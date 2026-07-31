# Frontend Repository — Complete Setup Checklist

> **Purpose:** Step-by-step checklist for setting up a new knx-iot-frontend repository  
> **Time:** ~2-hour total setup time  
> **Date:** 2026-07-31

---

## ✅ Phase 1: GitHub Setup (10 minutes)

### Step 1.1: Create GitHub Repository

```bash
# Via GitHub Web UI:
# 1. Go to https://github.com/new
# 2. Repository name: knx-iot-frontend
# 3. Description: Angular Frontend for KNX IoT Gateway
# 4. Visibility: Public
# 5. License: AGPL-3.0
# 6. .gitignore: Node
# 7. Click "Create repository"

# Result: https://github.com/Noschvie/knx-iot-frontend (empty repo)
```

### Step 1.2: Clone Locally

```bash
cd ~/projects  # or wherever you keep repos

git clone https://github.com/Noschvie/knx-iot-frontend.git
cd knx-iot-frontend

# Verify you're in empty repo
ls -la
# Should show only: .git, LICENSE, README.md, .gitignore
```

---

## ✅ Phase 2: Angular Project Setup (20 minutes)

### Step 2.1: Initialize Angular 20

```bash
# Generate new Angular project (in-place, skip git)
ng new . \
  --skip-git \
  --package-manager=npm \
  --routing \
  --style=scss \
  --strict

# Confirm all prompts (yes for routing, scss)
```

### Step 2.2: Verify Installation

```bash
# Check versions
ng version
# Should show:
# Angular: 20.x.x
# Node: 20.x.x
# npm: 10.x.x

# Check build works
npm run build
# Should complete without errors
# Output in: dist/knx-iot-frontend/
```

---

## ✅ Phase 3: Install Dependencies (10 minutes)

### Step 3.1: Core Dependencies

```bash
# Material Design
ng add @angular/material

# When prompted:
# ? Set up HammerJS? → Yes
# ? Select theme → Indigo/Pink (or custom)
# ? Set up typography? → Yes
# ? Include animations? → Yes
```

### Step 3.2: Additional Libraries

```bash
# Virtual Scrolling
npm install @angular/cdk

# Charts
npm install echarts ngx-echarts

# Internationalization
npm install @ngx-translate/core @ngx-translate/http-loader

# Development tools
npm install --save-dev @angular-eslint/eslint-plugin prettier
npm install --save-dev webpack-bundle-analyzer
```

### Step 3.3: Verify

```bash
npm start
# Should show:
# ✔ Compiled successfully
# ⠋ Building...
# Application bundle generation complete. [X seconds]

# Open: http://localhost:4200
# Should see: Angular logo & default page
```

---

## ✅ Phase 4: Project Structure (15 minutes)

### Step 4.1: Create Folders

```bash
# Core services
mkdir -p src/app/core/{auth,http,api,websocket,config,logger}

# Shared components
mkdir -p src/app/shared/{components/{toolbar,sidebar,loading},pipes,directives,tables}

# Features
mkdir -p src/app/features/{dashboard,monitor,datapoints,devices,locations,functions,charts,history,settings,logs,auth,layout}

# Assets & styles
mkdir -p src/assets/{images,icons,i18n}
mkdir -p src/styles

# Docker
mkdir -p docker

# Documentation
mkdir -p docs

# E2E Tests
mkdir -p e2e/src
```

### Step 4.2: Copy Documentation

```bash
# Get docs from semantic-knx-gateway (already created)
# Copy these files to docs/ folder:

# From: ../semantic-knx-gateway/docs/specifications/
# To: ./docs/

# Files to copy:
# - GUI-frontend-api.md
# - GUI-IMPLEMENTATION-GUIDE.md
# - ANGULAR-PROJECT-STRUCTURE.md
# - ANGULAR-GETTING-STARTED.md
# - TEAM-ONBOARDING.md
# - VALIDATION-CHECKLIST.md
# - GUI-API-ADAPTATION-SUMMARY.md

# Quick copy command:
cp ../semantic-knx-gateway/docs/specifications/GUI*.md ./docs/
cp ../semantic-knx-gateway/docs/specifications/*ANGULAR*.md ./docs/
```

