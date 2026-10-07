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
import { tap } from 'rxjs';

import { BRAND } from '../../../../core/config/brand.config';
import { ExecutionResult } from '../../../../core/models/execution.model';
import { SubmissionResult } from '../../../../core/models/exercise.model';
import { AuthService } from '../../../../core/services/auth.service';
import {
  readStorage,
  removeStorage,
  writeStorage,
} from '../../../../core/services/browser-storage';
import { ExecutionService } from '../../../../core/services/execution.service';
import { ExerciseService } from '../../../../core/services/exercise.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { MarkdownComponent } from '../../../../shared/components/markdown/markdown.component';
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_TAGS,
  SUBMISSION_LABELS,
} from '../../../../shared/utils/labels';
import { CodeEditorComponent } from '../../components/code-editor/code-editor.component';
import { ConsoleOutputComponent } from '../../components/console-output/console-output.component';
import { TestResultsComponent } from '../../components/test-results/test-results.component';

function draftKey(slug: string): string {
  return `forja.exercise.${slug}`;
}

/** Statement, editor and grading for one exercise. */
@Component({
  selector: 'app-exercise-page',
  imports: [
    RouterLink,
    MarkdownComponent,
    CodeEditorComponent,
    ConsoleOutputComponent,
    TestResultsComponent,
  ],
  templateUrl: './exercise-page.component.html',
  styleUrl: './exercise-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExercisePageComponent {
  private readonly exercises = inject(ExerciseService);
  private readonly executions = inject(ExecutionService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  protected readonly auth = inject(AuthService);

  /** Route parameter. */
  readonly exerciseSlug = input.required<string>();

  protected readonly difficultyLabels = DIFFICULTY_LABELS;
  protected readonly difficultyTags = DIFFICULTY_TAGS;
  protected readonly submissionLabels = SUBMISSION_LABELS;

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

  /** The learner's code: their draft, else their last submission, else the starter. */
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

  constructor() {
    effect(() => {
      const exercise = this.exercise.value();
      const code = this.code();
      if (exercise && code !== exercise.starterCode) {
        writeStorage(draftKey(exercise.slug), code);
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
    if (this.busy() || !this.requireLogin()) {
      return;
    }
    this.busy.set('run');
    this.submission.set(null);
    this.executions.run(this.code(), this.customInput()).subscribe({
      next: (result) => {
        this.runResult.set(result);
        this.busy.set(null);
      },
      error: () => this.busy.set(null),
    });
  }

  protected submit(): void {
    if (this.busy() || !this.requireLogin()) {
      return;
    }
    this.busy.set('submit');
    this.runResult.set(null);
    this.exercises.submit(this.exerciseSlug(), this.code()).subscribe({
      next: (result) => {
        this.submission.set(result);
        this.busy.set(null);
        if (result.firstSolve) {
          this.notifications.showInfo(`¡Ejercicio resuelto! +${result.xpAwarded} XP`);
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
    const alreadySolved = this.solved();
    if (
      !alreadySolved &&
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
    const exercise = this.exercise.value();
    if (exercise && confirm('¿Volver al código inicial? Perderás lo que has escrito.')) {
      removeStorage(draftKey(exercise.slug));
      this.code.set(exercise.starterCode);
    }
  }

  protected onCustomInput(event: Event): void {
    this.customInput.set((event.target as HTMLTextAreaElement).value);
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
