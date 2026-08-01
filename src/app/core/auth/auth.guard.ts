import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    const isAuthenticated = this.auth.isAuthenticated();
    console.log(`[AUTH GUARD] Checking authentication... result: ${isAuthenticated}`);

    if (isAuthenticated) {
      console.log(`[AUTH GUARD] ✓ User is authenticated, allowing access`);
      return true;
    }

    console.log(`[AUTH GUARD] ✗ User is not authenticated, redirecting to login`);
    this.router.navigate(['/login']);
    return false;
  }
}
