Ich schaue mir die Frontend-Anwendung an und identifiziere die REST API Endpoints zum Backend. Lass mich die Verzeichnisstruktur erkunden: Jetzt schaue ich mir die src-Verzeichnis genauer an:Jetzt schaue ich nach weiteren Dateien, die API-Aufrufe enthalten könnten:Jetzt durchsuche ich systematisch alle Komponenten, um alle REST API Endpoints zu finden: Basierend auf meiner Analyse der Frontend-Anwendung habe ich folgende **REST API Endpunkte** identifiziert, die vom Backend verwendet werden:

## SpectrumKNX Frontend - REST API Endpoints

### **Konfiguration & System**
- `GET /api/version` - Backend-Version abrufen
- `GET /api/server/config` - Server-Konfiguration (Status, Verbindung, Dateien)
- `GET /api/update` - Update-Informationen prüfen
- `GET /api/filter-options` - Filter-Optionen (Sources, Targets, Types, DPTs, Namen)

### **Projekt & Sicherheit**
- `GET /api/project/status` - Projekt-Upload-Status
- `POST /api/project/upload` - ETS-Projektdatei hochladen
- `GET /api/knxkeys/status` - KNX-Keys-Datei-Status
- `POST /api/knxkeys/upload` - KNX-Keys-Datei hochladen

### **KNX Telegrams & Daten**
- `GET /api/telegrams` - Telegram-Historie abrufen (mit Filterung)
    - Query-Parameter: `limit`, `start_time`, `end_time`, `source_address`, `target_address`, `telegram_type`, `dpt_main`, `delta_before_ms`, `delta_after_ms`
- `WebSocket /ws/telegrams` - Live-Telegram-Stream

### **KNX Schreiben/Lesen**
- `POST /api/knx/send` - Telegram senden (address, payload, dpt, response)
- `POST /api/knx/read` - Leseanfrage senden (address)
- `POST /api/knx/send/scheduled` - Geplantes Senden mit Verzögerung/Wiederholung
- `GET /api/knx/send/scheduled/status` - Status des aktuellen Sendejobs
- `POST /api/knx/send/scheduled/cancel` - Geplanten Sendjob abbrechen

### **Gebäude & Struktur**
- `GET /api/building` - Gebäudestruktur (Devices, Channels, KOs, Group Addresses)

### **Datenbank**
- `GET /api/database/info` - Datenbank-Informationen
- `POST /api/database/purge` - Telegrams löschen (mit dry-run Option)
- `POST /api/database/optimize` - Datenbank komprimieren

### **Statistiken**
- `GET /api/statistics` - Traffic-Statistiken (by_ga, by_pa)

### **Import/Export**
- `POST /api/import` - Telegram-Datei importieren (XML/ZIP)
- `GET /api/import/status` - Import-Job-Status
- `POST /api/import/cancel` - Import abbrechen
- `GET /api/export` - Telegrams exportieren (mit Filterung: start_time, end_time, source_address, target_address, telegram_type)

---

**Hinweis:** Die Suche hat möglicherweise nicht alle Endpoints erfasst. Es empfiehlt sich, die [Backend-Dokumentation](https://github.com/martinhoefling/SpectrumKNX) oder den API-Code zu überprüfen, um eine vollständige Liste zu erhalten.
