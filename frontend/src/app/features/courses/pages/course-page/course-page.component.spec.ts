import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { CourseDetail } from '../../../../core/models/course.model';
import { CourseProgress } from '../../../../core/models/progress.model';
import { AuthService } from '../../../../core/services/auth.service';
import { CourseService } from '../../../../core/services/course.service';
import { ProgressService } from '../../../../core/services/progress.service';
import { CoursePageComponent } from './course-page.component';

const COURSE: CourseDetail = {
  id: 1,
  slug: 'java-desde-cero',
  title: 'Java desde cero',
  summary: 'De cero a aplicaciones.',
  description: null,
  language: {
    id: 1,
    slug: 'java',
    name: 'Java',
    version: '21',
    icon: null,
    tagline: '',
    description: null,
    active: true,
  },
  modules: [
    {
      id: 1,
      slug: 'fundamentos',
      title: 'Fundamentos',
      summary: '',
      position: 1,
      published: true,
      lessonCount: 5,
      exerciseCount: 4,
      estimatedMinutes: 50,
    },
    {
      id: 2,
      slug: 'variables',
      title: 'Variables',
      summary: '',
      position: 2,
      published: true,
      lessonCount: 3,
      exerciseCount: 3,
      estimatedMinutes: 40,
    },
  ],
};

const PROGRESS: CourseProgress = {
  courseId: 1,
  completedLessons: 2,
  totalLessons: 8,
  solvedExercises: 1,
  totalExercises: 7,
  percent: 20,
  completedLessonIds: [1, 2],
  solvedExerciseSlugs: ['hola-mundo'],
  attemptedExerciseSlugs: [],
  modules: [],
  nextLesson: {
    id: 3,
    slug: 'salida',
    title: 'Escribir en la consola',
    moduleSlug: 'fundamentos',
    moduleTitle: 'Fundamentos',
  },
};

describe('CoursePageComponent', () => {
  let fixture: ComponentFixture<CoursePageComponent>;
  let element: HTMLElement;

  async function render(authenticated: boolean): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [CoursePageComponent],
      providers: [
        provideRouter([]),
        {
          provide: CourseService,
          useValue: { getPrimaryCourse: () => of({ id: 1 }), getCourse: () => of(COURSE) },
        },
        { provide: ProgressService, useValue: { getCourseProgress: () => of(PROGRESS) } },
        { provide: AuthService, useValue: { isAuthenticated: () => authenticated } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CoursePageComponent);
    fixture.componentRef.setInput('languageSlug', 'java');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  }

  it('lists every module and totals the course', async () => {
    await render(false);

    expect(element.querySelector('h1')?.textContent).toBe('Java desde cero');
    expect(element.querySelectorAll('app-module-row')).toHaveLength(2);
    expect(element.querySelector('.course__stats')?.textContent).toContain('8 lecciones');
  });

  it('invites a visitor to start and to create an account', async () => {
    await render(false);

    expect(element.querySelector('.course__resume .button--primary')?.getAttribute('href')).toBe(
      '/languages/java/modules/fundamentos',
    );
    expect(element.querySelector('.course__hint a')?.getAttribute('href')).toBe('/register');
  });

  it('resumes a learner at their next lesson', async () => {
    await render(true);

    const resume = element.querySelector('.course__resume .button--primary');
    expect(resume?.getAttribute('href')).toBe('/learn/java/fundamentos/salida');
    expect(resume?.textContent).toContain('Continuar');
    expect(element.textContent).toContain('20 %');
  });
});
