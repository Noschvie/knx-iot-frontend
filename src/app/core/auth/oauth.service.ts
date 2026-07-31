import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map, catchError } from 'rxjs';
import { throwError } from 'rxjs';
import { environment } from '@environments/environment';

import { AuthService } from './auth.service';
import { ConfigService } from '../config/config.service';

export interface OAuthToken {
    access_token: string;
    token_type: string;
    expires_in: number;
}

@Injectable()
export class OAuthService extends AuthService {
    private token$ = new BehaviorSubject<string | null>(null);

    constructor(private http: HttpClient, private config: ConfigService) {
        super();
        this.loadToken();
    }

    login(username: string, password: string): Observable<void> {
        // Client Credentials Grant: use username as client_id, password as client_secret
        const body = new URLSearchParams({
            grant_type: 'client_credentials',
            scope: 'manage'
        });

        // Basic Auth: base64(client_id:client_secret)
        const credentials = btoa(`${username}:${password}`);
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`
        };

        const url = `${this.config.getApiBase()}${environment.tokenEndpoint}`;
        console.debug('[OAuth] Login request:', {
            url,
            grantType: 'client_credentials',
            scope: 'manage',
            clientId: username
        });

        return this.http.post<OAuthToken>(url, body.toString(), { headers }).pipe(
            tap(token => {
                console.debug('[OAuth] Login successful, token received');
                localStorage.setItem('access_token', token.access_token);
                localStorage.setItem('token_expires_at', String(Date.now() + token.expires_in * 1000));
                this.token$.next(token.access_token);
            }),
            catchError((error: HttpErrorResponse) => {
                console.error('[OAuth] Login failed:', {
                    status: error.status,
                    statusText: error.statusText,
                    message: error.error?.error_description || error.message
                });
                return throwError(() => error);
            }),
            map(() => void 0)
        );
    }

    getToken(): string | null {
        const token = this.token$.value ?? localStorage.getItem('access_token');
        const expiresAt = parseInt(localStorage.getItem('token_expires_at') ?? '0', 10);
        if (Date.now() > expiresAt) {
            this.logout();
            return null;
        }
        return token;
    }

    isAuthenticated(): boolean {
        return this.getToken() !== null;
    }

    logout(): void {
        localStorage.removeItem('access_token');
        localStorage.removeItem('token_expires_at');
        this.token$.next(null);
    }

    private loadToken(): void {
        const token = localStorage.getItem('access_token');
        if (token) {
            this.token$.next(token);
        }
    }
}
