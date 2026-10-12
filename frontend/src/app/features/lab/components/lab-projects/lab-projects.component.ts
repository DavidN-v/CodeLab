import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CatalogEntry, TEMPLATES } from '../../data/lab-catalog';
import { LabMode, LabProjectSummary } from '../../models/lab.models';
import { LabStore } from '../../services/lab-store.service';

const MODE_LABEL: Record<LabMode, string> = {
  free: 'Libre',
  tutor: 'Tutor',
  challenge: 'Desafío',
  debug: 'Depuración',
};

/** The learner's projects: name this one, keep save points, open, copy or delete others. */
@Component({
  selector: 'app-lab-projects',
  imports: [DatePipe, RouterLink],
  templateUrl: './lab-projects.component.html',
  styleUrl: './lab-projects.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabProjectsComponent {
  protected readonly store = inject(LabStore);
  protected readonly modes = MODE_LABEL;
  protected readonly templates = TEMPLATES;

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected readonly name = signal('');
  protected readonly description = signal('');
  protected readonly folder = signal('');
  protected readonly versionLabel = signal('');
  /** Id of the project being moved, and the folder typed for it. */
  protected readonly moving = signal<number | null>(null);
  protected readonly target = signal('');

  /** The folders in use, in alphabetical order. */
  protected readonly folders = computed(() =>
    [...new Set((this.store.savedProjects() ?? []).map((project) => project.folder).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, 'es'),
    ),
  );
  /** The saved projects by folder; those in no folder come last. */
  protected readonly groups = computed<{ folder: string; projects: LabProjectSummary[] }[]>(() => {
    const projects = this.store.savedProjects() ?? [];
    const groups = this.folders().map((folder) => ({
      folder,
      projects: projects.filter((project) => project.folder === folder),
    }));
    const loose = projects.filter((project) => !project.folder);
    return loose.length > 0 ? [...groups, { folder: '', projects: loose }] : groups;
  });
  /** Id of the project waiting for the learner to confirm its deletion. */
  protected readonly deleting = signal<number | null>(null);
  protected readonly restoring = signal<number | null>(null);
  protected readonly busy = signal(false);

  open(): void {
    const project = this.store.project();
    this.name.set(project.name);
    this.description.set(project.description);
    this.folder.set(project.folder);
    this.moving.set(null);
    this.deleting.set(null);
    this.restoring.set(null);
    this.dialog().nativeElement.showModal();
    void this.store.loadProjects();
    void this.store.loadVersions();
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }

  protected read(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected async saveDetails(): Promise<void> {
    this.store.rename(this.name(), this.description(), this.folder());
    await this.guard(() => this.store.save());
    // Saving changes the list below: its name, its folder, or a project that was not there.
    await this.store.loadProjects();
  }

  protected async saveVersion(): Promise<void> {
    this.store.rename(this.name(), this.description(), this.folder());
    const saved = await this.guard(() => this.store.saveVersion(this.versionLabel().trim()));
    if (saved) {
      this.versionLabel.set('');
    }
    await this.store.loadProjects();
  }

  protected async restore(versionId: number): Promise<void> {
    await this.guard(() => this.store.restoreVersion(versionId));
    this.restoring.set(null);
  }

  protected async openProject(id: number): Promise<void> {
    await this.guard(() => this.store.openProject(id));
    this.close();
  }

  protected startMove(project: LabProjectSummary): void {
    this.target.set(project.folder);
    this.deleting.set(null);
    this.moving.set(project.id);
  }

  protected async move(id: number): Promise<void> {
    await this.guard(() => this.store.moveProject(id, this.target()));
    if (id === this.store.project().id) {
      this.folder.set(this.store.project().folder);
    }
    this.moving.set(null);
  }

  protected async duplicate(id: number): Promise<void> {
    await this.guard(() => this.store.duplicateProject(id));
  }

  protected async remove(id: number): Promise<void> {
    await this.guard(() => this.store.deleteProject(id));
    this.deleting.set(null);
  }

  protected startNew(template: CatalogEntry): void {
    this.store.startFrom(template);
    this.close();
  }

  private async guard<T>(action: () => Promise<T>): Promise<T | null> {
    if (this.busy()) {
      return null;
    }
    this.busy.set(true);
    try {
      return await action();
    } finally {
      this.busy.set(false);
    }
  }
}
