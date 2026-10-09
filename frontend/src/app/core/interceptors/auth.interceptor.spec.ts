import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../config/api.config';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let token: string | null;
  let logout: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    token = 'abc';
    logout = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
        { provide: AuthService, useValue: { token: () => token, logout } },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('sends the token to the API', () => {
    http.get('/api/dashboard').subscribe();

    expect(backend.expectOne('/api/dashboard').request.headers.get('Authorization')).toBe(
      'Bearer abc',
    );
  });

  it('never sends the token anywhere else', () => {
    http.get('https://example.com/data').subscribe();

    expect(backend.expectOne('https://example.com/data').request.headers.has('Authorization')).toBe(
      false,
    );
  });

  it('sends nothing when signed out', () => {
    token = null;
    http.get('/api/languages').subscribe();

    expect(backend.expectOne('/api/languages').request.headers.has('Authorization')).toBe(false);
  });

  it('signs out when the API rejects the token', () => {
    http.get('/api/dashboard').subscribe({ error: () => undefined });

    backend.expectOne('/api/dashboard').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(logout).toHaveBeenCalled();
  });
});
