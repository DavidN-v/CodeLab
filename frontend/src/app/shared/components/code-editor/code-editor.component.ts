import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { SettingsService } from '../../../core/services/settings.service';
import type { LineMark } from './codemirror-setup';

type EditorModule = typeof import('./codemirror-setup');
type EditorView = ReturnType<EditorModule['createEditor']>;

/**
 * Java code editor (CodeMirror 6). CodeMirror is loaded on first use, so it
 * only weighs on the practice pages. Until it arrives, a plain textarea keeps
 * the code editable. Ctrl/Cmd + Enter asks to run.
 */
@Component({
  selector: 'app-code-editor',
  templateUrl: './code-editor.component.html',
  styleUrl: './code-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeEditorComponent {
  /** The code; two-way bindable. */
  readonly value = model.required<string>();
  readonly label = input('Editor de código Java');

  /** Lines to underline as errors, e.g. from the compiler. */
  readonly marks = input<readonly LineMark[]>([]);

  /** Ctrl/Cmd + Enter. */
  readonly run = output<void>();

  protected readonly settings = inject(SettingsService);

  private readonly host = viewChild.required<ElementRef<HTMLElement>>('host');
  protected readonly ready = signal(false);

  private view: EditorView | null = null;
  private editorModule: EditorModule | null = null;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      void import('./codemirror-setup').then((module) => {
        if (destroyRef.destroyed) {
          return;
        }
        this.editorModule = module;
        this.view = module.createEditor(this.host().nativeElement, this.value(), this.label(), {
          onChange: (code) => this.value.set(code),
          onRun: () => this.run.emit(),
        });
        this.ready.set(true);
        module.markLines(this.view, this.marks());
      });
    });
    destroyRef.onDestroy(() => this.view?.destroy());

    effect(() => {
      const marks = this.marks();
      if (this.view && this.editorModule) {
        this.editorModule.markLines(this.view, marks);
      }
    });

    // Changes made by the parent (reset, load a solution) reach the editor.
    effect(() => {
      const code = this.value();
      if (this.view && this.editorModule) {
        this.editorModule.replaceDocument(this.view, code);
      }
    });
  }

  protected onFallbackInput(event: Event): void {
    this.value.set((event.target as HTMLTextAreaElement).value);
  }

  protected onFallbackKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.run.emit();
    }
  }
}
