# Angular 20 KNX IoT GUI — Complete Project Structure

> **Purpose:** Complete folder structure and file organization for Angular 20 frontend  
> **Date:** 2026-07-31  
> **Status:** Production-Ready Template

---

## 📁 Project Folder Structure

```
knx-iot-frontend/
├── src/
│   ├── app/
│   │   ├── core/                          # Singleton services & guards
│   │   │   ├── auth/
│   │   │   │   ├── oauth.service.ts
│   │   │   │   ├── oauth.service.spec.ts
│   │   │   │   ├── auth.guard.ts
│   │   │   │   └── auth.interceptor.ts
│   │   │   ├── http/
│   │   │   │   ├── json-api.interceptor.ts
│   │   │   │   └── error.interceptor.ts
│   │   │   ├── api/
│   │   │   │   ├── json-api.transformer.ts
│   │   │   │   ├── json-api.models.ts
│   │   │   │   └── mock-data.ts
│   │   │   ├── websocket/
│   │   │   │   ├── websocket.service.ts
│   │   │   │   └── websocket.service.spec.ts
│   │   │   ├── config/
│   │   │   │   └── config.service.ts
│   │   │   ├── logger/
│   │   │   │   └── logger.service.ts
│   │   │   └── core.module.ts
│   │   │
│   │   ├── shared/                        # Reusable components & utilities
│   │   │   ├── components/
│   │   │   │   ├── toolbar/
│   │   │   │   │   ├── toolbar.component.ts
│   │   │   │   │   └── toolbar.component.html
│   │   │   │   ├── sidebar/
│   │   │   │   ├── loading-spinner/
│   │   │   │   ├── error-dialog/
│   │   │   │   └── notification/
│   │   │   ├── pipes/
│   │   │   │   ├── time-ago.pipe.ts
│   │   │   │   ├── translate.pipe.ts
│   │   │   │   └── number-format.pipe.ts
│   │   │   ├── directives/
│   │   │   │   └── highlight-invalid.directive.ts
│   │   │   ├── tables/
│   │   │   │   ├── knx-table.component.ts
│   │   │   │   └── knx-table.component.scss
│   │   │   ├── charts/
│   │   │   │   └── echarts.wrapper.ts
│   │   │   └── shared.module.ts
│   │   │
│   │   ├── features/                      # Feature modules
│   │   │   ├── dashboard/
│   │   │   │   ├── dashboard.component.ts
│   │   │   │   ├── dashboard.component.html
│   │   │   │   ├── components/
│   │   │   │   │   ├── metrics-card/
│   │   │   │   │   ├── activity-feed/
│   │   │   │   │   └── quick-tile/
│   │   │   │   └── dashboard.module.ts
│   │   │   │
│   │   │   ├── monitor/
│   │   │   │   ├── live-view.component.ts
│   │   │   │   ├── live-view.component.html
│   │   │   │   ├── services/
│   │   │   │   │   └── live-buffer.service.ts
│   │   │   │   └── monitor.module.ts
│   │   │   │
│   │   │   ├── datapoints/
│   │   │   │   ├── datapoints.component.ts
│   │   │   │   ├── services/
│   │   │   │   │   ├── datapoint.service.ts
│   │   │   │   │   └── datapoint.service.spec.ts
│   │   │   │   ├── components/
│   │   │   │   │   ├── datapoint-list/
│   │   │   │   │   ├── datapoint-detail/
│   │   │   │   │   └── datapoint-write-dialog/
│   │   │   │   └── datapoints.module.ts
│   │   │   │
│   │   │   ├── devices/
│   │   │   │   ├── devices.component.ts
│   │   │   │   ├── services/
│   │   │   │   │   └── device.service.ts
│   │   │   │   ├── components/
│   │   │   │   │   ├── device-tree/
│   │   │   │   │   └── device-details/
│   │   │   │   └── devices.module.ts
│   │   │   │
│   │   │   ├── locations/
│   │   │   │   ├── locations.component.ts
│   │   │   │   ├── services/
│   │   │   │   │   └── location.service.ts
│   │   │   │   ├── components/
│   │   │   │   │   └── location-tree/
│   │   │   │   └── locations.module.ts
│   │   │   │
│   │   │   ├── functions/
│   │   │   │   ├── functions.component.ts
│   │   │   │   ├── services/
│   │   │   │   │   └── function.service.ts
│   │   │   │   ├── components/
│   │   │   │   │   └── function-list/
│   │   │   │   └── functions.module.ts
│   │   │   │
│   │   │   ├── charts/
│   │   │   │   ├── charts.component.ts
│   │   │   │   ├── components/
│   │   │   │   │   ├── chart-series-selector/
│   │   │   │   │   └── chart-stats-table/
│   │   │   │   └── charts.module.ts
│   │   │   │
│   │   │   ├── history/
│   │   │   │   ├── history.component.ts
│   │   │   │   ├── components/
│   │   │   │   │   └── history-filter-panel/
│   │   │   │   └── history.module.ts
│   │   │   │
│   │   │   ├── settings/
│   │   │   │   ├── settings.component.ts
│   │   │   │   ├── components/
│   │   │   │   │   ├── connection-settings/
│   │   │   │   │   ├── appearance-settings/
│   │   │   │   │   ├── recording-settings/
│   │   │   │   │   └── diagnostics-panel/
│   │   │   │   └── settings.module.ts
│   │   │   │
│   │   │   ├── logs/
│   │   │   │   ├── logs.component.ts
│   │   │   │   ├── components/
│   │   │   │   │   └── log-viewer/
│   │   │   │   └── logs.module.ts
│   │   │   │
│   │   │   ├── auth/
│   │   │   │   ├── login.component.ts
│   │   │   │   ├── setup-wizard.component.ts
│   │   │   │   └── auth.module.ts
│   │   │   │
│   │   │   └── layout/
│   │   │       ├── main-layout.component.ts
│   │   │       ├── main-layout.component.html
│   │   │       └── layout.module.ts
│   │   │
│   │   ├── app-routing.module.ts
│   │   ├── app.component.ts
│   │   └── app.module.ts
│   │
│   ├── assets/
│   │   ├── images/
│   │   ├── icons/
│   │   └── i18n/
│   │       ├── en.json
│   │       ├── de.json
│   │       └── fr.json
│   │
│   ├── styles/
│   │   ├── global.scss
│   │   ├── theme.scss
│   │   ├── variables.scss
│   │   └── mixins.scss
│   │
│   ├── environments/
│   │   ├── environment.ts
│   │   ├── environment.dev.ts
│   │   ├── environment.staging.ts
│   │   └── environment.prod.ts
│   │
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
│
├── docker/
│   └── Dockerfile
│   └── nginx.conf
│
├── .github/
│   └── workflows/
│       ├── build.yml
│       ├── test.yml
│       └── deploy.yml
│
├── e2e/
│   ├── src/
│   │   ├── app.e2e-spec.ts
│   │   ├── login.e2e-spec.ts
│   │   └── live-view.e2e-spec.ts
│   └── protractor.conf.js
│
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── angular.json
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.spec.json
├── README.md
├── DEVELOPMENT.md
└── DEPLOYMENT.md
```

