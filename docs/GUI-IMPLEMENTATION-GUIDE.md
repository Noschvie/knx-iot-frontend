# GUI Frontend Implementation Guide

> **Quick Start:** Step-by-step guide to implement GUI based on updated specifications  
> **Target:** Angular 20 with semantic-knx-gateway API  
> **Date:** 2026-07-30

---

## Phase 1: Setup & Authentication

### Step 1.1: Install Dependencies

```bash
npm install @angular/core @angular/material echarts ngx-echarts
npm install @angular/cdk  # Virtual scroll
npm install axios          # Alternative to HttpClient (optional)
```

### Step 1.2: Create OAuth2 Service

```typescript
// src/app/core/auth/oauth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

export interface OAuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

@Injectable({ providedIn: 'root' })
export class OAuthService {
  private token$ = new BehaviorSubject<string | null>(null);
  
  constructor(private http: HttpClient, private config: ConfigService) {}
  
  login(username: string, password: string): Observable<OAuthToken> {
    const body = new URLSearchParams({
      grant_type: 'password',
      username,
      password,
      client_id: this.config.clientId
    });
    
    return this.http.post<OAuthToken>(
      `${this.config.apiBase}/oauth/access`,
      body.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    ).pipe(
      tap(token => {
        localStorage.setItem('access_token', token.access_token);
        this.token$.next(token.access_token);
      })
    );
  }
  
  getToken(): string | null {
    return this.token$.value || localStorage.getItem('access_token');
  }
  
  logout(): void {
    localStorage.removeItem('access_token');
    this.token$.next(null);
  }
}
```

### Step 1.3: Create HTTP Interceptor (JSON:API)

```typescript
// src/app/core/http/json-api.interceptor.ts

import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler } from '@angular/common/http';

@Injectable()
export class JsonApiInterceptor implements HttpInterceptor {
  constructor(private auth: OAuthService) {}
  
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    let headers = req.headers
      .set('Authorization', `Bearer ${this.auth.getToken()}`)
      .set('Accept', 'application/vnd.api+json')
      .set('Content-Type', 'application/vnd.api+json');
    
    // Allow application/json for some endpoints (datapoints/values, subscriptions)
    if (this.isJsonFallbackEndpoint(req.url)) {
      headers = headers.set('Content-Type', 'application/json');
    }
    
    return next.handle(req.clone({ headers }));
  }
  
  private isJsonFallbackEndpoint(url: string): boolean {
    return url.includes('/datapoints/values') || url.includes('/subscriptions');
  }
}
```

---

## Phase 2: Core Services

### Step 2.1: JSON:API Transformer Service

```typescript
// src/app/core/api/json-api.transformer.ts

import { Injectable } from '@angular/core';

export interface JsonApiDocument {
  data: JsonApiResource | JsonApiResource[];
  included?: JsonApiResource[];
  meta?: any;
}

export interface JsonApiResource {
  type: string;
  id: string;
  attributes?: any;
  relationships?: Record<string, any>;
}

@Injectable({ providedIn: 'root' })
export class JsonApiTransformer {
  /**
   * Transform JSON:API document to internal model
   */
  toModel<T>(resource: JsonApiResource, includeMap?: Map<string, any>): T {
    const model = {
      id: resource.id,
      type: resource.type,
      ...resource.attributes,
      _relationships: resource.relationships
    } as T;
    
    // Resolve relationships if includes provided
    if (includeMap && resource.relationships) {
      for (const [key, rel] of Object.entries(resource.relationships)) {
        if (rel.data) {
          model[key] = this.resolveRelationship(rel.data, includeMap);
        }
      }
    }
    
    return model;
  }
  
  /**
   * Parse document and create include map
   */
  parseDocument(doc: JsonApiDocument): { data: any[], includes: Map<string, any> } {
    const includeMap = new Map();
    
    if (doc.included) {
      doc.included.forEach(resource => {
        includeMap.set(`${resource.type}:${resource.id}`, resource);
      });
    }
    
    const data = Array.isArray(doc.data) ? doc.data : [doc.data];
    return {
      data: data.map(r => this.toModel(r, includeMap)),
      includes: includeMap
    };
  }
  
  private resolveRelationship(relData: any, includeMap: Map<string, any>): any {
    if (Array.isArray(relData)) {
      return relData.map(r => includeMap.get(`${r.type}:${r.id}`));
    }
    return includeMap.get(`${relData.type}:${relData.id}`);
  }
}
```

### Step 2.2: Datapoint Service (KNX IoT API)

