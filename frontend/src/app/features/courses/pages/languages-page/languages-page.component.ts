import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { withoutErrorNotification } from '../../../../core/interceptors/http-error.interceptor';
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
}
