import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { GlossaryTerm } from '../../../core/models/course.model';
import { FileTreeComponent } from '../file-tree/file-tree.component';
import { MermaidDiagramComponent } from '../mermaid-diagram/mermaid-diagram.component';
import { RunnableExampleComponent } from '../runnable-example/runnable-example.component';
import { ScreenPreviewComponent } from '../screen-preview/screen-preview.component';
import { Heading, renderMarkdown } from './markdown-renderer';

type View =
  | { kind: 'html'; html: SafeHtml }
  | { kind: 'example'; code: string }
  | { kind: 'mermaid'; source: string }
  | { kind: 'tree'; source: string }
  | { kind: 'screen'; html: string; url: string };

/**
 * Renders first-party Markdown (lessons, statements). The renderer escapes raw
 * HTML, which is what makes bypassing Angular's sanitizer safe here: the
 * sanitizer would strip the heading ids the page index links to.
 */
@Component({
  selector: 'app-markdown',
  imports: [
    RunnableExampleComponent,
    MermaidDiagramComponent,
    FileTreeComponent,
    ScreenPreviewComponent,
  ],
  template: `
    <div class="prose">
      @for (segment of view(); track $index) {
        @switch (segment.kind) {
          @case ('html') {
            <div class="prose__segment" [innerHTML]="segment.html"></div>
          }
          @case ('example') {
            <app-runnable-example [code]="segment.code" />
          }
          @case ('mermaid') {
            <app-mermaid-diagram [source]="segment.source" />
          }
          @case ('tree') {
            <app-file-tree [source]="segment.source" />
          }
          @case ('screen') {
            <app-screen-preview [html]="segment.html" [url]="segment.url" />
          }
        }
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkdownComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly content = input.required<string>();
  /** Turn Java examples with a main method into runnable ones. */
  readonly runnable = input(false);
  /** Terms explained on hover; null for none. */
  readonly glossary = input<readonly GlossaryTerm[] | null>(null);

  private readonly rendered = computed(() =>
    renderMarkdown(this.content(), {
      runnable: this.runnable(),
      glossary: this.glossary() ?? undefined,
    }),
  );

  protected readonly view = computed<View[]>(() =>
    this.rendered().segments.map((segment) =>
      segment.kind === 'html'
        ? { kind: 'html', html: this.sanitizer.bypassSecurityTrustHtml(segment.html) }
        : segment,
    ),
  );

  /** Second-level headings, for an index of the page. */
  readonly headings = computed<Heading[]>(() => this.rendered().headings);
}
