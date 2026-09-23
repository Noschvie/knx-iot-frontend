import { Component } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-root',
  template: `<router-outlet></router-outlet>`,
  styles: []
})
export class AppComponent {
  title = 'KNX IoT Frontend';
}
