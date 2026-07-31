import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OAuthService } from './core/auth/oauth.service';
import { ConfigService } from './core/config/config.service';

@Component({
  standalone: false,
  selector: 'app-root',
  template: `<router-outlet></router-outlet>`,
  styles: []
})
export class AppComponent implements OnInit {
  title = 'KNX IoT Frontend';

  constructor(
      private auth: OAuthService,
      private config: ConfigService,
      private router: Router
  ) {}

  ngOnInit(): void {
    // Load API info
    this.config.loadApiInfo().subscribe(
        info => console.log('API Info:', info),
        error => console.error('Failed to load API info:', error)
    );

    // Redirect to log in if not authenticated
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
    }
  }
}
