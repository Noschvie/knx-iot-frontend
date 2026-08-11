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
import { AuthService } from '@core/auth/auth.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';

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
    MatProgressSpinnerModule,
    TranslatePipe
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
           <div style="background-color: #fff3cd; border: 1px solid #ffc107; padding: 8px; margin-bottom: 16px; border-radius: 4px; font-size: 0.85rem;">
             <strong>TEST MODE:</strong> Any username/password will be accepted. Backend uses hardcoded credentials.
           </div>

           <form [formGroup]="form" (ngSubmit)="onSubmit()">
             <mat-form-field appearance="outline" class="full-width">
               <mat-label>Username</mat-label>
               <input matInput formControlName="username" autocomplete="username" placeholder="Any username (test mode)" />
               @if (form.get('username')?.hasError('required')) {
                 <mat-error>
                   {{ 'errors.usernameRequired' | translate }}
                 </mat-error>
               }
             </mat-form-field>

             <mat-form-field appearance="outline" class="full-width">
               <mat-label>Password</mat-label>
               <input
                 matInput
                 [type]="hidePassword ? 'password' : 'text'"
                 formControlName="password"
                 autocomplete="current-password"
                 placeholder="Any password (test mode)"
               />
               <button
                 mat-icon-button matSuffix type="button"
                 (click)="hidePassword = !hidePassword"
                 [attr.aria-label]="hidePassword ? 'Show password' : 'Hide password'"
               >
                 <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
               </button>
               @if (form.get('password')?.hasError('required')) {
                 <mat-error>
                   {{ 'errors.passwordRequired' | translate }}
                 </mat-error>
               }
             </mat-form-field>

            @if (errorMessage) {
              <div class="error-message">
                <mat-icon>warning</mat-icon>
                <span>{{ errorMessage }}</span>
              </div>
            }

            <button
              mat-raised-button color="primary"
              type="submit"
              class="full-width submit-btn"
              [disabled]="loading"
            >
              @if (loading) {
                <mat-spinner diameter="20"></mat-spinner>
              }
              @if (!loading) {
                <span>Sign In</span>
              }
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
      private router: Router,
      private translate: TranslateService
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

     // TEST MODE: Accept any username/password from UI
     // Backend auth uses hardcoded credentials
     const { username, password } = this.form.value;

     console.log(`[Login Component] TEST MODE: Accepting any credentials. User entered: ${username}`);

     // In test mode, any credentials are accepted
     this.auth.login(username, password).subscribe({
       next: () => {
         this.loading = false;
         console.log(`[Login Component] ✓ Successfully authenticated (TEST MODE)`);
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
             // Backend-provided text passes through as-is: the backend currently
             // returns human-readable English, not an error code we could map to
             // a translation key. See commit message for details.
             this.errorMessage = err.error.error_description;
         } else if (err.status === 401 || err.status === 400) {
             this.errorMessage = this.translate.instant('errors.testModeAuthFailed');
         } else if (err.status === 0 || err.status === undefined) {
             this.errorMessage = this.translate.instant('errors.connection');
         } else {
             this.errorMessage = this.translate.instant('errors.loginFailed', { message: err.message || 'Unknown error' });
         }
         console.error('[Login Component] Displayed error to user:', this.errorMessage);
       }
     });
   }
}
