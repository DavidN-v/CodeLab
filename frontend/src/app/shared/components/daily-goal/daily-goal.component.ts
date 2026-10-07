import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { AuthService } from '../../../core/services/auth.service';

/** The goals on offer, in experience per day. */
export const DAILY_GOALS = [
  { xp: 10, label: 'Tranquilo', detail: 'una lección' },
  { xp: 30, label: 'Normal', detail: 'una lección y un ejercicio' },
  { xp: 50, label: 'En serio', detail: 'un par de ejercicios' },
  { xp: 100, label: 'Intenso', detail: 'una buena sesión' },
] as const;

/** Today's experience against the learner's daily goal, as a ring, with a goal picker. */
@Component({
  selector: 'app-daily-goal',
  templateUrl: './daily-goal.component.html',
  styleUrl: './daily-goal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyGoalComponent {
  private readonly auth = inject(AuthService);

  readonly goalXp = input.required<number>();
  readonly todayXp = input.required<number>();
  /** The goal was changed and saved. */
  readonly changed = output<number>();

  protected readonly goals = DAILY_GOALS;
  protected readonly picking = signal(false);
  protected readonly saving = signal(false);

  protected readonly percent = computed(() =>
    Math.min(100, Math.round((this.todayXp() / Math.max(1, this.goalXp())) * 100)),
  );
  protected readonly reached = computed(() => this.todayXp() >= this.goalXp());

  protected pick(xp: number): void {
    if (this.saving()) {
      return;
    }
    this.saving.set(true);
    this.auth.changeDailyGoal(xp).subscribe({
      next: () => {
        this.saving.set(false);
        this.picking.set(false);
        this.changed.emit(xp);
      },
      error: () => this.saving.set(false),
    });
  }
}
