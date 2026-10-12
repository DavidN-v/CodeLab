import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { TutorService } from '../../../../core/services/tutor.service';
import { MarkdownComponent } from '../../../../shared/components/markdown/markdown.component';
import { CHALLENGES, CatalogEntry, DEBUG_EXERCISES, TEMPLATES } from '../../data/lab-catalog';
import { LabStore } from '../../services/lab-store.service';

/**
 * What the learner is building and how far they are: their idea and its plan
 * in free and tutor modes, the statement of the exercise in challenge and
 * debugging modes.
 */
@Component({
  selector: 'app-lab-guide',
  imports: [MarkdownComponent, NgTemplateOutlet, RouterLink],
  templateUrl: './lab-guide.component.html',
  styleUrl: './lab-guide.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabGuideComponent {
  protected readonly store = inject(LabStore);

  /** A tutor answer is on its way: show the tutor panel. */
  readonly asked = output<void>();

  /** Undefined while the server is being asked whether it has a tutor. */
  protected readonly tutorEnabled = toSignal(inject(TutorService).isEnabled());

  protected readonly idea = signal<string | null>(null);
  protected readonly answers = signal('');
  /** The catalogue entry waiting for confirmation before it replaces the project. */
  protected readonly confirming = signal<string | null>(null);
  protected readonly browsing = signal(false);

  protected readonly mode = computed(() => this.store.project().mode);
  protected readonly isExerciseMode = computed(() => this.mode() === 'challenge' || this.mode() === 'debug');
  /** The exercise on screen, when it belongs to the selected mode. */
  protected readonly exercise = computed(() => {
    const exercise = this.store.exercise();
    return exercise && exercise.mode === this.mode() ? exercise : null;
  });
  protected readonly options = computed<CatalogEntry[]>(() =>
    this.mode() === 'challenge' ? CHALLENGES : this.mode() === 'debug' ? DEBUG_EXERCISES : TEMPLATES,
  );
  protected readonly ideaText = computed(() => this.idea() ?? this.store.project().idea);
  protected readonly plan = computed(() => this.store.project().plan);

  protected read(event: Event): string {
    return (event.target as HTMLTextAreaElement).value;
  }

  protected onIdea(event: Event): void {
    this.idea.set(this.read(event));
  }

  protected keepIdea(): void {
    const idea = this.idea();
    if (idea !== null && idea !== this.store.project().idea) {
      this.store.setIdea(idea.trim());
    }
  }

  protected async makePlan(): Promise<void> {
    const idea = this.ideaText().trim();
    if (!idea) {
      return;
    }
    await this.store.planIdea(idea, this.answers().trim());
    this.answers.set('');
  }

  protected explainStep(step: string): void {
    this.asked.emit();
    void this.store.help(2, `Explícame cómo hacer este paso de mi plan: ${step}`);
  }

  protected start(entry: CatalogEntry): void {
    this.store.startFrom(entry);
    this.confirming.set(null);
    this.browsing.set(false);
    this.idea.set(null);
  }
}
