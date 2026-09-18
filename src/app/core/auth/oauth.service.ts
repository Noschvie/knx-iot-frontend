import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map, catchError, forkJoin, Subscription, timer } from 'rxjs';
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
export class OAuthService extends AuthService implements OnDestroy {
    private tokens$ = new BehaviorSubject<TokenPair>({ read: null, write: null });

    // Renew the tokens this many seconds BEFORE they actually expire
    private readonly REFRESH_SKEW_SECONDS = 60;

    private refreshSub?: Subscription;
    private immediateRefreshInProgress = false;

    constructor(private http: HttpClient, private config: ConfigService) {
        super();
        this.loadTokens();
    }

    ngOnDestroy(): void {
        this.refreshSub?.unsubscribe();
    }

    login(username: string, password: string): Observable<void> {
        // LAN-only deployment: no real user login. Backend uses OAuth2
        // client_credentials with values from the runtime config (app-config.json).
        const clientId = this.config.getClientId();
        const clientSecret = this.config.getClientSecret();

        // TEST MODE: Ignore user input and use hardcoded credentials for backend
        console.log(`[AUTH] Backend will use hardcoded credentials (client_id: ${clientId})`);
        console.log(`[AUTH] Starting OAuth2 login with hardcoded client credentials`);
        console.log(`[AUTH] Using token endpoint: ${this.config.getApiBase()}${environment.tokenEndpoint}`);

        const readTokenReq = this.fetchToken(clientId, clientSecret, 'read');
        const writeTokenReq = this.fetchToken(clientId, clientSecret, 'write');

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

                // Schedule automatic renewal based on the shortest token lifetime.
                const minExpiresIn = Math.min(readToken.expires_in, writeToken.expires_in);
                this.scheduleRefresh(minExpiresIn);
                this.immediateRefreshInProgress = false;
            }),
            catchError((error: HttpErrorResponse) => {
                console.error(`[AUTH] ✗ Login failed!`, {
                    status: error.status,
                    message: error.message,
                    errorDescription: error.error?.error_description || error.message,
                    url: `${this.config.getApiBase()}${environment.tokenEndpoint}`
                });
                this.immediateRefreshInProgress = false;
                return throwError(() => error);
            }),
            map(() => void 0)
        );
    }

    /**
     * Triggers an immediate token refresh if one is not already in progress.
     * This is called when tokens are about to expire.
     */
    private triggerImmediateRefresh(): void {
        if (this.immediateRefreshInProgress) {
            console.log(`[AUTH] Token refresh already in progress, skipping duplicate request`);
            return;
        }

        this.immediateRefreshInProgress = true;
        console.log(`[AUTH] Triggering immediate token refresh (tokens about to expire)`);
        this.login('', '').subscribe({
            error: () => {
                console.warn(`[AUTH] Immediate token refresh failed`);
                this.immediateRefreshInProgress = false;
            }
        });
    }

    /**
     * Schedules the next automatic token renewal based on the shortest lifetime.
     * On failure, it reschedules itself after the skew window, so a temporary
     * backend outage self-heals. Non-blocking: never affects UI rendering.
     * @param expiresInSeconds lifetime (in seconds) of the freshly obtained tokens
     */
    private scheduleRefresh(expiresInSeconds: number): void {
        this.refreshSub?.unsubscribe();

        const delaySeconds = Math.max(expiresInSeconds - this.REFRESH_SKEW_SECONDS, this.REFRESH_SKEW_SECONDS);
        console.log(`[AUTH] Next token refresh scheduled in ${delaySeconds}s`);

        this.refreshSub = timer(delaySeconds * 1000).subscribe(() => {
            console.log(`[AUTH] Refreshing backend tokens...`);
            // login() re-runs the full client_credentials acquisition and, on
            // success, schedules the following refresh again.
            this.login('', '').subscribe({
                error: () => {
                    console.warn(`[AUTH] Token refresh failed; retrying in ${this.REFRESH_SKEW_SECONDS}s`);
                    this.scheduleRefresh(this.REFRESH_SKEW_SECONDS);
                }
            });
        });
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

        // If token is about to expire (within skew window), trigger immediate refresh
        if (expiresAt > 0 && Date.now() + this.REFRESH_SKEW_SECONDS * 1000 > expiresAt) {
            console.log(`[AUTH] Read token about to expire, triggering immediate refresh`);
            this.triggerImmediateRefresh();
        }

        if (Date.now() > expiresAt) {
            return null;
        }
        return token;
    }

    getWriteToken(): string | null {
        const token = this.tokens$.value.write ?? localStorage.getItem('access_token_write');
        const expiresAt = parseInt(localStorage.getItem('token_expires_at_write') ?? '0', 10);

        // If token is about to expire (within skew window), trigger immediate refresh
        if (expiresAt > 0 && Date.now() + this.REFRESH_SKEW_SECONDS * 1000 > expiresAt) {
            console.log(`[AUTH] Write token about to expire, triggering immediate refresh`);
            this.triggerImmediateRefresh();
        }

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
        this.refreshSub?.unsubscribe();
        console.log(`[AUTH] ✓ Logout complete`);
    }

    private loadTokens(): void {
        const readToken = localStorage.getItem('access_token_read');
        const writeToken = localStorage.getItem('access_token_write');
        const readExpiresAt = parseInt(localStorage.getItem('token_expires_at_read') ?? '0', 10);
        const writeExpiresAt = parseInt(localStorage.getItem('token_expires_at_write') ?? '0', 10);

        if (readToken || writeToken) {
            console.log(`[AUTH] Loaded tokens from localStorage (read: ${readToken ? 'yes' : 'no'}, write: ${writeToken ? 'yes' : 'no'})`);
            this.tokens$.next({ read: readToken, write: writeToken });

            // Schedule automatic renewal based on the remaining time until expiration
            if (readExpiresAt > 0 && writeExpiresAt > 0) {
                const readRemainingSeconds = Math.max(0, Math.floor((readExpiresAt - Date.now()) / 1000));
                const writeRemainingSeconds = Math.max(0, Math.floor((writeExpiresAt - Date.now()) / 1000));
                const minRemainingSeconds = Math.min(readRemainingSeconds, writeRemainingSeconds);

                if (minRemainingSeconds > 0) {
                    console.log(`[AUTH] Token refresh will be rescheduled after ${minRemainingSeconds}s (read expires in ${readRemainingSeconds}s, write expires in ${writeRemainingSeconds}s)`);
                    this.scheduleRefresh(minRemainingSeconds);
                } else {
                    console.log(`[AUTH] Tokens have already expired and need to be renewed immediately`);
                }
            }
        } else {
            console.log(`[AUTH] No tokens found in localStorage`);
        }
    }
}

