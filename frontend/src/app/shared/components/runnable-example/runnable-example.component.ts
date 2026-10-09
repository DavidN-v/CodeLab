import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import hljs from 'highlight.js/lib/core';
import java from 'highlight.js/lib/languages/java';

import { ExecutionResult } from '../../../core/models/execution.model';
import { AuthService } from '../../../core/services/auth.service';
import { CodeHandoffService } from '../../../core/services/code-handoff.service';
import { ExecutionService } from '../../../core/services/execution.service';
import { CodeEditorComponent } from '../code-editor/code-editor.component';
import { ConsoleOutputComponent } from '../console-output/console-output.component';

hljs.registerLanguage('java', java);

/**
 * A lesson example the learner can run right there, change and run again,
 * watch step by step, or take to the playground.
 */
@Component({
  selector: 'app-runnable-example',
  imports: [CodeEditorComponent, ConsoleOutputComponent],
  templateUrl: './runnable-example.component.html',
  styleUrl: './runnable-example.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RunnableExampleComponent {
  private readonly executions = inject(ExecutionService);
  private readonly handoff = inject(CodeHandoffService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  readonly code = input.required<string>();

  /** The code as edited here; back to the original on reset. */
  protected readonly current = linkedSignal(() => this.code());
  protected readonly editing = signal(false);
  protected readonly running = signal(false);
  protected readonly result = signal<ExecutionResult | null>(null);
  protected readonly stdin = signal('');

  /** Programs that read input get a box for it. */
  protected readonly readsInput = computed(() =>
    /Scanner|BufferedReader|System\.in/.test(this.code()),
  );
  protected readonly changed = computed(() => this.current() !== this.code());
  protected readonly highlighted = computed(
    () => hljs.highlight(this.current(), { language: 'java' }).value,
  );

  protected run(): void {
    if (this.running() || !this.requireLogin()) {
      return;
    }
    this.running.set(true);
    this.executions.run(this.current(), this.stdin()).subscribe({
      next: (result) => {
        this.result.set(result);
        this.running.set(false);
      },
      error: () => this.running.set(false),
    });
  }

  protected visualize(): void {
    this.handoff.send(this.current(), this.stdin());
    void this.router.navigate(['/practice/visualizer']);
  }

  protected openInPlayground(): void {
    this.handoff.send(this.current());
    void this.router.navigate(['/practice/playground']);
  }

  protected reset(): void {
    this.current.set(this.code());
    this.result.set(null);
  }

  protected onStdin(event: Event): void {
    this.stdin.set((event.target as HTMLTextAreaElement).value);
  }

  private requireLogin(): boolean {
    if (this.auth.isAuthenticated()) {
      return true;
    }
    void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
    return false;
  }
}
