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
import { BreadcrumbsComponent } from '../../../../shared/components/breadcrumbs/breadcrumbs.component';
@Component({
  selector: 'app-module-page',
  imports: [BreadcrumbsComponent, RouterLink],
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

  protected readonly lessonsRead = computed(
    () =>
      (this.module.value()?.lessons ?? []).filter((l) => this.completedLessons().has(l.id)).length,
  );
  protected readonly exercisesSolved = computed(
    () =>
      (this.module.value()?.exercises ?? []).filter((e) => this.solvedExercises().has(e.slug))
        .length,
  );

  /** The first unread lesson, then the first unsolved exercise, then the next module. */
  protected readonly nextStep = computed<{ label: string; link: string[] } | null>(() => {
    const detail = this.module.value();
    if (!detail) {
      return null;
    }
    const lesson = detail.lessons.find((l) => !this.completedLessons().has(l.id));
    if (lesson) {
      return {
        label: 'Lección: ' + lesson.title,
        link: ['/learn', this.languageSlug(), detail.slug, lesson.slug],
      };
    }
    const exercise = detail.exercises.find((e) => !this.solvedExercises().has(e.slug));
    if (exercise) {
      return { label: 'Ejercicio: ' + exercise.title, link: ['/practice', exercise.slug] };
    }
    if (detail.next) {
      return {
        label: 'Módulo ' + detail.next.position + ': ' + detail.next.title,
        link: ['/languages', this.languageSlug(), 'modules', detail.next.slug],
      };
    }
    return null;
  });

  protected readonly started = computed(() => this.lessonsRead() > 0 || this.exercisesSolved() > 0);

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
