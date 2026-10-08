import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';

import { withoutErrorNotification } from '../../../../core/interceptors/http-error.interceptor';
import { ModuleProgress } from '../../../../core/models/progress.model';
import { AuthService } from '../../../../core/services/auth.service';
import { CourseService } from '../../../../core/services/course.service';
import { ProgressService } from '../../../../core/services/progress.service';
import { ProgressBarComponent } from '../../../../shared/components/progress-bar/progress-bar.component';
import { readStorage, writeStorage } from '../../../../core/services/browser-storage';
import { ModulePathComponent } from '../../components/module-path/module-path.component';
import { ModuleRowComponent } from '../../components/module-row/module-row.component';

const VIEW_KEY = 'forja.courseView';

/** A language's course: what it covers, the learner's progress and the module outline. */
import { BreadcrumbsComponent } from '../../../../shared/components/breadcrumbs/breadcrumbs.component';
import { stepLabel, stepLink } from '../../../../shared/utils/next-step';
@Component({
  selector: 'app-course-page',
  imports: [
    BreadcrumbsComponent,
    RouterLink,
    ModuleRowComponent,
    ModulePathComponent,
    ProgressBarComponent,
  ],
  templateUrl: './course-page.component.html',
  styleUrl: './course-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoursePageComponent {
  protected readonly stepLink = stepLink;
  protected readonly stepLabel = stepLabel;

  private readonly courses = inject(CourseService);
  private readonly progressService = inject(ProgressService);
  protected readonly auth = inject(AuthService);

  /** Route parameter. */
  readonly languageSlug = input.required<string>();

  protected readonly course = rxResource({
    params: () => this.languageSlug(),
    stream: ({ params: slug }) =>
      this.courses
        .getPrimaryCourse(slug)
        .pipe(switchMap((course) => this.courses.getCourse(course.id))),
  });

  protected readonly progress = rxResource({
    params: () => (this.auth.isAuthenticated() ? this.course.value()?.id : undefined),
    stream: ({ params: courseId }) =>
      this.progressService.getCourseProgress(courseId, withoutErrorNotification()),
  });

  /** The outline as a path (default) or as a compact list. */
  protected readonly view = signal<'path' | 'list'>(
    readStorage(VIEW_KEY) === 'list' ? 'list' : 'path',
  );

  protected showAs(view: 'path' | 'list'): void {
    this.view.set(view);
    writeStorage(VIEW_KEY, view);
  }

  protected readonly totals = computed(() => {
    const modules = this.course.value()?.modules ?? [];
    const minutes = modules.reduce((sum, module) => sum + module.estimatedMinutes, 0);
    return {
      modules: modules.length,
      lessons: modules.reduce((sum, module) => sum + module.lessonCount, 0),
      exercises: modules.reduce((sum, module) => sum + module.exerciseCount, 0),
      hours: Math.max(1, Math.round(minutes / 60)),
    };
  });

  protected readonly firstModule = computed(
    () => this.course.value()?.modules.find((module) => module.published) ?? null,
  );

  private readonly progressByModule = computed(() => {
    const byModule = new Map<number, ModuleProgress>();
    for (const module of this.progress.value()?.modules ?? []) {
      byModule.set(module.moduleId, module);
    }
    return byModule;
  });

  protected moduleProgress(moduleId: number): ModuleProgress | null {
    return this.progressByModule().get(moduleId) ?? null;
  }
}
