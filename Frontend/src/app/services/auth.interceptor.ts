import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

const API = import.meta.env.NG_APP_API_URL;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth  = inject(AuthService);
  const token = auth.token();
  // Only attach the bearer token to our own API — never to third-party
  // requests (e.g. the reverse-geocoding call in DepartmentService).
  const isOwnApi = req.url.startsWith(API);
  const authedReq = token && isOwnApi ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authedReq).pipe(
    catchError(err => {
      if (token && isOwnApi && err instanceof HttpErrorResponse && err.status === 401) {
        auth.logout();
      }
      return throwError(() => err);
    }),
  );
};
