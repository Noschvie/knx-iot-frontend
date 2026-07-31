import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideAppInitializer, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { CoreModule } from './core/core.module';
import { LayoutModule } from './features/layout/layout.module';
import { ConfigService } from './core/config/config.service';

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
        provideAppInitializer(() => firstValueFrom(inject(ConfigService).loadConfig()))
    ],
    bootstrap: [AppComponent]
})
export class AppModule {}
