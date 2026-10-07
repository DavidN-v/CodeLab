import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { AppError } from '../models/api-error.model';
import {
  CourseDetail,
  CourseSummary,
  ExerciseSummary,
  GlossaryTerm,
  LessonDetail,
  ModuleDetail,
} from '../models/course.model';

@Injectable({ providedIn: 'root' })
export class CourseService {
  private readonly http = inject(HttpClient);
  private readonly coursesUrl = `${inject(API_BASE_URL)}/courses`;

  /** Courses rarely change while the app is open; each one is fetched once. */
  private readonly courseCache = new Map<number, Observable<CourseDetail>>();
  private readonly primaryCourseCache = new Map<string, Observable<CourseSummary>>();
  private readonly glossaryCache = new Map<number, Observable<GlossaryTerm[]>>();

  /**
   * The course a language's pages are about. URLs only carry the language, so
   * every course page starts here.
   */
  getPrimaryCourse(languageSlug: string): Observable<CourseSummary> {
    let course = this.primaryCourseCache.get(languageSlug);
    if (!course) {
      course = this.http
        .get<CourseSummary[]>(this.coursesUrl, { params: { language: languageSlug } })
        .pipe(
          map((courses) => {
            if (courses.length === 0) {
              throw new AppError(
                404,
                'RESOURCE_NOT_FOUND',
                'Este lenguaje todavía no tiene cursos.',
              );
            }
            return courses[0];
          }),
          shareReplay({ bufferSize: 1, refCount: false }),
        );
      this.primaryCourseCache.set(languageSlug, course);
      course.subscribe({ error: () => this.primaryCourseCache.delete(languageSlug) });
    }
    return course;
  }

  getCourse(courseId: number): Observable<CourseDetail> {
    let course = this.courseCache.get(courseId);
    if (!course) {
      course = this.http
        .get<CourseDetail>(`${this.coursesUrl}/${courseId}`)
        .pipe(shareReplay({ bufferSize: 1, refCount: false }));
      this.courseCache.set(courseId, course);
      course.subscribe({ error: () => this.courseCache.delete(courseId) });
    }
    return course;
  }

  getModule(courseId: number, moduleSlug: string): Observable<ModuleDetail> {
    return this.http.get<ModuleDetail>(
      `${this.coursesUrl}/${courseId}/modules/${encodeURIComponent(moduleSlug)}`,
    );
  }

  getLesson(courseId: number, moduleSlug: string, lessonSlug: string): Observable<LessonDetail> {
    return this.http.get<LessonDetail>(
      `${this.coursesUrl}/${courseId}/modules/${encodeURIComponent(moduleSlug)}/lessons/${encodeURIComponent(lessonSlug)}`,
    );
  }

  getExercises(courseId: number): Observable<ExerciseSummary[]> {
    return this.http.get<ExerciseSummary[]>(`${this.coursesUrl}/${courseId}/exercises`);
  }

  /** The course's glossary; fetched once per course. */
  getGlossary(courseId: number): Observable<GlossaryTerm[]> {
    let glossary = this.glossaryCache.get(courseId);
    if (!glossary) {
      glossary = this.http
        .get<GlossaryTerm[]>(`${this.coursesUrl}/${courseId}/glossary`)
        .pipe(shareReplay({ bufferSize: 1, refCount: false }));
      this.glossaryCache.set(courseId, glossary);
      glossary.subscribe({ error: () => this.glossaryCache.delete(courseId) });
    }
    return glossary;
  }
}
