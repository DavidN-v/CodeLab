import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CatalogEntry, TEMPLATES } from '../../data/lab-catalog';
import { LabMode } from '../../models/lab.models';
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
  protected readonly versionLabel = signal('');
  /** Id of the project waiting for the learner to confirm its deletion. */
  protected readonly deleting = signal<number | null>(null);
  protected readonly restoring = signal<number | null>(null);
  protected readonly busy = signal(false);

  open(): void {
    const project = this.store.project();
    this.name.set(project.name);
    this.description.set(project.description);
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
    this.store.rename(this.name(), this.description());
    await this.guard(() => this.store.save());
  }

  protected async saveVersion(): Promise<void> {
    this.store.rename(this.name(), this.description());
    const saved = await this.guard(() => this.store.saveVersion(this.versionLabel().trim()));
    if (saved) {
      this.versionLabel.set('');
    }
  }

  protected async restore(versionId: number): Promise<void> {
    await this.guard(() => this.store.restoreVersion(versionId));
    this.restoring.set(null);
  }

  protected async openProject(id: number): Promise<void> {
    await this.guard(() => this.store.openProject(id));
    this.close();
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
