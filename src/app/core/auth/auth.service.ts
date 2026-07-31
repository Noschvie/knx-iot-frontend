import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

/**
 * Abstrakte Basis für alle Auth-Implementierungen.
 * Komponenten, Guards und Interceptors nutzen NUR dieses Interface –
 * niemals direkt OAuthService oder KeycloakAuthService.
 *
 * Späterer Wechsel zu Keycloak: Nur den Provider in core.module.ts tauschen.
 */
@Injectable()
export abstract class AuthService {
    /**
     * Meldet den Nutzer an. Bei Redirect-Flows (z. B. Keycloak)
     * kann username/password ignoriert werden.
     */
    abstract login(username: string, password: string): Observable<void>;

    /** Meldet den Nutzer ab und bereinigt den lokalen State. */
    abstract logout(): void;

    /** Gibt den aktuellen Bearer-Token zurück, oder null wenn nicht angemeldet. */
    abstract getToken(): string | null;

    /** Gibt zurück ob der Nutzer aktuell authentifiziert ist. */
    abstract isAuthenticated(): boolean;
}
