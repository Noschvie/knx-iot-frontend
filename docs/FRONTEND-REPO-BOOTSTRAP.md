# Frontend Repository — Initial Setup Files

> **Purpose:** Template files to quickly bootstrap the new frontend repository  
> **Use:** Copy these files after `ng new knx-iot-frontend`  
> **Date:** 2026-07-31

---

## 📄 File: README.md

```markdown
# KNX IoT Gateway — Angular Frontend

Modern web frontend for monitoring and controlling KNX building automation systems via the semantic-knx-gateway REST API.

## 🎯 Features

- **Real-time Monitoring:** WebSocket-based live datapoint streaming (1000+ points @ 60 FPS)
- **Interactive Charts:** Time-series visualization with ECharts
- **Device Hierarchy:** Browse building structure (Locations → Devices → Datapoints)
- **Semantic Functions:** Vendor-specific feature integration
- **Secure Authentication:** OAuth2 (RFC 6749) login
- **Responsive Design:** Desktop, tablet, and mobile optimized
- **Dark Theme:** Eye-friendly monitoring interface
- **Accessibility:** WCAG 2.1 AA compliant

## 🛠 Tech Stack

- **Angular 20** — Frontend framework
- **TypeScript 5.2** — Type-safe development
- **RxJS** — Reactive data flow
- **Angular Material** — UI component library
- **ECharts** — Data visualization
- **CDK Virtual Scrolling** — High-performance tables

## 🚀 Quick Start

### Requirements
- Node.js 20.x
- npm 10.x

### Setup

```bash
# Clone repository
git clone https://github.com/Noschvie/knx-iot-frontend.git
cd knx-iot-frontend

# Install dependencies
npm install

# Start development server
npm start

# Open browser
# http://localhost:4200
```

### Configuration

Create `.env` file:
```
API_BASE=http://localhost:3000
WS_BASE=ws://localhost:3000
CLIENT_ID=knx-frontend-dev
```

Or use `src/environments/environment.ts`

## 📚 Documentation

- **API Specification:** [GUI-frontend-api.md](./docs/GUI-frontend-api.md)
- **Getting Started:** [ANGULAR-GETTING-STARTED.md](./docs/ANGULAR-GETTING-STARTED.md)
- **Implementation Guide:** [GUI-IMPLEMENTATION-GUIDE.md](./docs/GUI-IMPLEMENTATION-GUIDE.md)
- **Architecture:** [ANGULAR-PROJECT-STRUCTURE.md](./docs/ANGULAR-PROJECT-STRUCTURE.md)
- **Deployment:** [DEPLOYMENT.md](./docs/DEPLOYMENT.md)

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run E2E tests
npm run e2e

# Check code quality
npm run lint

# Format code
npm run format
```

## 🐳 Docker

```bash
# Build image
docker build -f docker/Dockerfile -t knx-iot-frontend .

# Run container
docker run -p 80:80 -e API_BASE=http://gateway:3000 knx-iot-frontend
```

## 📋 Development

### Project Structure
```
src/
├── app/
│   ├── core/              # Services, guards, interceptors
│   ├── shared/            # Reusable components & utilities
│   ├── features/          # Feature modules
│   ├── app-routing.module.ts
│   └── app.module.ts
├── assets/                # Images, icons, translations
├── styles/                # Global SCSS
└── environments/          # Environment configs
```

### Architecture

See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for detailed architecture decisions.

### Code Style

- **Linting:** ESLint + Prettier
- **Language:** TypeScript strict mode
- **Naming:** camelCase (variables), PascalCase (classes)
- **Formatting:** 2 spaces, 100 char line limit

## 🔐 Security

- OAuth2 Bearer Token authentication
- HTTPS/WSS in production
- CORS properly configured
- CSP headers set
- Input sanitization
- XSS protection

## 📈 Performance

- Page load: < 2 seconds
- Time to interactive: < 3 seconds
- Live view (1000 rows): 60 FPS
- Chart render (1000 points): < 1 second
- Bundle size: < 2 MB (production)

