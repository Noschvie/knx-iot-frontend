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

    getApiBase(): string {
        return this.config?.apiBase ?? '';
    }

    getWebSocketBase(): string {
        return this.config?.wsBase ?? '';
    }
}
