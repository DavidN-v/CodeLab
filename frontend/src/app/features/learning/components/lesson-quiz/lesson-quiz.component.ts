import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import hljs from 'highlight.js/lib/core';
import java from 'highlight.js/lib/languages/java';

import { QuizQuestion } from '../../../../core/models/course.model';
import { MarkdownComponent } from '../../../../shared/components/markdown/markdown.component';

hljs.registerLanguage('java', java);

interface Answer {
  /** CHOICE: index chosen. OUTPUT: text written. */
  value: number | string;
  correct: boolean;
}

/** Same leniency as the grader: trailing spaces and blank lines at the end do not count. */
export function sameOutput(expected: string, actual: string): boolean {
  const normalize = (text: string) =>
    text
      .replace(/\r\n?/g, '\n')
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n')
      .replace(/\n+$/, '');
  return normalize(expected) === normalize(actual);
}

/**
 * "¿Lo has entendido?": a few questions at the end of a lesson, answered
 * here, each with its explanation. Nothing is sent to the server.
 */
@Component({
  selector: 'app-lesson-quiz',
  imports: [MarkdownComponent],
  templateUrl: './lesson-quiz.component.html',
  styleUrl: './lesson-quiz.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LessonQuizComponent {
  readonly questions = input.required<QuizQuestion[]>();
  /** Every question answered; carries how many were right at the first try. */
  readonly finished = output<number>();

  protected readonly answers = signal<(Answer | null)[]>([]);
  protected readonly drafts = signal<string[]>([]);

  protected readonly answered = computed(
    () => this.answers().filter((answer) => answer !== null).length,
  );
  protected readonly correct = computed(
    () => this.answers().filter((answer) => answer?.correct).length,
  );
  protected readonly done = computed(
    () => this.questions().length > 0 && this.answered() === this.questions().length,
  );

  constructor() {
    effect(() => {
      const count = this.questions().length;
      this.answers.set(Array(count).fill(null));
      this.drafts.set(Array(count).fill(''));
    });
  }

  protected code(question: QuizQuestion): string {
    return question.code ? hljs.highlight(question.code, { language: 'java' }).value : '';
  }

  protected choose(index: number, option: number): void {
    if (this.answers()[index]) {
      return;
    }
    const question = this.questions()[index];
    this.record(index, { value: option, correct: option === question.correctOption });
  }

  protected check(index: number): void {
    const question = this.questions()[index];
    const text = this.drafts()[index] ?? '';
    if (this.answers()[index] || !text.trim()) {
      return;
    }
    this.record(index, { value: text, correct: sameOutput(question.expectedOutput ?? '', text) });
  }

  protected onDraft(index: number, event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.drafts.update((drafts) => drafts.map((draft, at) => (at === index ? value : draft)));
  }

  protected retry(): void {
    this.answers.set(Array(this.questions().length).fill(null));
    this.drafts.set(Array(this.questions().length).fill(''));
  }

  private record(index: number, answer: Answer): void {
    this.answers.update((answers) =>
      answers.map((current, at) => (at === index ? answer : current)),
    );
    if (this.done()) {
      this.finished.emit(this.correct());
    }
  }
}
