import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '@environments/environment';

export interface OAuthToken {
    access_token: string;
    token_type: string;
    expires_in: number;
}

@Injectable({ providedIn: 'root' })
export class OAuthService {
    private token$ = new BehaviorSubject<string | null>(null);
    private tokenExpiresAt = 0;

    constructor(private http: HttpClient) {
        this.loadToken();
    }

    login(username: string, password: string): Observable<OAuthToken> {
        const body = new URLSearchParams({
            grant_type: 'password',
            username,
            password,
            client_id: environment.clientId
        });

        return this.http.post<OAuthToken>(
            `${environment.apiBase}${environment.tokenEndpoint}`,
            body.toString(),
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }
        ).pipe(
            tap(token => {
                localStorage.setItem('access_token', token.access_token);
                localStorage.setItem('token_expires_at', String(Date.now() + token.expires_in * 1000));
                this.token$.next(token.access_token);
            })
        );
    }

    getToken(): string | null {
        const token = this.token$.value || localStorage.getItem('access_token');

        // Check if expired
        const expiresAt = parseInt(localStorage.getItem('token_expires_at') || '0');
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
