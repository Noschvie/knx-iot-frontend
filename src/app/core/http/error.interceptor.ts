import { Injectable, Injector } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
    constructor(private injector: Injector) {}

    intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        // Don't intercept syslog requests - these are internal logging requests and cause infinite loops
        if (req.url.includes('/syslog')) {
            return next.handle(req);
        }

        console.log(`[HTTP Interceptor] Request: ${req.method} ${req.url}`);
        return next.handle(req).pipe(
            catchError((error: HttpErrorResponse) => {
                const endpoint = this.extractEndpoint(req.url);
                const queryParams = this.extractQueryParams(req.url);

                console.error(`[HTTP Interceptor] ❌ HTTP ERROR`, {
                    method: req.method,
                    endpoint: endpoint,
                    queryParams: queryParams,
                    fullUrl: req.url,
                    status: error.status,
                    message: error.message,
                    errorDetail: error.error
                });

                if (error.status === 406) {
                    console.error(`[HTTP Interceptor] 🔴 NOT ACCEPTABLE (406) - Likely missing application/vnd.api+json Accept header!`, {
                        endpoint: endpoint,
                        requestHeaders: {
                            accept: req.headers.get('Accept'),
                            contentType: req.headers.get('Content-Type')
                        }
                    });
                }

                return throwError(() => error);
            })
        );
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
