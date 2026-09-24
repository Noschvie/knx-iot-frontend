/**
 * StatusReceiverService - Receives KNX status feedback for raffstores.
 *
 * Opens a single WebSocket connection to the gateway messaging endpoint
 * (`/messaging/ws`, subprotocol `gw.knx.org`, authenticated with a `manage`
 * token) and subscribes to the four status datapoints of every raffstore
 * (position, lamella, top end position, bottom end position). Incoming
 * `update` messages are mapped back to the raffstore and forwarded to the
 * RaffstoreService, which emits `status_changed` events to the frontend.
 */

import WebSocket from 'ws';
import axios, { AxiosInstance } from 'axios';
import { RaffstoreDatapoints } from '../models';
import { TokenService } from './token.service';
import { RaffstoreService, StatusKind } from './raffstore.service';
import { API_VERSION } from '../config/api';

const WS_SUBPROTOCOL = 'gw.knx.org';

// Reconnect settings
const RECONNECT_BASE_DELAY_MS = 1_000;
const RECONNECT_MAX_DELAY_MS = 60_000;

// Close the connection if no message (incl. server pings) arrives within this window.
const INACTIVITY_TIMEOUT_MS = 60_000;

/**
 * Maps each raffstore config status field to its StatusKind.
 */
const STATUS_GA_KINDS: Array<{ field: keyof RaffstoreDatapoints; kind: StatusKind }> = [
  { field: 'gaStatusPosition', kind: 'position' },
  { field: 'gaStatusLamellas', kind: 'lamella' },
  { field: 'gaEndTop', kind: 'endTop' },
  { field: 'gaEndBottom', kind: 'endBottom' }
];

interface StatusTarget {
  raffstoreId: string;
  kind: StatusKind;
}

interface RaffstoreSubscription {
  raffstoreId: string;
  datapointIds: string[];
}

export class StatusReceiverService {
  private client: AxiosInstance;
  private ws: WebSocket | null = null;

  // Reverse indexes: incoming updates carry both `meta.datapointId` and `meta.ga`.
  private byDatapointId: Map<string, StatusTarget> = new Map();
  private byGa: Map<string, StatusTarget> = new Map();

  // One subscribe message is sent per raffstore.
  private subscriptions: RaffstoreSubscription[] = [];

  private reconnectAttempts = 0;
  private shuttingDown = false;
  private inactivityTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(
    gatewayUrl: string,
    private tokenService: TokenService,
    private raffstoreService: RaffstoreService,
    private config: RaffstoreDatapoints[]
  ) {
    this.client = axios.create({ baseURL: gatewayUrl });
  }

  /**
   * Resolve datapoint ids, preload current values and open the WebSocket.
   */
  async start(): Promise<void> {
    const readToken = await this.getReadToken();
    if (!readToken) {
      console.error('[StatusReceiver] No read token available - cannot resolve datapoints');
      return;
    }

    await this.buildIndex(readToken);

    if (this.byDatapointId.size === 0) {
      console.warn('[StatusReceiver] No status datapoints resolved - receiver not started');
      return;
    }

    await this.preloadValues(readToken);
    this.connect();
  }

  /**
   * Stop the receiver and close the connection.
   */
  stop(): void {
    this.shuttingDown = true;
    this.clearInactivityTimer();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close(1000, 'shutdown');
    this.ws = null;
  }

  /**
   * Resolve the datapoint id for every status GA and build the reverse indexes
   * plus the per-raffstore subscribe payloads.
   */
  private async buildIndex(readToken: string): Promise<void> {
    for (const cfg of this.config) {
      const datapointIds: string[] = [];

      for (const { field, kind } of STATUS_GA_KINDS) {
        const ga = cfg[field] as string;
        if (!ga) {
          continue;
        }

        const datapointId = await this.resolveDatapointId(ga, readToken);
        if (!datapointId) {
          console.warn(`[StatusReceiver] No datapoint found for GA ${ga} (${cfg.id}/${kind})`);
          continue;
        }

        const target: StatusTarget = { raffstoreId: cfg.id, kind };
        this.byDatapointId.set(datapointId, target);
        this.byGa.set(ga, target);
        datapointIds.push(datapointId);
        console.log(`[StatusReceiver] Mapped ${cfg.id}/${kind} GA ${ga} -> DP ${datapointId}`);
      }

      if (datapointIds.length > 0) {
        this.subscriptions.push({ raffstoreId: cfg.id, datapointIds });
      }
    }

    console.log(`[StatusReceiver] Resolved ${this.byDatapointId.size} status datapoints for ${this.subscriptions.length} raffstores`);
  }

