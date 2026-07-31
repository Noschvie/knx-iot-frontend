# Angular 20 KNX IoT Frontend — Development Getting Started

> **Purpose:** Quick start guide for developers to begin implementation  
> **Time:** ~30 minutes to first working build  
> **Date:** 2026-07-31

---

## 🚀 Phase 1: Initial Setup (5 minutes)

### Step 1: Clone & Setup

```bash
# Create new Angular project
ng new knx-iot-frontend \
  --package-manager=npm \
  --routing \
  --style=scss \
  --skip-git

cd knx-iot-frontend

# Install dependencies
npm install

# Add Angular Material
ng add @angular/material
```

Choose:
- **Indigo/Pink theme** (or custom) → Yes
- **Typography** → Yes  
- **Animations** → Yes

### Step 2: Add Required Libraries

```bash
# Virtual Scrolling (CDK)
npm install @angular/cdk

# Charts (ECharts)
npm install echarts ngx-echarts

# Internationalization
npm install @ngx-translate/core @ngx-translate/http-loader

# Development tools
npm install --save-dev @angular-eslint/eslint-plugin prettier
npm install --save-dev webpack-bundle-analyzer
```

### Step 3: Verify Installation

```bash
# Check versions
ng version

# Should show Angular 20.x.x
# Node 20.x.x
# npm 10.x.x
```

---

## 📁 Phase 2: Project Structure (5 minutes)

### Create Folder Structure

```bash
# Core services
mkdir -p src/app/core/{auth,http,api,websocket,config,logger}

# Shared components & utilities
mkdir -p src/app/shared/{components,pipes,directives,tables,charts}

# Features
mkdir -p src/app/features/{dashboard,monitor,datapoints,devices,locations,functions,charts,history,settings,logs,auth,layout}

# Each feature needs
for feature in dashboard monitor datapoints devices locations functions charts history settings logs; do
  mkdir -p src/app/features/$feature/{components,services}
done

# Assets & environments
mkdir -p src/assets/{images,icons,i18n}
mkdir -p src/styles
mkdir -p docker
mkdir -p e2e/src
```

### Create Base Files

```bash
# Environments
cp src/environments/environment.ts src/environments/environment.dev.ts
cp src/environments/environment.ts src/environments/environment.staging.ts
cp src/environments/environment.ts src/environments/environment.prod.ts

# Styles
touch src/styles/{global,theme,variables,mixins}.scss

# Config files
touch .eslintrc.json .prettierrc
```

---

## 🔑 Phase 3: Core Services (10 minutes)

### Create OAuth Service

**File:** `src/app/core/auth/oauth.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '@environments/environment';

export interface OAuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

@Injectable({ providedIn: 'root' })
export class OAuthService {
  private token$ = new BehaviorSubject<string | null>(null);
  private tokenExpiresAt = 0;

  constructor(private http: HttpClient) {
    this.loadToken();
  }

  login(username: string, password: string): Observable<OAuthToken> {
    const body = new URLSearchParams({
      grant_type: 'password',
      username,
      password,
      client_id: environment.clientId
    });

    return this.http.post<OAuthToken>(
      `${environment.apiBase}${environment.tokenEndpoint}`,
      body.toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    ).pipe(
      tap(token => {
        localStorage.setItem('access_token', token.access_token);
        localStorage.setItem('token_expires_at', String(Date.now() + token.expires_in * 1000));
        this.token$.next(token.access_token);
      })
    );
  }

  getToken(): string | null {
    const token = this.token$.value || localStorage.getItem('access_token');
    
    // Check if expired
    const expiresAt = parseInt(localStorage.getItem('token_expires_at') || '0');
    if (Date.now() > expiresAt) {
      this.logout();
      return null;
    }
    
    return token;
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_expires_at');
    this.token$.next(null);
  }

  private loadToken(): void {
    const token = localStorage.getItem('access_token');
    if (token) {
      this.token$.next(token);
    }
  }
}
```

### Create Auth Interceptor

**File:** `src/app/core/http/json-api.interceptor.ts`

```typescript
import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { OAuthService } from '../auth/oauth.service';

@Injectable()
export class JsonApiInterceptor implements HttpInterceptor {
  constructor(private auth: OAuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.auth.getToken();
    
    let headers = req.headers
      .set('Accept', 'application/vnd.api+json');

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    // Set Content-Type based on endpoint
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'DELETE') {
      const isJsonFallback = 
        req.url.includes('/datapoints/values') ||
        req.url.includes('/subscriptions');
      
      headers = headers.set(
        'Content-Type',
        isJsonFallback ? 'application/json' : 'application/vnd.api+json'
      );
    }

    return next.handle(req.clone({ headers }));
  }
}
```

### Create Config Service

**File:** `src/app/core/config/config.service.ts`

```typescript
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
```

---

## 🔌 Phase 4: HTTP & WebSocket (5 minutes)

### Create Error Interceptor

**File:** `src/app/core/http/error.interceptor.ts`

```typescript
import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { OAuthService } from '../auth/oauth.service';
import { Router } from '@angular/router';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private auth: OAuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 || error.status === 403) {
          this.auth.logout();
          this.router.navigate(['/login']);
        }
        
        console.error('HTTP Error:', error);
        return throwError(() => error);
      })
    );
  }
}
```

