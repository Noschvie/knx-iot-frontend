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

            console.log('[WebSocket] Attempting to connect to:', wsUrl);

            try {
                this.ws = new WebSocket(wsUrl, ['gw.knx.org']);

                this.ws.onopen = () => {
                    console.log('[WebSocket] ✓ Connected');
                    this.isConnecting = false;
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
                    console.error('[WebSocket] ✗ Error:', {
                        error,
                        readyState: this.ws?.readyState,
                        url: wsUrl
                    });
                    this.isConnecting = false;
                    this.connectionStatus$.next(false);
                    observer.next({
                        type: 'connection_error',
                        error: error
                    });
                };

                this.ws.onclose = () => {
                    console.log('[WebSocket] Disconnected (readyState:', this.ws?.readyState, ')');
                    this.isConnecting = false;
                    this.connectionStatus$.next(false);
                    observer.complete();
                };

                return () => this.disconnect();
            } catch (e) {
                console.error('[WebSocket] Connection exception:', e);
                this.isConnecting = false;
                this.connectionStatus$.next(false);
                observer.next({
                    type: 'connection_error',
                    error: e
                });
                return () => {};
            }
        });
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
