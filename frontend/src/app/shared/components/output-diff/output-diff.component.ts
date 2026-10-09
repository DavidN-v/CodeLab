import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { DiffRow, diffOutputs } from './output-diff';

/** One side of a row: the matching start, the differing rest, or a placeholder. */
interface Cell {
  same: string;
  different: string;
  placeholder: string | null;
}

/** Expected and actual output side by side, line by line, with the differences marked. */
@Component({
  selector: 'app-output-diff',
  templateUrl: './output-diff.component.html',
  styleUrl: './output-diff.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutputDiffComponent {
  readonly expected = input.required<string>();
  readonly actual = input.required<string>();

  protected readonly diff = computed(() => diffOutputs(this.expected(), this.actual()));

  protected readonly rows = computed(() =>
    this.diff().rows.map((row) => ({
      ...row,
      left: cell(row, row.expected, '(nada)'),
      right: cell(row, row.actual, '(falta esta línea)'),
    })),
  );
}

function cell(row: DiffRow, text: string | null, placeholder: string): Cell {
  if (text === null) {
    return { same: '', different: '', placeholder };
  }
  if (row.same) {
    return { same: text, different: '', placeholder: null };
  }
  // Spaces made visible, so "a  b" and "a b" can be told apart.
  const visible = text.replace(/ /g, '·');
  const at = row.firstDifference ?? 0;
  return { same: visible.slice(0, at), different: visible.slice(at) || '⏎', placeholder: null };
}
