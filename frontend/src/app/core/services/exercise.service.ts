import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import {
  ExerciseDetail,
  ExerciseProgress,
  Solution,
  SubmissionResult,
} from '../models/exercise.model';

@Injectable({ providedIn: 'root' })
export class ExerciseService {
  private readonly http = inject(HttpClient);
  private readonly exercisesUrl = `${inject(API_BASE_URL)}/exercises`;

  getExercise(slug: string): Observable<ExerciseDetail> {
    return this.http.get<ExerciseDetail>(this.url(slug));
  }

  getProgress(slug: string): Observable<ExerciseProgress> {
    return this.http.get<ExerciseProgress>(`${this.url(slug)}/progress`);
  }

  revealHint(slug: string): Observable<ExerciseProgress> {
    return this.http.post<ExerciseProgress>(`${this.url(slug)}/hints`, null);
  }

  revealSolution(slug: string): Observable<Solution> {
    return this.http.post<Solution>(`${this.url(slug)}/solution`, null);
  }

  submit(slug: string, sourceCode: string): Observable<SubmissionResult> {
    return this.http.post<SubmissionResult>(`${this.url(slug)}/submissions`, { sourceCode });
  }

  private url(slug: string): string {
    return `${this.exercisesUrl}/${encodeURIComponent(slug)}`;
  }
}
