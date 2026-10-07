import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { withoutErrorNotification } from '../../../../core/interceptors/http-error.interceptor';
import { Language } from '../../../../core/models/language.model';
import { LoadState } from '../../../../core/models/load-state.model';
import { LanguageService } from '../../../../core/services/language.service';
import { HeroComponent } from '../../components/hero/hero.component';
import { LanguageCatalogComponent } from '../../components/language-catalog/language-catalog.component';
import { LearningFlowComponent } from '../../components/learning-flow/learning-flow.component';

@Component({
  selector: 'app-home-page',
  imports: [HeroComponent, LearningFlowComponent, LanguageCatalogComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {
  private readonly languageService = inject(LanguageService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly languages = signal<readonly Language[]>([]);
  protected readonly loadState = signal<LoadState>('loading');

  /** First available language in catalog order; the hero's primary action starts with it. */
  protected readonly featuredLanguage = computed(
    () => this.languages().find((language) => language.active) ?? null,
  );

  constructor() {
    this.loadLanguages();
  }

  protected loadLanguages(): void {
    this.loadState.set('loading');
    this.languageService
      // The catalog section shows the failure inline, so the global toast is skipped.
      .getLanguages(withoutErrorNotification())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (languages) => {
          this.languages.set(languages);
          this.loadState.set('ready');
        },
        error: () => this.loadState.set('error'),
      });
  }
}
