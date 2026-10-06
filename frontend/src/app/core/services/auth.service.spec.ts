import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../config/api.config';
import { AuthResponse } from '../models/auth.model';
import { AuthService } from './auth.service';

const RESPONSE: AuthResponse = {
  token: 'jwt-token',
  expiresAt: '2999-01-01T00:00:00Z',
  user: { id: 1, email: 'ada@example.com', displayName: 'Ada' },
};

describe('AuthService', () => {
  let http: HttpTestingController;

  function createService(): AuthService {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    return TestBed.inject(AuthService);
  }

  beforeEach(() => localStorage.clear());

  it('starts a session on login and remembers it across reloads', () => {
    const service = createService();
    service.login({ email: 'ada@example.com', password: 'secreta123' }).subscribe();
    http.expectOne('/api/auth/login').flush(RESPONSE);

    expect(service.isAuthenticated()).toBe(true);
    expect(service.user()?.displayName).toBe('Ada');
    expect(service.token()).toBe('jwt-token');
    expect(JSON.parse(localStorage.getItem('forja.session')!).token).toBe('jwt-token');
  });

  it('restores a stored session', () => {
    localStorage.setItem('forja.session', JSON.stringify(RESPONSE));

    expect(createService().user()?.email).toBe('ada@example.com');
  });

  it('discards an expired session', () => {
    localStorage.setItem(
      'forja.session',
      JSON.stringify({ ...RESPONSE, expiresAt: '2000-01-01T00:00:00Z' }),
    );

    const service = createService();

    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('forja.session')).toBeNull();
  });

  it('forgets everything on logout', () => {
    localStorage.setItem('forja.session', JSON.stringify(RESPONSE));
    const service = createService();

    service.logout();

    expect(service.user()).toBeNull();
    expect(service.token()).toBeNull();
    expect(localStorage.getItem('forja.session')).toBeNull();
  });

  it('registers and signs in in one step', () => {
    const service = createService();
    service.register({ email: 'ada@example.com', password: 'secreta123', displayName: 'Ada' }).subscribe();

    const request = http.expectOne('/api/auth/register');
    expect(request.request.body.displayName).toBe('Ada');
    request.flush(RESPONSE);

    expect(service.isAuthenticated()).toBe(true);
  });
});
