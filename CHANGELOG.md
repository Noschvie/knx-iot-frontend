# Changelog

All notable changes to this project will be documented in this file.

The format is based on "Keep a Changelog" and aims to make it easy for
contributors and users to follow meaningful changes over time.

Unreleased
----------

### Added
- Internationalization (i18n) support via `@ngx-translate/core` v18, with English and German translations (#1)
  - Language resolution on startup: stored preference → browser language → English fallback
  - Language switcher on the Settings page, persisted across sessions
  - Translated: navigation, logs page, error messages (login, dashboard, monitor)
  - Developer documentation for adding translations and new languages (`docs/internationalization.md`)

### Changed
- Settings page now has real functionality (language switcher) instead of a placeholder

### Known limitations
- CSV export headers in the logs page remain hardcoded in German, independent of the UI language
- The backend's login error response (`error_description`) is returned as plain English text rather than an error code, so it cannot be localized on the frontend without a backend change
- Translation key parity between languages is currently checked manually; no automated CI check exists yet

Guidelines
----------
- Add a short, plain-language entry for each pull request or notable change.
- Use categories such as Added, Changed, Deprecated, Removed, Fixed, Security.
- Keep entries under Unreleased until you create a release tag, then move them
  under the release date/version.

Example entry
-------------
```markdown
### Fixed
- Prevent crash when X is missing on startup (PR #123)
```
