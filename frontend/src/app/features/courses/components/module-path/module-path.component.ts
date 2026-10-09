import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ModuleSummary } from '../../../../core/models/course.model';
import { ModuleProgress } from '../../../../core/models/progress.model';

type NodeState = 'done' | 'current' | 'started' | 'upcoming';

interface PathNode {
  module: ModuleSummary;
  state: NodeState;
  /** Lessons and exercises done, out of all of them. */
  percent: number;
  progress: ModuleProgress | null;
}

/**
 * The course as a path: one stop per module, finished ones ticked, the next
 * one highlighted. Every module stays open; the path only suggests an order.
 */
@Component({
  selector: 'app-module-path',
  imports: [RouterLink],
  templateUrl: './module-path.component.html',
  styleUrl: './module-path.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModulePathComponent {
  readonly modules = input.required<ModuleSummary[]>();
  readonly languageSlug = input.required<string>();
  /** Null when signed out: then the first module is the suggested one. */
  readonly progress = input<ModuleProgress[] | null>(null);

  protected readonly nodes = computed<PathNode[]>(() => {
    const byModule = new Map((this.progress() ?? []).map((item) => [item.moduleId, item]));
    let currentFound = false;
    return this.modules()
      .filter((module) => module.published)
      .map((module) => {
        const progress = byModule.get(module.id) ?? null;
        const total = (progress?.totalLessons ?? 0) + (progress?.totalExercises ?? 0);
        const done = (progress?.completedLessons ?? 0) + (progress?.solvedExercises ?? 0);
        const percent = total === 0 ? 0 : Math.round((done / total) * 100);
        let state: NodeState;
        if (progress?.completed) {
          state = 'done';
        } else if (!currentFound) {
          state = 'current';
          currentFound = true;
        } else {
          state = done > 0 ? 'started' : 'upcoming';
        }
        return { module, state, percent, progress };
      });
  });

  protected readonly doneCount = computed(
    () => this.nodes().filter((node) => node.state === 'done').length,
  );
}
