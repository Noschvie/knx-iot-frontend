import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { OAuthService } from '../auth/oauth.service';
import { ConfigService } from '../config/config.service';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
    private ws: WebSocket | null = null;
    private messageSubject = new ReplaySubject<any>(100);
    private connectionStatus$ = new Subject<boolean>();
    private isConnecting = false;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 3000; // Start with 3 seconds

    constructor(
        private auth: OAuthService,
        private config: ConfigService
    ) {}

    connect(): Observable<any> {
        return new Observable(observer => {
            // Prevent multiple simultaneous connection attempts
            if (this.isConnecting) {
                console.warn('[WebSocket] Connection already in progress');
                return;
            }

            this.isConnecting = true;
            const wsBase = this.config.getWebSocketBase();
            const token = this.auth.getToken();
            const wsUrl = `${wsBase}/messaging/ws?token=${token}`;

            console.log('[WebSocket] 🔌 ATTEMPTING CONNECTION', {
                wsBase: wsBase,
                wsUrl: wsUrl,
                tokenAvailable: !!token,
                attempt: this.reconnectAttempts + 1,
                maxAttempts: this.maxReconnectAttempts
            });

            try {
                this.ws = new WebSocket(wsUrl, ['gw.knx.org']);

                this.ws.onopen = () => {
                    console.log('[WebSocket] ✅ Connected successfully');
                    this.isConnecting = false;
                    this.reconnectAttempts = 0; // Reset on successful connection
                    this.connectionStatus$.next(true);
                    observer.next({ type: 'connected' });
                };

                this.ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        this.messageSubject.next(message);
                        observer.next(message);
                    } catch (e) {
                        console.error('[WebSocket] Failed to parse message:', e);
                    }
                };

                this.ws.onerror = (error) => {
                    console.error('[WebSocket] ❌ ERROR', {
                        error: error,
                        wsUrl: wsUrl,
                        readyState: this.ws?.readyState,
                        reconnectAttempts: this.reconnectAttempts,
                        errorEvent: {
                            type: (error as any).type,
                            code: (error as any).code,
                            reason: (error as any).reason,
                            wasClean: (error as any).wasClean
                        }
                    });
                    this.isConnecting = false;
                    this.connectionStatus$.next(false);

                    // Notify about error
                    observer.next({
                        type: 'connection_error',
                        error: error,
                        code: (error as any).code,
                        wsUrl: wsUrl
                    });

                    // Attempt reconnection
                    this.scheduleReconnect();
                };

                this.ws.onclose = (event) => {
                    console.log('[WebSocket] ❌ CLOSED', {
                        code: event.code,
                        reason: event.reason,
                        wasClean: event.wasClean,
                        wsUrl: wsUrl,
                        readyState: this.ws?.readyState
                    });
                    this.isConnecting = false;
                    this.connectionStatus$.next(false);

                    // Notify close
                    observer.next({
                        type: 'connection_closed',
                        code: event.code,
                        reason: event.reason,
                        wsUrl: wsUrl
                    });

                    // Attempt reconnection unless clean close or max attempts reached
                    if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.scheduleReconnect();
                    } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                        console.error('[WebSocket] Max reconnection attempts reached, giving up');
                        observer.complete();
                    }
                };

                return () => this.disconnect();
            } catch (e) {
                console.error('[WebSocket] ❌ CONNECTION EXCEPTION', {
                    error: e,
                    wsUrl: wsUrl,
                    message: (e as any).message
                });
                this.isConnecting = false;
                this.connectionStatus$.next(false);
                observer.next({
                    type: 'connection_error',
                    error: e,
                    wsUrl: wsUrl
                });
                this.scheduleReconnect();
                return () => {};
            }
        });
    }

    /**
     * Schedule automatic reconnection with exponential backoff
     */
    private scheduleReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('[WebSocket] Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

        console.log(`[WebSocket] Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(() => {
            console.log(`[WebSocket] Attempting reconnect (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            // Create new connection attempt
            this.disconnect();
            // Trigger new connection by reconnecting
            // This will be handled by the component's subscription
        }, delay);
    }

    disconnect(): void {
        if (this.ws) {
            try {
                this.ws.close();
            } catch (e) {
                console.warn('[WebSocket] Error closing connection:', e);
            }
            this.ws = null;
        }
        this.isConnecting = false;
    }

    isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }

    getConnectionStatus$(): Observable<boolean> {
        return this.connectionStatus$.asObservable();
    }

    send(message: any): void {
        if (this.isConnected()) {
            try {
                this.ws!.send(JSON.stringify(message));
            } catch (e) {
                console.error('[WebSocket] Failed to send message:', e);
            }
        } else {
            console.warn('[WebSocket] Not connected, cannot send message');
        }
    }

    getMessages(): Observable<any> {
        return this.messageSubject.asObservable();
    }
}
