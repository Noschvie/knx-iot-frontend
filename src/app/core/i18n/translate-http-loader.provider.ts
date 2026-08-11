import { Provider } from '@angular/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

/**
 * ngx-translate v18 configures the HTTP loader via a provider function
 * (`provideTranslateHttpLoader`) rather than constructing `TranslateHttpLoader`
 * directly. Kept in its own file so app.module.ts stays focused on wiring
 * things together, and so the loader config can be unit tested in isolation.
 */
export function translateHttpLoaderProviders(): Provider[] {
  return provideTranslateHttpLoader({
    prefix: './assets/i18n/',
    suffix: '.json'
  });
}
