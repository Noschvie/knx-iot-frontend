# Internationalization (i18n)

## Overview

The KNX IoT Frontend uses **i18next** as its internationalization framework.

Although the project initially targets a small audience, internationalization is introduced from the beginning to avoid hard-coded UI strings and to provide a scalable foundation for future language support.

The primary language of the project is **English**. Additional languages, including **German**, are supported through translation files.

---

## Design Goals

- No hard-coded user-facing strings in React components
- Keep the backend language-neutral
- Support multiple languages with minimal effort
- Use descriptive translation keys
- Keep KNX terminology consistent across all languages
- Follow established React and i18next best practices

---

## Technology

The frontend uses:

- i18next
- react-i18next
- i18next-browser-languagedetector
- i18next-http-backend (optional, if translations are loaded dynamically)

---

## Directory Structure

```
src/
└── i18n/
    ├── index.ts
    ├── LanguageSwitcher.tsx
    └── locales/
        ├── en/
        │   ├── common.json
        │   ├── navigation.json
        │   ├── devices.json
        │   ├── topology.json
        │   ├── settings.json
        │   └── errors.json
        │
        └── de/
            ├── common.json
            ├── navigation.json
            ├── devices.json
            ├── topology.json
            ├── settings.json
            └── errors.json
```

Namespaces keep translations modular and easier to maintain as the application grows.

---

## Translation Keys

Translation keys should describe the **meaning**, not the displayed text.

Good examples:

```text
navigation.dashboard
navigation.devices
navigation.settings

devices.add
devices.delete
devices.online

errors.connectionFailed
errors.timeout
```

Avoid generic keys such as:

```text
button1
label5
text42
```

---

## React Usage

Always use the translation hook.

```tsx
const { t } = useTranslation();

<Button>
    {t("devices.add")}
</Button>
```

Never write:

```tsx
<Button>Add Device</Button>
```

---

## Backend Communication

The backend should never return localized text.

Preferred:

```json
{
    "errorCode": "DEVICE_NOT_FOUND"
}
```

Instead of:

```json
{
    "message": "Device not found"
}
```

The frontend is responsible for translating messages.

Example:

```tsx
t(`errors.${errorCode}`)
```

---

## KNX Terminology

Certain KNX terms are part of the KNX specification and should normally remain unchanged across all languages.

Examples:

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

General UI elements should be translated.

Examples:

| English | German |
|----------|---------|
| Device | Gerät |
| Settings | Einstellungen |
| History | Verlauf |
| Connection | Verbindung |
| Save | Speichern |
| Cancel | Abbrechen |

---

## Adding a New Language

1. Create a new language directory under:

```
src/i18n/locales/
```

Example:

```
fr/
```

2. Copy the English translation files.

3. Translate only the values.

Never modify translation keys.

---

## Language Detection

Preferred order:

1. User-selected language
2. Browser language
3. English (fallback)

The selected language should be stored in local storage.

---

## Development Guidelines

### DO

- Use descriptive translation keys.
- Keep translations organized by namespace.
- Reuse existing keys whenever possible.
- Keep wording consistent.
- Prefer short and concise UI texts.

### DON'T

- Hard-code visible strings.
- Duplicate translation keys.
- Translate KNX specification terms unless there is a widely accepted translation.
- Build translation keys dynamically unless necessary.

---

## Future Improvements

Possible future enhancements include:

- Lazy loading of translation namespaces
- Automatic detection of missing translations
- CI validation of translation files
- Translation coverage reports
- Integration with translation platforms (e.g. Weblate, Crowdin, Tolgee)

---

## References

- https://www.i18next.com/
- https://react.i18next.com/
