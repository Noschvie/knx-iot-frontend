# Repository Strategy für KNX IoT Frontend

> **Question:** Neues Frontend-Repository oder im gleichen Repo wie Gateway?  
> **Date:** 2026-07-31  
> **Analysis:** Architecture & DevOps Implications

---

## 🎯 Szenarien

### Option 1: ❌ Im gleichen Repo wie Gateway (NICHT empfohlen)

```
semantic-knx-gateway/
├── src/                    (Backend: Node.js)
│   ├── api/
│   ├── knx/
│   └── storage/
├── frontend/               (Frontend: Angular)
│   ├── src/
│   ├── angular.json
│   └── package.json
├── package.json
├── docker-compose.yml
└── .github/workflows/
```

**Nachteile:**
- ❌ Unterschiedliche Tech Stacks (Node.js + Angular)
- ❌ Unterschiedliche Build-Zeiten (Backend schnell, Frontend langsam)
- ❌ Unterschiedliche Deployment-Cycles (API täglich, Frontend wöchentlich)
- ❌ Monorepo-Komplexität (2 verschiedene package.json, 2 build-Prozesse)
- ❌ Team-Autonomie eingeschränkt (Frontend-Devs müssen Backend-Struktur kennen)
- ❌ CI/CD kompliziert (Alles oder nichts Release)
- ❌ Dependencies Konflikt-Anfälligkeit

---

### Option 2: ✅ Separates Frontend-Repository (EMPFOHLEN)

```
GitHub/GitLab:

semantic-knx-gateway/         (Backend API)
├── src/                       (Node.js)
├── docs/
├── docker-compose.yml
├── Dockerfile
├── package.json
└── .github/workflows/

knx-iot-frontend/              (Frontend SPA) ← NEW REPO
├── src/                        (Angular)
├── angular.json
├── package.json
├── docker/
│   ├── Dockerfile
│   └── nginx.conf
└── .github/workflows/
```

**Vorteile:**
- ✅ Klare Separation of Concerns
- ✅ Independent Build & Deployment
- ✅ Separate CI/CD Pipelines
- ✅ Frontend-Team arbeitet autonom
- ✅ Unterschiedliche Versioning-Strategien
- ✅ Unterschiedliche Dependencies (keine Konflikte)
- ✅ Einfacheres Troubleshooting
- ✅ Bessere für mehrere Teams

---

### Option 3: ⚠️ Monorepo mit Workspaces (Hybrid)

```
knx-iot-monorepo/
├── package.json (root)
├── packages/
│   ├── gateway/              (Node.js Backend)
│   │   ├── src/
│   │   └── package.json
│   ├── frontend/             (Angular Frontend)
│   │   ├── src/
│   │   └── package.json
│   └── shared/               (TypeScript Libs)
│       └── package.json
└── .github/workflows/
```

**Vorteile:**
- ✅ Shared Libs zwischen Backend & Frontend (Interfaces, Types)
- ✅ Single Dependency Management
- ✅ Unified Build
- ✅ Atomic Commits (beide Teile zusammen versioniert)

**Nachteile:**
- ⚠️ Komplexere Setup
- ⚠️ Monorepo-Tools nötig (npm workspaces, Turborepo)
- ⚠️ Größere Repository
- ⚠️ Build braucht länger (alles werden gebaut)

---

## 🏆 Empfehlung: **Option 2 — Separates Frontend-Repository**

### Begründung:

| Kriterium | Gateway | Frontend | Gewinner |
|-----------|---------|----------|----------|
| **Tech Stack** | Node.js | Angular | Unterschiedlich |
| **Build-Zeit** | ~1 min | ~3-5 min | Unterschiedlich |
| **Deploy-Frequenz** | ~täglich | ~wöchentlich | Unterschiedlich |
| **Team-Größe** | 1-2 devs | 2-3 devs | Unterschiedlich |
| **Dependencies** | npm (Node) | npm (Angular) | Unterschiedlich |
| **Versionierung** | API v2.x | GUI v2.x | Unterschiedlich |

**→ Alles spricht für separate Repositories!**

### Ideal für:
- ✅ Teams arbeiten parallel (kein Blocking)
- ✅ Frontend kann off-network entwickelt werden
- ✅ Unabhängige Releases & Hotfixes
- ✅ Separate CI/CD für jedes Projekt
- ✅ Klare Ownership & Accountability

---

## 📋 Repository Setup-Plan

