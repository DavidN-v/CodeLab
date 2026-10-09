import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { CourseProgress, LessonCompletion } from '../models/progress.model';

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly http = inject(HttpClient);
  private readonly progressUrl = `${inject(API_BASE_URL)}/progress`;

  getCourseProgress(courseId: number, context?: HttpContext): Observable<CourseProgress> {
    return this.http.get<CourseProgress>(`${this.progressUrl}/courses/${courseId}`, { context });
  }

  completeLesson(lessonId: number): Observable<LessonCompletion> {
    return this.http.post<LessonCompletion>(`${this.progressUrl}/lessons/${lessonId}`, null);
  }
}
