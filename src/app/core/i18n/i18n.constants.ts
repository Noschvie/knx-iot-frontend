/**
 * Supported UI languages.
 *
 * When adding a language: add its code here and add the matching
 * `src/assets/i18n/<code>.json` translation file.
 */
export const SUPPORTED_LANGUAGES = ['en', 'de'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** Language used when no stored preference or supported browser language is found. */
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

/** localStorage key used to persist the user's language choice across sessions. */
export const LANGUAGE_STORAGE_KEY = 'knx-iot-frontend.language';

export function isSupportedLanguage(lang: string | null | undefined): lang is SupportedLanguage {
  return !!lang && (SUPPORTED_LANGUAGES as readonly string[]).includes(lang);
}

/**
 * Resolves which language to activate on startup, in priority order:
 * 1. Previously stored user preference (localStorage)
 * 2. Browser language, if supported
 * 3. DEFAULT_LANGUAGE as fallback
 */
export function resolveInitialLanguage(browserLang: string | undefined): SupportedLanguage {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (isSupportedLanguage(stored)) {
    return stored;
  }
  if (isSupportedLanguage(browserLang)) {
    return browserLang;
  }
  return DEFAULT_LANGUAGE;
}
