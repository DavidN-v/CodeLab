import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, output, viewChild } from '@angular/core';

import { ConsoleEntry } from '../../models/lab.models';
import { LabRunnerService } from '../../services/lab-runner.service';
import { LabStore } from '../../services/lab-store.service';

/** What the program wrote while it really ran: console messages, warnings and errors. */
@Component({
  selector: 'app-lab-console',
  templateUrl: './lab-console.component.html',
  styleUrl: './lab-console.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabConsoleComponent {
  protected readonly runner = inject(LabRunnerService);
  protected readonly store = inject(LabStore);

  /** The learner clicked the location of an error. */
  readonly locate = output<{ path: string; line: number }>();

  private readonly body = viewChild<ElementRef<HTMLElement>>('body');

  protected readonly statusText: Record<string, string> = {
    idle: 'Sin ejecutar',
    running: 'Ejecutando…',
    ok: 'Ejecutado sin errores',
    error: 'Ejecutado con errores',
    timeout: 'Detenido: no terminaba',
    blocked: 'No se ha ejecutado',
  };

  constructor() {
    // Keeps the newest output in view, like a terminal.
    effect(() => {
      this.runner.entries();
      const element = this.body()?.nativeElement;
      if (element) {
        queueMicrotask(() => (element.scrollTop = element.scrollHeight));
      }
    });
  }

  protected goTo(entry: ConsoleEntry): void {
    if (entry.path && entry.line) {
      this.locate.emit({ path: entry.path, line: entry.line });
    }
  }
}
