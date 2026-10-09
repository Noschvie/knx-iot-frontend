import { platformBrowser } from '@angular/platform-browser';
import { AppModule } from '@app/app.module';

platformBrowser().bootstrapModule(AppModule)
  .then(() => {
    console.log('[Angular] Application bootstrapped successfully');
  })
  .catch(err => console.error('[Angular Bootstrap Error]', err));
