import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAngularQuery, QueryClient } from '@tanstack/angular-query-experimental';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(),
    provideAngularQuery(
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,       // 30 s before data is considered stale
            refetchOnWindowFocus: false,
          },
        },
      }),
    ),
  ],
};
