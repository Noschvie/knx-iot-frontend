import { Component } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-main-layout',
  template: `
    <div class="main-layout">
      <router-outlet></router-outlet>
    </div>
  `
})
export class MainLayoutComponent {}

