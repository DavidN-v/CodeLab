import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { ModuleDetail } from '../../../../core/models/course.model';
import { AuthService } from '../../../../core/services/auth.service';
import { CourseService } from '../../../../core/services/course.service';
import { ProgressService } from '../../../../core/services/progress.service';
import { ModulePageComponent } from './module-page.component';

const MODULE: ModuleDetail = {
  id: 1,
  slug: 'fundamentos',
  title: 'Fundamentos',
  summary: 'Primeros pasos.',
  position: 1,
  course: { id: 1, slug: 'java-desde-cero', title: 'Java desde cero', languageSlug: 'java', languageName: 'Java' },
  lessons: [
    { id: 10, slug: 'que-es-java', title: '¿Qué es Java?', summary: '', estimatedMinutes: 8, position: 1 },
    { id: 11, slug: 'primer-programa', title: 'Tu primer programa', summary: '', estimatedMinutes: 10, position: 2 },
  ],
  exercises: [
    {
      id: 5,
      slug: 'hola-mundo',
      title: 'Hola, mundo',
      summary: '',
      difficulty: 'EASY',
      module: { id: 1, slug: 'fundamentos', title: 'Fundamentos', position: 1 },
    },
  ],
  previous: null,
  next: { id: 2, slug: 'variables', title: 'Variables', position: 2 },
};

describe('ModulePageComponent', () => {
  it('lists lessons and exercises and resumes at the first unread lesson', async () => {
    await TestBed.configureTestingModule({
      imports: [ModulePageComponent],
      providers: [
        provideRouter([]),
        {
          provide: CourseService,
          useValue: { getPrimaryCourse: () => of({ id: 1 }), getModule: () => of(MODULE) },
        },
        {
          provide: ProgressService,
          useValue: {
            getCourseProgress: () =>
              of({ completedLessonIds: [10], solvedExerciseSlugs: ['hola-mundo'], attemptedExerciseSlugs: [] }),
          },
        },
        { provide: AuthService, useValue: { isAuthenticated: () => true } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ModulePageComponent);
    fixture.componentRef.setInput('languageSlug', 'java');
    fixture.componentRef.setInput('moduleSlug', 'fundamentos');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    const resume = element.querySelector('.page__header .button--primary');
    expect(resume?.getAttribute('href')).toBe('/learn/java/fundamentos/primer-programa');
    expect(resume?.textContent).toContain('Continuar');
    expect(element.querySelectorAll('.check--done')).toHaveLength(2);
    expect(element.querySelector('a[href="/practice/hola-mundo"] .tag')?.textContent?.trim()).toBe('Fácil');
    expect(element.querySelector('.module__nav .button--secondary')?.getAttribute('href')).toBe(
      '/languages/java/modules/variables',
    );
  });
});
