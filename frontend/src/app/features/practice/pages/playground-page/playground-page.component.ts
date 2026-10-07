import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { ExecutionResult } from '../../../../core/models/execution.model';
import { AuthService } from '../../../../core/services/auth.service';
import { readStorage, writeStorage } from '../../../../core/services/browser-storage';
import { CodeHandoffService } from '../../../../core/services/code-handoff.service';
import { ExecutionService } from '../../../../core/services/execution.service';
import { CodeEditorComponent } from '../../../../shared/components/code-editor/code-editor.component';
import { ConsoleOutputComponent } from '../../../../shared/components/console-output/console-output.component';

const DRAFT_KEY = 'forja.playground';

export const PLAYGROUND_TEMPLATE = `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner entrada = new Scanner(System.in);
        System.out.println("Hola desde el playground");
    }
}
`;

/** Free-form editor: write any program, give it input, run it. */
@Component({
  selector: 'app-playground-page',
  imports: [RouterLink, CodeEditorComponent, ConsoleOutputComponent],
  templateUrl: './playground-page.component.html',
  styleUrl: './playground-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaygroundPageComponent {
  private readonly executions = inject(ExecutionService);
  private readonly router = inject(Router);
  private readonly handoff = inject(CodeHandoffService);
  protected readonly auth = inject(AuthService);

  /** A snippet sent from a lesson wins over the saved draft. */
  protected readonly code = signal(
    inject(CodeHandoffService).take() ?? readStorage(DRAFT_KEY) ?? PLAYGROUND_TEMPLATE,
  );
  protected readonly stdin = signal('');
  protected readonly running = signal(false);
  protected readonly result = signal<ExecutionResult | null>(null);

  constructor() {
    effect(() => writeStorage(DRAFT_KEY, this.code()));
  }

  protected run(): void {
    if (this.running()) {
      return;
    }
    if (!this.auth.isAuthenticated()) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: '/practice/playground' } });
      return;
    }
    this.running.set(true);
    this.executions.run(this.code(), this.stdin()).subscribe({
      next: (result) => {
        this.result.set(result);
        this.running.set(false);
      },
      error: () => this.running.set(false),
    });
  }

  protected visualize(): void {
    this.handoff.send(this.code(), this.stdin());
    void this.router.navigate(['/practice/visualizer']);
  }

  protected reset(): void {
    this.code.set(PLAYGROUND_TEMPLATE);
    this.result.set(null);
  }

  protected onStdin(event: Event): void {
    this.stdin.set((event.target as HTMLTextAreaElement).value);
  }
}
