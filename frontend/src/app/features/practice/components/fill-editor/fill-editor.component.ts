import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';

const BLANK = '{{?}}';

interface Segment {
  text: string;
  /** Index of the blank that follows this text, or null at the end of the line. */
  blank: number | null;
}

/** The program with its blanks as text boxes: the learner types only what is missing. */
@Component({
  selector: 'app-fill-editor',
  templateUrl: './fill-editor.component.html',
  styleUrl: './fill-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FillEditorComponent {
  /** The program with {{?}} where each blank goes. */
  readonly template = input.required<string>();
  /** One answer per blank, in order. */
  readonly answers = model.required<string[]>();

  protected readonly lines = computed<Segment[][]>(() => {
    let blank = 0;
    return this.template()
      .replace(/\n$/, '')
      .split('\n')
      .map((line) => {
        const pieces = line.split(BLANK);
        return pieces.map((text, index) => ({
          text,
          blank: index < pieces.length - 1 ? blank++ : null,
        }));
      });
  });

  protected readonly blankCount = computed(() => this.template().split(BLANK).length - 1);
  protected readonly filled = computed(
    () => this.answers().filter((answer) => answer.trim() !== '').length,
  );

  protected answer(index: number): string {
    return this.answers()[index] ?? '';
  }

  protected width(index: number): number {
    return Math.max(4, this.answer(index).length + 2);
  }

  protected onInput(index: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.answers.update((answers) => {
      const next = [...answers];
      while (next.length < this.blankCount()) {
        next.push('');
      }
      next[index] = value;
      return next;
    });
  }
}
