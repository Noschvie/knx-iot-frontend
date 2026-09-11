import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { AuthService } from './auth.service';

// Mock credentials for development — do not use in production
const MOCK_USERNAME = 'admin';
const MOCK_PASSWORD = 'admin';

/**
 * Mock implementation for frontend development without a backend.
 * In TEST MODE: accepts ANY username/password combination.
 * Uses localStorage to persist session across reloads.
 */
@Injectable()
export class MockAuthService extends AuthService {
    private readonly STORAGE_KEY = 'mock-auth-token';

    constructor() {
        super();
        // Check if already logged in from previous session
        const storedToken = this.getStoredToken();
        if (storedToken) {
            console.log('[MockAuth] ✅ Restored session from localStorage');
        } else {
            console.log('[MockAuth] ✅ TEST MODE: Accepting ANY credentials for development');
        }
    }

    login(username: string, password: string): Observable<void> {
        // TEST MODE: Accept ANY credentials
        if (username && password) {
            console.log(`[MockAuth] ✅ Login successful (TEST MODE): "${username}"`);
            // Store token in localStorage to persist across reloads
            localStorage.setItem(this.STORAGE_KEY, 'mock-token-dev');
            return of(void 0);
        }

        console.warn(`[MockAuth] ✗ Login failed: Missing username or password`);
        return throwError(() => ({ status: 400, message: 'Username and password required' }));
    }

    logout(): void {
        localStorage.removeItem(this.STORAGE_KEY);
        console.log('[MockAuth] Logged out');
    }

    getToken(): string | null {
        return this.getStoredToken();
    }

    isAuthenticated(): boolean {
        return !!this.getStoredToken();
    }

    private getStoredToken(): string | null {
        try {
            return localStorage.getItem(this.STORAGE_KEY);
        } catch (e) {
            console.warn('[MockAuth] localStorage not available:', e);
            return null;
        }
    }
}
