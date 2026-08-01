import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { LoggerService } from './app/shared/services/logger.service';

// Initialize logger service to capture all console output
const injector = platformBrowserDynamic().injector;
if (injector) {
  injector.get(LoggerService);
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .then(() => {
    console.log('[Angular] Application bootstrapped successfully');
  })
  .catch(err => console.error('[Angular Bootstrap Error]', err));
