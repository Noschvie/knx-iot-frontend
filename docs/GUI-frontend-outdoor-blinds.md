# Raffstore Frontend

Frontend zur Steuerung von 17 Raffstores, verteilt auf 2 Stockwerke (EG/OG). Backend ist das [semantic-knx-gateway](https://github.com/Noschvie/semantic-knx-gateway) über die KNX IoT 3rd Party REST API.

Architektur orientiert sich an [knx-iot-frontend](https://github.com/Noschvie/knx-iot-frontend) (Angular + Node.js, Docker, i18next).

> Dieses Dokument hält die UI/UX-Design-Entscheidungen der Planungsphase fest. Implementierungsdetails (Komponentenstruktur, API-Contracts, Datenmodell) folgen in separaten Docs unter `docs/`.

## Ziel

Eine kompakte, Loxone-App-ähnliche Bedienoberfläche, die bei 17 Geräten nicht in Einzelbedienung ausartet — Fokus auf schnelle Übersicht und wenige, klare Bedienstufen statt stufenloser Regelung.

## Design-Entscheidungen

### 1. Zwei-Ebenen-UI: Übersicht + Detailansicht

- **Übersicht**: Grid je Stockwerk (EG/OG), kompakte Kacheln pro Raffstore
- **Detailansicht**: Volle Steuerung für ein einzelnes Gerät, geöffnet per Tap auf eine Kachel

Grund: Bei 17 Geräten muss der Normalzustand (Überblick verschaffen) von der Detailsteuerung getrennt sein.

### 2. Diskrete Positionen statt stufenloser Regelung

| Achse | Stufen |
|---|---|
| Höhe | Auf / 1/3 / 2/3 / Zu (4 Positionen) |
| Lamellenwinkel | Offen / Schräg / Zu (3 Positionen) |

Ursprünglich war ein Slider (0–100 % bzw. 0–90°) vorgesehen, wurde aber zugunsten fester Stufen verworfen — einfachere Bedienung, einfachere Backend-Validierung (nur 4×3 = 12 gültige Kombinationen pro Raffstore).

### 3. Gruppenbefehle pro Stockwerk

„Alle auf" / „Alle zu" je Stockwerk in der Übersicht — vermeidet 9 Einzelaufrufe bei Verlassen des Hauses o.ä.

### 4. Statusindikatoren auf Kachel-Ebene

- Bewegungsrichtung (fährt gerade rauf/runter)
- Automatik-Badge (Sonnen-/Windautomatik aktiv vs. manuell übersteuert) — wichtig, um bei vielen Geräten nicht den Überblick zu verlieren, welche automatisch laufen

### 5. Favoritenpositionen je Stockwerk

Vordefinierte Kombinationen aus Höhe + Winkel (z. B. „Sonnenschutz", „Ganz zu", „Ganz auf") werden **je Stockwerk/Ebene** definiert, nicht pro Einzelgerät — ein Favorit gilt für alle Raffstores einer Ebene.

## Geklärte Rahmenentscheidungen

- **Lizenz**: AGPL-3.0, konsistent mit knx-iot-frontend
- **i18n**: i18next, keine hartkodierten UI-Strings (Konvention aus knx-iot-frontend übernommen)
- **Positions-Mapping**: semantic-knx-gateway liefert stufenlose DPT-Werte (KNX-Spec-konform); das Mapping auf die 4 Höhen- und 3 Winkelstufen erfolgt in diesem Frontend-Projekt (Node.js-BFF), nicht im Gateway
- **Gruppierung**: Gruppenbefehle nach Stockwerk **und** Himmelsrichtung
- **Orientierungsdaten**: Himmelsrichtung wird für den Start pragmatisch nur in diesem Frontend-Projekt gepflegt (eigene Config/Mapping-Tabelle Raffstore-ID → Stockwerk + Himmelsrichtung); spätere Migration ins semantic-knx-gateway (Location-/Function-Attribut) möglich
- **Speicherort Gruppenzuordnung**: JSON-Config-Datei im Repo (statische Gebäude-Topologie, änderungsarm, über Git versionierbar)
- **Speicherort Favoritenpositionen**: SQLite-Datenbank (falls Favoriten später über die UI editierbar sein sollen, sind transaktionssichere Laufzeit-Schreibzugriffe nötig; JSON zur Laufzeit zu beschreiben ist dafür fehleranfälliger)
- **Endpoint-Design Gruppenbefehle**: `POST /api/v1/raffstore-groups/command` mit Filter-Objekt (`floor`/`orientation`, beide optional, mind. eines Pflicht — kein impliziter globaler Befehl an alle 17 Geräte), synchron ausgeführt (keine Job-Queue nötig bei max. 9 Geräten pro Stockwerk), Ergebnis pro Gerät statt Alles-oder-nichts (einzelne KNX-Geräte können offline sein); ergänzend `GET /api/v1/raffstore-groups` zum Vorab-Zählen der betroffenen Geräte fürs UI
- **SQLite-Schema Favoriten**: Tabelle `favorites` (`id`, `floor` CHECK EG/OG, `label`, `height_step` 0–3, `angle_step` 0–2, `sort_order`, `created_at`, `updated_at`); Zugriff über `better-sqlite3`

```sql
CREATE TABLE favorites (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  floor       TEXT    NOT NULL CHECK (floor IN ('EG', 'OG')),
  label       TEXT    NOT NULL,
  height_step INTEGER NOT NULL CHECK (height_step BETWEEN 0 AND 3),
  angle_step  INTEGER NOT NULL CHECK (angle_step BETWEEN 0 AND 2),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_favorites_floor ON favorites(floor, sort_order);
```

## Status

Alle in der Planungsphase identifizierten offenen Punkte sind geklärt. Nächster Schritt: Projekt-Setup (Repo, Angular/Node.js-Grundgerüst analog zu knx-iot-frontend) und Umsetzung der hier dokumentierten Entscheidungen.

## Tech-Stack

- **Frontend**: Angular
- **Backend/BFF**: Node.js (Übersetzung/Aggregation der Aufrufe Richtung semantic-knx-gateway)
- **Deployment**: Docker, analog zu knx-iot-frontend
- **Lizenz**: AGPL-3.0
- **i18n**: i18next