## 🤝 Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Create Pull Request

## 📝 License

AGPL-3.0 — See [LICENSE](./LICENSE) file

## 📞 Support

- **Issues:** GitHub Issues
- **Discussions:** GitHub Discussions
- **Documentation:** See [docs/](./docs/) folder
- **Gateway API:** https://github.com/Noschvie/semantic-knx-gateway

## 🎯 Roadmap

- [x] Core services & authentication
- [x] Dashboard component
- [x] Live view with WebSocket
- [ ] Charts & analytics
- [ ] Device browser
- [ ] Settings panel
- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] E2E tests
- [ ] Production deployment

---

**Status:** Early Development  
**Version:** 0.1.0  
**Last Updated:** 2026-07-31
```

---

## 📄 File: .github/workflows/build.yml

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
    
    strategy:
      matrix:
        node-version: [20.x]
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Lint code
      run: npm run lint
    
    - name: Run unit tests
      run: npm run test:ci
    
    - name: Build production
      run: npm run build
    
    - name: Upload build artifacts
      uses: actions/upload-artifact@v3
      with:
        name: dist-${{ matrix.node-version }}
        path: dist/
        retention-days: 1
```

---

## 📄 File: .github/workflows/deploy.yml

```yaml
name: Deploy

on:
  push:
    branches: [main]
    paths:
      - 'src/**'
      - 'docker/**'
      - 'package*.json'
      - '.github/workflows/deploy.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    needs: build  # Requires build job to pass first
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build production
      run: npm run build
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Login to GitHub Container Registry
      uses: docker/login-action@v2
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Build and push Docker image
      uses: docker/build-push-action@v4
      with:
        context: .
        file: ./docker/Dockerfile
        push: true
        tags: |
          ghcr.io/${{ github.repository }}:latest
          ghcr.io/${{ github.repository }}:${{ github.sha }}
        cache-from: type=registry,ref=ghcr.io/${{ github.repository }}:buildcache
        cache-to: type=registry,ref=ghcr.io/${{ github.repository }}:buildcache,mode=max
```

---

## 📄 File: docker/Dockerfile

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /build

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine AS base
RUN apk add --no-cache nginx

WORKDIR /app

# Copy built application
COPY --from=builder /build/dist/knx-iot-frontend /usr/share/nginx/html

# Copy Nginx configuration
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
```

---

## 📄 File: docker/nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    sendfile on;
    keepalive_timeout 65;
    gzip on;
    gzip_types text/plain text/css text/javascript application/json application/javascript;
    gzip_min_length 1024;

    # Logging
    access_log /var/log/nginx/access.log combined;
    error_log /var/log/nginx/error.log warn;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/s;

    upstream gateway {
        server gateway:3000;
    }

    server {
        listen 80 default_server;
        server_name _;

        root /usr/share/nginx/html;
        index index.html;

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
        }

        # Static assets with long cache
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            add_header X-Content-Type-Options "nosniff";
        }

        # API proxy (optional)
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://gateway;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 60s;
            proxy_connect_timeout 60s;
        }

        # WebSocket proxy (optional)
        location /messaging/ws {
            proxy_pass http://gateway;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "Upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 3600s;
            proxy_send_timeout 3600s;
        }

        # OAuth endpoint (optional)
        location /oauth/ {
            proxy_pass http://gateway;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # SPA: Route all non-API requests to index.html
        location / {
            try_files $uri $uri/ /index.html;
            add_header X-Frame-Options "SAMEORIGIN" always;
            add_header X-Content-Type-Options "nosniff" always;
            add_header X-XSS-Protection "1; mode=block" always;
        }

        # Deny access to sensitive files
        location ~ /\. {
            deny all;
            access_log off;
            log_not_found off;
        }

        location ~ ~$ {
            deny all;
            access_log off;
            log_not_found off;
        }
    }
}
```

---

## 📄 File: .env.example

