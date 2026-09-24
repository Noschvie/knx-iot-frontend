/**
 * GatewayService - Handles communication with KNX Gateway
 */

import axios, { AxiosInstance } from 'axios';
import { GatewayDatapoint, GatewayCommand, ResolvedDatapoint } from '../models';
import { TokenService } from './token.service';
import { API_VERSION } from '../config/api';

export class GatewayService {
  private client: AxiosInstance;
  private tokenService: TokenService;
  private gaToDatapoint: Map<string, ResolvedDatapoint> = new Map();

  constructor(gatewayUrl: string, tokenService: TokenService) {
    this.tokenService = tokenService;
    this.client = axios.create({
      baseURL: gatewayUrl
    });
  }

  /**
   * Get the full API endpoint URL including a version
   * e.g., /api/v2 or /api/v2/datapoints
   */
  private getApiEndpoint(path: string = ''): string {
    return `${API_VERSION}${path}`;
  }

  /**
   * Initialize gateway datapoint mappings
   * Discovers all datapoints and maps GA → DatapointID
   */
  async initializeDatapoints(gasToDiscover: string[]): Promise<void> {
    console.log('[GatewayService] Discovering datapoints for GAs:', gasToDiscover);

    // Get valid read token
    const readToken = this.tokenService.getReadToken();
    if (!readToken) {
      throw new Error('No valid read token available');
    }

    try {
      // Query each GA individually to avoid URL length issues
      for (const ga of gasToDiscover) {
        try {
          const response = await this.client.get(this.getApiEndpoint('/datapoints'), {
            params: { 'filter[ga]': ga },
            headers: { 
              Authorization: `Bearer ${readToken}`,
              Accept: 'application/vnd.api+json'
            }
          });
          
          const datapoints: GatewayDatapoint[] = response.data.data || [];
          for (const dp of datapoints) {
            // The datapoints API returns JSON:API resources whose top-level `id`
            // is the vendor resource UUID (used for command writes). The vendor
            // `meta` carries the human-friendly `datapointId` (e.g. "GA-471") and
            // `ga`, which are used for WS subscribe / read / logging. Since we query
            // one GA at a time, the queried `ga` is the correct map key.
            const resolved: ResolvedDatapoint = {
              groupAddress: ga,
              resourceId: dp.id,
              datapointId: dp.meta?.datapointId ?? dp.id,
              title: dp.attributes?.title,
              dpt: dp.meta?.dpt ?? this.firstDpt(dp.attributes?.datapointType),
              readable: dp.attributes?.readable,
              writable: dp.attributes?.writable
            };
            this.gaToDatapoint.set(ga, resolved);
            console.log(`[GatewayService] Mapped GA ${ga} → DP ${resolved.datapointId}`);
          }
        } catch (error) {
          console.warn(`[GatewayService] Failed to initialize datapoint for GA ${ga}:`, error);
        }
      }

      console.log(`[GatewayService] Initialized ${this.gaToDatapoint.size} datapoint mappings`);
    } catch (error) {
      console.error('[GatewayService] Failed to initialize datapoints:', error);
      throw error;
    }
  }

  /**
   * Get the full resolved datapoint for a specific Group Address
   */
  getDatapoint(ga: string): ResolvedDatapoint {
    const dp = this.gaToDatapoint.get(ga);
    if (!dp) {
      throw new Error(`No datapoint found for GA: ${ga}`);
    }
    return dp;
  }

  /**
   * Get the resource UUID (`ResolvedDatapoint.resourceId`) for a Group Address.
   * Use this for command writes (`PUT /datapoints/values`) — NOT the vendor
   * `datapointId` ("GA-###"), which is meant for WS subscribe / read.
   */
  getDatapointId(ga: string): string {
    return this.getDatapoint(ga).resourceId;
  }

  /**
   * Pick the first datapoint type entry (the API may return a string or array)
   */
  private firstDpt(dpt?: string | string[]): string | undefined {
    if (Array.isArray(dpt)) {
      return dpt[0];
    }
    return dpt;
  }

  /**
   * Send command to gateway
   */
  async sendCommand(command: GatewayCommand): Promise<void> {
    console.log('[GatewayService] Sending command:', JSON.stringify(command));

    const writeToken = this.tokenService.getWriteToken();
    if (!writeToken) {
      throw new Error('No valid write token available');
    }

    try {
      await this.client.put(this.getApiEndpoint('/datapoints/values'), command, {
        headers: {
          Authorization: `Bearer ${writeToken}`,
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json'
        }
      });
      console.log('[GatewayService] Command sent successfully');
    } catch (error) {
      console.error('[GatewayService] Failed to send command:', error);
      throw error;
    }
  }

  /**
   * Get status of a specific datapoint
   */
  async getDatapointValue(ga: string): Promise<string | number> {
    const datapointId = this.getDatapointId(ga);
    const readToken = this.tokenService.getReadToken();
    if (!readToken) {
      throw new Error('No valid read token available');
    }

    try {
      const response = await this.client.get(this.getApiEndpoint(`/datapoints/${datapointId}`), {
        headers: {
          Authorization: `Bearer ${readToken}`,
          Accept: 'application/vnd.api+json'
        }
      });
      return response.data.data.attributes.value;
    } catch (error) {
      console.error(`[GatewayService] Failed to get datapoint value for GA ${ga}:`, error);
      throw error;
    }
  }

  /**
   * Get multiple datapoint values
   */
  async getDatapointValues(gas: string[]): Promise<Map<string, string | number>> {
    const result = new Map<string, string | number>();
    
    for (const ga of gas) {
      try {
        const value = await this.getDatapointValue(ga);
        result.set(ga, value);
      } catch (error) {
        console.warn(`[GatewayService] Could not get value for GA ${ga}`);
      }
    }

    return result;
  }
}
