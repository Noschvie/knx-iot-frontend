# Docker Volume Mounts für Raffstore-Konfiguration

Dieser Ordner enthält optionale Konfigurationsdateien, die in den Docker-Container gemountet werden können, um zur Laufzeit Konfigurationen zu überschreiben.

## Verwendung

### 1. Konfigurationsdatei erstellen

```bash
mkdir -p config
cp src/assets/config/raffstore-config.json config/raffstore-config.json
```

### 2. Bei Bedarf anpassen

Bearbeite `config/raffstore-config.json` nach Bedarf:

```json
{
  "raffstores": [
    {
      "id": "rs-1",
      "name": "Wohnbereich",
      "floor": "EG",
      "orientation": "SUED",
      "gaMove": "2/1/1",
      "gaStep": "2/2/1",
      "gaPositionSet": "2/3/1",
      "gaLamellasSet": "2/4/1",
      "gaStatusPosition": "2/5/1",
      "gaStatusLamellus": "2/6/1",
      "gaLock": "2/7/1",
      "gaEndTop": "2/8/1",
      "gaEndBottom": "2/9/1"
    }
  ]
}
```

### 3. Container starten

Die `docker-compose.yml` ist bereits konfiguriert, um diese Datei zu mounten:

```bash
docker-compose up -d
```

Falls die Datei nicht existiert, wird automatisch die Fallback-Konfiguration aus dem Asset verwendet.

## Hinweise

- Diese Datei wird **nicht** in Git versioniert (siehe `.gitignore`)
- Perfekt für Umgebungen, die unterschiedliche Konfigurationen benötigen
- Der Mount ist **read-only** (`:ro`) im Docker
- Änderungen erfordern einen Container-Restart

## Weitere Informationen

Siehe [RAFFSTORE-CONFIG.md](../docs/RAFFSTORE-CONFIG.md) für vollständige Dokumentation.
