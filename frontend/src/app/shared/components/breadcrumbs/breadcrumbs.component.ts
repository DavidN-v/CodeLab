import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface Crumb {
  label: string;
  /** Router link; the last crumb, the current page, has none. */
  link?: readonly (string | number)[] | string;
}

/** Where the page sits: course › module › lesson or exercise. */
@Component({
  selector: 'app-breadcrumbs',
  imports: [RouterLink],
  templateUrl: './breadcrumbs.component.html',
  styleUrl: './breadcrumbs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbsComponent {
  readonly crumbs = input.required<readonly Crumb[]>();
}
