import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';

import { DiagnosticCategory, LabDiagnostic } from '../../models/lab.models';
import { LabStore } from '../../services/lab-store.service';

const CATEGORY_LABEL: Record<DiagnosticCategory, string> = {
  syntax: 'Sintaxis',
  types: 'Tipos',
  runtime: 'Ejecución',
  logic: 'Lógica',
  practice: 'Mala práctica',
  security: 'Seguridad',
};

/** Most urgent first: what stops the program, then what makes it wrong, then advice. */
const CATEGORY_ORDER: DiagnosticCategory[] = ['syntax', 'runtime', 'types', 'logic', 'security', 'practice'];

/**
 * Every problem the tools have found, each explained: what is wrong, where,
 * why it matters, what it causes, how to fix it, an example and the concept
 * to review. Confirmed problems and mere suspicions are told apart.
 */
@Component({
  selector: 'app-lab-problems',
  templateUrl: './lab-problems.component.html',
  styleUrl: './lab-problems.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabProblemsComponent {
  protected readonly store = inject(LabStore);

  readonly locate = output<{ path: string; line: number }>();
  /** The learner asked the tutor about a problem: show the tutor panel. */
  readonly asked = output<void>();

  protected readonly labels = CATEGORY_LABEL;
  /** Index of the problem whose explanation is open. */
  protected readonly open = signal<number | null>(null);

  protected readonly problems = computed<LabDiagnostic[]>(() =>
    [...this.store.diagnostics()].sort(
      (a, b) =>
        CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) ||
        (a.path ?? '').localeCompare(b.path ?? '') ||
        a.line - b.line,
    ),
  );

  protected toggle(index: number): void {
    this.open.update((current) => (current === index ? null : index));
  }

  protected goTo(problem: LabDiagnostic): void {
    if (problem.path) {
      this.locate.emit({ path: problem.path, line: problem.line });
    }
  }

  protected ask(problem: LabDiagnostic): void {
    this.asked.emit();
    void this.store.explain(problem);
  }
}
