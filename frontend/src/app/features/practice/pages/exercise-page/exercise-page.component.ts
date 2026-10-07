import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { BRAND } from '../../../../core/config/brand.config';
import { ExecutionResult } from '../../../../core/models/execution.model';
import {
  ExerciseDetail,
  SubmissionRequest,
  SubmissionResult,
} from '../../../../core/models/exercise.model';
import { AuthService } from '../../../../core/services/auth.service';
import {
  readStorage,
  removeStorage,
  writeStorage,
} from '../../../../core/services/browser-storage';
import { CelebrationService } from '../../../../core/services/celebration.service';
import { CodeHandoffService } from '../../../../core/services/code-handoff.service';
import { ExecutionService } from '../../../../core/services/execution.service';
import { ExerciseService } from '../../../../core/services/exercise.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { TutorService } from '../../../../core/services/tutor.service';
import { MarkdownComponent } from '../../../../shared/components/markdown/markdown.component';
import { TutorPanelComponent } from '../../../../shared/components/tutor-panel/tutor-panel.component';
import { explainCompileErrors, explainRuntimeError } from '../../../../shared/utils/java-errors';
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_TAGS,
  KIND_ICONS,
  KIND_INSTRUCTIONS,
  KIND_LABELS,
  SUBMISSION_LABELS,
} from '../../../../shared/utils/labels';
import { CodeEditorComponent } from '../../../../shared/components/code-editor/code-editor.component';
import type { LineMark } from '../../../../shared/components/code-editor/codemirror-setup';
import { ConsoleOutputComponent } from '../../../../shared/components/console-output/console-output.component';
import { FillEditorComponent } from '../../components/fill-editor/fill-editor.component';
import { ParsonsBoardComponent } from '../../components/parsons-board/parsons-board.component';
import { PredictPanelComponent } from '../../components/predict-panel/predict-panel.component';
import { TestResultsComponent } from '../../components/test-results/test-results.component';
import { blankCount, fillProgram, parsonsProgram } from '../../exercise-program';

function draftKey(slug: string): string {
  return `forja.exercise.${slug}`;
}

