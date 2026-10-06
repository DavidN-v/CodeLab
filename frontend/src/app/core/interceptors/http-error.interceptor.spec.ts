import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AppError } from '../models/api-error.model';
import { NotificationService } from '../services/notification.service';
import { httpErrorInterceptor, withoutErrorNotification } from './http-error.interceptor';

describe('httpErrorInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let notifications: NotificationService;

  /** Performs a GET that fails with the given response and returns the error the caller receives. */
  function failRequest(
    status: number,
    body: object | string | null,
    options: { silent?: boolean } = {},
  ): AppError {
    let received: unknown;
    http
      .get('/api/resource', { context: options.silent ? withoutErrorNotification() : undefined })
      .subscribe({ error: (error: unknown) => (received = error) });

    const request = backend.expectOne('/api/resource');
    if (status === 0) {
      request.error(new ProgressEvent('error'));
    } else {
      request.flush(body, { status, statusText: 'Error' });
    }

    expect(received).toBeInstanceOf(AppError);
    return received as AppError;
  }

  function apiError(status: number, error: string, message: string, extra: object = {}): object {
    return { timestamp: '2026-01-01T00:00:00Z', status, error, message, path: '/api/resource', ...extra };
  }

  function shownMessages(): string[] {
    return notifications.notifications().map((notification) => notification.message);
  }

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([httpErrorInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    notifications = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    backend.verify();
    vi.useRealTimers();
  });

  it('passes successful responses through untouched', () => {
    let received: unknown;
    http.get('/api/resource').subscribe((body) => (received = body));

    backend.expectOne('/api/resource').flush({ ok: true });

    expect(received).toEqual({ ok: true });
    expect(shownMessages()).toEqual([]);
  });

  it('keeps the field errors and the server message of a 400', () => {
    const fieldErrors = [{ field: 'email', message: 'no es válido' }];
    const error = failRequest(400, apiError(400, 'VALIDATION_ERROR', 'Revisa el formulario.', { fieldErrors }));

    expect(error.status).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.fieldErrors).toEqual(fieldErrors);
    expect(shownMessages()).toEqual(['Revisa el formulario.']);
  });

  it('uses its own wording for 401 and 403, whatever the server says', () => {
    const unauthorized = failRequest(401, apiError(401, 'UNAUTHORIZED', 'jwt expired'));
    const forbidden = failRequest(403, apiError(403, 'FORBIDDEN', 'role USER lacks scope'));

    expect(unauthorized.message).toContain('Inicia sesión');
    expect(forbidden.message).toContain('No tienes permiso');
    expect(shownMessages().join(' ')).not.toContain('jwt');
  });

  it('shows the server message for 404 and 409', () => {
    failRequest(404, apiError(404, 'RESOURCE_NOT_FOUND', "No existe el lenguaje 'cobol'."));
    failRequest(409, apiError(409, 'CONFLICT', 'Ese ejercicio ya está resuelto.'));

    expect(shownMessages()).toEqual(["No existe el lenguaje 'cobol'.", 'Ese ejercicio ya está resuelto.']);
  });

  it('falls back to a generic message when the body is not an API error', () => {
    const error = failRequest(404, '<html>Not Found</html>');

    expect(error.code).toBe('HTTP_404');
    expect(error.message).toBe('No encontramos lo que buscabas.');
  });

  it('never exposes the details of a server failure', () => {
    const error = failRequest(500, apiError(500, 'INTERNAL_ERROR', 'NullPointerException at Foo.java:42'));

    expect(error.status).toBe(500);
    expect(error.message).not.toContain('NullPointerException');
    expect(error.message).toContain('servidor');
  });

  it('shows the sandbox-unavailable message, which is written for learners', () => {
    const message = 'El entorno de ejecución no está disponible ahora mismo.';
    const error = failRequest(503, apiError(503, 'EXECUTION_UNAVAILABLE', message));

    expect(error.code).toBe('EXECUTION_UNAVAILABLE');
    expect(error.message).toBe(message);
  });

  it('explains a rate limit even without a server message', () => {
    const error = failRequest(429, '');

    expect(error.message).toContain('demasiadas solicitudes');
  });

  it('reports an unreachable server as a connection problem', () => {
    const error = failRequest(0, null);

    expect(error.code).toBe('NETWORK_ERROR');
    expect(error.message).toContain('No se pudo conectar');
  });

  it('still fails the request but stays quiet when the caller opts out', () => {
    const error = failRequest(404, apiError(404, 'RESOURCE_NOT_FOUND', 'No existe.'), { silent: true });

    expect(error.status).toBe(404);
    expect(shownMessages()).toEqual([]);
  });
});