---

## ✅ Phase 5: Configuration Files (20 minutes)

### Step 5.1: Add Configuration Files

Use files from **FRONTEND-REPO-BOOTSTRAP.md**:

```bash
# Root files
touch .env.example .prettierrc .eslintrc.json

# GitHub Actions
mkdir -p .github/workflows
touch .github/workflows/build.yml
touch .github/workflows/deploy.yml

# Docker
mkdir -p docker
touch docker/Dockerfile
touch docker/nginx.conf

# Documentation
touch docs/README.md
touch docs/DEVELOPMENT.md
touch docs/DEPLOYMENT.md
touch docs/ARCHITECTURE.md
```

**Copy content from FRONTEND-REPO-BOOTSTRAP.md into each file**

### Step 5.2: Create Environment Files

```bash
# Development environment
cp src/environments/environment.ts src/environments/environment.dev.ts

# Staging environment (copy from environment.ts)
cp src/environments/environment.ts src/environments/environment.staging.ts

# Production environment (copy from environment.ts)
cp src/environments/environment.ts src/environments/environment.prod.ts
```

### Step 5.3: Verify Configuration

```bash
npm run lint
# Should show: ✔ All files pass linting

npm run format:check
# Should show: No formatting issues

npm run build:dev
# Should complete successfully
```

---

## ✅ Phase 6: Initial Commit (10 minutes)

### Step 6.1: Git Setup

```bash
# Verify git is clean (no untracked files)
git status

# Add all files
git add .

# Show what will be committed
git status
# Should show all new files ready to commit
```

### Step 6.2: First Commit

```bash
git commit -m "Initial Angular 20 project setup

- Create Angular 20 application
- Add Material Design
- Add virtual scrolling (CDK)
- Add charts (ECharts)
- Add internationalization
- Setup folder structure
- Add configuration files
- Add GitHub Actions CI/CD
- Add Docker configuration
- Add documentation structure"

# Verify
git log
# Should show 1 commit (after initial GitHub repo)
```

### Step 6.3: Push to GitHub

```bash
git push origin main

# Verify on GitHub
# https://github.com/Noschvie/knx-iot-frontend
# Should show all files
```

---

## ✅ Phase 7: Verify Everything Works (10 minutes)

### Step 7.1: Development Build

```bash
npm start

# In browser: http://localhost:4200
# Should see: Angular default page (white background, Angular logo)

# Terminal should show:
# ✔ Compiled successfully
# ⠋ Building...
```

### Step 7.2: Production Build

```bash
npm run build

# Should complete without errors
# Check dist/ folder:
ls -la dist/knx-iot-frontend/

# Should show: index.html, main.js, styles.css, etc.
```

### Step 7.3: Docker Build

```bash
docker build -f docker/Dockerfile -t knx-iot-frontend:test .

# Should complete successfully
# Verify image:
docker images | grep knx-iot-frontend

# Test running container:
docker run -p 8080:80 knx-iot-frontend:test

# In browser: http://localhost:8080
# Should show: Angular app
```

### Step 7.4: Code Quality

```bash
npm run lint
# Should pass all checks

npm run format:check
# Should pass all formatting

npm test -- --watch=false
# Should run tests (may fail, that's OK for now)
```

---

## 📋 Complete Checklist

### Pre-Setup
- [ ] Node.js 20.x installed
- [ ] npm 10.x installed
- [ ] GitHub account access
- [ ] Git configured locally
- [ ] Docker installed (optional, for testing)

### Phase 1: GitHub
- [ ] Created new repository "knx-iot-frontend"
- [ ] Cloned repository locally
- [ ] Verified empty repo in directory

### Phase 2: Angular
- [ ] Ran `ng new . --skip-git`
- [ ] Material Design installed
- [ ] Initial build verified

### Phase 3: Dependencies
- [ ] All libraries installed
- [ ] npm start works
- [ ] localhost:4200 loads

