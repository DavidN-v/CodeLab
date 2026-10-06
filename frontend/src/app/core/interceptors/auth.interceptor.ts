import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { AuthService } from '../services/auth.service';

/**
 * Sends the learner's token with every API request and signs them out when
 * the API rejects it (expired, or the account no longer exists).
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const apiBaseUrl = inject(API_BASE_URL);
  const token = request.url.startsWith(apiBaseUrl) ? auth.token() : null;
  if (!token) {
    return next(request);
  }

  return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })).pipe(
    catchError((failure: unknown) => {
      if (failure instanceof HttpErrorResponse && failure.status === 401) {
        auth.logout();
      }
      return throwError(() => failure);
    }),
  );
};
