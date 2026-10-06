import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ModuleSummary } from '../../../../core/models/course.model';
import { ModuleProgress } from '../../../../core/models/progress.model';
import { plural } from '../../../../shared/utils/labels';

/** One module in a course outline, with the learner's progress when known. */
@Component({
  selector: 'app-module-row',
  imports: [RouterLink],
  templateUrl: './module-row.component.html',
  styleUrl: './module-row.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModuleRowComponent {
  readonly module = input.required<ModuleSummary>();
  readonly languageSlug = input.required<string>();
  readonly progress = input<ModuleProgress | null>(null);

  protected readonly state = computed(() => {
    const progress = this.progress();
    if (!progress) {
      return 'none';
    }
    if (progress.completed) {
      return 'done';
    }
    return progress.completedLessons + progress.solvedExercises > 0 ? 'partial' : 'none';
  });

  protected readonly meta = computed(() => {
    const module = this.module();
    return [
      plural(module.lessonCount, 'lección', 'lecciones'),
      plural(module.exerciseCount, 'ejercicio', 'ejercicios'),
      `${module.estimatedMinutes} min`,
    ].join(' · ');
  });
}