### Phase 4: Project Structure
- [ ] All folders created
- [ ] Documentation copied
- [ ] Project organized

### Phase 5: Configuration
- [ ] All config files in place
- [ ] Environment files created
- [ ] GitHub Actions configured
- [ ] Docker files added
- [ ] ESLint & Prettier configured

### Phase 6: Git
- [ ] All files added to git
- [ ] First commit created
- [ ] Pushed to GitHub
- [ ] Repository on GitHub has all files

### Phase 7: Verification
- [ ] npm start works
- [ ] npm run build succeeds
- [ ] npm run lint passes
- [ ] npm run format:check passes
- [ ] Docker build succeeds
- [ ] Docker container runs

### Final Checks
- [ ] GitHub repo has all files
- [ ] GitHub Actions ready (will run on next push)
- [ ] Documentation in place
- [ ] Team can clone & run `npm start`

---

## 🚀 After Setup: Next Steps

### Immediate (Same Day)
```
1. Commit & push initial code ✓
2. Team clones repository
3. Team runs npm start
4. Verify everyone can run locally
```

### Day 2-3: Core Services
```
1. Read: ANGULAR-GETTING-STARTED.md
2. Implement: OAuthService
3. Implement: HttpInterceptor (JSON:API)
4. Implement: WebSocketService
5. Test with actual Gateway API
```

### Week 1: First Component
```
1. Implement: LoginComponent
2. Implement: CoreModule
3. Route to /login on startup
4. Test full OAuth2 flow
```

### Week 2+: Features
```
1. Follow: GUI-IMPLEMENTATION-GUIDE.md
2. Implement 9 feature modules
3. Follow: VALIDATION-CHECKLIST.md
4. Pass all test criteria
```

---

## 🆘 Troubleshooting

### Issue: "ng: command not found"
```bash
# Solution: Install Angular CLI globally
npm install -g @angular/cli@20

# Verify
ng version
```

### Issue: "Module not found" errors
```bash
# Solution: Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Build fails with TypeScript errors
```bash
# Solution: Check tsconfig.json strict mode
# Should be: "strict": true

npm run build -- --configuration development  # More lenient
```

### Issue: Docker build fails
```bash
# Solution: Ensure Docker has enough space
docker system prune  # Clean up

# Rebuild with full output
docker build -f docker/Dockerfile -t knx-iot-frontend:test . --no-cache
```

### Issue: Port 4200 already in use
```bash
# Solution: Use different port
npm start -- --port 4201

# Or kill process on port 4200
lsof -ti:4200 | xargs kill -9  # Mac/Linux
netstat -ano | findstr :4200   # Windows
```

---

## 📊 Final State

After completing all phases:

```
knx-iot-frontend/
├── .git/                     # Git repository
├── .github/
│   └── workflows/           # CI/CD pipelines
├── node_modules/            # Dependencies
├── dist/                    # Build output (after npm run build)
├── src/
│   └── app/                 # Angular application
├── docs/                    # Documentation
├── docker/                  # Docker config
│   ├── Dockerfile
│   └── nginx.conf
├── .env.example             # Environment template
├── .eslintrc.json           # Linting config
├── .prettierrc              # Formatting config
├── angular.json             # Angular config
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── README.md                # Project README
├── LICENSE                  # AGPL-3.0
└── .gitignore              # Git ignore rules
```

✅ **Ready for team development!**

---

## ⏱️ Time Estimate

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 1: GitHub | 10 min | ⏱️ |
| Phase 2: Angular | 20 min | ⏱️ |
| Phase 3: Dependencies | 10 min | ⏱️ |
| Phase 4: Structure | 15 min | ⏱️ |
| Phase 5: Configuration | 20 min | ⏱️ |
| Phase 6: Git | 10 min | ⏱️ |
| Phase 7: Verification | 10 min | ⏱️ |
| **TOTAL** | **~95 min** | **~1.5 hours** |

---

**Version:** 1.0  
**Date:** 2026-07-31  
**Status:** ✅ Ready to Use  
**Next:** Start Phase 1!

