import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AuthService } from './auth/auth.service';
import { OAuthService } from './auth/oauth.service';
import { AuthGuard } from './auth/auth.guard';
import { JsonApiInterceptor } from './http/json-api.interceptor';
import { ErrorInterceptor } from './http/error.interceptor';
import { WebSocketService } from './websocket/websocket.service';
import { ConfigService } from './config/config.service';

// Hier später für Keycloak tauschen:
// import { KeycloakAuthService } from './auth/keycloak-auth.service';
// { provide: AuthService, useClass: KeycloakAuthService }

@NgModule({
  imports: [CommonModule, HttpClientModule],
  providers: [
    { provide: AuthService, useClass: OAuthService },
    AuthGuard,
    WebSocketService,
    ConfigService,
    { provide: HTTP_INTERCEPTORS, useClass: JsonApiInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true }
  ]
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import only once in AppModule');
    }
  }
}
