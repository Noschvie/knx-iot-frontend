import { Injectable, Injector } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { OAuthService } from '../auth/oauth.service';

@Injectable()
export class JsonApiInterceptor implements HttpInterceptor {
  constructor(private injector: Injector) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Don't intercept syslog requests - these are internal logging requests
    if (req.url.includes('/syslog')) {
      return next.handle(req);
    }

    // Don't intercept OAuth or asset requests
    if (req.url.includes('/oauth/') || req.url.includes('/assets/')) {
      return next.handle(req);
    }

    const auth = this.injector.get(AuthService);
    let token: string | null = null;

    // Select token based on HTTP method: read for GET/HEAD, write for POST/PUT/PATCH/DELETE
    if (auth instanceof OAuthService) {
      const isReadOperation = req.method === 'GET' || req.method === 'HEAD';
      token = isReadOperation ? auth.getReadToken() : auth.getWriteToken();

      if (!token) {
        console.warn(`[JSON API Interceptor] No ${isReadOperation ? 'read' : 'write'} token available for ${req.method} ${req.url}`);
      } else {
        console.log(`[JSON API Interceptor] Added ${isReadOperation ? 'read' : 'write'} token to ${req.method} ${req.url}`);
      }
    } else {
      // Fallback for non-OAuth auth services
      token = auth.getToken();
      if (!token) {
        console.warn(`[JSON API Interceptor] No token available for ${req.method} ${req.url}`);
      }
    }

    let headers = req.headers.set('Accept', 'application/vnd.api+json');

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'DELETE') {
      const isJsonFallback =
          req.url.includes('/datapoints/values') ||
          req.url.includes('/subscriptions');
      headers = headers.set(
          'Content-Type',
          isJsonFallback ? 'application/json' : 'application/vnd.api+json'
      );
    }

    return next.handle(req.clone({ headers }));
  }
}
