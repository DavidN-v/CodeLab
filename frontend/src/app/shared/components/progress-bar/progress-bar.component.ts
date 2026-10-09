import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** A thin bar for a 0–100 percentage, with an accessible label. */
@Component({
  selector: 'app-progress-bar',
  template: `
    <div
      class="bar"
      role="progressbar"
      [attr.aria-label]="label()"
      aria-valuemin="0"
      aria-valuemax="100"
      [attr.aria-valuenow]="clamped()"
    >
      <div class="bar__fill" [style.width.%]="clamped()"></div>
    </div>
  `,
  styleUrl: './progress-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressBarComponent {
  readonly percent = input.required<number>();
  readonly label = input('Progreso');

  protected readonly clamped = computed(() =>
    Math.max(0, Math.min(100, Math.round(this.percent()))),
  );
}
