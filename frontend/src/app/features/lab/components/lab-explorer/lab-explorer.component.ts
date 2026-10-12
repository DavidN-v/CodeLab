import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { LANGUAGE_LABEL, languageOf } from '../../engine/languages';
import { zipFiles } from '../../engine/zip';
import { LabFile } from '../../models/lab.models';
import { LabStore } from '../../services/lab-store.service';

interface Row {
  file: LabFile;
  /** Folder part of the path, shown dimmed. */
  folder: string;
  name: string;
  badge: string;
  problems: number;
}

/** The files of the project: open, create, rename, delete and download them. */
@Component({
  selector: 'app-lab-explorer',
  templateUrl: './lab-explorer.component.html',
  styleUrl: './lab-explorer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabExplorerComponent {
  protected readonly store = inject(LabStore);

  /** `''` while creating a file; the old path while renaming one; null otherwise. */
  protected readonly editing = signal<string | null>(null);
  protected readonly draft = signal('');
  protected readonly problem = signal<string | null>(null);
  /** Path waiting for the learner to confirm its deletion. */
  protected readonly confirming = signal<string | null>(null);

  protected readonly rows = computed<Row[]>(() => {
    const diagnostics = this.store.diagnostics();
    return [...this.store.project().files]
      .sort((a, b) => a.path.localeCompare(b.path))
      .map((file) => {
        const slash = file.path.lastIndexOf('/');
        return {
          file,
          folder: slash >= 0 ? file.path.slice(0, slash + 1) : '',
          name: file.path.slice(slash + 1),
          badge: LANGUAGE_LABEL[languageOf(file.path)],
          problems: diagnostics.filter((d) => d.path === file.path && d.severity === 'error').length,
        };
      });
  });

  protected startCreating(): void {
    this.editing.set('');
    this.draft.set('');
    this.problem.set(null);
  }

  protected startRenaming(path: string): void {
    this.editing.set(path);
    this.draft.set(path);
    this.problem.set(null);
  }

  protected onDraft(event: Event): void {
    this.draft.set((event.target as HTMLInputElement).value);
    this.problem.set(null);
  }

  protected commit(): void {
    const editing = this.editing();
    if (editing === null) {
      return;
    }
    const path = this.draft().trim();
    const problem = editing === '' ? this.store.addFile(path) : path === editing ? null : this.store.renameFile(editing, path);
    this.problem.set(problem);
    if (!problem) {
      this.editing.set(null);
    }
  }

  protected cancel(): void {
    this.editing.set(null);
    this.problem.set(null);
  }

  protected remove(path: string): void {
    this.store.deleteFile(path);
    this.confirming.set(null);
  }

  protected download(): void {
    const project = this.store.project();
    const url = URL.createObjectURL(zipFiles(project.files));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name.trim().replace(/[^\p{L}\p{N}_-]+/gu, '-') || 'proyecto'}.zip`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