### Phase 1: Neues Frontend-Repo erstellen

```bash
# GitHub/GitLab
# Neu erstellen: knx-iot-frontend (Public oder Private)
# License: AGPL-3.0 (wie Gateway)
# .gitignore: Node.js
# README.md: Wird generiert

# Lokal klonen & setup
git clone https://github.com/Noschvie/knx-iot-frontend.git
cd knx-iot-frontend

# Angular Project initialisieren
ng new . --skip-git --routing --style=scss
npm install
```

### Phase 2: Repository-Struktur

```
knx-iot-frontend/
├── .github/
│   └── workflows/
│       ├── build.yml          (Build on push)
│       ├── test.yml           (Test suite)
│       └── deploy.yml         (Deploy to staging/prod)
├── docker/
│   ├── Dockerfile             (Multi-stage build)
│   └── nginx.conf             (Production config)
├── docs/
│   ├── API.md                 (Gateway API reference)
│   ├── DEVELOPMENT.md         (Local setup)
│   ├── DEPLOYMENT.md          (Docker & K8s)
│   └── ARCHITECTURE.md        (Design decisions)
├── e2e/                       (End-to-End tests)
├── src/                       (Angular application)
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── angular.json
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.spec.json
├── karma.conf.js              (Test runner)
├── README.md
├── LICENSE                    (AGPL-3.0)
├── CHANGELOG.md
└── .gitignore
```

---

## 🔗 Kommunikation zwischen Repos

Beide Repos sind **völlig unabhängig**, aber kommunizieren über API:

```
Browser
  ├─ App (from knx-iot-frontend repo)
  │   ├─ HTTP REST → semantic-knx-gateway:3000
  │   ├─ WebSocket → semantic-knx-gateway:3000
  │   └─ OAuth2 → semantic-knx-gateway:/oauth/access
```

**API Contract:**
- Definiert in: `semantic-knx-gateway/docs/knxiot_api_openapi.yaml`
- Frontend nutzt: Diese OpenAPI Spec
- Kein Code-Sharing nötig

---

## 📦 Gemeinsame Ressourcen (Shared)

### Was wird NICHT geteilt (Separate):
- ❌ Source Code (Frontend ≠ Backend)
- ❌ Dependencies (npm packages unterschiedlich)
- ❌ Build Config (Angular ≠ Node.js)
- ❌ Docker Images (Alpine + Nginx ≠ Node)

### Was kann geteilt werden (Optional):
- ✅ API Documentation (in Gateway-Repo unter `/docs/`)
- ✅ OpenAPI Spec (in Gateway-Repo `/knxiot_api_openapi.yaml`)
- ✅ Test Data (in separate Repo `knx-iot-test-data`)
- ✅ Docker Compose (für Local Development)

---

## 🚀 Setup-Checklist für neues Frontend-Repo

### GitHub/GitLab Setup
```bash
# 1. Neues Public Repository erstellen
# Name: knx-iot-frontend
# Description: KNX IoT 3rd-Party Gateway — Angular Frontend
# License: AGPL-3.0
# .gitignore: Node
# README: Generated by Angular CLI

# 2. Lokales Setup
git clone https://github.com/Noschvie/knx-iot-frontend.git
cd knx-iot-frontend

# 3. Angular Project generieren
ng new . \
  --skip-git \
  --package-manager=npm \
  --routing \
  --style=scss

# 4. Dependencies installieren
npm install
npm install @angular/cdk
npm install echarts ngx-echarts
npm install @ngx-translate/core @ngx-translate/http-loader

# 5. Verify
ng version
npm test    # Should pass
npm start   # Should see localhost:4200
```

### Repository Structure
```bash
# Create folder structure
mkdir -p docker docs e2e/src

# Copy documentation (from semantic-knx-gateway)
cp ../semantic-knx-gateway/docs/specifications/GUI-*.md ./docs/
cp ../semantic-knx-gateway/docs/specifications/*ANGULAR*.md ./docs/
cp ../semantic-knx-gateway/docs/specifications/VALIDATION*.md ./docs/
cp ../semantic-knx-gateway/docs/specifications/TEAM-*.md ./docs/

# Create .env file
echo "API_BASE=http://localhost:3000" > .env.example
echo "WS_BASE=ws://localhost:3000" >> .env.example
```

### GitHub Actions CI/CD
```bash
# Create workflows directory (if not exists)
mkdir -p .github/workflows

# GitHub Actions will automatically discover *.yml files
# See next section for CI/CD examples
```

