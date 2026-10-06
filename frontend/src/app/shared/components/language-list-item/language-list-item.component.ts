import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Language } from '../../../core/models/language.model';

/**
 * One row of a language listing. Available languages link to their page;
 * announced ones are shown as upcoming and are not interactive.
 */
@Component({
  selector: 'app-language-list-item',
  imports: [NgTemplateOutlet, RouterLink],
  templateUrl: './language-list-item.component.html',
  styleUrl: './language-list-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageListItemComponent {
  readonly language = input.required<Language>();
}
