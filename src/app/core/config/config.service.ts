import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '@environments/environment';

export interface ApiInfo {
    name: string;
    version: string;
    features: Record<string, boolean>;
    endpoints: Record<string, string>;
}

@Injectable({ providedIn: 'root' })
export class ConfigService {
    private apiInfo: ApiInfo | null = null;

    constructor(private http: HttpClient) {}

    loadApiInfo(): Observable<ApiInfo> {
        return this.http.get<ApiInfo>(`${environment.apiBase}/info`).pipe(
            tap(info => this.apiInfo = info)
        );
    }

    getApiInfo(): ApiInfo | null {
        return this.apiInfo;
    }

    getApiBase(): string {
        return environment.apiBase;
    }

    getWebSocketBase(): string {
        return environment.wsBase;
    }
}
