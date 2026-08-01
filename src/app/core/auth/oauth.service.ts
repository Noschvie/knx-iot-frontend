import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map, catchError, forkJoin } from 'rxjs';
import { throwError } from 'rxjs';
import { environment } from '@environments/environment';

import { AuthService } from './auth.service';
import { ConfigService } from '../config/config.service';

export interface OAuthToken {
    access_token: string;
    token_type: string;
    expires_in: number;
}

interface TokenPair {
    read: string | null;
    write: string | null;
}

@Injectable()
export class OAuthService extends AuthService {
    private tokens$ = new BehaviorSubject<TokenPair>({ read: null, write: null });

    constructor(private http: HttpClient, private config: ConfigService) {
        super();
        this.loadTokens();
    }

    login(username: string, password: string): Observable<void> {
        // Client Credentials Grant: use username as client_id, password as client_secret
        // Request both read and write tokens in parallel
        console.log(`[AUTH] Starting OAuth2 login for client: ${username}`);
        console.log(`[AUTH] Using token endpoint: ${this.config.getApiBase()}${environment.tokenEndpoint}`);

        const readTokenReq = this.fetchToken(username, password, 'read');
        const writeTokenReq = this.fetchToken(username, password, 'write');

        return forkJoin([readTokenReq, writeTokenReq]).pipe(
            tap(([readToken, writeToken]) => {
                console.log(`[AUTH] ✓ Login successful! Both tokens received`);
                console.log(`[AUTH]   - Read token received (expires in ${readToken.expires_in}s)`);
                console.log(`[AUTH]   - Write token received (expires in ${writeToken.expires_in}s)`);
                console.log(`[AUTH] Storing tokens in localStorage...`);
                localStorage.setItem('access_token_read', readToken.access_token);
                localStorage.setItem('access_token_write', writeToken.access_token);
                localStorage.setItem('token_expires_at_read', String(Date.now() + readToken.expires_in * 1000));
                localStorage.setItem('token_expires_at_write', String(Date.now() + writeToken.expires_in * 1000));
                this.tokens$.next({
                    read: readToken.access_token,
                    write: writeToken.access_token
                });
                console.log(`[AUTH] ✓ Tokens stored successfully`);
            }),
            catchError((error: HttpErrorResponse) => {
                console.error(`[AUTH] ✗ Login failed!`, {
                    status: error.status,
                    message: error.message,
                    errorDescription: error.error?.error_description || error.message,
                    url: `${this.config.getApiBase()}${environment.tokenEndpoint}`
                });
                return throwError(() => error);
            }),
            map(() => void 0)
        );
    }

    private fetchToken(clientId: string, clientSecret: string, scope: string): Observable<OAuthToken> {
        const body = new URLSearchParams({
            grant_type: 'client_credentials',
            scope
        });

        const credentials = btoa(`${clientId}:${clientSecret}`);
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`
        };

        const url = `${this.config.getApiBase()}${environment.tokenEndpoint}`;
        console.log(`[AUTH] Requesting ${scope} token from: ${url}`);

        return this.http.post<OAuthToken>(url, body.toString(), { headers }).pipe(
            tap((token) => {
                console.log(`[AUTH] ✓ ${scope.toUpperCase()} token received successfully (expires in ${token.expires_in}s)`);
            }),
            catchError((error: HttpErrorResponse) => {
                console.error(`[AUTH] ✗ Failed to get ${scope} token:`, {
                    status: error.status,
                    message: error.message,
                    url: url
                });
                return throwError(() => error);
            })
        );
    }

    getToken(): string | null {
        // For backwards compatibility, return read token
        return this.getReadToken();
    }

    getReadToken(): string | null {
        const token = this.tokens$.value.read ?? localStorage.getItem('access_token_read');
        const expiresAt = parseInt(localStorage.getItem('token_expires_at_read') ?? '0', 10);
        if (Date.now() > expiresAt) {
            return null;
        }
        return token;
    }

    getWriteToken(): string | null {
        const token = this.tokens$.value.write ?? localStorage.getItem('access_token_write');
        const expiresAt = parseInt(localStorage.getItem('token_expires_at_write') ?? '0', 10);
        if (Date.now() > expiresAt) {
            return null;
        }
        return token;
    }

    isAuthenticated(): boolean {
        const readToken = this.getReadToken();
        const writeToken = this.getWriteToken();
        const isAuth = readToken !== null && writeToken !== null;
        if (!isAuth) {
            console.log(`[AUTH] isAuthenticated() = false (read: ${readToken ? 'valid' : 'invalid'}, write: ${writeToken ? 'valid' : 'invalid'})`);
        }
        return isAuth;
    }

    logout(): void {
        console.log(`[AUTH] Logging out...`);
        localStorage.removeItem('access_token_read');
        localStorage.removeItem('access_token_write');
        localStorage.removeItem('token_expires_at_read');
        localStorage.removeItem('token_expires_at_write');
        this.tokens$.next({ read: null, write: null });
        console.log(`[AUTH] ✓ Logout complete`);
    }

    private loadTokens(): void {
        const readToken = localStorage.getItem('access_token_read');
        const writeToken = localStorage.getItem('access_token_write');
        if (readToken || writeToken) {
            console.log(`[AUTH] Loaded tokens from localStorage (read: ${readToken ? 'yes' : 'no'}, write: ${writeToken ? 'yes' : 'no'})`);
            this.tokens$.next({ read: readToken, write: writeToken });
        } else {
            console.log(`[AUTH] No tokens found in localStorage`);
        }
    }
}
