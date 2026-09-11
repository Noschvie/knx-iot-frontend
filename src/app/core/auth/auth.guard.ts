import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    // TEST MODE: Always allow access (no authentication required)
    console.log(`[AUTH GUARD] TEST MODE - Allowing access without authentication`);
    return true;
  }
}
