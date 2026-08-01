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

    // Extract endpoint name and query params for logging
    const endpoint = this.extractEndpoint(req.url);
    const queryParams = this.extractQueryParams(req.url);

    // Select token based on HTTP method: read for GET/HEAD, write for POST/PUT/PATCH/DELETE
    if (auth instanceof OAuthService) {
      const isReadOperation = req.method === 'GET' || req.method === 'HEAD';
      token = isReadOperation ? auth.getReadToken() : auth.getWriteToken();

      if (!token) {
        console.warn(`[JSON API Interceptor] No ${isReadOperation ? 'read' : 'write'} token available for ${req.method} ${endpoint}`);
      }
    } else {
      // Fallback for non-OAuth auth services
      token = auth.getToken();
      if (!token) {
        console.warn(`[JSON API Interceptor] No token available for ${req.method} ${endpoint}`);
      }
    }

    // Log request details BEFORE modification
    console.log(`[JSON API Interceptor] REQUEST_DETAIL`, {
      method: req.method,
      endpoint: endpoint,
      queryParams: queryParams,
      url: req.url,
      acceptBefore: req.headers.get('Accept') || '⚠️ NOT SET',
      contentTypeBefore: req.headers.get('Content-Type') || '⚠️ NOT SET'
    });

    // Set Accept header for JSON:API compliance
    let headers = req.headers
      .set('Accept', 'application/vnd.api+json')
      .set('Content-Type', 'application/vnd.api+json');

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    // Log request details AFTER modification
    console.log(`[JSON API Interceptor] HEADERS_SET`, {
      method: req.method,
      endpoint: endpoint,
      queryParams: queryParams,
      acceptAfter: headers.get('Accept'),
      contentTypeAfter: headers.get('Content-Type'),
      hasAuth: headers.has('Authorization') ? 'YES' : 'NO'
    });

    return next.handle(req.clone({ headers }));
  }

  /**
   * Extract the endpoint name from URL
   */
  private extractEndpoint(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname;
    } catch {
      return url;
    }
  }

  /**
   * Extract query parameters from URL
   */
  private extractQueryParams(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.search || 'none';
    } catch {
      const qIndex = url.indexOf('?');
      return qIndex > -1 ? url.substring(qIndex) : 'none';
    }
  }
}
