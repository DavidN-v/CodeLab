import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { LessonDetail, ModuleDetail } from '../../../../core/models/course.model';
import { AuthService } from '../../../../core/services/auth.service';
import { CodeHandoffService } from '../../../../core/services/code-handoff.service';
import { CourseService } from '../../../../core/services/course.service';
import { ProgressService } from '../../../../core/services/progress.service';
import { LessonPageComponent } from './lesson-page.component';

const COURSE_REF = {
  id: 1,
  slug: 'java-desde-cero',
  title: 'Java desde cero',
  languageSlug: 'java',
  languageName: 'Java',
};
const MODULE_REF = { id: 1, slug: 'fundamentos', title: 'Fundamentos', position: 1 };

const LESSON: LessonDetail = {
  id: 10,
  slug: 'primer-programa',
  title: 'Tu primer programa',
  summary: 'Hola, mundo.',
  estimatedMinutes: 10,
  position: 1,
  contentMarkdown:
    '## La clase\n\n```java\npublic class Main {\n    public static void main(String[] args) {}\n}\n```\n',
  course: COURSE_REF,
  module: MODULE_REF,
  previous: null,
  next: {
    id: 11,
    slug: 'salida',
    title: 'Escribir en la consola',
    moduleSlug: 'fundamentos',
    moduleTitle: 'Fundamentos',
  },
};

const MODULE: ModuleDetail = {
  ...MODULE_REF,
  summary: '',
  course: COURSE_REF,
  lessons: [
    {
      id: 10,
      slug: 'primer-programa',
      title: 'Tu primer programa',
      summary: '',
      estimatedMinutes: 10,
      position: 1,
    },
    {
      id: 11,
      slug: 'salida',
      title: 'Escribir en la consola',
      summary: '',
      estimatedMinutes: 10,
      position: 2,
    },
  ],
  exercises: [],
  previous: null,
  next: null,
};

describe('LessonPageComponent', () => {
  let fixture: ComponentFixture<LessonPageComponent>;
  let element: HTMLElement;
  let completeLesson: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    completeLesson = vi
      .fn()
      .mockReturnValue(
        of({
          lessonId: 10,
          completedAt: '2026-10-06T10:00:00Z',
          newlyCompleted: true,
          xpAwarded: 10,
        }),
      );
    await TestBed.configureTestingModule({
      imports: [LessonPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: CourseService,
          useValue: {
            getPrimaryCourse: () => of({ id: 1 }),
            getLesson: () => of(LESSON),
            getModule: () => of(MODULE),
          },
        },
        {
          provide: ProgressService,
          useValue: { getCourseProgress: () => of({ completedLessonIds: [] }), completeLesson },
        },
        { provide: AuthService, useValue: { isAuthenticated: () => true } },
      ],
    }).compileComponents();
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(LessonPageComponent);
    fixture.componentRef.setInput('languageSlug', 'java');
    fixture.componentRef.setInput('moduleSlug', 'fundamentos');
    fixture.componentRef.setInput('lessonSlug', 'primer-programa');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  });

  it('shows the lesson, the module index and the page index', () => {
    expect(element.querySelector('h1')?.textContent).toBe('Tu primer programa');
    expect(element.querySelectorAll('.index__link')).toHaveLength(2);
    expect(element.querySelector('.index__link--current')?.textContent).toContain(
      'Tu primer programa',
    );
    expect(element.querySelector('.toc__link')?.textContent).toBe('La clase');
  });

  it('completes the lesson and moves on to the next one', () => {
    element.querySelector<HTMLButtonElement>('.lesson__footer .button--primary')!.click();

    expect(completeLesson).toHaveBeenCalledWith(10);
    expect(navigate).toHaveBeenCalledWith(['/learn', 'java', 'fundamentos', 'salida']);
  });

  it('hands runnable examples to the playground', () => {
    element.querySelector<HTMLButtonElement>('.prose__run')!.click();

    expect(TestBed.inject(CodeHandoffService).take()).toContain('public class Main');
    expect(navigate).toHaveBeenCalledWith(['/practice/playground']);
  });
});
