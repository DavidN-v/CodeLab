import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ExecutionResult } from '../../../../core/models/execution.model';

const STATUS_LABELS = {
  SUCCESS: 'Ejecutado',
  COMPILATION_ERROR: 'Error de compilación',
  RUNTIME_ERROR: 'Error de ejecución',
  TIMEOUT: 'Tiempo agotado',
} as const;

/** What a run printed: compiler messages, stdout and stderr, kept apart. */
@Component({
  selector: 'app-console-output',
  templateUrl: './console-output.component.html',
  styleUrl: './console-output.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsoleOutputComponent {
  readonly result = input<ExecutionResult | null>(null);
  readonly running = input(false);

  protected readonly statusLabel = computed(() => {
    const result = this.result();
    return result ? STATUS_LABELS[result.status] : null;
  });

  protected readonly failed = computed(() => {
    const status = this.result()?.status;
    return status !== undefined && status !== 'SUCCESS';
  });
}