  /**
   * Resolve GA -> datapoint id via the gateway REST API.
   */
  private async resolveDatapointId(ga: string, readToken: string): Promise<string | null> {
    try {
      const response = await this.client.get(`${API_VERSION}/datapoints`, {
        params: { 'filter[ga]': ga },
        headers: { Authorization: `Bearer ${readToken}`, Accept: 'application/vnd.api+json' }
      });
      const d = response.data?.data?.[0];
      if (!d) {
        return null;
      }
      return d.meta?.datapointId ?? d.id ?? null;
    } catch (error) {
      console.warn(`[StatusReceiver] Datapoint lookup failed for GA ${ga}:`, error);
      return null;
    }
  }

  /**
   * Preload current status values via REST so the first WebSocket update is a real event.
   */
  private async preloadValues(readToken: string): Promise<void> {
    await Promise.all(
      [...this.byDatapointId.entries()].map(async ([datapointId, target]) => {
        try {
          const response = await this.client.get(`${API_VERSION}/datapoints/${datapointId}`, {
            headers: { Authorization: `Bearer ${readToken}`, Accept: 'application/vnd.api+json' }
          });
          const value = response.data?.data?.attributes?.value;
          if (value !== undefined) {
            this.raffstoreService.applyStatusUpdate(target.raffstoreId, target.kind, value);
          }
        } catch (error) {
          console.warn(`[StatusReceiver] Could not preload value for DP ${datapointId}:`, error);
        }
      })
    );
  }

  /**
   * Open the WebSocket connection and (re)subscribe.
   */
  private connect(): void {
    if (this.shuttingDown) {
      return;
    }

    void this.getManageToken().then((token) => {
      if (this.shuttingDown) {
        return;
      }
      if (!token) {
        console.error('[StatusReceiver] No manage token available - retrying');
        this.scheduleReconnect();
        return;
      }

      const wsUrl = this.toWebSocketUrl();
      if (this.reconnectAttempts === 0) {
        console.log(`[StatusReceiver] Connecting to ${wsUrl}`);
      } else {
        console.log(`[StatusReceiver] Reconnecting (attempt ${this.reconnectAttempts})...`);
      }

      const ws = new WebSocket(wsUrl, WS_SUBPROTOCOL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      this.ws = ws;

      ws.on('open', () => {
        this.reconnectAttempts = 0;
        console.log('[StatusReceiver] WebSocket connected');
        this.sendSubscriptions(ws);
        this.resetInactivityTimer();
      });

      ws.on('message', (data: WebSocket.RawData) => {
        this.resetInactivityTimer();
        this.handleMessage(data.toString());
      });

      ws.on('close', (code: number, reason: Buffer) => {
        this.clearInactivityTimer();
        const reasonStr = reason.toString();
        console.log(`[StatusReceiver] WebSocket closed (${code}): ${reasonStr}`);
        if (!this.shuttingDown) {
          this.scheduleReconnect();
        }
      });

      ws.on('error', (err: Error) => {
        console.error(`[StatusReceiver] WebSocket error: ${err.message}`);
      });
    }).catch((err) => {
      console.error(`[StatusReceiver] Failed to acquire manage token: ${err.message}`);
      this.scheduleReconnect();
    });
  }

  /**
   * Send one subscribe message per raffstore.
   */
  private sendSubscriptions(ws: WebSocket): void {
    for (const sub of this.subscriptions) {
      const message = {
        action: 'subscribe',
        items: sub.datapointIds.map((id) => ({ type: 'datapoint', id }))
      };
      ws.send(JSON.stringify(message));
      console.log(`[StatusReceiver] Subscribed ${sub.raffstoreId} (${sub.datapointIds.length} datapoints)`);
    }
  }

  /**
   * Parse and dispatch an incoming WebSocket message.
   */
  private handleMessage(raw: string): void {
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.warn(`[StatusReceiver] Non-JSON message: ${raw}`);
      return;
    }

    switch (parsed.type) {
      case 'update': {
        const entries = Array.isArray(parsed.data) ? parsed.data : [parsed.data];
        for (const entry of entries) {
          this.handleUpdateEntry(entry);
        }
        break;
      }
      case 'welcome':
        console.log(`[StatusReceiver] Welcome - clientId: ${parsed.data?.clientId}, scope: ${parsed.data?.scope}`);
        break;
      case 'subscribed': {
        const count = Array.isArray(parsed.data) ? parsed.data.length : 0;
        if (count === 0) {
          console.warn('[StatusReceiver] Subscribed - no items matched');
        } else {
          console.log(`[StatusReceiver] Subscribed - ${count} item(s)`);
        }
        break;
      }
      case 'error':
        console.error('[StatusReceiver] Error:', JSON.stringify(parsed.errors ?? parsed.error ?? parsed));
        break;
      case 'ping':
      case 'pong':
      case 'heartbeat':
        break;
      default:
        // Unknown message type - ignore.
        break;
    }
  }

