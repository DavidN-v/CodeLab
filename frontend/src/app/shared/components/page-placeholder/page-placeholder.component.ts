import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Stands in for a page whose feature has not been built yet, so navigation and
 * lazy loading can be exercised end to end. Its inputs come from route data;
 * build routes for it with `placeholderRoute`.
 */
@Component({
  selector: 'app-page-placeholder',
  imports: [RouterLink],
  templateUrl: './page-placeholder.component.html',
  styleUrl: './page-placeholder.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PagePlaceholderComponent {
  readonly heading = input.required<string>();
  readonly description = input.required<string>();
  /** Roadmap phase in which the real page is delivered. */
  readonly phase = input.required<number>();
}
