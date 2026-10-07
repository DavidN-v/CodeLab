import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import hljs from 'highlight.js/lib/core';
import java from 'highlight.js/lib/languages/java';

import { HeapObject, Trace, TraceFrame, TraceValue } from '../../../core/models/trace.model';
import { explainException } from '../../utils/java-errors';
import {
  changedVariables,
  describeStep,
  formatValue,
  objectNumbers,
  objectRows,
  outputUpTo,
} from './trace-steps';

hljs.registerLanguage('java', java);

const PLAY_INTERVAL_MS = 900;

/**
 * Replays a traced program step by step: the line about to run, the call
 * stack with its variables, the objects in memory and the output so far, with
 * a plain-language note of what changed.
 */
@Component({
  selector: 'app-trace-viewer',
  imports: [NgTemplateOutlet],
  templateUrl: './trace-viewer.component.html',
  styleUrl: './trace-viewer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(keydown)': 'onKeydown($event)' },
})
export class TraceViewerComponent {
  readonly code = input.required<string>();
  readonly trace = input.required<Trace>();

  protected readonly index = signal(0);
  protected readonly playing = signal(false);
  /** Object highlighted because the pointer is on a reference to it. */
  protected readonly hovered = signal<number | null>(null);

  private readonly codeList = viewChild<ElementRef<HTMLElement>>('codeList');
  private timer: ReturnType<typeof setInterval> | null = null;

  protected readonly lines = computed(() =>
    this.code()
      .replace(/\n$/, '')
      .split('\n')
      .map((line) => hljs.highlight(line, { language: 'java', ignoreIllegals: true }).value),
  );

  protected readonly total = computed(() => this.trace().steps.length);
  protected readonly step = computed(() => this.trace().steps[this.index()] ?? null);
  protected readonly previous = computed(() =>
    this.index() > 0 ? this.trace().steps[this.index() - 1] : null,
  );
  protected readonly isLast = computed(() => this.index() >= this.total() - 1);
  protected readonly numbers = computed(() => objectNumbers(this.trace()));

  protected readonly notes = computed(() => {
    const step = this.step();
    return step ? describeStep(this.previous(), step, this.numbers()) : [];
  });

  protected readonly changed = computed(() => {
    const step = this.step();
    return step ? changedVariables(this.previous(), step) : new Set<string>();
  });

  protected readonly output = computed(() => outputUpTo(this.trace(), this.index()));

  protected readonly heap = computed(() =>
    Object.entries(this.step()?.heap ?? {})
      .map(([id, object]) => ({
        id: Number(id),
        object,
        number: this.numbers().get(Number(id)) ?? 0,
      }))
      .sort((a, b) => a.number - b.number),
  );

  protected readonly exception = computed(() => {
    const exception = this.trace().exception;
    return exception && this.isLast()
      ? explainException(exception.type, exception.message, exception.line)
      : null;
  });

  constructor() {
    // A new trace starts from the beginning.
    effect(() => {
      this.trace();
      this.index.set(0);
      this.pause();
    });
    effect(() => {
      this.index();
      const list = this.codeList()?.nativeElement;
      list
        ?.querySelector<HTMLElement>('[data-current]')
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
    inject(DestroyRef).onDestroy(() => this.pause());
  }

  protected go(index: number): void {
    this.index.set(Math.max(0, Math.min(index, this.total() - 1)));
  }

  protected togglePlay(): void {
    if (this.playing()) {
      this.pause();
      return;
    }
    if (this.isLast()) {
      this.index.set(0);
    }
    this.playing.set(true);
    this.timer = setInterval(() => {
      if (this.isLast()) {
        this.pause();
      } else {
        this.index.update((index) => index + 1);
      }
    }, PLAY_INTERVAL_MS);
  }

  protected onSlider(event: Event): void {
    this.pause();
    this.go(Number((event.target as HTMLInputElement).value));
  }

  protected onKeydown(event: KeyboardEvent): void {
    if ((event.target as HTMLElement).tagName === 'INPUT' && event.key !== 'Escape') {
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.pause();
      this.go(this.index() + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.pause();
      this.go(this.index() - 1);
    }
  }

  /** Constructors show as "new Persona()", static initialisers as "static Main". */
  protected frameName(frame: TraceFrame): string {
    if (frame.method === '<init>') {
      return `new ${frame.class}()`;
    }
    if (frame.method === '<clinit>') {
      return `static ${frame.class}`;
    }
    return `${frame.method}()`;
  }

  protected format(value: TraceValue): string {
    return formatValue(value, this.numbers());
  }

  protected rows(object: HeapObject) {
    return objectRows(object);
  }

  protected kindLabel(object: HeapObject): string {
    switch (object.kind) {
      case 'array':
        return `array de ${object.length}`;
      case 'list':
        return `lista de ${object.items.length}`;
      case 'set':
        return `conjunto de ${object.items.length}`;
      case 'map':
        return `mapa de ${object.entries.length}`;
      default:
        return '';
    }
  }

  private pause(): void {
    this.playing.set(false);
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
