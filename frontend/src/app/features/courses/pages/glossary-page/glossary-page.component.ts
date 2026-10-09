import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { map, switchMap } from 'rxjs';

import { CourseService } from '../../../../core/services/course.service';
import { BreadcrumbsComponent } from '../../../../shared/components/breadcrumbs/breadcrumbs.component';

/** Folds accents and case so "metodo" finds "método". */
function fold(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Every term of a course, explained in plain words, with a search box. */
@Component({
  selector: 'app-glossary-page',
  imports: [BreadcrumbsComponent],
  templateUrl: './glossary-page.component.html',
  styleUrl: './glossary-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlossaryPageComponent {
  private readonly courses = inject(CourseService);

  /** Route parameter. */
  readonly languageSlug = input.required<string>();

  protected readonly query = signal('');

  protected readonly glossary = rxResource({
    params: () => this.languageSlug(),
    stream: ({ params: language }) =>
      this.courses
        .getPrimaryCourse(language)
        .pipe(
          switchMap((course) =>
            this.courses.getGlossary(course.id).pipe(map((terms) => ({ course, terms }))),
          ),
        ),
  });

  /** Alphabetical groups of the terms that match the search. */
  protected readonly groups = computed(() => {
    const terms = this.glossary.value()?.terms ?? [];
    const query = fold(this.query().trim());
    const matching = terms
      .filter(
        (term) =>
          !query ||
          fold(term.term).includes(query) ||
          term.aliases.some((alias) => fold(alias).includes(query)) ||
          fold(term.definition).includes(query),
      )
      .sort((a, b) => fold(a.term).localeCompare(fold(b.term), 'es'));
    const groups = new Map<string, typeof matching>();
    for (const term of matching) {
      const letter = fold(term.term).charAt(0).toUpperCase();
      groups.set(letter, [...(groups.get(letter) ?? []), term]);
    }
    return [...groups.entries()].map(([letter, items]) => ({ letter, items }));
  });

  protected readonly count = computed(() =>
    this.groups().reduce((total, group) => total + group.items.length, 0),
  );

  protected onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }
}
