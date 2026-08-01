import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="login-page">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>KNX IoT Monitor</mat-card-title>
          <mat-card-subtitle>v2.0.0</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <h2>Sign In</h2>

          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Client ID</mat-label>
              <input matInput formControlName="username" autocomplete="username" placeholder="OAuth Client ID" />
              <mat-error *ngIf="form.get('username')?.hasError('required')">
                Client ID is required
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Client Secret</mat-label>
              <input
                matInput
                [type]="hidePassword ? 'password' : 'text'"
                formControlName="password"
                autocomplete="current-password"
                placeholder="OAuth Client Secret"
              />
              <button
                mat-icon-button matSuffix type="button"
                (click)="hidePassword = !hidePassword"
                [attr.aria-label]="hidePassword ? 'Show secret' : 'Hide secret'"
              >
                <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="form.get('password')?.hasError('required')">
                Client Secret is required
              </mat-error>
            </mat-form-field>

            <div *ngIf="errorMessage" class="error-message">
              <mat-icon>warning</mat-icon>
              <span>{{ errorMessage }}</span>
            </div>

            <button
              mat-raised-button color="primary"
              type="submit"
              class="full-width submit-btn"
              [disabled]="loading"
            >
              <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
              <span *ngIf="!loading">Sign In</span>
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-page {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #f5f5f5;
    }
    .login-card {
      width: 100%;
      max-width: 400px;
      padding: 16px;
    }
    mat-card-title {
      font-size: 1.5rem;
    }
    h2 {
      margin: 16px 0;
    }
    .full-width {
      width: 100%;
    }
    .submit-btn {
      margin-top: 8px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #f44336;
      margin-bottom: 12px;
      font-size: 0.9rem;
    }
  `]
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  hidePassword = true;
  errorMessage = '';

  constructor(
      private fb: FormBuilder,
      private auth: AuthService,
      private router: Router
  ) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      console.log('[Login Component] Form validation failed');
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    // Note: Username/password are used for UI flow compatibility but ignored by backend.
    // The backend uses Client Credentials Grant (app credentials only).
    const { username, password } = this.form.value;

    console.log(`[Login Component] Submitting login form for client: ${username}`);

    this.auth.login(username, password).subscribe({
      next: () => {
        this.loading = false;
        console.log(`[Login Component] ✓ Successfully authenticated as client: ${username}`);
        console.log(`[Login Component] Navigating to dashboard...`);
        this.router.navigate(['/dashboard']);
      },
      error: err => {
        this.loading = false;
        console.error('[Login Component] ✗ Login error:', {
          status: err.status,
          statusText: err.message,
          errorDescription: err.error?.error_description || err.message
        });

        // Show backend error message if available, otherwise show generic message
        if (err.error?.error_description) {
            this.errorMessage = err.error.error_description;
        } else if (err.status === 401 || err.status === 400) {
            this.errorMessage = 'Invalid client credentials. Please verify your Client ID and Secret.';
        } else if (err.status === 0 || err.status === undefined) {
            this.errorMessage = 'Connection error. Please check if the API server is running and accessible.';
        } else {
            this.errorMessage = `Login failed: ${err.message || 'Unknown error'}. Please check your connection.`;
        }
        console.error('[Login Component] Displayed error to user:', this.errorMessage);
      }
    });
  }
}
