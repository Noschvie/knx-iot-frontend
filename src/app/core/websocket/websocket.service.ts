import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { OAuthService } from '../auth/oauth.service';
import { ConfigService } from '../config/config.service';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
    private ws: WebSocket | null = null;
    private messageSubject = new ReplaySubject<any>(100);

    constructor(
        private auth: OAuthService,
        private config: ConfigService
    ) {}

    connect(): Observable<any> {
        return new Observable(observer => {
            const wsBase = this.config.getWebSocketBase();
            const token = this.auth.getToken();
            const wsUrl = `${wsBase}/messaging/ws?token=${token}`;

            try {
                this.ws = new WebSocket(wsUrl, ['gw.knx.org']);

                this.ws.onopen = () => {
                    console.log('[WebSocket] Connected');
                    observer.next({ type: 'connected' });
                };

                this.ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        this.messageSubject.next(message);
                        observer.next(message);
                    } catch (e) {
                        console.error('Failed to parse WebSocket message:', e);
                    }
                };

                this.ws.onerror = (error) => {
                    console.error('[WebSocket] Error:', error);
                    observer.error(error);
                };

                this.ws.onclose = () => {
                    console.log('[WebSocket] Disconnected');
                    observer.complete();
                };

                return () => this.disconnect();
            } catch (e) {
                observer.error(e);
                return () => {};
            }
        });
    }

    disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }

    send(message: any): void {
        if (this.isConnected()) {
            this.ws!.send(JSON.stringify(message));
        }
    }

    getMessages(): Observable<any> {
        return this.messageSubject.asObservable();
    }
}
