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
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
    constructor(private injector: Injector) {}

    intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        // Don't intercept OAuth requests - errors should reach the login component
        if (req.url.includes('/oauth/')) {
            console.log(`[HTTP Interceptor] OAuth request: ${req.method} ${req.url}`);
            return next.handle(req).pipe(
                catchError((error: HttpErrorResponse) => {
                    console.error(`[HTTP Interceptor] OAuth request failed:`, {
                        url: req.url,
                        method: req.method,
                        status: error.status,
                        statusText: error.statusText
                    });
                    return throwError(() => error);
                })
            );
        }

        console.log(`[HTTP Interceptor] Request: ${req.method} ${req.url}`);
        return next.handle(req).pipe(
            catchError((error: HttpErrorResponse) => {
                console.error(`[HTTP Interceptor] HTTP Error:`, {
                    url: req.url,
                    method: req.method,
                    status: error.status,
                    statusText: error.statusText
                });

                if (error.status === 401 || error.status === 403) {
                    console.log(`[HTTP Interceptor] Unauthorized (${error.status}), logging out and redirecting to login`);
                    const auth = this.injector.get(AuthService);
                    const router = this.injector.get(Router);
                    auth.logout();
                    router.navigate(['/login']);
                }

                return throwError(() => error);
            })
        );
    }
}
