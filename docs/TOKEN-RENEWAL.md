# Token-Erneuerungsmechanismus (Token Renewal)

## Übersicht

Das KNX IoT Frontend hat einen robusten automatischen Token-Erneuerungsmechanismus für die beiden OAuth2-Tokens (Read und Write), die für die Kommunikation mit dem KNX Backend erforderlich sind.

## Wie funktioniert es?

### 1. **Automatische Erneuerung beim Login**
Wenn sich der Benutzer anmeldet, werden beide Tokens (Read und Write) vom Backend angefordert. Nach erfolgreichem Erhalt werden die Tokens in `localStorage` gespeichert, zusammen mit ihrem Ablaufzeitpunkt.

```typescript
// Tokens werden gespeichert mit:
localStorage.setItem('access_token_read', readToken.access_token);
localStorage.setItem('access_token_write', writeToken.access_token);
localStorage.setItem('token_expires_at_read', String(Date.now() + readToken.expires_in * 1000));
localStorage.setItem('token_expires_at_write', String(Date.now() + writeToken.expires_in * 1000));
```

Die nächste Erneuerung wird automatisch geplant: `REFRESH_SKEW_SECONDS` (60 Sekunden) **vor** dem eigentlichen Ablauf der Tokens.

### 2. **Erneuerung nach App-Refresh**
**Dies war das Hauptproblem!** Wenn der Benutzer die App aktualisiert (F5, Browser-Refresh), werden die Tokens aus `localStorage` wiederhergestellt, **und** die automatische Erneuerung wird neu geplant.

```typescript
// In loadTokens():
const readRemainingSeconds = Math.max(0, Math.floor((readExpiresAt - Date.now()) / 1000));
const writeRemainingSeconds = Math.max(0, Math.floor((writeExpiresAt - Date.now()) / 1000));
const minRemainingSeconds = Math.min(readRemainingSeconds, writeRemainingSeconds);

if (minRemainingSeconds > 0) {
    this.scheduleRefresh(minRemainingSeconds);
}
```

### 3. **Proaktive Token-Erneuerung**
Wenn `getReadToken()` oder `getWriteToken()` aufgerufen wird und die Tokens kurz vor dem Ablauf stehen, wird sofort eine Erneuerung ausgelöst:

```typescript
// If token is about to expire (within skew window), trigger immediate refresh
if (expiresAt > 0 && Date.now() + this.REFRESH_SKEW_SECONDS * 1000 > expiresAt) {
    console.log(`[AUTH] Read token about to expire, triggering immediate refresh`);
    this.triggerImmediateRefresh();
}
```

Dies verhindert, dass API-Anfragen mit abgelaufenen Tokens fehlschlagen.

### 4. **Fehlertoleranz**
Wenn die Erneuerung fehlschlägt, wird die nächste Erneuerung nach `REFRESH_SKEW_SECONDS` (60 Sekunden) automatisch versucht. Dies ermöglicht die Selbstheilung bei temporären Backend-Ausfällen.

## Zeitablauf-Beispiel

Angenommen, die Tokens haben eine Gültigkeitsdauer von 3600 Sekunden (1 Stunde):

```
Zeit          | Ereignis
0s            | Login -> beide Tokens erhalten (gültig bis 3600s)
0s            | Erneuerung geplant für: 3600 - 60 = 3540s
3540s         | ✓ Erneuerung erfolgreich (neue Tokens bis 7140s)
3540s         | Neue Erneuerung geplant für: 7140 - 60 = 7080s
...
```

### Mit App-Refresh (z.B. nach 2000s):

```
Zeit          | Ereignis
0s            | Login -> beide Tokens erhalten (gültig bis 3600s)
0s            | Erneuerung geplant für: 3600 - 60 = 3540s
2000s         | 🔄 App-Refresh (Benutzer drückt F5)
2000s         | loadTokens() -> Tokens aus localStorage laden
2000s         | Verbleibende Zeit: 3600 - 2000 = 1600s
2000s         | Neue Erneuerung geplant für: 1600 - 60 = 1540s
3540s         | ✓ Erneuerung erfolgreich (neue Tokens bis 7140s)
...
```

## Wichtige Variablen

- **`REFRESH_SKEW_SECONDS`**: 60 Sekunden vor Ablauf erneuern (verhindert Race Conditions)
- **`immediateRefreshInProgress`**: Flag zur Vermeidung doppelter Erneuerungen
- **`refreshSub`**: RxJS-Subscription für den Erneuerungstimer

## Console-Ausgabe

Die Authentifizierung gibt detaillierte Logs aus:

```
[AUTH] Loaded tokens from localStorage (read: yes, write: yes)
[AUTH] Token refresh will be rescheduled after 1540s (read expires in 1600s, write expires in 1600s)
[AUTH] Read token about to expire, triggering immediate refresh
[AUTH] Triggering immediate token refresh (tokens about to expire)
[AUTH] Refreshing backend tokens...
[AUTH] ✓ Login successful! Both tokens received
```

## Debugging

Öffne die Browser-Konsole (F12) und suche nach Logs mit `[AUTH]`:

- `[AUTH] Loaded tokens from localStorage` - Tokens werden beim App-Start wiederhergestellt
- `[AUTH] Next token refresh scheduled in Xs` - Wann die nächste Erneuerung stattfindet
- `[AUTH] Refreshing backend tokens...` - Erneuerung wird durchgeführt
- `[AUTH] ✓ ... tokens received successfully` - Erneuerung erfolgreich
- `[AUTH] Token refresh failed; retrying in 60s` - Erneuerung fehlgeschlagen, neuer Versuch

## Mögliche Probleme

### Problem: "Tokens have already expired and need to be renewed immediately"
- **Ursache**: Beim App-Start sind die gespeicherten Tokens bereits abgelaufen
- **Lösung**: Erneuerung wird sofort angefordert. Wenn das Backend nicht verfügbar ist, wird nach 60s erneut versucht.

### Problem: API-Anfragen mit 401 Unauthorized
- **Mögliche Ursache**: Token wurde abgelaufen nicht erneuert
- **Lösung**: Überprüfen Sie die [AUTH] Logs in der Konsole

### Problem: Tokens werden nicht erneuert
- **Debugging-Schritte**:
  1. Öffnen Sie die Konsole (F12)
  2. Suchen Sie nach "[AUTH]" Logs
  3. Überprüfen Sie, dass `[AUTH] Next token refresh scheduled in Xs` angezeigt wird
  4. Warten Sie auf die geplante Erneuerung

## Zusammenfassung der Lösung

| Problem | Lösung |
|---------|--------|
| Token läuft nach App-Refresh ab | `loadTokens()` plant Erneuerung basierend auf verbleibender Zeit neu |
| Zu spät erkannt, dass Token abläuft | `getReadToken()`/`getWriteToken()` lösen sofortige Erneuerung aus |
| Mehrere Erneuerungen gleichzeitig | `immediateRefreshInProgress` Flag verhindert Duplikate |
| Erneuerung schlägt fehl | Automatischer Retry nach 60s |