```typescript
// src/app/features/datapoints/services/datapoint.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DatapointService {
  private apiBase = '/api/v2';
  
  constructor(
    private http: HttpClient,
    private transformer: JsonApiTransformer,
    private config: ConfigService
  ) {}
  
  /**
   * Get all datapoints with filters
   * Example: filter[meta.@type]=9.001&page[limit]=50
   */
  getAll(params?: any): Observable<any> {
    return this.http.get<JsonApiDocument>(
      `${this.config.apiBase}${this.apiBase}/datapoints`,
      { params }
    );
  }
  
  /**
   * Get single datapoint
   */
  getById(id: string): Observable<JsonApiResource> {
    return this.http.get<JsonApiDocument>(
      `${this.config.apiBase}${this.apiBase}/datapoints/${id}`
    );
  }
  
  /**
   * Get latest values for all datapoints
   */
  getValues(): Observable<any> {
    return this.http.get(
      `${this.config.apiBase}${this.apiBase}/datapoints/values`
    );
  }
  
  /**
   * Get time-series data for chart
   */
  getTimeseries(id: string, params?: any): Observable<any> {
    return this.http.get(
      `${this.config.apiBase}${this.apiBase}/datapoints/${id}/timeseries`,
      { params }
    );
  }
  
  /**
   * Write multiple datapoint values
   */
  writeValues(updates: any[]): Observable<any> {
    return this.http.put(
      `${this.config.apiBase}${this.apiBase}/datapoints/values`,
      { data: updates }
    );
  }
}
```

### Step 2.3: WebSocket Service (Real-Time)

```typescript
// src/app/core/websocket/websocket.service.ts

import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private ws: WebSocket | null = null;
  private message$ = new Subject<any>();
  
  constructor(
    private auth: OAuthService,
    private config: ConfigService
  ) {}
  
  connect(): Observable<any> {
    return new Observable(observer => {
      const wsUrl = `${this.config.wsBase}/messaging/ws?token=${this.auth.getToken()}`;
      this.ws = new WebSocket(wsUrl, ['gw.knx.org']);
      
      this.ws.onopen = () => {
        console.log('[WebSocket] Connected');
        observer.next({ type: 'connected' });
      };
      
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          observer.next(message);
        } catch (e) {
          observer.error(e);
        }
      };
      
      this.ws.onerror = (error) => observer.error(error);
      this.ws.onclose = () => observer.complete();
      
      return () => this.disconnect();
    });
  }
  
  disconnect(): void {
    if (this.ws) this.ws.close();
  }
  
  send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
}
```

---

## Phase 3: Features

### Step 3.1: Datapoints List Component

```typescript
// src/app/features/datapoints/datapoints-list.component.ts

import { Component, OnInit, ViewChild } from '@angular/core';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { DatapointService } from './services/datapoint.service';

@Component({
  selector: 'app-datapoints-list',
  template: `
    <div class="toolbar">
      <mat-form-field>
        <input matInput placeholder="Search" [(ngModel)]="searchTerm">
      </mat-form-field>
      <button mat-icon-button (click)="onRefresh()">
        <mat-icon>refresh</mat-icon>
      </button>
    </div>
    
    <cdk-virtual-scroll-viewport itemSize="50" class="table">
      <table mat-table [dataSource]="datapoints">
        <!-- Columns -->
      </table>
    </cdk-virtual-scroll-viewport>
  `
})
export class DatapointsListComponent implements OnInit {
  @ViewChild(CdkVirtualScrollViewport) viewport!: CdkVirtualScrollViewport;
  
  datapoints: any[] = [];
  searchTerm = '';
  
  constructor(private datapointService: DatapointService) {}
  
  ngOnInit(): void {
    this.loadDatapoints();
  }
  
  loadDatapoints(): void {
    const params = {
      'page[limit]': 100,
      'page[offset]': 0,
      ...(this.searchTerm && { 'filter[title]': this.searchTerm })
    };
    
    this.datapointService.getAll(params).subscribe((doc: JsonApiDocument) => {
      this.datapoints = doc.data;
    });
  }
  
  onRefresh(): void {
    this.loadDatapoints();
  }
}
```

### Step 3.2: Live View with WebSocket

```typescript
// src/app/features/monitor/live-view.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { WebSocketService } from '@app/core/websocket';

@Component({
  selector: 'app-live-view',
  template: `
    <div *ngIf="!isConnected" class="status">
      <mat-spinner diameter="30"></mat-spinner>
      Connecting to live stream...
    </div>
    
    <cdk-virtual-scroll-viewport itemSize="50" class="live-table">
      <table mat-table [dataSource]="buffer">
        <!-- Columns -->
      </table>
    </cdk-virtual-scroll-viewport>
  `
})
export class LiveViewComponent implements OnInit, OnDestroy {
  buffer: any[] = [];
  isConnected = false;
  private destroy$ = new Subject<void>();
  
  constructor(private wsService: WebSocketService) {}
  
  ngOnInit(): void {
    this.wsService.connect()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        message => this.onMessage(message),
        error => console.error('WebSocket error:', error)
      );
  }
  
  onMessage(message: any): void {
    if (message.type === 'connected') {
      this.isConnected = true;
    } else if (message.type === 'datapoint_updated') {
      this.buffer.unshift(message);
      if (this.buffer.length > 1000) this.buffer.pop();
    } else if (message.type === 'batch') {
      message.updates.forEach(u => {
        this.buffer.unshift(u);
      });
      this.buffer = this.buffer.slice(0, 1000);
    }
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.wsService.disconnect();
  }
}
```

