import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { withoutErrorNotification } from '../interceptors/http-error.interceptor';

/** The AI tutor: another explanation, a debugging hint, a code review. */
@Injectable({ providedIn: 'root' })
export class TutorService {
  private readonly http = inject(HttpClient);
  private readonly tutorUrl = `${inject(API_BASE_URL)}/tutor`;

  private enabled$: Observable<boolean> | null = null;

  /** Whether the server has a tutor configured; asked once. */
  isEnabled(): Observable<boolean> {
    this.enabled$ ??= this.http
      .get<{ enabled: boolean }>(`${this.tutorUrl}/status`, { context: withoutErrorNotification() })
      .pipe(
        map((status) => status.enabled),
        catchError(() => of(false)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    return this.enabled$;
  }

  explain(lessonId: number, question: string): Observable<string> {
    return this.ask('explain', { lessonId, question });
  }

  debug(exerciseSlug: string, sourceCode: string, result: string): Observable<string> {
    return this.ask('debug', { exerciseSlug, sourceCode, result });
  }

  review(exerciseSlug: string, sourceCode: string): Observable<string> {
    return this.ask('review', { exerciseSlug, sourceCode });
  }

  private ask(mode: string, body: object): Observable<string> {
    return (
      this.http
        // The panel shows the failure inline, where the learner is looking.
        .post<{ answer: string }>(`${this.tutorUrl}/${mode}`, body, {
          context: withoutErrorNotification(),
        })
        .pipe(map((response) => response.answer))
    );
  }
}
