# Design: Status-Rückmeldung für Raffstores im BFF

**Status:** Entwurf (noch nicht implementiert)
**Betroffene Komponente:** BFF (`bff/src`)
**Ziel:** Rückmelde-Status für **Position** (`gaStatusPosition`) und **Lamelle** (`gaStatusLamellas`)
pro Raffstore aus dem KNX-Backend empfangen und im Frontend visualisieren.

---

## 1. Ausgangslage

- Kommandos gehen bereits über `RaffstoreService` → `GatewayService.sendCommand`
  (PUT `/api/v2/datapoints/values`).
- Der lokale Zustand (`heightStep`, `angleStep`) wird heute nur **optimistisch** gesetzt —
  es gibt keine echte KNX-Rückmeldung.
- Pro Raffstore existieren bereits Status-GAs in `RaffstoreDatapoints`:
  - `gaStatusPosition` — DPT 5.001 (Status Position %)
  - `gaStatusLamellas` — DPT 5.001 (Status Lamellen %)
  - `gaEndTop` / `gaEndBottom` — DPT 1.001 (Endlagen)
- Gateway-Protokoll — **verifiziert** anhand einer produktiven Referenz-Implementierung
  gegen dasselbe `semantic-knx-gateway`
  ([knx-garage-wled](https://github.com/Noschvie/knx-garage-wled)), siehe §8:
  - **Eine** WebSocket-Verbindung `/messaging/ws`, Subprotokoll `gw.knx.org`,
    `Authorization: Bearer <token>`-Header (Scope `manage`).
  - **Subscribe per WS-Nachricht** (nicht per REST) über die `datapointId`:
    `{ "action": "subscribe", "items": [ { "type": "datapoint", "id": "<datapointId>" } ] }`.
  - Server-Nachrichtentypen: `welcome`, `subscribed`, `update`, `error`, `ping`,
    `pong`, `heartbeat`.
  - Hinweis: Die frühere Annahme aus `docs/GUI-frontend-api.md` §4 (REST
    `POST /api/v2/subscriptions` + `datapoint_updated`/`batch`) trifft **nicht** auf das
    reale Gateway zu und wird durch die verifizierten Fakten oben ersetzt.

---

## 2. Neue Komponente: `StatusReceiverService` (BFF)

Ein **serverseitiger WebSocket-Client**, der eine Verbindung zum Gateway hält und pro
Raffstore die Status-GAs abonniert.

```
┌────────────┐  POST /subscriptions (pro Status-GA)   ┌──────────────┐
│ StatusRecv │ ─────────────────────────────────────► │ KNX Gateway  │
│  (BFF)     │  WS /messaging/ws (gw.knx.org, token)   │  /api/v2     │
│            │ ◄───── datapoint_updated / batch ────── │              │
└─────┬──────┘                                         └──────────────┘
      │ applyStatusUpdate(ga, value)
      ▼
┌──────────────────┐  emitEvent(status_changed)   ┌──────────┐   SSE   ┌──────────┐
│ RaffstoreService │ ───────────────────────────► │  /events │ ──────► │ Frontend │
│  (State-Map)     │                              └──────────┘         └──────────┘
└──────────────────┘
```

---

## 3. Ablauf

1. **Datapoint-IDs auflösen:** pro Status-GA `GET /api/v2/datapoints?filter[ga]=<GA>` →
   `data[0].meta.datapointId` (⚠️ ID liegt in `meta.datapointId`, nicht top-level `id`).
2. **Reverse-Index aufbauen:** `Map<datapointId, { raffstoreId, kind, ga }>` mit
   `kind ∈ {position, lamella, endTop, endBottom}`. Zusätzlich `ga` als Fallback-Key, da
   `update`-Nachrichten sowohl `meta.datapointId` als auch `meta.ga` tragen.
3. **Initial-Werte per REST vorladen (optional, empfohlen):**
   `GET /api/v2/datapoints/<datapointId>` → `data.attributes.value`, damit sofort ein
   Ist-Zustand vorliegt und das erste WS-Telegramm als echtes Event behandelt wird.
4. **WS-Verbindung** öffnen (`gw.knx.org` + `Authorization: Bearer`, Scope `manage`), mit
   **Reconnect/Backoff**, **Inaktivitäts-Timeout** und **Re-Subscribe** nach Disconnect.
5. **Subscribe je Raffstore** (nicht alle in einer Nachricht): pro Raffstore eine eigene
   Subscribe-Nachricht mit dessen **4 Status-Datapoints** (Position, Lamelle, Endlage oben,
   Endlage unten), sequenziell/leicht gedrosselt gesendet. Kürzere Requests, robuster und
   einfacher zu debuggen (Fehler/`subscribed`-Antwort eindeutig einem Raffstore zuordenbar):
   `{ "action": "subscribe", "items": [ { "type": "datapoint", "id": "<posId>" }, { "type": "datapoint", "id": "<lamId>" }, { "type": "datapoint", "id": "<endTopId>" }, { "type": "datapoint", "id": "<endBottomId>" } ] }`.
6. **Receiver:** eingehende `update`-Nachrichten (`data` = Array oder Einzelobjekt) →
   je Eintrag `datapointId = entry.meta.datapointId ?? entry.id` (Fallback `entry.meta.ga`)
   nachschlagen → `raffstoreService.applyStatusUpdate(raffstoreId, kind, value)`.
7. **Mapping % → Step** (Umkehr der bestehenden `STEP_TO_KNX`-Tabelle, mit Toleranz /
   Nearest-Match), Zustand aktualisieren, `isMoving` bei Endlagen zurücksetzen.
8. **Emit `status_changed`** → fließt über die vorhandene SSE-Route
   `/api/raffstores/events` zum Frontend.

---

## 4. Änderungen im Bestand

- **`bff/src/models.ts`** — `Raffstore` um Ist-Werte erweitern, damit Soll und Ist getrennt
  visualisierbar sind:
  - `statusPositionPercent?: number`  — Rückmeldung Position (roh `0..100`, `100 % = unten/geschlossen`)
  - `statusLamellaPercent?: number`   — Rückmeldung Lamelle (roh `0..100`)
  - `isEndTop?: boolean`              — Endlage oben erreicht
  - `isEndBottom?: boolean`           — Endlage unten erreicht
  - optional abgeleitet für die UI: `statusHeightStep?` / `statusAngleStep?`
    (Nearest-Match aus dem Prozentwert), nur falls eine Stufen-Anzeige gebraucht wird.
- **`bff/src/services/raffstore.service.ts`** — neue Methode
  `applyStatusUpdate(datapointIdOrGa, kind, value)` + Hilfsfunktion `percentToStep()`.
  Das `status_changed`-Event ist im `Event`-Typ bereits vorgesehen.
- **`bff/src/services/status-receiver.service.ts`** (neu) — WS-Client (`ws`-Paket, wie im
  Referenzbeispiel), Datapoint-Lookup, WS-Subscribe, Receiver-Loop, Reconnect/Backoff,
  Inaktivitäts-Timeout. Baut den Reverse-Index `datapointId/ga → {raffstoreId, kind}`.
- **`bff/src/services/token.service.ts`** — ✅ muss um einen **`manage`-Scope** erweitert
  werden (zusätzlich zu `read`+`write`). Der `StatusReceiverService` verbindet die WS mit
  dem `manage`-Token; Refresh analog zu den bestehenden Tokens.
- **`bff/src/services/gateway.service.ts`** — Datapoint-ID-Quelle prüfen/angleichen: der
  Lookup liefert die ID in `meta.datapointId`; der bestehende Code speichert `dp.id`. Für
  den Receiver muss der Reverse-Index dieselbe ID verwenden, die `update`-Nachrichten in
  `meta.datapointId` tragen.
- **`bff/src/index.ts`** — `StatusReceiverService` erzeugen und nach `initializeDatapoints`
  starten; sauberes Herunterfahren bei `SIGTERM`/`SIGINT`.
- **Kein neuer Frontend-Endpoint nötig** — die SSE-Route liefert die neuen Events automatisch mit.

---

## 5. Robustheit

- Reconnect mit exponentiellem Backoff + Re-Subscribe nach Verbindungsabbruch.
- Idempotente Subscriptions (bestehende beim Start aufräumen/wiederverwenden).
- Optionaler initialer **REST-Poll** (`GatewayService.getDatapointValues`) beim Start, um
  sofort einen Ist-Zustand zu haben, bevor das erste Telegramm eintrifft.

---

## 6. Verifiziertes Protokoll & Entscheidungen

Das Zustell- und Subscribe-Modell ist durch die Referenz-Implementierung (§8) geklärt:

- **Zustellmodell:** Variante A — *eine* `/messaging/ws`-Verbindung, Subscribe per
  WS-Nachricht `{ action: 'subscribe', items: [{ type: 'datapoint', id }] }`.
- **Message-`id`:** `update`-Einträge tragen `meta.datapointId` **und** `meta.ga`; wir mappen
  primär über `datapointId`, mit `ga` als Fallback.
- **Value-Parsing:** WS liefert native JS-Typen, REST liefert Strings.

Geklärte Entscheidungen (Anlagen-spezifisch bestätigt):

1. **Token-Scope für Subscribe:** ✅ **`manage`-Token erforderlich.** `TokenService` muss um
   einen `manage`-Scope erweitert werden; der `StatusReceiverService` verbindet die WS mit
   diesem Token.
2. **Value-Format der Status-GAs (DPT 5.001):** ✅ **`0..100` als Prozentwert.**
   **`100 % = Raffstore unten/geschlossen`**, `0 % = oben/offen`. Konsistent mit der
   bestehenden `STEP_TO_KNX`-Tabelle (`height {0:0,1:33,2:66,3:100}`,
   `angle {0:0,1:50,2:100}`) → `percentToStep()` = Nearest-Match auf diese Stützpunkte.
3. **Endlagen-GAs (DPT 1.001):** ✅ Raffstore **komplett unten/geschlossen** ⇒
   `isEndBottom = true`, `isEndTop = false` (und umgekehrt für ganz oben/offen). Keine
   Invertierung nötig — GA-Wert wird direkt als Boolean übernommen.

---

## 7. Nächste Schritte

- [ ] `TokenService` um `manage`-Scope erweitern (inkl. Cache + Refresh).
- [ ] `Raffstore`-Modell um Ist-Werte erweitern (`statusPositionPercent`,
      `statusLamellaPercent`, `isEndTop`, `isEndBottom`).
- [ ] `StatusReceiverService` implementieren (Lookup + WS-Subscribe + Receiver + Reconnect),
      Muster aus §8 übernehmen; WS mit `manage`-Token verbinden.
- [ ] `applyStatusUpdate` in `RaffstoreService` ergänzen (Position/Lamelle als `0..100 %`
      übernehmen; optional `percentToStep` für UI-Stufen).
- [ ] Endlagen (`gaEndTop`/`gaEndBottom`) auf `isEndTop`/`isEndBottom` abbilden (ohne Invertierung).
- [ ] Datapoint-ID-Quelle in `GatewayService` angleichen (`meta.datapointId`).
- [ ] Verdrahtung in `index.ts` inkl. sauberem Shutdown.
- [ ] Frontend-Visualisierung der Ist-Werte (Soll vs. Ist).

---

## 8. Referenz-Implementierung (bestätigtes Protokoll)

Basis: `knx-garage-wled` (produktiver Node-Client gegen dasselbe `semantic-knx-gateway`).
Übernehmbare, verifizierte Muster:

**WS-URL & Verbindung**
```
ws://<host>/messaging/ws   (bzw. wss://)
Subprotokoll: gw.knx.org
Header: Authorization: ****** <manage-token>
```

**Datapoint-Lookup (REST)**
```
GET /api/v2/datapoints?filter[ga]=<GA>
→ data[0].meta.datapointId, data[0].meta.ga, data[0].meta.dpt, data[0].attributes.title
```

**Initial-Wert (REST-Preload)**
```
GET /api/v2/datapoints/<datapointId>
→ data.attributes.value
```

**Subscribe (WS-Nachricht, je Raffstore eine Nachricht)**

Pro Raffstore eine eigene Subscribe-Nachricht mit dessen **4 Status-Datapoints** (Position,
Lamelle, Endlage oben, Endlage unten), sequenziell/leicht gedrosselt senden — kürzere
Requests, robuster, einfacher zu debuggen:
```json
{ "action": "subscribe", "items": [ { "type": "datapoint", "id": "<posId>" }, { "type": "datapoint", "id": "<lamId>" }, { "type": "datapoint", "id": "<endTopId>" }, { "type": "datapoint", "id": "<endBottomId>" } ] }
```

**Server-Nachrichtentypen**
| Typ          | Inhalt / Verwendung |
|--------------|---------------------|
| `welcome`    | `data.clientId`, `data.scope` |
| `subscribed` | `data` = bestätigte Items (leer ⇒ kein Match) |
| `update`     | `data` = Array oder Einzelobjekt; je Eintrag `meta.datapointId`, `meta.ga`, `attributes.value`, `attributes.timestamp` |
| `error`      | `errors` / `error` |
| `ping`       | `data.serverTime` |
| `pong` / `heartbeat` | Keep-alive (ignorierbar) |

**Robustheit (aus dem Beispiel)**
- Reconnect: exponentieller Backoff `1s → 60s`, max. 10 Versuche.
- Inaktivitäts-Timeout: nach 60s ohne Nachricht Verbindung schließen → Reconnect.
- Token-Refresh proaktiv (Margin ~60s); bei Refresh WS neu verbinden.
- `401` → Token-Force-Refresh vor dem nächsten Reconnect.
- Value-Parsing robust: WS = native Typen, REST = Strings.
