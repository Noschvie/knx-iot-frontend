import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
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
      private auth: AuthService,
      private config: ConfigService,
      private router: Router
  ) {}

  ngOnInit(): void {
    this.config.loadApiInfo().subscribe({
      next: () => {
        this.config.loadApiInfo().subscribe({
          next: info => console.log('API Info:', info),
          error: err => console.error('Failed to load API info:', err)
        });
      },
      error: err => console.error('Failed to load config:', err)
    });

    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
    }
  }
}
