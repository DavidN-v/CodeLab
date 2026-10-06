import { HttpErrorResponse } from '@angular/common/http';

import { ApiErrorBody, AppError } from '../models/api-error.model';

const NETWORK_ERROR_MESSAGE =
  'No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.';
const UNEXPECTED_ERROR_MESSAGE = 'Ha ocurrido un error inesperado. Inténtalo de nuevo.';

/** Statuses whose wording is decided here, regardless of what the server says. */
const FIXED_MESSAGES: Readonly<Partial<Record<number, string>>> = {
  401: 'Tu sesión no es válida o ha caducado. Inicia sesión para continuar.',
  403: 'No tienes permiso para realizar esta acción.',
};

/** Used when the server answered with one of these statuses but sent no usable message. */
const FALLBACK_MESSAGES: Readonly<Partial<Record<number, string>>> = {
  400: 'Hay datos que no son válidos. Revísalos e inténtalo de nuevo.',
  404: 'No encontramos lo que buscabas.',
  409: 'La operación entra en conflicto con el estado actual. Recarga la página e inténtalo de nuevo.',
};

const SERVER_ERROR_MESSAGE = 'Algo ha fallado en el servidor. Inténtalo de nuevo en unos minutos.';

export function toAppError(failure: unknown): AppError {
  if (failure instanceof AppError) {
    return failure;
  }
  if (!(failure instanceof HttpErrorResponse)) {
    return new AppError(0, 'UNEXPECTED_ERROR', UNEXPECTED_ERROR_MESSAGE);
  }
  if (failure.status === 0) {
    return new AppError(0, 'NETWORK_ERROR', NETWORK_ERROR_MESSAGE);
  }

  const body = isApiErrorBody(failure.error) ? failure.error : null;
  const code = body?.error ?? `HTTP_${failure.status}`;
  return new AppError(failure.status, code, resolveMessage(failure.status, body), body?.fieldErrors ?? []);
}

function resolveMessage(status: number, body: ApiErrorBody | null): string {
  if (status >= 500) {
    // Never surface server-side failure details to the user.
    return SERVER_ERROR_MESSAGE;
  }
  return (
    FIXED_MESSAGES[status] ?? body?.message ?? FALLBACK_MESSAGES[status] ?? UNEXPECTED_ERROR_MESSAGE
  );
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Partial<ApiErrorBody>;
  return typeof candidate.error === 'string' && typeof candidate.message === 'string';
}
