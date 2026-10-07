import { ChangeDetectionStrategy, Component, computed, input, model, signal } from '@angular/core';

const LINES = '{{lines}}';

/**
 * Parsons puzzle: the program's lines come shuffled, some of them extra, and
 * the learner builds the program by picking and ordering them. Lines are kept
 * as indexes into the shuffled pool, so repeated lines (two "}") stay apart.
 */
@Component({
  selector: 'app-parsons-board',
  templateUrl: './parsons-board.component.html',
  styleUrl: './parsons-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParsonsBoardComponent {
  /** The skeleton, with a {{lines}} line where the chosen lines go. */
  readonly template = input.required<string>();
  /** Every line on offer, shuffled. */
  readonly pool = input.required<string[]>();
  /** Indexes into the pool, in program order. */
  readonly chosen = model.required<number[]>();

  /** Index being dragged, and whether it comes from the program or the pool. */
  private readonly dragging = signal<{ index: number; fromProgram: boolean } | null>(null);

  protected readonly before = computed(() => this.skeleton()[0]);
  protected readonly after = computed(() => this.skeleton()[1]);
  protected readonly available = computed(() =>
    this.pool()
      .map((text, index) => ({ text, index }))
      .filter((line) => !this.chosen().includes(line.index)),
  );

  protected line(index: number): string {
    return this.pool()[index] ?? '';
  }

  protected add(index: number): void {
    this.chosen.update((chosen) => [...chosen, index]);
  }

  protected remove(position: number): void {
    this.chosen.update((chosen) => chosen.filter((_, at) => at !== position));
  }

  protected move(position: number, offset: number): void {
    const target = position + offset;
    this.chosen.update((chosen) => {
      if (target < 0 || target >= chosen.length) {
        return chosen;
      }
      const next = [...chosen];
      [next[position], next[target]] = [next[target], next[position]];
      return next;
    });
  }

  protected onDragStart(index: number, fromProgram: boolean, event: DragEvent): void {
    this.dragging.set({ index, fromProgram });
    event.dataTransfer?.setData('text/plain', String(index));
  }

  protected onDrop(position: number, event: DragEvent): void {
    event.preventDefault();
    const dragged = this.dragging();
    this.dragging.set(null);
    if (!dragged) {
      return;
    }
    this.chosen.update((chosen) => {
      const next = chosen.filter((index) => index !== dragged.index);
      const at = Math.min(position, next.length);
      next.splice(at, 0, dragged.index);
      return next;
    });
  }

  protected onDropToPool(event: DragEvent): void {
    event.preventDefault();
    const dragged = this.dragging();
    this.dragging.set(null);
    if (dragged?.fromProgram) {
      this.chosen.update((chosen) => chosen.filter((index) => index !== dragged.index));
    }
  }

  protected allowDrop(event: DragEvent): void {
    event.preventDefault();
  }

  private skeleton(): [string, string] {
    const lines = this.template().replace(/\n$/, '').split('\n');
    const marker = lines.findIndex((line) => line.trim() === LINES);
    return marker < 0
      ? [lines.join('\n'), '']
      : [lines.slice(0, marker).join('\n'), lines.slice(marker + 1).join('\n')];
  }
}
