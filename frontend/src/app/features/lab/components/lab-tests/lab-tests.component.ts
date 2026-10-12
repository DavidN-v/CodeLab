import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { LabTest, TestOutcome } from '../../models/lab.models';
import { LabStore } from '../../services/lab-store.service';

interface Row {
  test: LabTest;
  outcome: TestOutcome | null;
}

const ORIGIN_LABEL: Record<LabTest['origin'], string> = {
  student: 'Tuya',
  tutor: 'Sugerida por el tutor',
  catalog: 'Del ejercicio',
};

/**
 * Tests: an expression and the value it should give. They are what tells a
 * program that runs from a program that does what was asked.
 */
@Component({
  selector: 'app-lab-tests',
  templateUrl: './lab-tests.component.html',
  styleUrl: './lab-tests.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabTestsComponent {
  protected readonly store = inject(LabStore);
  protected readonly origins = ORIGIN_LABEL;

  protected readonly adding = signal(false);
  protected readonly description = signal('');
  protected readonly expression = signal('');
  protected readonly expected = signal('');

  protected readonly rows = computed<Row[]>(() => {
    const outcomes = new Map(this.store.runner.testOutcomes().map((outcome) => [outcome.testId, outcome]));
    return this.store.project().tests.map((test) => ({ test, outcome: outcomes.get(test.id) ?? null }));
  });
  protected readonly passed = computed(() => this.rows().filter((row) => row.outcome?.status === 'pass').length);
  protected readonly hasResults = computed(() => this.rows().some((row) => row.outcome !== null));

  protected read(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected add(): void {
    const expression = this.expression().trim();
    const expected = this.expected().trim();
    if (!expression || !expected) {
      return;
    }
    this.store.addTest(this.description().trim() || `${expression} da ${expected}`, expression, expected);
    this.description.set('');
    this.expression.set('');
    this.expected.set('');
    this.adding.set(false);
  }
}
