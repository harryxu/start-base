import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, isDevMode, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideTanStackQuery(new QueryClient()),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerImmediately',
    }),
  ],
};
