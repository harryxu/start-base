import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { API_BASE } from '../api/api.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Attach session cookie to all requests targeting our own API
  const isApiRequest = req.url.startsWith(API_BASE + '/api') || req.url.startsWith('/api');
  const authReq = isApiRequest ? req.clone({ withCredentials: true }) : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        const loginLocation = error.headers.get('X-Login-Location');
        if (loginLocation && loginLocation.trim().length > 0) {
          window.location.href = loginLocation.trim();
        } else {
          router.navigate(['/login']);
        }
      }
      return throwError(() => error);
    }),
  );
};
