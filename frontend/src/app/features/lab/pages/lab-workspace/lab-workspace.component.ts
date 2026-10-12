import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';

import { readStorage, writeStorage } from '../../../../core/services/browser-storage';
import { CodeEditorComponent } from '../../../../shared/components/code-editor/code-editor.component';
import { LabConsoleComponent } from '../../components/lab-console/lab-console.component';
import { LabExplorerComponent } from '../../components/lab-explorer/lab-explorer.component';
import { LabGuideComponent } from '../../components/lab-guide/lab-guide.component';
import { LabPreviewComponent } from '../../components/lab-preview/lab-preview.component';
import { LabProblemsComponent } from '../../components/lab-problems/lab-problems.component';
import { LabProjectsComponent } from '../../components/lab-projects/lab-projects.component';
import { LabTestsComponent } from '../../components/lab-tests/lab-tests.component';
import { LabTutorComponent } from '../../components/lab-tutor/lab-tutor.component';
import { LANGUAGE_LABEL, languageOf } from '../../engine/languages';
import { LabMode } from '../../models/lab.models';
import { LabStore, SaveState } from '../../services/lab-store.service';

type RightTab = 'preview' | 'guide' | 'tutor';
type BottomTab = 'console' | 'problems' | 'tests';
type Divider = 'side' | 'right' | 'bottom';

interface Layout {
  side: number;
  right: number;
  bottom: number;
  showSide: boolean;
  showRight: boolean;
  showBottom: boolean;
}

const LAYOUT_KEY = 'forja.lab.layout';
const DEFAULT_LAYOUT: Layout = { side: 200, right: 440, bottom: 250, showSide: true, showRight: true, showBottom: true };
const LIMITS: Record<Divider, [number, number]> = { side: [140, 360], right: [260, 900], bottom: [110, 620] };

const MODES: { mode: LabMode; label: string; hint: string }[] = [
  { mode: 'free', label: 'Libre', hint: 'Construye lo que quieras y pide ayuda cuando la necesites.' },
  { mode: 'tutor', label: 'Tutor', hint: 'El tutor convierte tu idea en pasos y te explica cada uno.' },
  { mode: 'challenge', label: 'Desafío', hint: 'Un objetivo y unas pruebas que evalúan tu solución.' },
  { mode: 'debug', label: 'Depuración', hint: 'Un programa con errores que tienes que encontrar y corregir.' },
];

const SAVE_LABEL: Record<SaveState, string> = {
  saved: 'Guardado en tu cuenta',
  saving: 'Guardando…',
  unsaved: 'Cambios sin guardar',
  draft: 'Borrador en este navegador',
  error: 'No se ha podido guardar',
};

/**
 * Práctica general: a workspace to build anything with HTML, CSS, JavaScript
 * and TypeScript. The editor, the real execution and the explanation of what
 * goes wrong share one screen.
 */
