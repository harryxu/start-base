import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { API_BASE } from '../api/api.service';

let isRedirectingToLogin = false;

/** Reset unauthenticated redirect state (e.g. after login). */
export function resetAuthInterceptorState(): void {
  isRedirectingToLogin = false;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  const isApiRequest = req.url.startsWith(API_BASE + '/api') || req.url.startsWith('/api');
  const isAuthEndpoint = req.url.includes('/api/auth/login') || req.url.includes('/api/auth/me');

  // If a 401 has already occurred and redirect to /login is underway, block subsequent non-auth API calls locally
  if (isApiRequest && isRedirectingToLogin && !isAuthEndpoint) {
    return throwError(
      () => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized (Blocked)' }),
    );
  }

  const authReq = isApiRequest ? req.clone({ withCredentials: true }) : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        if (!isRedirectingToLogin) {
          isRedirectingToLogin = true;
          const loginLocation = error.headers.get('X-Login-Location');
          if (loginLocation && loginLocation.trim().length > 0) {
            window.location.href = loginLocation.trim();
          } else {
            router.navigate(['/login']);
          }
        }
      }
      return throwError(() => error);
    }),
  );
};
