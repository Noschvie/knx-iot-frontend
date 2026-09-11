import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { AuthService } from './auth.service';

// Mock credentials for development — do not use in production
const MOCK_USERNAME = 'admin';
const MOCK_PASSWORD = 'admin';

/**
 * Mock implementation for frontend development without a backend.
 * In TEST MODE: accepts ANY username/password combination.
 */
@Injectable()
export class MockAuthService extends AuthService {
    private loggedIn = true; // Auto-login for development

    constructor() {
        super();
        console.log('[MockAuth] ✅ TEST MODE: Accepting ANY credentials for development');
    }

    login(username: string, password: string): Observable<void> {
        // TEST MODE: Accept ANY credentials
        if (username && password) {
            console.log(`[MockAuth] ✅ Login successful (TEST MODE): "${username}"`);
            this.loggedIn = true;
            return of(void 0);
        }

        console.warn(`[MockAuth] ✗ Login failed: Missing username or password`);
        return throwError(() => ({ status: 400, message: 'Username and password required' }));
    }

    logout(): void {
        this.loggedIn = false;
        console.log('[MockAuth] Logged out');
    }

    getToken(): string | null {
        return this.loggedIn ? 'mock-token-dev' : null;
    }

    isAuthenticated(): boolean {
        return this.loggedIn;
    }
}
