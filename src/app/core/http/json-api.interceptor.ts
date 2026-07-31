import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { OAuthService } from '../auth/oauth.service';

@Injectable()
export class JsonApiInterceptor implements HttpInterceptor {
  constructor(private auth: OAuthService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.auth.getToken();

    let headers = req.headers
        .set('Accept', 'application/vnd.api+json');

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    // Set Content-Type based on endpoint
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'DELETE') {
      const isJsonFallback =
          req.url.includes('/datapoints/values') ||
          req.url.includes('/subscriptions');

      headers = headers.set(
          'Content-Type',
          isJsonFallback ? 'application/json' : 'application/vnd.api+json'
      );
    }

    return next.handle(req);
  }
}