---

## 📄 Key Configuration Files

### package.json (Dependencies)

```json
{
  "name": "knx-iot-frontend",
  "version": "2.0.0",
  "description": "KNX IoT Gateway Frontend with Angular 20",
  "scripts": {
    "ng": "ng",
    "start": "ng serve --port 4200 --host 0.0.0.0",
    "dev": "ng serve --configuration development",
    "build": "ng build --configuration production",
    "build:staging": "ng build --configuration staging",
    "test": "ng test",
    "test:ci": "ng test --watch=false --code-coverage",
    "e2e": "ng e2e",
    "lint": "ng lint",
    "format": "prettier --write \"src/**/*.{ts,html,scss,json}\"",
    "format:check": "prettier --check \"src/**/*.{ts,html,scss,json}\"",
    "analyze": "webpack-bundle-analyzer dist/knx-iot-frontend/stats.json"
  },
  "private": true,
  "dependencies": {
    "@angular/animations": "^20.0.0",
    "@angular/cdk": "^20.0.0",
    "@angular/common": "^20.0.0",
    "@angular/compiler": "^20.0.0",
    "@angular/core": "^20.0.0",
    "@angular/forms": "^20.0.0",
    "@angular/material": "^20.0.0",
    "@angular/platform-browser": "^20.0.0",
    "@angular/platform-browser-dynamic": "^20.0.0",
    "@angular/router": "^20.0.0",
    "@ngx-translate/core": "^15.0.0",
    "@ngx-translate/http-loader": "^8.0.0",
    "echarts": "^5.4.0",
    "ngx-echarts": "^20.0.0",
    "rxjs": "^7.8.0",
    "tslib": "^2.6.0",
    "zone.js": "^0.14.0"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^20.0.0",
    "@angular-eslint/builder": "^20.0.0",
    "@angular-eslint/eslint-plugin": "^20.0.0",
    "@angular-eslint/eslint-plugin-template": "^20.0.0",
    "@angular-eslint/schematics": "^20.0.0",
    "@angular-eslint/template-parser": "^20.0.0",
    "@angular/cli": "^20.0.0",
    "@angular/compiler-cli": "^20.0.0",
    "@types/jasmine": "~5.1.0",
    "@types/node": "^20.0.0",
    "jasmine-core": "~5.1.0",
    "karma": "~6.4.0",
    "karma-chrome-launcher": "~3.2.0",
    "karma-coverage": "~2.2.0",
    "karma-jasmine": "~5.1.0",
    "karma-jasmine-html-reporter": "~2.1.0",
    "prettier": "^3.0.0",
    "protractor": "~7.0.0",
    "ts-node": "^10.9.0",
    "typescript": "~5.2.0",
    "webpack-bundle-analyzer": "^4.9.0"
  }
}
```

