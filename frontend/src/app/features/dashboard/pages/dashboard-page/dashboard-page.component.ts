import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { withoutErrorNotification } from '../../../../core/interceptors/http-error.interceptor';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { ProgressBarComponent } from '../../../../shared/components/progress-bar/progress-bar.component';
import { SUBMISSION_LABELS } from '../../../../shared/utils/labels';
import { ActivityHeatmapComponent } from '../../components/activity-heatmap/activity-heatmap.component';

const RELATIVE = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

/** The student's panel: where to continue, how they are doing and what they have earned. */
@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink, ProgressBarComponent, ActivityHeatmapComponent],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent {
  private readonly dashboardService = inject(DashboardService);

  protected readonly submissionLabels = SUBMISSION_LABELS;

  protected readonly dashboard = rxResource({
    stream: () => this.dashboardService.getDashboard(undefined, withoutErrorNotification()),
  });

  /** Progress through the current level, 0–100. */
  protected readonly levelPercent = computed(() => {
    const value = this.dashboard.value();
    if (!value || value.level.nextLevelXp === null) {
      return 100;
    }
    const { currentLevelXp, nextLevelXp } = value.level;
    return ((value.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
  });

  protected readonly earnedCount = computed(
    () =>
      this.dashboard.value()?.achievements.filter((achievement) => achievement.earned).length ?? 0,
  );

  protected readonly greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 6) {
      return 'Buenas noches';
    }
    if (hour < 13) {
      return 'Buenos días';
    }
    return hour < 20 ? 'Buenas tardes' : 'Buenas noches';
  });

  protected timeAgo(instant: string): string {
    const minutes = Math.round((Date.parse(instant) - Date.now()) / 60_000);
    if (Math.abs(minutes) < 60) {
      return RELATIVE.format(minutes, 'minute');
    }
    const hours = Math.round(minutes / 60);
    if (Math.abs(hours) < 24) {
      return RELATIVE.format(hours, 'hour');
    }
    return RELATIVE.format(Math.round(hours / 24), 'day');
  }

  protected hours(minutes: number): string {
    return minutes < 60 ? `${minutes} min` : `${(minutes / 60).toFixed(1).replace('.0', '')} h`;
  }
}
