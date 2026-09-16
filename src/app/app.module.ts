import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideAppInitializer, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { translateHttpLoaderProviders } from '@core/i18n/translate-http-loader.provider';
import { DEFAULT_LANGUAGE, resolveInitialLanguage } from '@core/i18n/i18n.constants';
import { CoreModule } from '@core/core.module';
import { ConfigService } from '@core/config/config.service';
import { AuthService } from '@core/auth/auth.service';
import { OAuthService } from '@core/auth/oauth.service';
import { LayoutModule } from '@features/layout/layout.module';
import { LoggerService } from '@shared/services/logger.service';

@NgModule({
    declarations: [AppComponent],
    imports: [
        BrowserModule,
        AppRoutingModule,
        CoreModule,
        LayoutModule
    ],
    providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideTranslateService({
            lang: DEFAULT_LANGUAGE,
            fallbackLang: DEFAULT_LANGUAGE,
            loader: translateHttpLoaderProviders()
        }),
        // Initialize LoggerService FIRST, before any other config
        provideAppInitializer(() => {
            // Get and initialize logger service to hijack console methods
            inject(LoggerService);
            return Promise.resolve();
        }),
        // Resolve and activate the user's language before the app renders,
        // so there is no flash of untranslated / wrong-language content.
        provideAppInitializer(() => {
            const translate = inject(TranslateService);
            const lang = resolveInitialLanguage(translate.getBrowserLang());
            return firstValueFrom(translate.use(lang));
        }),
        // Then load configuration
        provideAppInitializer(() => firstValueFrom(inject(ConfigService).loadConfig())),

        // Acquire backend (client_credentials) tokens at startup.
        // Retries 3x with 15s pause to bridge a backend that is still starting up.
        // A final failure must NOT block the app from rendering (login/UI stays reachable);
        // renewal/retry keeps running in the background.
        provideAppInitializer(() => {
            const auth = inject(AuthService);
            if (auth instanceof OAuthService) {
                return firstValueFrom(auth.acquireTokens(true)).catch(() => {
                    // Swallow the error so bootstrap completes and the UI (incl. login) renders.
                });
            }
            return Promise.resolve();
        })
    ],
    bootstrap: [AppComponent]
})
export class AppModule {}