/** A stored draft that is JSON (answers, chosen lines), or the fallback. */
function readJson<T>(key: string, fallback: T): T {
  try {
    const stored = readStorage(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Statement, work area and grading for one exercise, whatever its kind. */
@Component({
  selector: 'app-exercise-page',
  imports: [
    RouterLink,
    MarkdownComponent,
    CodeEditorComponent,
    ConsoleOutputComponent,
    TestResultsComponent,
    FillEditorComponent,
    ParsonsBoardComponent,
    PredictPanelComponent,
    TutorPanelComponent,
  ],
  templateUrl: './exercise-page.component.html',
  styleUrl: './exercise-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExercisePageComponent {
  private readonly exercises = inject(ExerciseService);
  private readonly executions = inject(ExecutionService);
  private readonly notifications = inject(NotificationService);
  private readonly celebrations = inject(CelebrationService);
  private readonly handoff = inject(CodeHandoffService);
  private readonly tutor = inject(TutorService);
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  protected readonly auth = inject(AuthService);

  /** Route parameter. */
  readonly exerciseSlug = input.required<string>();

  protected readonly difficultyLabels = DIFFICULTY_LABELS;
  protected readonly difficultyTags = DIFFICULTY_TAGS;
  protected readonly submissionLabels = SUBMISSION_LABELS;
  protected readonly kindLabels = KIND_LABELS;
  protected readonly kindIcons = KIND_ICONS;
  protected readonly kindInstructions = KIND_INSTRUCTIONS;

  protected readonly exercise = rxResource({
    params: () => this.exerciseSlug(),
    stream: ({ params: slug }) =>
      this.exercises
        .getExercise(slug)
        .pipe(tap((exercise) => this.title.setTitle(`${exercise.title} · ${BRAND.name}`))),
  });

  protected readonly progress = rxResource({
    params: () =>
      this.auth.isAuthenticated() && this.exercise.hasValue() ? this.exerciseSlug() : undefined,
    stream: ({ params: slug }) => this.exercises.getProgress(slug),
  });

  protected readonly kind = computed(() => this.exercise.value()?.kind ?? 'CODE');
  /** Kinds worked in the code editor. */
  protected readonly writesCode = computed(() => ['CODE', 'FIX', 'PROJECT'].includes(this.kind()));

  /** CODE, FIX, PROJECT: their draft, else their last submission, else the starter. */
  protected readonly code = linkedSignal(() => {
    const exercise = this.exercise.value();
    if (!exercise) {
      return '';
    }
    return (
      readStorage(draftKey(exercise.slug)) ??
      this.progress.value()?.lastSubmittedCode ??
      exercise.starterCode
    );
  });

  /** FILL: one answer per blank. */
  protected readonly answers = linkedSignal<string[]>(() => {
    const exercise = this.exercise.value();
    return exercise?.kind === 'FILL'
      ? readJson(draftKey(exercise.slug), Array<string>(blankCount(exercise)).fill(''))
      : [];
  });

  /** PARSONS: indexes into the shuffled lines, in program order. */
  protected readonly chosen = linkedSignal<number[]>(() => {
    const exercise = this.exercise.value();
    return exercise?.kind === 'PARSONS' ? readJson(draftKey(exercise.slug), []) : [];
  });

  /** PREDICT: the output the learner expects. */
  protected readonly prediction = linkedSignal(() => {
    const exercise = this.exercise.value();
    return exercise?.kind === 'PREDICT' ? (readStorage(draftKey(exercise.slug)) ?? '') : '';
  });

  /** The program as it would run now, whatever the kind. */
  protected readonly program = computed(() => {
    const exercise = this.exercise.value();
    if (!exercise) {
      return '';
    }
    switch (exercise.kind) {
      case 'FILL':
        return fillProgram(exercise.starterCode, this.answers());
      case 'PARSONS':
        return parsonsProgram(
          exercise.starterCode,
          this.chosen().map((index) => exercise.parsonsLines?.[index] ?? ''),
        );
      case 'PREDICT':
        return exercise.starterCode;
      default:
        return this.code();
    }
  });

  /** Input for "Ejecutar"; starts as the first example's. */
  protected readonly customInput = linkedSignal(
    () => this.exercise.value()?.samples[0]?.input ?? '',
  );

  protected readonly busy = signal<'run' | 'submit' | null>(null);
  protected readonly runResult = signal<ExecutionResult | null>(null);
  protected readonly submission = signal<SubmissionResult | null>(null);
  protected readonly revealing = signal(false);
  protected readonly solution = signal<string | null>(null);

  protected readonly solved = computed(
    () => this.progress.value()?.solved === true || this.submission()?.status === 'ACCEPTED',
  );

  /** Predictions are only run once answered: running would give the answer away. */
  protected readonly canRun = computed(() => this.kind() !== 'PREDICT' || this.solved());

  /** Compiler and runtime errors to underline in the editor. */
  protected readonly marks = computed<LineMark[]>(() => {
    const compile = this.runResult()?.compileOutput || this.submission()?.compileOutput;
    if (compile) {
      return explainCompileErrors(compile)
        .filter((error) => error.line !== null)
        .map((error) => ({ line: error.line!, message: `${error.title}. ${error.explanation}` }));
    }
    const stderr =
      this.runResult()?.stderr ||
      this.submission()?.tests.find((test) => test.stderr)?.stderr ||
      '';
    const runtime = stderr ? explainRuntimeError(stderr) : null;
    return runtime?.line
      ? [{ line: runtime.line, message: `${runtime.title}. ${runtime.explanation}` }]
      : [];
  });

  /** The latest outcome failed: offer the tutor's debugging help. */
  protected readonly failing = computed(() => {
    const submission = this.submission();
    const run = this.runResult();
    return (
      (submission !== null && submission.status !== 'ACCEPTED') ||
      (run !== null && run.status !== 'SUCCESS')
    );
  });

  protected readonly askDebug = (): Observable<string> =>
    this.tutor.debug(this.exerciseSlug(), this.program(), this.outcomeSummary());
  protected readonly askReview = (): Observable<string> =>
    this.tutor.review(this.exerciseSlug(), this.program());

  constructor() {
    effect(() => {
      const exercise = this.exercise.value();
      if (!exercise) {
        return;
      }
      const key = draftKey(exercise.slug);
      switch (exercise.kind) {
        case 'FILL':
          writeStorage(key, JSON.stringify(this.answers()));
          break;
        case 'PARSONS':
          writeStorage(key, JSON.stringify(this.chosen()));
          break;
        case 'PREDICT':
          writeStorage(key, this.prediction());
          break;
        default:
          if (this.code() !== exercise.starterCode) {
            writeStorage(key, this.code());
          }
      }
    });
    // A new exercise starts with a clean output panel.
    effect(() => {
      this.exerciseSlug();
      this.runResult.set(null);
      this.submission.set(null);
      this.solution.set(null);
    });
  }

  protected run(): void {
    if (this.busy() || !this.canRun() || !this.requireLogin()) {
      return;
    }
    this.busy.set('run');
    this.submission.set(null);
    this.executions.run(this.program(), this.customInput()).subscribe({
      next: (result) => {
        this.runResult.set(result);
        this.busy.set(null);
      },
      error: () => this.busy.set(null),
    });
  }

  protected visualize(): void {
    if (!this.canRun()) {
      return;
    }
    this.handoff.send(this.program(), this.customInput());
    void this.router.navigate(['/practice/visualizer']);
  }

  protected submit(): void {
    const exercise = this.exercise.value();
    if (!exercise || this.busy() || !this.requireLogin()) {
      return;
    }
    this.busy.set('submit');
    this.runResult.set(null);
    this.exercises.submit(this.exerciseSlug(), this.request(exercise)).subscribe({
      next: (result) => {
        this.submission.set(result);
        this.busy.set(null);
        if (result.firstSolve) {
          this.notifications.showInfo(`¡Ejercicio resuelto! +${result.xpAwarded} XP`);
          this.celebrations.celebrate(result.celebration);
        } else if (result.reviewPassed) {
          this.notifications.showInfo('¡Repaso superado! Lo verás de nuevo más adelante.');
          this.celebrations.confetti();
        }
        this.progress.reload();
      },
      error: () => this.busy.set(null),
    });
  }

  protected revealHint(): void {
    if (this.revealing() || !this.requireLogin()) {
      return;
    }
    this.revealing.set(true);
    this.exercises.revealHint(this.exerciseSlug()).subscribe({
      next: (progress) => {
        this.progress.set(progress);
        this.revealing.set(false);
      },
      error: () => this.revealing.set(false),
    });
  }

  protected revealSolution(): void {
    if (!this.requireLogin()) {
      return;
    }
    if (
      !this.solved() &&
      !confirm('Si ves la solución antes de resolverlo, este ejercicio ya no dará XP. ¿Continuar?')
    ) {
      return;
    }
    this.exercises.revealSolution(this.exerciseSlug()).subscribe((solution) => {
      this.solution.set(solution.solutionCode);
      this.progress.reload();
    });
  }

  protected reset(): void {
    if (confirm('¿Volver al principio? Perderás lo que has hecho en este ejercicio.')) {
      this.startOver();
    }
  }

  /** A spaced review is done from scratch. */
  protected startOver(): void {
    const exercise = this.exercise.value();
    if (!exercise) {
      return;
    }
    removeStorage(draftKey(exercise.slug));
    this.code.set(exercise.starterCode);
    this.answers.set(Array<string>(blankCount(exercise)).fill(''));
    this.chosen.set([]);
    this.prediction.set('');
    this.runResult.set(null);
    this.submission.set(null);
  }

  /** Watch the reference solution run, once it has been revealed. */
  protected handoffSolution(solution: string): void {
    this.handoff.send(this.kind() === 'PREDICT' ? this.program() : solution, this.customInput());
    void this.router.navigate(['/practice/visualizer']);
  }

  /** On narrow screens the work area is below a long statement. */
  protected scrollToWork(): void {
    document.getElementById('work')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected onCustomInput(event: Event): void {
    this.customInput.set((event.target as HTMLTextAreaElement).value);
  }

  private request(exercise: ExerciseDetail): SubmissionRequest {
    switch (exercise.kind) {
      case 'FILL':
        return { parts: this.answers() };
      case 'PARSONS':
        return { parts: this.chosen().map((index) => exercise.parsonsLines?.[index] ?? '') };
      case 'PREDICT':
        return { sourceCode: this.prediction() };
      default:
        return { sourceCode: this.code() };
    }
  }

  /** What went wrong last time, as text for the tutor. */
  private outcomeSummary(): string {
    const submission = this.submission();
    if (submission) {
      const failing = submission.tests.find((test) => test.sample && test.outcome !== 'PASSED');
      return [
        `Veredicto: ${SUBMISSION_LABELS[submission.status]} (${submission.passedTests}/${submission.totalTests} pruebas)`,
        submission.compileOutput ? `Compilador:\n${submission.compileOutput}` : '',
        submission.feedback ?? '',
        failing
          ? `Prueba ${failing.position}. Entrada:\n${failing.input ?? ''}\nEsperado:\n${failing.expectedOutput ?? ''}\nObtenido:\n${failing.actualOutput ?? ''}\n${failing.stderr ?? ''}`
          : '',
      ]
        .filter(Boolean)
        .join('\n\n');
    }
    const run = this.runResult();
    if (run) {
      return [
        `Ejecución: ${run.status}`,
        run.compileOutput ? `Compilador:\n${run.compileOutput}` : '',
        `Entrada:\n${this.customInput()}`,
        `Salida:\n${run.stdout}`,
        run.stderr ? `Errores:\n${run.stderr}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');
    }
    return '';
  }

  private requireLogin(): boolean {
    if (this.auth.isAuthenticated()) {
      return true;
    }
    void this.router.navigate(['/login'], {
      queryParams: { returnUrl: `/practice/${this.exerciseSlug()}` },
    });
    return false;
  }
}
