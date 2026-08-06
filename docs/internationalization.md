# Internationalization (i18n)

## Overview

The KNX IoT Frontend uses **ngx-translate** (`@ngx-translate/core` + `@ngx-translate/http-loader`, v18) as its internationalization framework.

> This document previously described a React/i18next setup. That was a
> planning-stage draft that didn't match this project's actual Angular
> stack. This version documents what's actually implemented.

Although the project initially targets a small audience, internationalization is introduced from the beginning to avoid hard-coded UI strings and to provide a scalable foundation for future language support.

The primary language of the project is **English**. **German** is supported alongside it. Both currently have identical key coverage - this is checked manually per change (see [Adding or Changing Translations](#adding-or-changing-translations) below); an automated CI check is a possible future improvement.

---

## Design Goals

- No hard-coded user-facing strings in Angular templates or components
- Keep the backend language-neutral (see [Backend Communication](#backend-communication) - this is aspirational for parts of the app today, see [Known Gaps](#known-gaps))
- Support multiple languages with minimal effort
- Use descriptive translation keys
- Keep KNX terminology consistent across all languages

---

## Technology

The frontend uses:

- `@ngx-translate/core` v18 - translation service, `TranslatePipe`, `TranslateDirective`
- `@ngx-translate/http-loader` v18 - loads translation JSON over HTTP from `assets/i18n/`

**Important:** v18 of `@ngx-translate/core` dropped `TranslateModule.forRoot(...)`. Setup is done entirely through functional providers (`provideTranslateService`, `provideTranslateLoader` / `provideTranslateHttpLoader`), and `TranslatePipe`/`TranslateDirective` are standalone - they're imported directly into whichever `imports` array needs them (an `NgModule`'s or a standalone component's), not declared. If you're used to an older ngx-translate version or to i18next/react-i18next, the API looks different - check the installed package's type definitions (`node_modules/@ngx-translate/core/types/*.d.ts`) rather than assuming.

---

## Directory Structure

```
src/
├── app/
│   └── core/
│       └── i18n/
│           ├── i18n.constants.ts              # supported languages, default,
│           │                                  # storage key, resolveInitialLanguage()
│           └── translate-http-loader.provider.ts
└── assets/
    └── i18n/
        ├── en.json
        └── de.json
```

Unlike a namespace-per-file setup, this project uses **one JSON file per language**, with namespaces expressed as top-level keys inside that file (`common`, `navigation`, `logs`, `settings`, `errors`, ...). This was a deliberate simplification: `@ngx-translate/http-loader` fetches one file per language by default, and splitting into multiple files per language would need a custom multi-resource loader (`provideTranslateMultiHttpLoader` exists for this if it's ever needed - e.g. once a namespace gets large enough to want lazy loading).

---

## Translation Keys

Keys are dot-separated and namespaced by top-level feature/area, matching the JSON structure:

```
navigation.dashboard
navigation.devices
navigation.settings

logs.title
logs.clearConfirm

errors.connection
errors.usernameRequired
```

Translation keys should describe the **meaning**, not the displayed text. Avoid generic keys such as `button1`, `label5`, `text42`.

Nest keys to mirror the JSON structure (e.g. `logs.stats.total`, not `logs_stats_total`) - `TranslateService`/`TranslatePipe` resolve nested keys directly by the dotted path.

### Interpolation

For messages that need dynamic values (counts, backend status codes, etc.), use `{{paramName}}` placeholders in the translation value and pass params at the call site:

```json
// en.json
"errors": {
  "dashboardLoadFailed": "Error loading dashboard: {{status}} {{message}}"
}
```

```typescript
this.errorMessage = this.translate.instant('errors.dashboardLoadFailed', {
  status: error?.status ?? 'Unknown',
  message: error?.message ?? 'Connection failed'
});
```

Don't build translated sentences by concatenating multiple small translated fragments - interpolate a full sentence instead. Concatenation breaks word order in languages that don't share English's structure, even if German happens to work today.

---

## Angular Usage

This project uses Angular **NgModules** for most feature areas and **standalone components** for a few (e.g. `LoginComponent`, `MonitorComponent`) - check the existing component before assuming which pattern applies. Either way, `TranslatePipe` needs to be importable in the component's template:

**In an NgModule-declared component:** import `TranslatePipe` into the owning `*.module.ts`'s `imports` array (it's standalone, so this is a normal Angular 14+ pattern, not a mistake):

```typescript
// logs.module.ts
import { TranslatePipe } from '@ngx-translate/core';

@NgModule({
  declarations: [LogsComponent],
  imports: [CommonModule, FormsModule, RouterModule.forChild(routes), TranslatePipe]
})
export class LogsModule {}
```

**In a standalone component:** import it directly into the component's own `imports` array.

**In a template**, use the pipe:

```html
<span>{{ 'navigation.devices' | translate }}</span>
```

**In component TypeScript code** (e.g. a `confirm()` dialog, or an error message assigned to a field), inject `TranslateService` and call `.instant()` - translations are guaranteed loaded by the time any component runs, since language resolution happens in an `APP_INITIALIZER` before bootstrap (see `app.module.ts`):

```typescript
constructor(private translate: TranslateService) {}

clearLogs(): void {
  if (confirm(this.translate.instant('logs.clearConfirm'))) { ... }
}
```

Never write:

```html
<span>Devices</span>
```

### Dynamic attributes

Static HTML attributes that need to be translated (e.g. `aria-label`) must become property bindings, since ngx-translate can't act on a plain string attribute:

```html
<!-- Before -->
<button aria-label="Toggle navigation">

<!-- After -->
<button [attr.aria-label]="'navigation.toggle' | translate">
```

---

## Backend Communication

The backend should never return localized text. The frontend is responsible for translating messages.

Preferred:

```json
{ "errorCode": "DEVICE_NOT_FOUND" }
```

```typescript
this.translate.instant(`errors.${errorCode}`)
```

Instead of:

```json
{ "message": "Device not found" }
```

### Known gaps

This is the target design, not the current state everywhere:

- The KNX IoT API server's login endpoint returns a human-readable `error_description` string (in English) rather than a code. The frontend currently passes this through untranslated as-is (see `login.component.ts`) rather than guessing at a mapping. Fixing this properly needs a backend change (return a code), not a frontend workaround.
- Several error paths (dashboard/monitor load failures) build their message from `HttpErrorResponse.status`/`.message` rather than a backend-supplied code, because no code exists yet. These use interpolated, translated wrapper text (`errors.dashboardLoadFailed`, etc.) around the raw technical detail rather than translating the detail itself, since the detail is diagnostic, not really "UI text."

If you're adding a new backend-driven error, prefer adding an error code to the API response and a matching `errors.<code>` key over building a new ad hoc message string in the component.

---

## KNX Terminology

Certain KNX terms are part of the KNX specification and should normally remain unchanged across all languages:

- KNX
- KNX IoT
- KNX Secure
- DPT
- Datapoint Type
- Group Address (GA)
- Individual Address (IA)
- Interface Object
- CoAP
- OSCORE
- Thread
- IPv6

General UI elements should be translated:

| English | German |
|----------|---------|
| Device | Gerät |
| Settings | Einstellungen |
| History | Verlauf |
| Connection | Verbindung |
| Save | Speichern |
| Cancel | Abbrechen |

---

## Language Detection & Switching

Order of precedence, implemented in `resolveInitialLanguage()` (`core/i18n/i18n.constants.ts`) and applied in an `APP_INITIALIZER` in `app.module.ts`:

1. Previously stored user preference (`localStorage`, key from `LANGUAGE_STORAGE_KEY`)
2. Browser language, if it's one of `SUPPORTED_LANGUAGES`
3. `DEFAULT_LANGUAGE` (`'en'`) as fallback

The language can be changed at runtime on the Settings page, which calls `TranslateService.use(lang)` and writes the same `LANGUAGE_STORAGE_KEY` so the choice survives a reload.

---

## Adding a New Language

1. Add the language code to `SUPPORTED_LANGUAGES` in `src/app/core/i18n/i18n.constants.ts`.
2. Add its display name to `settings.language.<code>` in **every** `assets/i18n/*.json` file (so the language picker can show it in whichever language is currently active).
3. Copy `assets/i18n/en.json` to `assets/i18n/<code>.json`.
4. Translate only the values, not the keys.
5. Run the key-parity check below before committing.

---

## Adding or Changing Translations

There's no automated CI check for key parity between `en.json` and `de.json` yet (see [Future Improvements](#future-improvements)). Until there is, run this manually before committing a change that touches either file:

```bash
python3 -c "
import json
en = json.load(open('src/assets/i18n/en.json'))
de = json.load(open('src/assets/i18n/de.json'))
def flatten(d, prefix=''):
    keys = set()
    for k, v in d.items():
        p = f'{prefix}.{k}' if prefix else k
        keys |= flatten(v, p) if isinstance(v, dict) else {p}
    return keys
ek, dk = flatten(en), flatten(de)
print('only in en:', ek - dk)
print('only in de:', dk - ek)
"
```

Both sets should be empty. Also grep the codebase for any `| translate` or `.instant('key...')` usage of a new key to make sure it's spelled identically to the JSON.

---

## Development Guidelines

### DO

- Use descriptive, nested translation keys that mirror the JSON structure.
- Reuse existing keys whenever possible (e.g. `common.actions.save` rather than a new per-feature "Save" key).
- Keep wording consistent across features.
- Interpolate full sentences rather than concatenating translated fragments.
- Run the key-parity check above whenever you touch `en.json`/`de.json`.

### DON'T

- Hard-code visible strings in templates or component code.
- Duplicate translation keys.
- Translate KNX specification terms unless there's a widely accepted translation.
- Build translation keys dynamically unless genuinely necessary (e.g. the Settings language picker builds `settings.language.<code>` from `SUPPORTED_LANGUAGES` - that's fine because both sides are the same small, closed list).
- Assume an older ngx-translate/i18next API (like `TranslateModule.forRoot()`) still applies - v18 removed it.

---

## Future Improvements

Possible future enhancements include:

- CI validation of translation key parity (replacing the manual script above)
- An error-code contract with the backend, replacing the ad hoc status/message-based error strings described in [Known Gaps](#known-gaps)
- Lazy loading of translation namespaces via `provideTranslateMultiHttpLoader`, if `en.json`/`de.json` grow large enough to matter
- Translation coverage reports
- Integration with a translation platform (e.g. Weblate, Crowdin, Tolgee)

---

## References

- https://github.com/ngx-translate/core
- https://github.com/ngx-translate/http-loader
