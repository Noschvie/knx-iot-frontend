import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Mock implementation for frontend development without a backend.
 * Every login attempt is immediately treated as successful.
 * Activation: swap the provider in core.module.ts.
 */
@Injectable()
export class MockAuthService extends AuthService {
    private loggedIn = false;

    login(username: string, password: string): Observable<void> {
        console.log(`[MockAuth] Login as "${username}" (no backend call)`);
        this.loggedIn = true;
        return of(void 0);
    }

    logout(): void {
        this.loggedIn = false;
    }

    getToken(): string | null {
        return this.loggedIn ? 'mock-token-dev' : null;
    }

    isAuthenticated(): boolean {
        return this.loggedIn;
    }
}
