import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { ExerciseSummary } from '../../../../core/models/course.model';
import { AuthService } from '../../../../core/services/auth.service';
import { CourseService } from '../../../../core/services/course.service';
import { ProgressService } from '../../../../core/services/progress.service';
import { PracticePageComponent } from './practice-page.component';

const FUNDAMENTOS = { id: 1, slug: 'fundamentos', title: 'Fundamentos', position: 1 };
const BUCLES = { id: 6, slug: 'bucles', title: 'Bucles', position: 6 };

const EXERCISES: ExerciseSummary[] = [
  {
    id: 1,
    slug: 'hola-mundo',
    title: 'Hola, mundo',
    summary: 'Tu primer programa.',
    difficulty: 'EASY',
    module: FUNDAMENTOS,
  },
  {
    id: 2,
    slug: 'tabla',
    title: 'Tabla de multiplicar',
    summary: 'Con un for.',
    difficulty: 'MEDIUM',
    module: BUCLES,
  },
];

describe('PracticePageComponent', () => {
  let fixture: ComponentFixture<PracticePageComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PracticePageComponent],
      providers: [
        provideRouter([]),
        {
          provide: CourseService,
          useValue: { getPrimaryCourse: () => of({ id: 1 }), getExercises: () => of(EXERCISES) },
        },
        {
          provide: ProgressService,
          useValue: {
            getCourseProgress: () =>
              of({ solvedExerciseSlugs: ['hola-mundo'], attemptedExerciseSlugs: [] }),
          },
        },
        { provide: AuthService, useValue: { isAuthenticated: () => true } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(PracticePageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  });

  it('groups exercises by module and marks the solved ones', () => {
    expect(element.querySelectorAll('.group')).toHaveLength(2);
    expect(element.querySelectorAll('.check--done')).toHaveLength(1);
    expect(element.textContent).toContain('1 de 2 resueltos');
  });

  it('filters by text ignoring accents and by status', () => {
    const search = element.querySelector<HTMLInputElement>('#practice-query')!;
    search.value = 'multiplicación';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(element.textContent).toContain('Ningún ejercicio');

    search.value = 'tabla';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(element.querySelectorAll('.row-link')).toHaveLength(1);

    search.value = '';
    search.dispatchEvent(new Event('input'));
    const status = element.querySelector<HTMLSelectElement>('#practice-status')!;
    status.value = 'pending';
    status.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(
      Array.from(element.querySelectorAll('.exercise__title')).map((t) => t.textContent),
    ).toEqual(['Tabla de multiplicar']);
  });
});