---

## 🔄 CI/CD Pipeline (Separates Frontend-Repo)

### .github/workflows/build.yml
```yaml
name: Build & Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'npm'
    
    - run: npm ci
    - run: npm run lint
    - run: npm run test:ci
    - run: npm run build
    
    - uses: actions/upload-artifact@v3
      with:
        name: dist
        path: dist/
```

### .github/workflows/deploy.yml
```yaml
name: Deploy

on:
  push:
    branches: [main]
  
jobs:
  deploy:
    runs-on: ubuntu-latest
    needs: build
    
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '20'
    
    - run: npm ci
    - run: npm run build
    
    # Docker build & push
    - uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: |
          ghcr.io/noschvie/knx-iot-frontend:latest
          ghcr.io/noschvie/knx-iot-frontend:${{ github.sha }}
    
    # Deploy to production (Kubernetes, Docker Swarm, etc.)
    # - run: ./scripts/deploy.sh
```

---

## 📊 Vergleich: Ein Repo vs. Zwei Repos

| Aspect | Ein Repo | Zwei Repos |
|--------|----------|-----------|
| **Komplexität Setup** | Hoch | Niedrig |
| **Build-Zeit** | +100% (beide) | Normal (each) |
| **CI/CD Pipelines** | 1 komplex | 2 einfach |
| **Deployment** | Atomisch | Independent |
| **Team Autonomie** | Gering | Hoch |
| **Code Review** | Gemischt | Klar |
| **Bug Tracking** | 1 Issue DB | 2 separate |
| **Debugging** | Kompliziert | Einfach |
| **Versioning** | Gekoppelt | Independent |
| **Reusable Code** | Einfach | Schwieriger |

**→ Für dieses Projekt: ZWEI REPOS ist besser**

---

## 💡 Best Practice Struktur

```
GitHub Organization: Noschvie

Repo 1: semantic-knx-gateway
├── Backend API (Node.js)
├── KNX Protocol handling
├── Database (TimescaleDB)
├── OpenAPI Spec
├── Shared Docs (in /docs/specifications/)
└── Docker: Backend image

Repo 2: knx-iot-frontend ← NEW
├── Frontend SPA (Angular)
├── UI Components
├── Charts & Visualization
├── Documentation (links to gateway docs)
└── Docker: Frontend image

Repo 3: knx-iot-infra (Optional)
├── docker-compose.yml (both services)
├── Kubernetes manifests
├── Terraform/IaC
└── Deployment automation
```

---

## ✅ Empfohlener Setup-Plan

### Woche 31 (Nächste Woche):
```
Day 1:
  [ ] GitHub: Neues Repo "knx-iot-frontend" erstellen
  [ ] Local: ng new knx-iot-frontend (initialisieren)
  [ ] GitHub: Push initial Angular project
  
Day 2:
  [ ] CI/CD: GitHub Actions Workflows setup
  [ ] Docker: Dockerfile & nginx.conf erstellen
  [ ] Docs: README.md & DEVELOPMENT.md schreiben
  
Day 3-5:
  [ ] Implement core services
  [ ] Test gegen Gateway API
  [ ] Setup complete
```

---

## 🎯 Final Recommendation

### ✅ **NEUES REPOSITORY FÜR FRONTEND**

**Gründe:**
1. **Unterschiedliche Technologien** (Node.js vs. Angular)
2. **Unterschiedliche Teams** (Backend-Devs ≠ Frontend-Devs)
3. **Unterschiedliche Zyklen** (API-changes ≠ UI-changes)
4. **Bessere Skalierung** (2 unabhängige Projekte)
5. **Einfacheres DevOps** (separate CI/CD, separate Docker)
6. **Klare Ownership** (Frontend-Team → Frontend-Repo)

### Repository Links:
- **Gateway:** https://github.com/Noschvie/semantic-knx-gateway
- **Frontend:** https://github.com/Noschvie/knx-iot-frontend ← NEW

### Next Action:
```bash
# 1. Erstelle neues GitHub Repo "knx-iot-frontend"
# 2. Clone lokal
# 3. ng new . --skip-git
# 4. Push initial code
# 5. Setup GitHub Actions
# 6. Done! 🚀
```

---

**Version:** 1.0  
**Decision:** ✅ **SEPARATE REPOSITORY RECOMMENDED**  
**Timeline:** Can be set up in 1 day  
**Impact:** High autonomy, better maintainability