### Create WebSocket Service

**File:** `src/app/core/websocket/websocket.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { OAuthService } from '../auth/oauth.service';
import { ConfigService } from '../config/config.service';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private ws: WebSocket | null = null;
  private messageSubject = new ReplaySubject<any>(100);

  constructor(
    private auth: OAuthService,
    private config: ConfigService
  ) {}

  connect(): Observable<any> {
    return new Observable(observer => {
      const wsBase = this.config.getWebSocketBase();
      const token = this.auth.getToken();
      const wsUrl = `${wsBase}/messaging/ws?token=${token}`;

      try {
        this.ws = new WebSocket(wsUrl, ['gw.knx.org']);

        this.ws.onopen = () => {
          console.log('[WebSocket] Connected');
          observer.next({ type: 'connected' });
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.messageSubject.next(message);
            observer.next(message);
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
          observer.error(error);
        };

        this.ws.onclose = () => {
          console.log('[WebSocket] Disconnected');
          observer.complete();
        };

        return () => this.disconnect();
      } catch (e) {
        observer.error(e);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  send(message: any): void {
    if (this.isConnected()) {
      this.ws!.send(JSON.stringify(message));
    }
  }

  getMessages(): Observable<any> {
    return this.messageSubject.asObservable();
  }
}
```

---

## 📦 Phase 5: Create Core Module (5 minutes)

**File:** `src/app/core/core.module.ts`

```typescript
import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { OAuthService } from './auth/oauth.service';
import { AuthGuard } from './auth/auth.guard';
import { JsonApiInterceptor } from './http/json-api.interceptor';
import { ErrorInterceptor } from './http/error.interceptor';
import { WebSocketService } from './websocket/websocket.service';
import { ConfigService } from './config/config.service';

@NgModule({
  imports: [CommonModule, HttpClientModule],
  providers: [
    OAuthService,
    AuthGuard,
    WebSocketService,
    ConfigService,
    { provide: HTTP_INTERCEPTORS, useClass: JsonApiInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true }
  ]
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import only once in AppModule');
    }
  }
}
```

---

## 🏗️ Phase 6: Create Shared Module (3 minutes)

**File:** `src/app/shared/shared.module.ts`

```typescript
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCommonModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ScrollingModule } from '@angular/cdk/scrolling';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    // Material modules
    MatCommonModule,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatInputModule,
    MatFormFieldModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatMenuModule,
    MatDialogModule,
    MatTabsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatTooltipModule,
    ScrollingModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    // Material modules
    MatCommonModule,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatInputModule,
    MatFormFieldModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatMenuModule,
    MatDialogModule,
    MatTabsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatTooltipModule,
    ScrollingModule
  ]
})
export class SharedModule {}
```

---

## 🎨 Phase 7: Setup App Component (2 minutes)

**File:** `src/app/app.component.ts`

```typescript
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OAuthService } from './core/auth/oauth.service';
import { ConfigService } from './core/config/config.service';

@Component({
  selector: 'app-root',
  template: `<router-outlet></router-outlet>`,
  styles: []
})
export class AppComponent implements OnInit {
  title = 'KNX IoT Frontend';

  constructor(
    private auth: OAuthService,
    private config: ConfigService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Load API info
    this.config.loadApiInfo().subscribe(
      info => console.log('API Info:', info),
      error => console.error('Failed to load API info:', error)
    );

    // Redirect to login if not authenticated
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
    }
  }
}
```

---

## ✅ First Build Test

```bash
# Start development server
npm start

# Should see:
# ✔ Compiled successfully
# ⠋ Building...
# https://localhost:4200/

# Open browser to http://localhost:4200
# Should redirect to /login
```

---

## 📝 Next Steps

### Immediate (Today)
1. ✅ Run `npm start`
2. ✅ Verify no errors
3. ✅ Test login redirect
4. ✅ Create basic login component
5. ✅ Test OAuth flow with gateway

### Next Phase (This Week)
1. Create all feature modules (9 modules)
2. Implement main layout & routing
3. Create datapoint service
4. Create WebSocket subscription service
5. Build live view component with virtual scrolling

### Testing (Ongoing)
1. Unit tests for services
2. E2E tests for critical flows
3. Performance testing (1000 rows @ 60 FPS)

---

## 🔗 Reference Docs

| Document | Purpose |
|----------|---------|
| **GUI-frontend-api.md** | Complete specification |
| **GUI-IMPLEMENTATION-GUIDE.md** | Code examples for all features |
| **ANGULAR-PROJECT-STRUCTURE.md** | Folder & file organization |
| **VALIDATION-CHECKLIST.md** | Progress tracking |

---

## 💡 Common Issues & Solutions

### Issue: "Cannot find module @angular/material"
**Solution:** `ng add @angular/material`

### Issue: WebSocket connection fails
**Solution:** Check `environment.wsBase` matches gateway (e.g., `ws://localhost:3000`)

### Issue: OAuth login returns 401
**Solution:** Verify `environment.clientId` matches gateway configuration

### Issue: Virtual scrolling shows blank
**Solution:** Import `ScrollingModule` from `@angular/cdk/scrolling`

---

**Version:** 1.0  
**Status:** ✅ READY TO START  
**Time to First Build:** ~30 minutes  
**Last Updated:** 2026-07-31
