# Angular 20 KNX IoT Frontend — Team Onboarding Guide

> **Purpose:** Complete onboarding for a frontend development team  
> **Audience:** Angular Developers, QA, DevOps  
> **Duration:** Day 1-2 review, Day 3 coding starts  
> **Date:** 2026-07-31

---

## 📚 Documentation Roadmap

**For All Team Members:**
1. Read this document (Onboarding)
2. Read **GUI-frontend-api.md** (5-10 min skim, detailed reference)
3. Read **EXECUTIVE-SUMMARY.md** (5 min quick overview)

**For Developers:**
4. Read **ANGULAR-GETTING-STARTED.md** (setup first project)
5. Read **GUI-IMPLEMENTATION-GUIDE.md** (code examples per feature)
6. Read **ANGULAR-PROJECT-STRUCTURE.md** (folder organization)

**For QA/DevOps:**
7. Read **VALIDATION-CHECKLIST.md** (testing & acceptance criteria)
8. Setup Docker/deployment infrastructure

---

## 🎯 Project Overview

### What We're Building
A professional **Angular 20 SPA** that monitors and controls KNX building automation systems via the **semantic-knx-gateway** REST API.

### Architecture (High-Level)
```
User Browser (Angular 20 SPA)
         ↓
    HTTP (JSON:API)
    WebSocket (gw.knx.org)
         ↓
semantic-knx-gateway (/api/v2, /messaging/ws)
         ↓
KNX Hardware (Building Systems)
```

### Key Features
- ✅ Real-time datapoint monitoring (1000+ points)
- ✅ Live view with WebSocket streaming
- ✅ Historical data queries
- ✅ Interactive charts (ECharts)
- ✅ Device & location hierarchy browser
- ✅ Semantic functions (vendor bridge)
- ✅ OAuth2 authentication
- ✅ Settings & diagnostics

### Technology Stack
| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | Angular 20 | Enterprise-grade, type-safe |
| **Language** | TypeScript 5.2 | Strong typing, better tooling |
| **UI Library** | Angular Material 20 | Consistent design, accessibility |
| **Data Grid** | CDK Virtual Scrolling | Handle 1000+ rows @ 60 FPS |
| **Charts** | ECharts + ngx-echarts | Real-time, dark theme support |
| **Real-Time** | WebSocket (RFC 6455) | Efficient, standard protocol |
| **HTTP** | HttpClient + Interceptors | OAuth2, JSON:API compliant |
| **State** | RxJS Observables | Reactive, event-driven |
| **Styling** | SCSS + CSS Variables | Dark theme, theming support |

---

## 🔑 Key Concepts You Must Know

### 1. JSON:API Format
API responses are in **JSON:API 1.0** format (not plain JSON):

```typescript
// Response from GET /api/v2/datapoints/1/2/3
{
  "data": {
    "type": "datapoint",          // Resource type
    "id": "1/2/3",                // Resource ID (KNX group address)
    "attributes": {               // Actual data
      "title": "Living Room Temp",
      "value": "21.5",
      "meta": { "@type": "9.001" }
    },
    "relationships": {            // Links to related resources
      "device": {
        "data": { "type": "device", "id": "sensor-1" }
      }
    }
  },
  "included": [                   // Related resources (reduces N+1 queries)
    {
      "type": "device",
      "id": "sensor-1",
      "attributes": { "title": "Temperature Sensor" }
    }
  ]
}
```

**Why?** Standard format, better tooling, schema validation, vendor independence.

### 2. OAuth2 Bearer Token
All API requests use OAuth2 (RFC 6749):

```typescript
// Login
POST /oauth/access
grant_type=password&username=user&password=pass

// Response
{ access_token: "...", token_type: "Bearer", expires_in: 3600 }

// Use in all requests
Authorization: Bearer <access_token>
```

**Why?** Industry standard, stateless, scalable, more secure than JWT.

### 3. WebSocket Subscriptions
Real-time updates via WebSocket (not SignalR):

```typescript
// Connect
ws://gateway:3000/messaging/ws?token=<bearer>
Subprotocol: gw.knx.org

// Receive messages
{ type: "datapoint_updated", id: "1/2/3", value: "21.5" }
{ type: "batch", updates: [...] }  // For high frequency (>100/sec)
```

**Why?** Standard WebSocket protocol, efficient batching, native browser support.

### 4. RxJS Observables
All async operations use RxJS Observables:

```typescript
// Get datapoints
this.datapointService.getAll()
  .pipe(
    debounceTime(300),           // Wait 300ms after last event
    filter(doc => doc.data.length > 0),  // Only if results
    map(doc => transform(doc)),   // Transform data
    takeUntil(this.destroy$)      // Cleanup on destroy
  )
  .subscribe(data => render(data));
```

**Why?** Functional, composable, automatic memory cleanup, handles backpressure.

### 5. Virtual Scrolling
Tables handle 1000+ rows efficiently:

