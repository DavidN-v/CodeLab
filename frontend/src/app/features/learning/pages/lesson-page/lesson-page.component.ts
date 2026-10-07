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
import { Observable, catchError, forkJoin, of, switchMap, tap } from 'rxjs';

import { BRAND } from '../../../../core/config/brand.config';
import { withoutErrorNotification } from '../../../../core/interceptors/http-error.interceptor';
import { AuthService } from '../../../../core/services/auth.service';
import { CelebrationService } from '../../../../core/services/celebration.service';
import { CourseService } from '../../../../core/services/course.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ProgressService } from '../../../../core/services/progress.service';
import { TutorService } from '../../../../core/services/tutor.service';
import { MarkdownComponent } from '../../../../shared/components/markdown/markdown.component';
import { ProgressBarComponent } from '../../../../shared/components/progress-bar/progress-bar.component';
import { TutorPanelComponent } from '../../../../shared/components/tutor-panel/tutor-panel.component';
import { DIFFICULTY_LABELS, KIND_ICONS } from '../../../../shared/utils/labels';
import { LessonQuizComponent } from '../../components/lesson-quiz/lesson-quiz.component';

/** The study view: module index, lesson content, and what is on this page. */
@Component({
  selector: 'app-lesson-page',
  imports: [
    RouterLink,
    MarkdownComponent,
    ProgressBarComponent,
    LessonQuizComponent,
    TutorPanelComponent,
  ],
  templateUrl: './lesson-page.component.html',
  styleUrl: './lesson-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LessonPageComponent {
  private readonly courses = inject(CourseService);
  private readonly progressService = inject(ProgressService);
  private readonly notifications = inject(NotificationService);
  private readonly celebrations = inject(CelebrationService);
  private readonly tutor = inject(TutorService);
  protected readonly router = inject(Router);
  private readonly title = inject(Title);
  protected readonly auth = inject(AuthService);

  /** Route parameters. */
  readonly languageSlug = input.required<string>();
  readonly moduleSlug = input.required<string>();
  readonly lessonSlug = input.required<string>();

  protected readonly difficultyLabels = DIFFICULTY_LABELS;
  protected readonly kindIcons = KIND_ICONS;

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

  /** Terms explained on hover; the lesson reads fine without them. */
  protected readonly glossary = rxResource({
    params: () => this.page.value()?.lesson.course.id,
    stream: ({ params: courseId }) =>
      this.courses.getGlossary(courseId).pipe(catchError(() => of([]))),
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

  protected readonly askTutor = (question: string): Observable<string> =>
    this.tutor.explain(this.page.value()!.lesson.id, question);

  /** A perfect quiz deserves a little confetti. */
  protected onQuizFinished(correct: number): void {
    if (correct === this.page.value()?.lesson.quiz.length) {
      this.celebrations.confetti();
    }
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
          if (completion.celebration) {
            this.celebrations.celebrate(completion.celebration);
          }
        }
        goNext();
      },
      error: () => this.completing.set(false),
    });
  }
}
