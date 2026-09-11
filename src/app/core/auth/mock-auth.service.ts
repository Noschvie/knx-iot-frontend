import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { AuthService } from './auth.service';

// Mock credentials for development — do not use in production
const MOCK_USERNAME = 'admin';
const MOCK_PASSWORD = 'admin';

/**
 * Mock implementation for frontend development without a backend.
 * Valid credentials: admin / admin
 * Activation: swap the provider in core.module.ts.
 */
@Injectable()
export class MockAuthService extends AuthService {
    private loggedIn = true; // Auto-login for development

    constructor() {
        super();
        console.log('[MockAuth] ✅ Auto-authenticated as "admin" for development');
    }

    login(username: string, password: string): Observable<void> {
        if (username === MOCK_USERNAME && password === MOCK_PASSWORD) {
            console.log(`[MockAuth] Login successful as "${username}"`);
            this.loggedIn = true;
            return of(void 0);
        }

        console.warn(`[MockAuth] Login failed for "${username}"`);
        return throwError(() => ({ status: 401, message: 'Invalid credentials' }));
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
