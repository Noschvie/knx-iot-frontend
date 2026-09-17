import { Component, OnInit } from '@angular/core';
import { AuthService } from './core/auth/auth.service';

@Component({
  standalone: false,
  selector: 'app-root',
  template: `<router-outlet></router-outlet>`,
  styles: []
})
export class AppComponent implements OnInit {
  title = 'KNX IoT Frontend';

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    // LAN-only deployment: no user login screen. Acquire the backend (M2M)
    // tokens in the background so the UI renders immediately and the app can
    // connect to the gateway (HTTP + WebSocket).
    if (!this.auth.isAuthenticated()) {
      // username/password are ignored in TEST MODE (client_credentials flow).
      this.auth.login('', '').subscribe({
        next: () => console.log('[AppComponent] ✓ Backend tokens acquired'),
        error: (err) =>
            console.error('[AppComponent] ✗ Failed to acquire backend tokens:', err)
      });
    }
  }
}
