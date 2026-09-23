import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { JsonApiInterceptor } from './http/json-api.interceptor';
import { ErrorInterceptor } from './http/error.interceptor';
import { WebSocketService } from './websocket/websocket.service';

import { ConfigService } from './config/config.service';

// Data Services
import { DatapointService } from './services/datapoint.service';
import { DeviceService } from './services/device.service';
import { LocationService } from './services/location.service';

@NgModule({
  imports: [CommonModule],
  providers: [
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
