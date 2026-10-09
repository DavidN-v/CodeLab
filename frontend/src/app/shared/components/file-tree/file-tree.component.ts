import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

import { fileBadge, parseTree, TreeEntry } from './file-tree';

/**
 * An interactive project tree: folders open and close, and choosing a file
 * shows what it is for. Lessons write it as an `arbol` block.
 */
@Component({
  selector: 'app-file-tree',
  templateUrl: './file-tree.component.html',
  styleUrl: './file-tree.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileTreeComponent {
  readonly source = input.required<string>();

  protected readonly entries = computed(() => parseTree(this.source()));
  private readonly closed = signal<ReadonlySet<string>>(new Set());
  protected readonly selected = signal<TreeEntry | null>(null);

  /** Entries whose folders are all open. */
  protected readonly visible = computed(() =>
    this.entries().filter(
      (entry) => ![...this.closed()].some((path) => entry.path.startsWith(path + '/')),
    ),
  );

  protected readonly described = computed(
    () => this.entries().filter((entry) => entry.description).length,
  );

  protected badge(entry: TreeEntry): string {
    return fileBadge(entry.name);
  }

  protected isOpen(entry: TreeEntry): boolean {
    return !this.closed().has(entry.path);
  }

  protected choose(entry: TreeEntry): void {
    this.selected.set(entry);
    if (entry.folder) {
      this.closed.update((closed) => {
        const next = new Set(closed);
        if (next.has(entry.path)) {
          next.delete(entry.path);
        } else if (entry.depth > 0) {
          next.add(entry.path);
        }
        return next;
      });
    }
  }
}
