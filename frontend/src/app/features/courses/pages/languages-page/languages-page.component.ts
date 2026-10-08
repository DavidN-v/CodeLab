import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { withoutErrorNotification } from '../../../../core/interceptors/http-error.interceptor';
import { groupLanguages } from '../../../../core/models/language-groups';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-languages-page',
  imports: [RouterLink],
  templateUrl: './languages-page.component.html',
  styleUrl: './languages-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguagesPageComponent {
  private readonly languageService = inject(LanguageService);

  protected readonly languages = rxResource({
    stream: () => this.languageService.getLanguages(withoutErrorNotification()),
  });

  protected readonly groups = computed(() => groupLanguages(this.languages.value() ?? []));
}
