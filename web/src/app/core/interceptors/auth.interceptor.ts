import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        const loginLocation = error.headers.get('X-Login-Location');
        if (loginLocation && loginLocation.trim().length > 0) {
          window.location.href = loginLocation.trim();
        } else {
          // TODO: Show error message on page area.
          console.error('Authentication failed');
        }
      }
      return throwError(() => error);
    }),
  );
};
