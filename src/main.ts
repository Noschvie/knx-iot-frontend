import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

platformBrowserDynamic().bootstrapModule(AppModule)
  .then(() => {
    console.log('[Angular] Application bootstrapped successfully');
  })
  .catch(err => console.error('[Angular Bootstrap Error]', err));
