import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ActivityDay } from '../../../../core/models/dashboard.model';

interface Cell {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  label: string;
}

const DATE_FORMAT = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' });

/** One square per day, a column per week, darker the more was done. */
@Component({
  selector: 'app-activity-heatmap',
  templateUrl: './activity-heatmap.component.html',
  styleUrl: './activity-heatmap.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityHeatmapComponent {
  /** Oldest first. */
  readonly days = input.required<readonly ActivityDay[]>();

  protected readonly weeks = computed(() => {
    const cells = this.days().map<Cell>((day) => ({
      date: day.date,
      count: day.count,
      level: levelOf(day.count),
      label: `${DATE_FORMAT.format(new Date(`${day.date}T12:00:00`))}: ${day.count} ${day.count === 1 ? 'actividad' : 'actividades'}`,
    }));
    const weeks: Cell[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    return weeks;
  });

  protected readonly activeDays = computed(() => this.days().filter((day) => day.count > 0).length);
}

function levelOf(count: number): Cell['level'] {
  if (count === 0) {
    return 0;
  }
  if (count <= 2) {
    return 1;
  }
  if (count <= 5) {
    return 2;
  }
  return count <= 9 ? 3 : 4;
}
