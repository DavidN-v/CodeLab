import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { TraceResult } from '../../../../core/models/trace.model';
import { AuthService } from '../../../../core/services/auth.service';
import { readStorage, writeStorage } from '../../../../core/services/browser-storage';
import { CodeHandoffService } from '../../../../core/services/code-handoff.service';
import { ExecutionService } from '../../../../core/services/execution.service';
import { FriendlyErrorsComponent } from '../../../../shared/components/friendly-errors/friendly-errors.component';
import { TraceViewerComponent } from '../../../../shared/components/trace-viewer/trace-viewer.component';
import { CodeEditorComponent } from '../../../../shared/components/code-editor/code-editor.component';

const DRAFT_KEY = 'forja.visualizer';

export const VISUALIZER_TEMPLATE = `public class Main {
    public static void main(String[] args) {
        int suma = 0;
        for (int i = 1; i <= 4; i++) {
            suma = suma + i;
            System.out.println("i = " + i + ", suma = " + suma);
        }
        int[] dobles = new int[3];
        for (int i = 0; i < dobles.length; i++) {
            dobles[i] = i * 2;
        }
        System.out.println("Fin");
    }
}
`;

/**
 * Write a program, then watch it run one line at a time: which line runs,
 * how each variable changes and what lives in memory.
 */
@Component({
  selector: 'app-visualizer-page',
  imports: [RouterLink, CodeEditorComponent, TraceViewerComponent, FriendlyErrorsComponent],
  templateUrl: './visualizer-page.component.html',
  styleUrl: './visualizer-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisualizerPageComponent {
  private readonly executions = inject(ExecutionService);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  private readonly handoff = inject(CodeHandoffService).takeWithInput();

  protected readonly code = signal(
    this.handoff?.code ?? readStorage(DRAFT_KEY) ?? VISUALIZER_TEMPLATE,
  );
  protected readonly stdin = signal(this.handoff?.stdin ?? '');
  protected readonly tracing = signal(false);
  protected readonly result = signal<TraceResult | null>(null);
  /** The code the shown trace belongs to; the editor may have changed since. */
  protected readonly tracedCode = signal('');

  constructor() {
    effect(() => writeStorage(DRAFT_KEY, this.code()));
    // Code sent from a lesson or an exercise is visualised straight away.
    if (this.handoff && this.auth.isAuthenticated()) {
      this.visualize();
    }
  }

  protected visualize(): void {
    if (this.tracing()) {
      return;
    }
    if (!this.auth.isAuthenticated()) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: '/practice/visualizer' } });
      return;
    }
    const code = this.code();
    this.tracing.set(true);
    this.executions.trace(code, this.stdin()).subscribe({
      next: (result) => {
        this.result.set(result);
        this.tracedCode.set(code);
        this.tracing.set(false);
      },
      error: () => this.tracing.set(false),
    });
  }

  protected edit(): void {
    this.result.set(null);
  }

  protected reset(): void {
    this.code.set(VISUALIZER_TEMPLATE);
    this.result.set(null);
  }

  protected onStdin(event: Event): void {
    this.stdin.set((event.target as HTMLTextAreaElement).value);
  }
}
