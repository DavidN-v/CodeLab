import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { Language } from '../../../../core/models/language.model';
import { LoadState } from '../../../../core/models/load-state.model';
import { LanguageListItemComponent } from '../../../../shared/components/language-list-item/language-list-item.component';

/** Presentational: the page owns the data and tells this component what to show. */
@Component({
  selector: 'app-language-catalog',
  imports: [LanguageListItemComponent],
  templateUrl: './language-catalog.component.html',
  styleUrl: './language-catalog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageCatalogComponent {
  readonly languages = input.required<readonly Language[]>();
  readonly loadState = input.required<LoadState>();

  /** Emitted when the user asks to load the catalog again after a failure. */
  readonly retry = output<void>();
}
