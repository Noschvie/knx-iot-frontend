import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

/**
 * Abstract base for all auth implementations.
 * Components, guards, and interceptors use ONLY this interface –
 * never directly OAuthService or KeycloakAuthService.
 *
 * Later switch to Keycloak: Only swap the provider in core.module.ts.
 */
@Injectable()
export abstract class AuthService {
    /**
     * Logs in the user. For redirect flows (e.g., Keycloak)
     * username/password can be ignored.
     */
    abstract login(username: string, password: string): Observable<void>;

    /** Logs out the user and cleans up the local state. */
    abstract logout(): void;

    /** Returns the current Bearer token, or null if not authenticated. */
    abstract getToken(): string | null;

    /** Returns whether the user is currently authenticated. */
    abstract isAuthenticated(): boolean;
}
