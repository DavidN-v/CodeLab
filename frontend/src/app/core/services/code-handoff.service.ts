import { Injectable } from '@angular/core';

/** A program sent from one page to another, with the input to run it with. */
export interface CodeHandoff {
  code: string;
  stdin: string;
}

/**
 * Carries a code snippet from a lesson or an exercise to the playground or
 * the visualizer ("Abrir en el playground", "Visualizar"). One-shot: the
 * receiving page takes it once.
 */
@Injectable({ providedIn: 'root' })
export class CodeHandoffService {
  private pending: CodeHandoff | null = null;

  send(code: string, stdin = ''): void {
    this.pending = { code, stdin };
  }

  /** The code only, for pages without an input box. */
  take(): string | null {
    return this.takeWithInput()?.code ?? null;
  }

  takeWithInput(): CodeHandoff | null {
    const pending = this.pending;
    this.pending = null;
    return pending;
  }
}
