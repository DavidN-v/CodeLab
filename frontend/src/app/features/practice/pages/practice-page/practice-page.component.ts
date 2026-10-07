import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';

import { withoutErrorNotification } from '../../../../core/interceptors/http-error.interceptor';
import {
  Difficulty,
  ExerciseKind,
  ExerciseSummary,
  ModuleRef,
} from '../../../../core/models/course.model';
import { AuthService } from '../../../../core/services/auth.service';
import { CourseService } from '../../../../core/services/course.service';
import { ProgressService } from '../../../../core/services/progress.service';
import { ProgressBarComponent } from '../../../../shared/components/progress-bar/progress-bar.component';
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_TAGS,
  KIND_ICONS,
  KIND_LABELS,
} from '../../../../shared/utils/labels';

/** The only active course for now; the page is built per language for when there are more. */
const LANGUAGE = 'java';

type StatusFilter = 'all' | 'pending' | 'solved';

interface ModuleGroup {
  module: ModuleRef;
  exercises: ExerciseSummary[];
}

/** Every exercise of the course, grouped by module, with filters and the playground. */
@Component({
  selector: 'app-practice-page',
  imports: [RouterLink, ProgressBarComponent],
  templateUrl: './practice-page.component.html',
  styleUrl: './practice-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PracticePageComponent {
  private readonly courses = inject(CourseService);
  private readonly progressService = inject(ProgressService);
  protected readonly auth = inject(AuthService);

  protected readonly difficultyLabels = DIFFICULTY_LABELS;
  protected readonly difficultyTags = DIFFICULTY_TAGS;
  protected readonly difficulties: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];
  protected readonly kindLabels = KIND_LABELS;
  protected readonly kindIcons = KIND_ICONS;
  protected readonly kinds: ExerciseKind[] = [
    'PREDICT',
    'FILL',
    'PARSONS',
    'CODE',
    'FIX',
    'PROJECT',
  ];

  protected readonly catalog = rxResource({
    stream: () =>
      this.courses
        .getPrimaryCourse(LANGUAGE)
        .pipe(switchMap((course) => this.courses.getExercises(course.id))),
  });

  private readonly courseId = rxResource({
    stream: () => this.courses.getPrimaryCourse(LANGUAGE),
  });

  protected readonly progress = rxResource({
    params: () => (this.auth.isAuthenticated() ? this.courseId.value()?.id : undefined),
    stream: ({ params: courseId }) =>
      this.progressService.getCourseProgress(courseId, withoutErrorNotification()),
  });

  protected readonly query = signal('');
  protected readonly difficulty = signal<Difficulty | 'ALL'>('ALL');
  protected readonly status = signal<StatusFilter>('all');
  protected readonly kind = signal<ExerciseKind | 'ALL'>('ALL');

  private readonly solved = computed(
    () => new Set(this.progress.value()?.solvedExerciseSlugs ?? []),
  );
  private readonly attempted = computed(
    () => new Set(this.progress.value()?.attemptedExerciseSlugs ?? []),
  );

  protected readonly groups = computed<ModuleGroup[]>(() => {
    const query = normalize(this.query());
    const difficulty = this.difficulty();
    const status = this.status();
    const groups = new Map<number, ModuleGroup>();
    for (const exercise of this.catalog.value() ?? []) {
      const matchesQuery =
        !query ||
        normalize(exercise.title).includes(query) ||
        normalize(exercise.summary).includes(query) ||
        normalize(exercise.module.title).includes(query);
      const matchesDifficulty =
        (difficulty === 'ALL' || exercise.difficulty === difficulty) &&
        (this.kind() === 'ALL' || exercise.kind === this.kind());
      const isSolved = this.solved().has(exercise.slug);
      const matchesStatus = status === 'all' || (status === 'solved' ? isSolved : !isSolved);
      if (matchesQuery && matchesDifficulty && matchesStatus) {
        const group = groups.get(exercise.module.id) ?? { module: exercise.module, exercises: [] };
        group.exercises.push(exercise);
        groups.set(exercise.module.id, group);
      }
    }
    return [...groups.values()];
  });

  protected readonly totals = computed(() => {
    const total = this.catalog.value()?.length ?? 0;
    const solved = this.solved().size;
    return { total, solved, percent: total === 0 ? 0 : (solved / total) * 100 };
  });

  protected exerciseState(slug: string): 'solved' | 'attempted' | 'new' {
    if (this.solved().has(slug)) {
      return 'solved';
    }
    return this.attempted().has(slug) ? 'attempted' : 'new';
  }

  protected onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected onDifficulty(event: Event): void {
    this.difficulty.set((event.target as HTMLSelectElement).value as Difficulty | 'ALL');
  }

  protected onKind(event: Event): void {
    this.kind.set((event.target as HTMLSelectElement).value as ExerciseKind | 'ALL');
  }

  protected onStatus(event: Event): void {
    this.status.set((event.target as HTMLSelectElement).value as StatusFilter);
  }
}

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
