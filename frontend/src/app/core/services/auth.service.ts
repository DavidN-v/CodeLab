import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { AuthResponse, Credentials, Registration, User } from '../models/auth.model';
import { withoutErrorNotification } from '../interceptors/http-error.interceptor';
import { readStorage, removeStorage, writeStorage } from './browser-storage';

const SESSION_KEY = 'forja.session';

interface Session {
  token: string;
  expiresAt: string;
  user: User;
}

/**
 * The signed-in learner. The session (token and user) survives reloads in
 * localStorage and is dropped once the token expires.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly authUrl = `${inject(API_BASE_URL)}/auth`;

  private readonly session = signal<Session | null>(restoreSession());

  readonly user = computed(() => this.session()?.user ?? null);
  readonly isAuthenticated = computed(() => this.session() !== null);

  /** Bearer token for the API, or null when signed out or expired. */
  token(): string | null {
    const session = this.session();
    if (session && isExpired(session)) {
      this.logout();
      return null;
    }
    return session?.token ?? null;
  }

  /** Login and register pages show failures inline, so the global toast is skipped. */
  login(credentials: Credentials): Observable<User> {
    return this.http
      .post<AuthResponse>(`${this.authUrl}/login`, credentials, {
        context: withoutErrorNotification(),
      })
      .pipe(
        tap((response) => this.start(response)),
        map((response) => response.user),
      );
  }

  register(registration: Registration): Observable<User> {
    return this.http
      .post<AuthResponse>(`${this.authUrl}/register`, registration, {
        context: withoutErrorNotification(),
      })
      .pipe(
        tap((response) => this.start(response)),
        map((response) => response.user),
      );
  }

  /** Changes the daily experience goal and keeps the stored session in step. */
  changeDailyGoal(dailyGoalXp: number): Observable<User> {
    return this.http
      .put<User>(`${this.authUrl}/me/daily-goal`, { dailyGoalXp })
      .pipe(tap((user) => this.updateUser(user)));
  }

  logout(): void {
    this.session.set(null);
    removeStorage(SESSION_KEY);
  }

  private updateUser(user: User): void {
    const session = this.session();
    if (session) {
      const updated = { ...session, user };
      this.session.set(updated);
      writeStorage(SESSION_KEY, JSON.stringify(updated));
    }
  }

  private start(response: AuthResponse): void {
    const session: Session = {
      token: response.token,
      expiresAt: response.expiresAt,
      user: response.user,
    };
    this.session.set(session);
    writeStorage(SESSION_KEY, JSON.stringify(session));
  }
}

function restoreSession(): Session | null {
  const stored = readStorage(SESSION_KEY);
  if (!stored) {
    return null;
  }
  try {
    const session = JSON.parse(stored) as Session;
    if (!session.token || !session.user || isExpired(session)) {
      removeStorage(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    removeStorage(SESSION_KEY);
    return null;
  }
}

function isExpired(session: Session): boolean {
  return Date.parse(session.expiresAt) <= Date.now();
}
