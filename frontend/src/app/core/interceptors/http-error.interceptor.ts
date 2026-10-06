import { HttpContext, HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { NotificationService } from '../services/notification.service';
import { toAppError } from './http-error.mapper';

const SKIP_ERROR_NOTIFICATION = new HttpContextToken<boolean>(() => false);

/**
 * Request context for callers that render the failure themselves (an inline
 * error state, a form message) and do not want the global toast as well.
 */
export function withoutErrorNotification(): HttpContext {
  return new HttpContext().set(SKIP_ERROR_NOTIFICATION, true);
}

/**
 * Normalises every failed request into an AppError and, unless the caller
 * opted out, tells the user about it.
 */
export const httpErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const notifications = inject(NotificationService);

  return next(request).pipe(
    catchError((failure: unknown) => {
      const error = toAppError(failure);
      if (!request.context.get(SKIP_ERROR_NOTIFICATION)) {
        notifications.showError(error.message);
      }
      return throwError(() => error);
    }),
  );
};