### Step 3.3: Charts Component (ECharts)

```typescript
// src/app/features/charts/charts.component.ts

import { Component, OnInit } from '@angular/core';
import { DatapointService } from '../datapoints/services/datapoint.service';

@Component({
  selector: 'app-charts',
  template: `
    <div class="chart-container">
      <echarts-simple [options]="chartOptions"></echarts-simple>
    </div>
  `
})
export class ChartsComponent implements OnInit {
  chartOptions: any;
  
  constructor(private datapointService: DatapointService) {}
  
  ngOnInit(): void {
    // Example: Load timeseries for datapoint "1/2/3"
    this.datapointService.getTimeseries('1/2/3', {
      'filter[timestamp][ge]': '2026-07-30T00:00:00Z',
      'filter[timestamp][le]': '2026-07-30T23:59:59Z'
    }).subscribe(data => {
      this.chartOptions = {
        xAxis: { type: 'time' },
        yAxis: {},
        series: [{
          data: data.map(p => [p.timestamp, p.value]),
          type: 'line'
        }]
      };
    });
  }
}
```

---

## Phase 4: Testing

### Step 4.1: Mock Data for Development

```typescript
// src/app/core/api/mock-data.ts

export const MOCK_DATAPOINT_RESPONSE: JsonApiDocument = {
  data: {
    type: 'datapoint',
    id: '1/2/3',
    attributes: {
      title: 'Living Room Temperature',
      value: '21.5',
      meta: { '@type': '9.001', '@unit': '°C' }
    },
    relationships: {
      device: {
        data: { type: 'device', id: 'sensor-1' }
      }
    }
  },
  included: [
    {
      type: 'device',
      id: 'sensor-1',
      attributes: {
        title: 'Temperature Sensor',
        manufacturer: 'Siemens'
      }
    }
  ]
};
```

### Step 4.2: Service Tests

```typescript
// src/app/features/datapoints/services/datapoint.service.spec.ts

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DatapointService } from './datapoint.service';

describe('DatapointService', () => {
  let service: DatapointService;
  let http: HttpTestingController;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DatapointService]
    });
    service = TestBed.inject(DatapointService);
    http = TestBed.inject(HttpTestingController);
  });
  
  it('should fetch datapoints with JSON:API format', () => {
    service.getAll({ 'page[limit]': 10 }).subscribe(doc => {
      expect(doc.data[0].type).toBe('datapoint');
    });
    
    const req = http.expectOne(req =>
      req.url.includes('/datapoints') &&
      req.params.has('page[limit]')
    );
    
    req.flush(MOCK_DATAPOINT_RESPONSE);
  });
});
```

---

## Phase 5: Deployment

### Environment Configuration

```typescript
// src/environments/environment.ts

export const environment = {
  apiBase: 'http://localhost:3000',
  wsBase: 'ws://localhost:3000',
  clientId: 'frontend-app',
  production: false
};
```

### Build & Run

```bash
# Development
ng serve --port 4200

# Production
ng build --configuration production

# Docker
docker build -f frontend/Dockerfile -t knx-frontend .
docker run -e API_BASE=http://gateway:3000 -p 80:4200 knx-frontend
```

---

## Key Differences from Specification

| Aspect | Spec | Reality | Note |
|--------|------|---------|------|
| API Base | `/api` | `/api/v2` | Versioned endpoints |
| Auth | JWT | OAuth2 | RFC 6749 compliant |
| Real-Time | SignalR | WebSocket | Standard WebSocket |
| Response Format | Custom JSON | JSON:API | Spec-compliant |
| Pagination | `skip`/`limit` | `page[offset]`/`page[limit]` | Standard format |

---

## Next Steps

1. ✅ Read updated GUI-frontend-api.md
2. ✅ Review GUI-API-ADAPTATION-SUMMARY.md
3. 📋 Setup Angular project with dependencies
4. 📋 Implement OAuth2 & HTTP interceptor
5. 📋 Create core services (Datapoint, WebSocket, etc.)
6. 📋 Build feature components (Dashboard, Live View, Charts)
7. 📋 Add unit & integration tests
8. 📋 Test with actual gateway API
9. 📋 Deploy to production

---

**Version:** 1.0  
**Last Updated:** 2026-07-30
