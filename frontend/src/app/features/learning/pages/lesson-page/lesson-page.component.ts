import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, switchMap, tap } from 'rxjs';

import { BRAND } from '../../../../core/config/brand.config';
import { withoutErrorNotification } from '../../../../core/interceptors/http-error.interceptor';
import { AuthService } from '../../../../core/services/auth.service';
import { CodeHandoffService } from '../../../../core/services/code-handoff.service';
import { CourseService } from '../../../../core/services/course.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ProgressService } from '../../../../core/services/progress.service';
import { MarkdownComponent } from '../../../../shared/components/markdown/markdown.component';
import { ProgressBarComponent } from '../../../../shared/components/progress-bar/progress-bar.component';
import { DIFFICULTY_LABELS } from '../../../../shared/utils/labels';

/** The study view: module index, lesson content, and what is on this page. */
@Component({
  selector: 'app-lesson-page',
  imports: [RouterLink, MarkdownComponent, ProgressBarComponent],
  templateUrl: './lesson-page.component.html',
  styleUrl: './lesson-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LessonPageComponent {
  private readonly courses = inject(CourseService);
  private readonly progressService = inject(ProgressService);
  private readonly notifications = inject(NotificationService);
  private readonly handoff = inject(CodeHandoffService);
  protected readonly router = inject(Router);
  private readonly title = inject(Title);
  protected readonly auth = inject(AuthService);

  /** Route parameters. */
  readonly languageSlug = input.required<string>();
  readonly moduleSlug = input.required<string>();
  readonly lessonSlug = input.required<string>();

  protected readonly difficultyLabels = DIFFICULTY_LABELS;

  protected readonly page = rxResource({
    params: () => ({
      language: this.languageSlug(),
      module: this.moduleSlug(),
      lesson: this.lessonSlug(),
    }),
    stream: ({ params }) =>
      this.courses.getPrimaryCourse(params.language).pipe(
        switchMap((course) =>
          forkJoin({
            lesson: this.courses.getLesson(course.id, params.module, params.lesson),
            module: this.courses.getModule(course.id, params.module),
          }),
        ),
        tap(({ lesson }) => this.title.setTitle(`${lesson.title} · ${BRAND.name}`)),
      ),
  });

  private readonly progress = rxResource({
    params: () => (this.auth.isAuthenticated() ? this.page.value()?.lesson.course.id : undefined),
    stream: ({ params: courseId }) =>
      this.progressService.getCourseProgress(courseId, withoutErrorNotification()),
  });

  /** Lessons completed in this visit, before the progress reloads. */
  private readonly justCompleted = signal<ReadonlySet<number>>(new Set());
  protected readonly completing = signal(false);

  private readonly markdown = viewChild(MarkdownComponent);
  protected readonly headings = computed(() => this.markdown()?.headings() ?? []);

  private readonly completedIds = computed(
    () => new Set([...(this.progress.value()?.completedLessonIds ?? []), ...this.justCompleted()]),
  );

  protected readonly isCompleted = computed(() => {
    const lesson = this.page.value()?.lesson;
    return lesson ? this.completedIds().has(lesson.id) : false;
  });

  /** Share of this module's lessons completed. */
  protected readonly modulePercent = computed(() => {
    const lessons = this.page.value()?.module.lessons ?? [];
    if (lessons.length === 0) {
      return 0;
    }
    const done = lessons.filter((lesson) => this.completedIds().has(lesson.id)).length;
    return (done / lessons.length) * 100;
  });

  protected lessonDone(lessonId: number): boolean {
    return this.completedIds().has(lessonId);
  }

  protected openInPlayground(code: string): void {
    this.handoff.send(code);
    void this.router.navigate(['/practice/playground']);
  }

  /** Marks the lesson as read and moves on to the next one, if any. */
  protected completeAndContinue(): void {
    const value = this.page.value();
    if (!value || this.completing()) {
      return;
    }
    const { lesson } = value;
    const goNext = () => {
      if (lesson.next) {
        void this.router.navigate([
          '/learn',
          this.languageSlug(),
          lesson.next.moduleSlug,
          lesson.next.slug,
        ]);
      } else {
        void this.router.navigate(['/languages', this.languageSlug()]);
      }
    };
    if (this.isCompleted()) {
      goNext();
      return;
    }
    this.completing.set(true);
    this.progressService.completeLesson(lesson.id).subscribe({
      next: (completion) => {
        this.completing.set(false);
        this.justCompleted.update((ids) => new Set([...ids, lesson.id]));
        if (completion.newlyCompleted) {
          this.notifications.showInfo(`Lección completada · +${completion.xpAwarded} XP`);
        }
        goNext();
      },
      error: () => this.completing.set(false),
    });
  }
}