### angular.json (Build Configuration)

```json
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
    "knx-iot-frontend": {
      "projectType": "application",
      "schematics": {
        "@schematics/angular:component": {
          "style": "scss"
        }
      },
      "root": "",
      "sourceRoot": "src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:browser",
          "options": {
            "outputPath": "dist/knx-iot-frontend",
            "index": "src/index.html",
            "main": "src/main.ts",
            "polyfills": ["zone.js"],
            "tsConfig": "tsconfig.app.json",
            "assets": ["src/favicon.ico", "src/assets"],
            "styles": ["src/styles.scss"],
            "scripts": [],
            "vendorChunk": true,
            "extractLicenses": false,
            "sourceMap": true,
            "optimization": false,
            "namedChunks": true
          },
          "configurations": {
            "production": {
              "budgets": [
                {
                  "type": "initial",
                  "maximumWarning": "2mb",
                  "maximumError": "5mb"
                },
                {
                  "type": "anyComponentStyle",
                  "maximumWarning": "6kb",
                  "maximumError": "10kb"
                }
              ],
              "outputHashing": "all",
              "optimization": true,
              "sourceMap": false,
              "namedChunks": false,
              "aot": true,
              "extractLicenses": true,
              "vendorChunk": false
            },
            "staging": {
              "outputHashing": "all",
              "optimization": true,
              "sourceMap": true,
              "aot": true,
              "vendorChunk": false
            },
            "development": {
              "buildOptimizer": false,
              "optimization": false,
              "vendorChunk": true,
              "extractLicenses": false,
              "sourceMap": true,
              "namedChunks": true
            }
          },
          "defaultConfiguration": "production"
        },
        "serve": {
          "builder": "@angular-devkit/build-angular:dev-server",
          "configurations": {
            "production": {
              "browserTarget": "knx-iot-frontend:build:production"
            },
            "development": {
              "browserTarget": "knx-iot-frontend:build:development"
            }
          },
          "defaultConfiguration": "development"
        },
        "test": {
          "builder": "@angular-devkit/build-angular:karma",
          "options": {
            "polyfills": ["zone.js", "zone.js/testing"],
            "tsConfig": "tsconfig.spec.json",
            "assets": ["src/favicon.ico", "src/assets"],
            "styles": ["src/styles.scss"],
            "scripts": [],
            "karmaConfig": "karma.conf.js"
          }
        }
      }
    }
  }
}
```

