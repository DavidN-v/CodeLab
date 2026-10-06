import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../config/api.config';
import { AppError } from '../models/api-error.model';
import { CourseService } from './course.service';

describe('CourseService', () => {
  let service: CourseService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: '/api' }],
    });
    service = TestBed.inject(CourseService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('resolves a language to its first course, once', () => {
    let first: unknown;
    let second: unknown;
    service.getPrimaryCourse('java').subscribe((course) => (first = course));
    http.expectOne('/api/courses?language=java').flush([{ id: 1, slug: 'java-desde-cero' }]);
    service.getPrimaryCourse('java').subscribe((course) => (second = course));

    expect(first).toEqual({ id: 1, slug: 'java-desde-cero' });
    expect(second).toBe(first);
  });

  it('fails with a not-found error when the language has no course', () => {
    let error: unknown;
    service.getPrimaryCourse('python').subscribe({ error: (failure: unknown) => (error = failure) });
    http.expectOne('/api/courses?language=python').flush([]);

    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).status).toBe(404);
  });

  it('builds lesson URLs from slugs', () => {
    service.getLesson(1, 'variables', 'declarar').subscribe();

    http.expectOne('/api/courses/1/modules/variables/lessons/declarar').flush({});
  });
});