  /**
   * Map a single `update` entry to a raffstore status update.
   */
  private handleUpdateEntry(entry: any): void {
    if (!entry) {
      return;
    }

    const datapointId: string | undefined = entry.meta?.datapointId ?? entry.id;
    const ga: string | undefined = entry.meta?.ga;
    const value = entry.attributes?.value;

    if (value === undefined) {
      return;
    }

    const target =
      (datapointId ? this.byDatapointId.get(datapointId) : undefined) ??
      (ga ? this.byGa.get(ga) : undefined);

    if (!target) {
      // Update for a datapoint we did not subscribe to - ignore.
      return;
    }

    this.raffstoreService.applyStatusUpdate(target.raffstoreId, target.kind, value);
  }

  /**
   * Schedule a reconnection with exponential backoff (capped).
   */
  private scheduleReconnect(): void {
    if (this.shuttingDown) {
      return;
    }
    this.reconnectAttempts += 1;
    const delay = Math.min(
      RECONNECT_BASE_DELAY_MS * 2 ** (this.reconnectAttempts - 1),
      RECONNECT_MAX_DELAY_MS
    );
    console.log(`[StatusReceiver] Reconnecting in ${delay / 1000}s...`);
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  private resetInactivityTimer(): void {
    this.clearInactivityTimer();
    this.inactivityTimer = setTimeout(() => {
      console.log('[StatusReceiver] No messages received - closing connection');
      this.ws?.close(1000, 'inactivity-timeout');
    }, INACTIVITY_TIMEOUT_MS);
  }

  private clearInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  private toWebSocketUrl(): string {
    const base = this.client.defaults.baseURL ?? '';
    const normalized = base.endsWith('/') ? base.slice(0, -1) : base;
    if (normalized.startsWith('https://')) {
      return `${normalized.replace('https://', 'wss://')}/messaging/ws`;
    }
    return `${normalized.replace('http://', 'ws://')}/messaging/ws`;
  }

  private async getReadToken(): Promise<string | null> {
    const token = this.tokenService.getReadToken();
    if (token) {
      return token;
    }
    await this.tokenService.acquireTokens();
    return this.tokenService.getReadToken();
  }

  private async getManageToken(): Promise<string | null> {
    const token = this.tokenService.getManageToken();
    if (token) {
      return token;
    }
    await this.tokenService.acquireTokens();
    return this.tokenService.getManageToken();
  }
}