```html
<cdk-virtual-scroll-viewport itemSize="50" class="table">
  <table mat-table [dataSource]="datapoints">
    <!-- Only visible rows rendered (DOM is small) -->
  </table>
</cdk-virtual-scroll-viewport>
```

**Why?** Renders only visible rows, 60 FPS even with 1000+ points, low memory.

### 6. Lazy-Loaded Modules
Each feature is a separate module loaded on-demand:

```typescript
// app-routing.module.ts
{
  path: 'datapoints',
  loadChildren: () => import('./features/datapoints/datapoints.module')
    .then(m => m.DatapointsModule)
}
```

**Why?** Faster initial load, smaller bundles, better memory usage.

---

## 👥 Team Roles & Responsibilities

### Lead Developer
- [ ] Review architecture and make design decisions
- [ ] Setup initial project structure
- [ ] Create core services (OAuth, HTTP, WebSocket)
- [ ] Mentor junior developers
- [ ] Code review for all PRs

### Frontend Developers (2-3)
- [ ] Implement feature modules (dashboard, live view, charts, etc.)
- [ ] Build components and templates
- [ ] Write unit tests
- [ ] Optimize performance (virtual scrolling, change detection)

### QA/Testing
- [ ] Write E2E tests (Protractor/Cypress)
- [ ] Performance testing (1000 rows @ 60 FPS)
- [ ] Accessibility testing (WCAG 2.1 AA)
- [ ] Security testing (OWASP, CORS, CSP)
- [ ] Browser compatibility testing

### DevOps/Deployment
- [ ] Setup Docker images
- [ ] CI/CD pipeline (GitHub Actions, GitLab CI)
- [ ] Environment management (dev, staging, prod)
- [ ] Monitoring & logging
- [ ] Backup & disaster recovery

---

## 🔄 Development Workflow

### Day 1: Setup
```
1. Clone/create Angular project
2. Install dependencies
3. Run first build (should see http://localhost:4200)
4. Read documentation
5. Setup IDE (VSCode plugins: Angular Language Service, Prettier)
```

### Day 2: Core Services
```
1. Implement OAuthService
2. Implement HttpInterceptor (JSON:API)
3. Implement WebSocketService
4. Implement ConfigService
5. Setup CoreModule
6. Test OAuth login flow
```

### Week 1: Feature Modules
```
1. Dashboard component
2. Live View (with WebSocket)
3. Datapoints List (with virtual scrolling)
4. Charts component
5. Basic routing working
```

### Week 2: Advanced Features
```
1. Device tree browser
2. Location hierarchy
3. History/archive view
4. Settings panel
5. Error handling & notifications
```

### Week 3: Testing & Polish
```
1. Unit tests (services)
2. E2E tests (critical flows)
3. Performance optimization
4. Accessibility audit
5. Code review & refactoring
```

### Week 4: Deployment
```
1. Docker image build
2. CI/CD pipeline setup
3. Production deployment
4. Monitoring setup
5. Team training & documentation
```

---

## 📋 Pre-Development Checklist

### Environment Setup
- [ ] Node.js 20.x installed
- [ ] npm 10.x installed
- [ ] VSCode with extensions installed
  - [ ] Angular Language Service
  - [ ] Prettier - Code Formatter
  - [ ] ESLint
  - [ ] SCSS Intellisense
- [ ] Git configured
- [ ] GitHub/GitLab access

### Knowledge Requirements
- [ ] Familiar with Angular 14+ (or willing to learn)
- [ ] TypeScript basics (types, interfaces, decorators)
- [ ] RxJS Observables (operators: map, filter, tap, takeUntil)
- [ ] HTTP basics (REST, headers, status codes)
- [ ] WebSocket basics
- [ ] SCSS/CSS Grid & Flexbox

### Gateway Access
- [ ] semantic-knx-gateway running locally or staging
- [ ] API credentials (username/password for OAuth2)
- [ ] Test data (devices, datapoints created)
- [ ] Postman/Insomnia collection for API testing

---

## 🏃 Quick Start (30 minutes)

```bash
# 1. Create project
ng new knx-iot-frontend --routing --style=scss
cd knx-iot-frontend

# 2. Add Material
ng add @angular/material

# 3. Add libraries
npm install @angular/cdk echarts ngx-echarts @ngx-translate/core

# 4. Create folder structure
mkdir -p src/app/{core/{auth,http,api,websocket},shared,features}

# 5. Copy files
# (OAuthService, Interceptors, etc.)

# 6. Start dev server
npm start

# 7. Open http://localhost:4200 (should redirect to /login)
```

---

## 🐛 Common Pitfalls & How to Avoid

### ❌ Pitfall 1: Not using JSON:API transformer
Wrong:
```typescript
this.http.get('/api/v2/datapoints').subscribe(doc => {
  this.datapoints = doc.data;  // Wrong! Need to parse JSON:API
});
```