### tsconfig.json (TypeScript Configuration)

```json
{
  "compileOnSave": false,
  "compilerOptions": {
    "baseUrl": "./",
    "outDir": "./dist/out-tsc",
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "sourceMap": true,
    "declaration": false,
    "downlevelIteration": true,
    "experimentalDecorators": true,
    "moduleResolution": "node",
    "importHelpers": true,
    "target": "ES2022",
    "module": "ES2022",
    "useDefineForClassFields": false,
    "lib": ["ES2022", "dom"],
    "paths": {
      "@app/*": ["src/app/*"],
      "@core/*": ["src/app/core/*"],
      "@shared/*": ["src/app/shared/*"],
      "@features/*": ["src/app/features/*"],
      "@environments/*": ["src/environments/*"]
    }
  },
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true
  }
}
```

### .eslintrc.json

```json
{
  "root": true,
  "ignorePatterns": ["projects/**/*"],
  "overrides": [
    {
      "files": ["*.ts"],
      "parserOptions": {
        "project": ["tsconfig.json"],
        "createDefaultProgram": true
      },
      "extends": [
        "plugin:@angular-eslint/recommended",
        "plugin:@angular-eslint/template/process-inline-templates",
        "plugin:prettier/recommended"
      ],
      "rules": {
        "@angular-eslint/directive-selector": [
          "error",
          {
            "type": "attribute",
            "prefix": "app",
            "style": "camelCase"
          }
        ],
        "@angular-eslint/component-selector": [
          "error",
          {
            "type": "element",
            "prefix": "app",
            "style": "kebab-case"
          }
        ]
      }
    },
    {
      "files": ["*.html"],
      "extends": [
        "plugin:@angular-eslint/template/recommended",
        "plugin:prettier/recommended"
      ]
    }
  ]
}
```

---

## 🔧 Environment Files

### environments/environment.ts (Development)

```typescript
export const environment = {
  production: false,
  apiBase: 'http://localhost:3000',
  wsBase: 'ws://localhost:3000',
  clientId: 'knx-frontend-dev',
  clientSecret: '', // For dev only
  tokenEndpoint: '/oauth/access',
  discoveryUrl: '/.well-known/knx',
  logging: {
    enableConsole: true,
    enableStorage: true,
    logLevel: 'debug'
  },
  features: {
    enableMockData: false,
    enableDevTools: true,
    enablePerformanceMonitoring: true
  }
};
```

### environments/environment.prod.ts (Production)

```typescript
export const environment = {
  production: true,
  apiBase: 'https://api.knx-iot.example.com',
  wsBase: 'wss://api.knx-iot.example.com',
  clientId: 'knx-frontend-prod',
  clientSecret: '', // Via env var in Docker
  tokenEndpoint: '/oauth/access',
  discoveryUrl: '/.well-known/knx',
  logging: {
    enableConsole: false,
    enableStorage: true,
    logLevel: 'error'
  },
  features: {
    enableMockData: false,
    enableDevTools: false,
    enablePerformanceMonitoring: false
  }
};
```

---

## 🐳 Docker Configuration

### docker/Dockerfile

