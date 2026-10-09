import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import hljs from 'highlight.js/lib/core';

import { guessLanguage } from '../../../../shared/utils/code-language';

/** "¿Qué imprime?": the program to read, and a box for the predicted output. */
@Component({
  selector: 'app-predict-panel',
  templateUrl: './predict-panel.component.html',
  styleUrl: './predict-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PredictPanelComponent {
  readonly code = input.required<string>();
  /** What the program reads, if anything. */
  readonly stdin = input('');
  readonly answer = model.required<string>();

  protected readonly isJava = computed(() => guessLanguage(this.code()) === 'java');

  protected readonly lines = computed(() => {
    const language = guessLanguage(this.code());
    return this.code()
      .replace(/\n$/, '')
      .split('\n')
      .map((line) => hljs.highlight(line, { language, ignoreIllegals: true }).value);
  });

  protected onInput(event: Event): void {
    this.answer.set((event.target as HTMLTextAreaElement).value);
  }
}