@Component({
  selector: 'app-lab-workspace',
  imports: [
    CodeEditorComponent,
    LabConsoleComponent,
    LabExplorerComponent,
    LabGuideComponent,
    LabPreviewComponent,
    LabProblemsComponent,
    LabProjectsComponent,
    LabTestsComponent,
    LabTutorComponent,
  ],
  providers: [LabStore],
  templateUrl: './lab-workspace.component.html',
  styleUrl: './lab-workspace.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabWorkspaceComponent {
  protected readonly store = inject(LabStore);
  protected readonly modes = MODES;
  protected readonly saveLabels = SAVE_LABEL;

  private readonly editor = viewChild(CodeEditorComponent);

  protected readonly layout = signal<Layout>(restoreLayout());
  protected readonly rightTab = signal<RightTab>('guide');
  protected readonly bottomTab = signal<BottomTab>('console');
  /** The divider being dragged, so frames stop swallowing the pointer. */
  protected readonly dragging = signal<Divider | null>(null);

  protected readonly activeLanguage = computed(() => languageOf(this.store.activeFile()?.path ?? ''));
  protected readonly activeLanguageLabel = computed(() => LANGUAGE_LABEL[this.activeLanguage()]);
  protected readonly testSummary = computed(() => {
    const total = this.store.project().tests.length;
    const outcomes = this.store.runner.testOutcomes();
    if (total === 0) {
      return '';
    }
    return outcomes.length === 0 ? `${total}` : `${outcomes.filter((o) => o.status === 'pass').length}/${total}`;
  });

  private dragStart = { pointer: 0, size: 0 };

  constructor() {
    void this.store.init();
    effect(() => writeStorage(LAYOUT_KEY, JSON.stringify(this.layout())));
    // A program that could not run sends the learner to the reason why.
    effect(() => {
      if (this.store.runner.status() === 'blocked') {
        this.bottomTab.set('problems');
      }
    });
  }

  protected languageOf(path: string): string {
    return languageOf(path);
  }

  protected setMode(mode: LabMode): void {
    this.store.setMode(mode);
    this.showRight('guide');
  }

  protected async run(withTests: boolean): Promise<void> {
    this.showBottom(withTests ? 'tests' : 'console');
    await this.store.run(withTests);
    if (this.store.runner.hasPage() && this.layout().showRight && !withTests) {
      this.rightTab.set('preview');
    }
  }

  protected showRight(tab: RightTab): void {
    this.rightTab.set(tab);
    this.layout.update((layout) => ({ ...layout, showRight: true }));
  }

  protected showBottom(tab: BottomTab): void {
    this.bottomTab.set(tab);
    this.layout.update((layout) => ({ ...layout, showBottom: true }));
  }

  protected toggle(panel: 'showSide' | 'showRight' | 'showBottom'): void {
    this.layout.update((layout) => ({ ...layout, [panel]: !layout[panel] }));
  }

  /** Opens a file at a line, from the console or the list of problems. */
  protected locate(target: { path: string; line: number }): void {
    const sameFile = this.store.activePath() === target.path;
    this.store.select(target.path);
    if (target.line > 0) {
      // Another file means another editor, which needs a moment to appear.
      setTimeout(() => this.editor()?.revealLine(target.line), sameFile ? 0 : 300);
    }
  }

  // --- Resizing --------------------------------------------------------------

  protected startDrag(divider: Divider, event: PointerEvent): void {
    event.preventDefault();
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    this.dragging.set(divider);
    this.dragStart = {
      pointer: divider === 'bottom' ? event.clientY : event.clientX,
      size: this.layout()[divider],
    };
  }

  protected drag(event: PointerEvent): void {
    const divider = this.dragging();
    if (!divider) {
      return;
    }
    const pointer = divider === 'bottom' ? event.clientY : event.clientX;
    // The side panel grows to the right; the other two grow away from the pointer.
    const delta = divider === 'side' ? pointer - this.dragStart.pointer : this.dragStart.pointer - pointer;
    this.resize(divider, this.dragStart.size + delta);
  }

  protected endDrag(): void {
    this.dragging.set(null);
  }

  /** Arrow keys move a focused divider, so resizing does not need a mouse. */
  protected nudge(divider: Divider, event: KeyboardEvent): void {
    const grow: Record<Divider, string> = { side: 'ArrowRight', right: 'ArrowLeft', bottom: 'ArrowUp' };
    const shrink: Record<Divider, string> = { side: 'ArrowLeft', right: 'ArrowRight', bottom: 'ArrowDown' };
    if (event.key === grow[divider] || event.key === shrink[divider]) {
      event.preventDefault();
      this.resize(divider, this.layout()[divider] + (event.key === grow[divider] ? 24 : -24));
    }
  }

  private resize(divider: Divider, size: number): void {
    const [min, max] = LIMITS[divider];
    this.layout.update((layout) => ({ ...layout, [divider]: Math.round(Math.min(max, Math.max(min, size))) }));
  }

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      void this.store.save();
    }
  }
}

function restoreLayout(): Layout {
  try {
    const stored = JSON.parse(readStorage(LAYOUT_KEY) ?? 'null') as Partial<Layout> | null;
    return { ...DEFAULT_LAYOUT, ...(stored ?? {}) };
  } catch {
    return DEFAULT_LAYOUT;
  }
}