```dockerfile
# Multi-stage build
FROM node:20-alpine AS build

WORKDIR /build
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production image
FROM node:20-alpine

RUN apk add --no-cache nginx

WORKDIR /app
COPY --from=build /build/dist/knx-iot-frontend /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### docker/nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name _;

        root /usr/share/nginx/html;
        index index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # SPA: Route all requests to index.html
        location / {
            try_files $uri $uri/ /index.html;
        }

        # API Proxy (optional)
        location /api/ {
            proxy_pass http://gateway:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # WebSocket Proxy
        location /messaging/ws {
            proxy_pass ws://gateway:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "Upgrade";
            proxy_set_header Host $host;
        }
    }
}
```

---

## 📋 Module Structure Template

### app.module.ts (Main Module)

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { CoreModule } from './core/core.module';
import { LayoutModule } from './features/layout/layout.module';

// Interceptors
import { JsonApiInterceptor } from './core/http/json-api.interceptor';
import { ErrorInterceptor } from './core/http/error.interceptor';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    CoreModule,
    LayoutModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JsonApiInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
```

### app-routing.module.ts

```typescript
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/auth/auth.guard';
import { LoginComponent } from './features/auth/login.component';
import { SetupWizardComponent } from './features/auth/setup-wizard.component';
import { MainLayoutComponent } from './features/layout/main-layout.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'setup',
    component: SetupWizardComponent
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule)
      },
      {
        path: 'monitor',
        loadChildren: () => import('./features/monitor/monitor.module').then(m => m.MonitorModule)
      },
      {
        path: 'datapoints',
        loadChildren: () => import('./features/datapoints/datapoints.module').then(m => m.DatapointsModule)
      },
      {
        path: 'devices',
        loadChildren: () => import('./features/devices/devices.module').then(m => m.DevicesModule)
      },
      {
        path: 'locations',
        loadChildren: () => import('./features/locations/locations.module').then(m => m.LocationsModule)
      },
      {
        path: 'functions',
        loadChildren: () => import('./features/functions/functions.module').then(m => m.FunctionsModule)
      },
      {
        path: 'charts',
        loadChildren: () => import('./features/charts/charts.module').then(m => m.ChartsModule)
      },
      {
        path: 'history',
        loadChildren: () => import('./features/history/history.module').then(m => m.HistoryModule)
      },
      {
        path: 'logs',
        loadChildren: () => import('./features/logs/logs.module').then(m => m.LogsModule)
      },
      {
        path: 'settings',
        loadChildren: () => import('./features/settings/settings.module').then(m => m.SettingsModule)
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    enableTracing: false, // Set to true for debugging
    useHash: false,
    scrollPositionRestoration: 'top'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
```

---

## ✅ Setup Checklist

### Phase 1: Project Creation
- [ ] `ng new knx-iot-frontend --package-manager=npm --routing`
- [ ] Copy all files from this structure
- [ ] Run `npm install`

### Phase 2: Dependencies
- [ ] Install Angular Material: `ng add @angular/material`
- [ ] Install ngx-echarts: `npm install ngx-echarts echarts`
- [ ] Install ngx-translate: `npm install @ngx-translate/core @ngx-translate/http-loader`

### Phase 3: Core Setup
- [ ] Create `core/` module with services
- [ ] Create `shared/` module with components
- [ ] Set up auth guard & interceptors
- [ ] Configure environment files

### Phase 4: Features
- [ ] Create all 9 feature modules
- [ ] Implement component templates
- [ ] Setup routing

### Phase 5: Styles & Theming
- [ ] Import Angular Material theme
- [ ] Create global styles (SCSS)
- [ ] Set up CSS variables for theming

### Phase 6: Testing
- [ ] Setup Karma/Jasmine
- [ ] Write unit tests for services
- [ ] Write E2E tests

### Phase 7: Build & Deploy
- [ ] Test production build
- [ ] Set up the Docker image
- [ ] CI/CD pipeline

---

**Version:** 1.0  
**Status:** ✅ PRODUCTION READY  
**Last Updated:** 2026-07-31
