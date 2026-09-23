import { Injectable, Injector } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable } from 'rxjs';

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

    // Extract endpoint name and query params for logging
    const endpoint = this.extractEndpoint(req.url);
    const queryParams = this.extractQueryParams(req.url);

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
    let headers = req.headers.set('Accept', 'application/vnd.api+json');

    // Only set Content-Type for requests with a body (POST, PUT, PATCH)
    // GET, HEAD, DELETE typically should not have Content-Type header
    const hasBody = req.body !== null && req.body !== undefined;
    const methodsWithBody = ['POST', 'PUT', 'PATCH'];

    if (hasBody && methodsWithBody.includes(req.method)) {
      headers = headers.set('Content-Type', 'application/vnd.api+json');
    }

    // Log request details AFTER modification
    console.log(`[JSON API Interceptor] HEADERS_SET`, {
      method: req.method,
      endpoint: endpoint,
      queryParams: queryParams,
      acceptAfter: headers.get('Accept'),
      contentTypeAfter: headers.get('Content-Type') || '(not set for GET/HEAD/DELETE)'
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
