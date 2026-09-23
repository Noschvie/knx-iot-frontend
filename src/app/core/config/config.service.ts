import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError } from 'rxjs';

export interface AppConfig {
    apiBase: string;
    wsBase: string;
}

export interface ApiInfo {
    name: string;
    version: string;
    features: Record<string, boolean>;
    endpoints: Record<string, string>;
}

/**
 * API Version - centralized configuration
 * Ensures all services use the same API version
 */
const API_VERSION = '/api/v2';

@Injectable({ providedIn: 'root' })
export class ConfigService {
    private apiInfo: ApiInfo | null = null;
    private config: AppConfig | null = null;

    constructor(private http: HttpClient) {}

    loadConfig(): Observable<AppConfig> {
        return this.http.get<AppConfig>('/assets/config/app-config.local.json').pipe(
            catchError(() =>
                this.http.get<AppConfig>('/assets/config/app-config.json')
            ),
            tap(cfg => this.config = cfg)
        );
    }

    loadApiInfo(): Observable<ApiInfo> {
        return this.http.get<ApiInfo>(`${this.getApiBase()}/info`).pipe(
            tap(info => this.apiInfo = info)
        );
    }

    getApiInfo(): ApiInfo | null {
        return this.apiInfo;
    }

    /**
     * Get base URL for API calls (e.g., http://localhost:8080)
     */
    getApiBase(): string {
        return this.config?.apiBase ?? '';
    }

    /**
     * Get the full API endpoint URL including a version
     * e.g., http://localhost:8080/api/v2
     */
    getApiEndpoint(): string {
        return `${this.getApiBase()}${API_VERSION}`;
    }

    getWebSocketBase(): string {
        return this.config?.wsBase ?? '';
    }

    /**
     * Get API version string
     */
    getApiVersion(): string {
        return API_VERSION;
    }
}
