import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';

import { withoutErrorNotification } from '../../../../core/interceptors/http-error.interceptor';
import { AuthService } from '../../../../core/services/auth.service';
import { CourseService } from '../../../../core/services/course.service';
import { ProgressService } from '../../../../core/services/progress.service';
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_TAGS,
  KIND_ICONS,
  KIND_LABELS,
} from '../../../../shared/utils/labels';

/** A module's lessons, in reading order, and its exercises. */
@Component({
  selector: 'app-module-page',
  imports: [RouterLink],
  templateUrl: './module-page.component.html',
  styleUrl: './module-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModulePageComponent {
  private readonly courses = inject(CourseService);
  private readonly progressService = inject(ProgressService);
  protected readonly auth = inject(AuthService);

  /** Route parameters. */
  readonly languageSlug = input.required<string>();
  readonly moduleSlug = input.required<string>();

  protected readonly difficultyLabels = DIFFICULTY_LABELS;
  protected readonly difficultyTags = DIFFICULTY_TAGS;
  protected readonly kindLabels = KIND_LABELS;
  protected readonly kindIcons = KIND_ICONS;

  protected readonly module = rxResource({
    params: () => ({ language: this.languageSlug(), module: this.moduleSlug() }),
    stream: ({ params }) =>
      this.courses
        .getPrimaryCourse(params.language)
        .pipe(switchMap((course) => this.courses.getModule(course.id, params.module))),
  });

  protected readonly progress = rxResource({
    params: () => (this.auth.isAuthenticated() ? this.module.value()?.course.id : undefined),
    stream: ({ params: courseId }) =>
      this.progressService.getCourseProgress(courseId, withoutErrorNotification()),
  });

  private readonly completedLessons = computed(
    () => new Set(this.progress.value()?.completedLessonIds ?? []),
  );
  private readonly solvedExercises = computed(
    () => new Set(this.progress.value()?.solvedExerciseSlugs ?? []),
  );
  private readonly attemptedExercises = computed(
    () => new Set(this.progress.value()?.attemptedExerciseSlugs ?? []),
  );

  /** First lesson not read yet, or the first one. */
  protected readonly nextLesson = computed(() => {
    const lessons = this.module.value()?.lessons ?? [];
    return lessons.find((lesson) => !this.completedLessons().has(lesson.id)) ?? lessons[0] ?? null;
  });

  protected readonly started = computed(() => this.completedLessons().size > 0);

  protected isCompleted(lessonId: number): boolean {
    return this.completedLessons().has(lessonId);
  }

  protected exerciseState(slug: string): 'solved' | 'attempted' | 'new' {
    if (this.solvedExercises().has(slug)) {
      return 'solved';
    }
    return this.attemptedExercises().has(slug) ? 'attempted' : 'new';
  }
}
