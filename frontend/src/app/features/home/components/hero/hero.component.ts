import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Language } from '../../../../core/models/language.model';
import { CodePreviewComponent } from '../code-preview/code-preview.component';

@Component({
  selector: 'app-hero',
  imports: [RouterLink, CodePreviewComponent],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroComponent {
  /**
   * Language the primary action starts with. Null while the catalog loads or
   * if it could not be loaded; the hero then only offers to browse.
   */
  readonly featuredLanguage = input<Language | null>(null);
}
