import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideAppInitializer, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { CoreModule } from './core/core.module';
import { LayoutModule } from './features/layout/layout.module';
import { ConfigService } from './core/config/config.service';
import { LoggerService } from './shared/services/logger.service';
import { translateHttpLoaderProviders } from './core/i18n/translate-http-loader.provider';
import { DEFAULT_LANGUAGE, resolveInitialLanguage } from './core/i18n/i18n.constants';

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
        provideAnimations(),
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
        provideAppInitializer(() => firstValueFrom(inject(ConfigService).loadConfig()))
    ],
    bootstrap: [AppComponent]
})
export class AppModule {}