```
# API Configuration
API_BASE=http://localhost:3000
WS_BASE=ws://localhost:3000

# OAuth2
CLIENT_ID=knx-frontend-dev
CLIENT_SECRET=

# Feature Flags
ENABLE_MOCK_DATA=false
ENABLE_DEV_TOOLS=true
ENABLE_PERFORMANCE_MONITORING=false

# Logging
LOG_LEVEL=debug
ENABLE_CONSOLE_LOG=true
ENABLE_STORAGE_LOG=true
```

---

## 📄 File: .eslintrc.json

```json
{
  "root": true,
  "ignorePatterns": ["projects/**/*", "dist/**/*"],
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
        ],
        "@angular-eslint/no-empty-lifecycle-method": "warn",
        "@typescript-eslint/explicit-member-accessibility": "error",
        "@typescript-eslint/member-ordering": "error",
        "@typescript-eslint/no-implicit-any-catch": "error",
        "no-console": ["warn", { "allow": ["warn", "error"] }]
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

## 📄 File: .prettierrc

```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "quoteProps": "as-needed",
  "jsxSingleQuote": false,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

---

## 📄 File: .gitignore

```
# See http://help.github.com/ignore-files/ for more about ignoring files.

# Compiled output
/dist
/tmp
/out-tsc
/bazel-out

# Node
/node_modules
npm-debug.log
package-lock.json
yarn.lock

# IDEs and editors
.idea/
.project
.classpath
.c9/
*.launch
.settings/
*.sublime-workspace

# Visual Studio Code
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json
.history/*

# Miscellaneous
/.angular/cache
.sass-cache/
/connect.lock
/coverage
/libpeerconnection.log
testem.log
/typings

# System files
.DS_Store
Thumbs.db

# Environment
.env
.env.local
.env.*.local

# Testing
/coverage

# IDE
.vscode
.idea

# OSX
.DS_Store
```

---

## 📄 File: package.json (scripts section only)

```json
{
  "name": "knx-iot-frontend",
  "version": "0.1.0",
  "description": "Angular frontend for semantic-knx-gateway",
  "scripts": {
    "ng": "ng",
    "start": "ng serve --host 0.0.0.0 --port 4200",
    "dev": "ng serve --configuration development",
    "build": "ng build --configuration production",
    "build:dev": "ng build --configuration development",
    "build:staging": "ng build --configuration staging",
    "test": "ng test",
    "test:ci": "ng test --watch=false --code-coverage --browsers=ChromeHeadless",
    "e2e": "ng e2e",
    "lint": "ng lint",
    "format": "prettier --write \"src/**/*.{ts,html,scss,json}\"",
    "format:check": "prettier --check \"src/**/*.{ts,html,scss,json}\"",
    "analyze": "npm run build && webpack-bundle-analyzer dist/knx-iot-frontend/stats.json"
  }
}
```

---

## 🚀 Setup Instructions

### 1. Create New Repo on GitHub
```bash
# Web: https://github.com/new
# Name: knx-iot-frontend
# License: AGPL-3.0
# .gitignore: Node
```

### 2. Clone & Initialize
```bash
git clone https://github.com/Noschvie/knx-iot-frontend.git
cd knx-iot-frontend

ng new . --skip-git --routing --style=scss --package-manager=npm

npm install
npm install @angular/cdk echarts ngx-echarts @ngx-translate/core
```

### 3. Add Files
```bash
# Copy all template files above into their respective locations:
# - README.md (root)
# - .env.example (root)
# - .eslintrc.json (root)
# - .prettierrc (root)
# - .github/workflows/*.yml
# - docker/Dockerfile
# - docker/nginx.conf
# - docs/ (copy from semantic-knx-gateway)
```

### 4. Verify
```bash
npm start
# http://localhost:4200 should show Angular default page

npm run lint
# Should pass

npm test
# Tests should pass
```

### 5. Push
```bash
git add .
git commit -m "Initial Angular project setup"
git push origin main
```

---

**Version:** 1.0  
**Date:** 2026-07-31  
**Status:** ✅ Ready to Use

