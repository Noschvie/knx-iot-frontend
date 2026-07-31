import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { JsonApiInterceptor } from './http/json-api.interceptor';
import { ErrorInterceptor } from './http/error.interceptor';
import { WebSocketService } from './websocket/websocket.service';

import { MockAuthService } from '@core/auth/mock-auth.service';
import { environment } from '@environments/environment';
import { ConfigService } from './config/config.service';
import { AuthService } from './auth/auth.service';
import { OAuthService } from './auth/oauth.service';
import { AuthGuard } from './auth/auth.guard';

// Data Services
import { DatapointService } from './services/datapoint.service';
import { DeviceService } from './services/device.service';
import { LocationService } from './services/location.service';

// TODO: Later swap to Keycloak:
// import { KeycloakAuthService } from './auth/keycloak-auth.service';
// { provide: AuthService, useClass: KeycloakAuthService }

@NgModule({
  imports: [CommonModule],
  providers: [
    {
      provide: AuthService,
      useClass: environment.features.enableMockData ? MockAuthService : OAuthService
    },
    AuthGuard,
    WebSocketService,
    ConfigService,

    // Data Services
    DatapointService,
    DeviceService,
    LocationService,

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