Right:
```typescript
this.http.get<JsonApiDocument>('/api/v2/datapoints')
  .pipe(map(doc => this.transformer.parseDocument(doc)))
  .subscribe(({ data }) => this.datapoints = data);
```

### ❌ Pitfall 2: Not unsubscribing from Observables
Wrong:
```typescript
ngOnInit() {
  this.datapoint$.subscribe(data => { ... });  // Memory leak!
}
```

Right:
```typescript
private destroy$ = new Subject<void>();

ngOnInit() {
  this.datapoint$
    .pipe(takeUntil(this.destroy$))
    .subscribe(data => { ... });
}

ngOnDestroy() {
  this.destroy$.next();  // Cleanup
}
```

### ❌ Pitfall 3: WebSocket without proper error handling
Wrong:
```typescript
this.ws.onmessage = event => {
  const msg = JSON.parse(event.data);  // Can throw!
  this.onMessage(msg);
};
```

Right:
```typescript
this.ws.onmessage = event => {
  try {
    const msg = JSON.parse(event.data);
    this.onMessage(msg);
  } catch (e) {
    console.error('Parse error:', e);
  }
};
```

### ❌ Pitfall 4: Virtual scrolling without proper height
Wrong:
```html
<cdk-virtual-scroll-viewport>  <!-- No height set! -->
  <table mat-table [dataSource]="data"></table>
</cdk-virtual-scroll-viewport>
```

Right:
```html
<cdk-virtual-scroll-viewport itemSize="50" class="table-viewport">
  <table mat-table [dataSource]="data"></table>
</cdk-virtual-scroll-viewport>

<style>
.table-viewport {
  height: 600px;  /* Must have fixed height */
  width: 100%;
}
</style>
```

### ❌ Pitfall 5: Not importing shared module in features
Wrong:
```typescript
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [DatapointsComponent],
  imports: [CommonModule]  // Material not imported!
})
export class DatapointsModule {}
```

Right:
```typescript
import { NgModule } from '@angular/core';
import { SharedModule } from '@shared/shared.module';

@NgModule({
  declarations: [DatapointsComponent],
  imports: [SharedModule]  // Has Material, forms, etc.
})
export class DatapointsModule {}
```

---

## 📞 Support & Resources

### Documentation
- **Angular Official:** https://angular.io/docs
- **RxJS:** https://rxjs.dev/
- **Material Design:** https://material.io/
- **JSON:API:** https://jsonapi.org/
- **OAuth2 RFC 6749:** https://tools.ietf.org/html/rfc6749

### Internal Resources
- Project repo: `semantic-knx-gateway` (GitHub)
- Spec docs: `docs/specifications/` folder
- Gateway API: `http://localhost:3000/docs` (Swagger UI)

### Team Channels
- Slack: #knx-iot-frontend
- Meetings: Weekly standup (Monday 10:00)
- Code Review: GitHub PRs

---

## ✅ Success Criteria for Sprint 1

By end of Week 1, verify:
- [ ] Angular 20 project running locally
- [ ] OAuth2 login working
- [ ] WebSocket connection successful
- [ ] Live view component renders 100+ datapoints
- [ ] Virtual scrolling works (60 FPS)
- [ ] Charts component displays timeseries data
- [ ] Error handling for API failures
- [ ] All core services have unit tests
- [ ] No console errors or warnings
- [ ] Prettier/ESLint passing

---

## 📈 Next Phase (Week 2+)

**Deliverables:**
- [ ] All 9 feature modules implemented
- [ ] Settings & configuration working
- [ ] Device tree browser with hierarchy
- [ ] History/archive view with pagination
- [ ] E2E tests for critical paths
- [ ] Performance: 1000 rows @ 60 FPS
- [ ] Accessibility: WCAG 2.1 AA score
- [ ] Docker image building & running

---

## 🎓 Learning Objectives

After completing this project, team should know:

- ✅ **Angular 20** — Standalone components, lazy loading, change detection
- ✅ **TypeScript** — Strict mode, generics, interfaces, decorators
- ✅ **RxJS** — Observables, operators, subscriptions, backpressure
- ✅ **JSON:API** — Parsing, transforming, relationships
- ✅ **OAuth2** — Token flow, interceptors, refresh logic
- ✅ **WebSocket** — Binary protocols, reconnection, backpressure
- ✅ **Performance** — Virtual scrolling, change detection, lazy loading
- ✅ **Testing** — Unit tests (Jasmine), E2E (Protractor), mocking

---

**Version:** 1.0  
**Status:** ✅ READY FOR TEAM LAUNCH  
**Estimated Duration:** 4-6 weeks (3 developers)  
**Last Updated:** 2026-07-31

---

## 📋 Team Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Lead Developer | _____ | _____ | _____ |
| Dev 1 | _____ | _____ | _____ |
| Dev 2 | _____ | _____ | _____ |
| QA Lead | _____ | _____ | _____ |
| DevOps | _____ | _____ | _____ |
| Project Manager | _____ | _____ | _____ |

**Print this document, collect signatures, and archive for project records.**
