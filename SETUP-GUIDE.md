# Setup Guide - KNX IoT Frontend

## 🚀 Schnellstart

### 1. Repository klonen
```bash
git clone https://github.com/your-org/knx-iot-frontend.git
cd knx-iot-frontend
```

### 2. NPM Proxy konfigurieren (nur wenn Sie hinter Corporate Proxy sind)

Falls Sie hinter einem Corporate Proxy sind:

```bash
# Kopieren Sie das Konfigurationstemplate
cp .npmrc.example .npmrc

# Überprüfen Sie die Proxy-Adresse in .npmrc
# Falls nötig, passen Sie an:
# proxy=http://proxy.YOUR_COMPANY.com:PORT
```

**Hinweis**: Windows System-Proxy-Einstellungen gelten NICHT für npm!
npm braucht EXPLIZIT `.npmrc` Konfiguration.

### 3. Dependencies installieren
```bash
npm install
```

### 4. Development Server starten
```bash
npm start
```

---

## 🔧 NPM Proxy Konfiguration

### Was Sie brauchen
Nur `.npmrc` - das ist alles!

```bash
# Einmalig nach dem Klonen:
cp .npmrc.example .npmrc

# Optional: Proxy-Adresse anpassen
# Datei öffnen und anpassen:
#   proxy=http://proxy.YOUR_COMPANY.com:8080
#   https-proxy=http://proxy.YOUR_COMPANY.com:8080
```

### Wie funktioniert es?
```
.npmrc Datei
  ↓
npm install → liest .npmrc ✅
npm run build → liest .npmrc ✅
ng build → nutzt npm Proxy ✅
```

### Was ist mit Windows System-Proxy?
```
Windows System-Proxy:
  ✅ Browser nutzt
  ✅ Git nutzt
  ❌ npm nutzt NICHT automatisch
  
Deshalb: .npmrc ist notwendig!
```

---

## 📋 NPM Scripts

| Command | Beschreibung |
|---------|------------|
| `npm start` | Development Server auf Port 4200 |
| `npm run dev` | Development (Alternative) |
| `npm run build` | Production Build |
| `npm run build:staging` | Staging Build |
| `npm test` | Unit Tests ausführen |
| `npm run lint` | Code Linting |
| `npm run format` | Code Formatieren |
| `npm run analyze` | Bundle-Analyse |

---

## 🔐 Konfiguration & Sicherheit

### `.npmrc` Datei

- **`.npmrc.example`**: Template (im Repository)
- **`.npmrc`**: Lokale Konfiguration (in `.gitignore`, nicht im Repository)

Warum so?
1. ✅ Sicherheit: Keine lokalen Konfigurationen im Repo
2. ✅ Flexibilität: Jeder kann lokal anpassen
3. ✅ Dokumentation: `.example` zeigt wie es aussieht

### `.npmrc` erstellen

```bash
# Einmalig nach dem Klonen:
cp .npmrc.example .npmrc

# Optional: Passen Sie die Proxy-Adresse an
# proxy=http://proxy.YOUR_COMPANY.com:PORT
```

---

## ❓ Häufige Probleme

### Problem: `npm install` schlägt fehl
**Lösung**:
1. Überprüfen Sie, ob `.npmrc` existiert
   ```bash
   ls -la .npmrc
   ```

2. Überprüfen Sie die Proxy-Adresse in `.npmrc`
   ```bash
   cat .npmrc | grep proxy
   ```

3. Falls noch Fehler: Versuchen Sie Proxy-Adresse zu überprüfen
   ```bash
   # Test: Kann npm den Proxy erreichen?
   npm config list | grep proxy
   ```

### Problem: `ETIMEDOUT fonts.googleapis.com`
**Lösung**:
1. Überprüfen Sie `.npmrc` Proxy-Einstellung
2. Stellen Sie sicher, dass Proxy korrekt funktioniert
3. Falls immer noch Fehler: Fallback Offline-Build
   ```bash
   node scripts/build-offline.js production
   ```

### Problem: `npm install` vs. IDE
**Hinweis**: 
- `npm install` in Terminal/PowerShell nutzt `.npmrc`
- Falls Sie IntelliJ npm integration nutzen: Settings → Proxy setzen
- Oder: Terminal in IntelliJ benutzen (nutzt .npmrc)

---

## ✅ Checkliste nach dem Setup

- [ ] Repository geklont: `git clone ...`
- [ ] `.npmrc` erstellt: `cp .npmrc.example .npmrc`
- [ ] Proxy-Adresse überprüft (falls nötig)
- [ ] Dependencies installiert: `npm install`
- [ ] Development Server startet: `npm start`
- [ ] Production Build funktioniert: `npm run build`

---

## 📖 Weitere Dokumentation

- `PROXY-SETUP.md` - Proxy-Konfiguration Details
- `docs/BUILD-PROXY-SOLUTION.md` - Ausführliche Build-Dokumentation
- `docs/TOKEN-RENEWAL.md` - Token-Erneuerungs-Dokumentation

---

## 🚀 Viel Erfolg!

Bei Fragen oder Problemen siehe die anderen Dokumentationen oder kontaktieren Sie das Team.
