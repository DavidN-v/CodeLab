import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { Heading, renderMarkdown } from './markdown-renderer';

/**
 * Renders first-party Markdown (lessons, statements). The renderer escapes raw
 * HTML, which is what makes bypassing Angular's sanitizer safe here: the
 * sanitizer would strip the heading ids the page index links to.
 */
@Component({
  selector: 'app-markdown',
  template: '<div class="prose" [innerHTML]="html()"></div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(click)': 'onClick($event)' },
})
export class MarkdownComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly content = input.required<string>();
  /** Offer runnable Java examples to the playground. */
  readonly runnable = input(false);

  /** The code of the example whose "open in playground" button was pressed. */
  readonly runCode = output<string>();

  private readonly rendered = computed(() => renderMarkdown(this.content(), this.runnable()));

  protected readonly html = computed<SafeHtml>(() =>
    this.sanitizer.bypassSecurityTrustHtml(this.rendered().html),
  );

  /** Second-level headings, for an index of the page. */
  readonly headings = computed<Heading[]>(() => this.rendered().headings);

  protected onClick(event: MouseEvent): void {
    const button = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-code-index]');
    if (!button) {
      return;
    }
    const code = this.rendered().runnableCode[Number(button.dataset['codeIndex'])];
    if (code !== undefined) {
      this.runCode.emit(code);
    }
  }
}
