import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

import { TutorService } from '../../../core/services/tutor.service';
import { MarkdownComponent } from '../markdown/markdown.component';

/**
 * A button that asks the AI tutor something, and its answer. Hidden when the
 * server has no tutor configured.
 */
@Component({
  selector: 'app-tutor-panel',
  imports: [MarkdownComponent],
  templateUrl: './tutor-panel.component.html',
  styleUrl: './tutor-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TutorPanelComponent {
  /** Optional heading above the button, shown only when the tutor is available. */
  readonly heading = input('');
  /** Button text, e.g. "¿Por qué falla mi código?". */
  readonly label = input.required<string>();
  /** One line under the button saying what the tutor will do. */
  readonly hint = input('');
  /** Offer a box for the learner's own question. */
  readonly withQuestion = input(false);
  /** Makes the request; receives the learner's question, if any. */
  readonly ask = input.required<(question: string) => Observable<string>>();

  protected readonly enabled = toSignal(inject(TutorService).isEnabled(), { initialValue: false });
  protected readonly loading = signal(false);
  protected readonly answer = signal<string | null>(null);
  protected readonly question = signal('');

  protected request(): void {
    if (this.loading()) {
      return;
    }
    this.loading.set(true);
    this.ask()(this.question()).subscribe({
      next: (answer) => {
        this.answer.set(answer);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected onQuestion(event: Event): void {
    this.question.set((event.target as HTMLInputElement).value);
  }
}
