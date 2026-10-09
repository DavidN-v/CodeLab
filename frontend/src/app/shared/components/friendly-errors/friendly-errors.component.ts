import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { FriendlyError, explainCompileErrors, explainRuntimeError } from '../../utils/java-errors';

/** At most this many: the first errors are the ones worth fixing first. */
const MAX_SHOWN = 3;

/**
 * "¿Qué significa?": compiler and runtime errors explained in plain Spanish,
 * under the raw output they come from.
 */
@Component({
  selector: 'app-friendly-errors',
  templateUrl: './friendly-errors.component.html',
  styleUrl: './friendly-errors.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FriendlyErrorsComponent {
  readonly compileOutput = input<string | null>(null);
  readonly stderr = input<string | null>(null);

  protected readonly errors = computed<FriendlyError[]>(() => {
    const compile = this.compileOutput();
    if (compile) {
      return explainCompileErrors(compile);
    }
    const runtime = this.stderr() ? explainRuntimeError(this.stderr()!) : null;
    return runtime ? [runtime] : [];
  });

  protected readonly shown = computed(() => this.errors().slice(0, MAX_SHOWN));
  protected readonly hidden = computed(() => this.errors().length - this.shown().length);
}
