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
            return next.handle(req).pipe(
                catchError((error: HttpErrorResponse) => {
                    console.error('HTTP Error:', error);
                    return throwError(() => error);
                })
            );
        }

        return next.handle(req).pipe(
            catchError((error: HttpErrorResponse) => {
                if (error.status === 401 || error.status === 403) {
                    const auth = this.injector.get(AuthService);
                    const router = this.injector.get(Router);
                    auth.logout();
                    router.navigate(['/login']);
                }

                console.error('HTTP Error:', error);
                return throwError(() => error);
            })
        );
    }
}
