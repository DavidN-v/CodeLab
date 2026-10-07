import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { ExerciseDetail, ExerciseProgress } from '../../../../core/models/exercise.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ExecutionService } from '../../../../core/services/execution.service';
import { ExerciseService } from '../../../../core/services/exercise.service';
import { ExercisePageComponent } from './exercise-page.component';

const EXERCISE: ExerciseDetail = {
  id: 1,
  slug: 'saludo',
  title: 'Saludo personalizado',
  summary: '',
  difficulty: 'EASY',
  statementMarkdown: 'Lee un nombre y salúdalo.',
  starterCode: 'public class Main {}',
  samples: [{ input: 'Ada\n', expectedOutput: 'Hola, Ada!\n' }],
  totalTests: 3,
  hintCount: 2,
  xp: 20,
  course: {
    id: 1,
    slug: 'java-desde-cero',
    title: 'Java desde cero',
    languageSlug: 'java',
    languageName: 'Java',
  },
  module: { id: 1, slug: 'fundamentos', title: 'Fundamentos', position: 1 },
  previous: null,
  next: null,
};

const PROGRESS: ExerciseProgress = {
  attempts: 0,
  solved: false,
  solvedAt: null,
  hints: [],
  hintCount: 2,
  solutionViewed: false,
  xp: 20,
  lastSubmittedCode: null,
  recentSubmissions: [],
};

describe('ExercisePageComponent', () => {
  let fixture: ComponentFixture<ExercisePageComponent>;
  let element: HTMLElement;
  let exerciseService: Record<string, ReturnType<typeof vi.fn>>;
  let run: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    localStorage.clear();
    exerciseService = {
      getExercise: vi.fn().mockReturnValue(of(EXERCISE)),
      getProgress: vi.fn().mockReturnValue(of(PROGRESS)),
      revealHint: vi.fn().mockReturnValue(of({ ...PROGRESS, hints: ['Usa nextLine().'], xp: 15 })),
      submit: vi
        .fn()
        .mockReturnValue(
          of({
            id: 9,
            status: 'ACCEPTED',
            passedTests: 3,
            totalTests: 3,
            executionTimeMs: 40,
            compileOutput: null,
            tests: [],
            firstSolve: true,
            xpAwarded: 20,
          }),
        ),
    };
    run = vi
      .fn()
      .mockReturnValue(
        of({
          status: 'SUCCESS',
          compileOutput: '',
          stdout: 'Hola, Ada!\n',
          stderr: '',
          exitCode: 0,
          durationMs: 30,
          outputTruncated: false,
        }),
      );
    await TestBed.configureTestingModule({
      imports: [ExercisePageComponent],
      providers: [
        provideRouter([]),
        { provide: ExerciseService, useValue: exerciseService },
        { provide: ExecutionService, useValue: { run } },
        { provide: AuthService, useValue: { isAuthenticated: () => true } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ExercisePageComponent);
    fixture.componentRef.setInput('exerciseSlug', 'saludo');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  });

  function button(text: string): HTMLButtonElement {
    return Array.from(element.querySelectorAll<HTMLButtonElement>('button')).find((b) =>
      b.textContent?.includes(text),
    )!;
  }

  it('shows the statement, the examples and the hidden test count', () => {
    expect(element.querySelector('h1')?.textContent).toBe('Saludo personalizado');
    expect(element.querySelector('.sample')?.textContent).toContain('Hola, Ada!');
    expect(element.textContent).toContain('2 pruebas ocultas');
  });

  it('runs the starter code with the first example as input', () => {
    button('Ejecutar').click();
    fixture.detectChanges();

    expect(run).toHaveBeenCalledWith('public class Main {}', 'Ada\n');
    expect(element.querySelector('.console__stream')?.textContent).toBe('Hola, Ada!\n');
  });

  it('submits and shows the verdict', () => {
    button('Enviar solución').click();
    fixture.detectChanges();

    expect(exerciseService['submit']).toHaveBeenCalledWith('saludo', 'public class Main {}');
    expect(element.querySelector('.results__status')?.textContent).toBe('Correcto');
  });

  it('reveals hints one at a time', () => {
    button('Ver pista 1 de 2').click();
    fixture.detectChanges();

    expect(element.querySelector('.hint')?.textContent).toContain('Usa nextLine().');
    expect(button('Ver pista 2 de 2')).toBeDefined();
  });
});
