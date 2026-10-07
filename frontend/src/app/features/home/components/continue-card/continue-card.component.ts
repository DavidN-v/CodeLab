import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { withoutErrorNotification } from '../../../../core/interceptors/http-error.interceptor';
import { AuthService } from '../../../../core/services/auth.service';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { ProgressBarComponent } from '../../../../shared/components/progress-bar/progress-bar.component';

/**
 * For a signed-in learner, the first thing on the home page: the next lesson,
 * today's goal, the streak and any review that is due.
 */
@Component({
  selector: 'app-continue-card',
  imports: [RouterLink, ProgressBarComponent],
  templateUrl: './continue-card.component.html',
  styleUrl: './continue-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContinueCardComponent {
  private readonly dashboards = inject(DashboardService);
  protected readonly auth = inject(AuthService);

  protected readonly dashboard = rxResource({
    params: () => (this.auth.isAuthenticated() ? true : undefined),
    stream: () => this.dashboards.getDashboard(undefined, withoutErrorNotification()),
  });

  protected readonly course = computed(() => this.dashboard.value()?.courses[0] ?? null);
  protected readonly goalPercent = computed(() => {
    const goal = this.dashboard.value()?.dailyGoal;
    return goal ? Math.min(100, (goal.todayXp / Math.max(1, goal.goalXp)) * 100) : 0;
  });
}
