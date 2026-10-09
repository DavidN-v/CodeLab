import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

import { SettingsService } from '../../../core/services/settings.service';

let counter = 0;

/**
 * A Mermaid diagram (flowchart, class diagram…). Mermaid is large, so it is
 * loaded only when a page has a diagram; until then, and if it fails, the
 * source is shown as text.
 */
@Component({
  selector: 'app-mermaid-diagram',
  template: `
    <figure class="diagram">
      <div #target class="diagram__svg" [class.diagram__svg--ready]="ready()"></div>
      @if (!ready()) {
        <pre class="diagram__source">{{ source() }}</pre>
      }
    </figure>
  `,
  styleUrl: './mermaid-diagram.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MermaidDiagramComponent {
  readonly source = input.required<string>();

  private readonly settings = inject(SettingsService);
  private readonly target = viewChild.required<ElementRef<HTMLElement>>('target');
  private readonly destroyRef = inject(DestroyRef);
  protected readonly ready = signal(false);

  constructor() {
    afterRenderEffect(() => {
      const source = this.source();
      const theme = this.settings.theme();
      void this.draw(source, theme);
    });
  }

  private async draw(source: string, theme: 'dark' | 'light'): Promise<void> {
    try {
      const mermaid = (await import('mermaid')).default;
      mermaid.initialize({
        startOnLoad: false,
        theme: theme === 'dark' ? 'dark' : 'neutral',
        securityLevel: 'strict',
        fontFamily: 'IBM Plex Sans, system-ui, sans-serif',
      });
      const { svg } = await mermaid.render(`forja-diagram-${++counter}`, source);
      if (this.destroyRef.destroyed) {
        return;
      }
      this.target().nativeElement.innerHTML = svg;
      this.ready.set(true);
    } catch {
      this.ready.set(false);
    }
  }
}
