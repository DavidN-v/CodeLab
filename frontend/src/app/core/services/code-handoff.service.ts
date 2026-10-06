import { Injectable } from '@angular/core';

/**
 * Carries a code snippet from a lesson to the playground ("Abrir en el
 * playground"). One-shot: the playground takes it once.
 */
@Injectable({ providedIn: 'root' })
export class CodeHandoffService {
  private pending: string | null = null;

  send(code: string): void {
    this.pending = code;
  }

  take(): string | null {
    const code = this.pending;
    this.pending = null;
    return code;
  }
}
