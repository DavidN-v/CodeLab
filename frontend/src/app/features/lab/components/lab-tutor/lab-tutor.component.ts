import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { TutorService } from '../../../../core/services/tutor.service';
import { MarkdownComponent } from '../../../../shared/components/markdown/markdown.component';
import { diffLines, withContext } from '../../engine/diff';
import { LabStore } from '../../services/lab-store.service';

interface HelpLevel {
  level: number;
  label: string;
  hint: string;
}

const LEVELS: HelpLevel[] = [
  { level: 1, label: 'Una pista', hint: 'Una o dos frases que orientan, sin código.' },
  { level: 2, label: 'El concepto', hint: 'La idea de programación que hay detrás, con otro ejemplo.' },
  { level: 3, label: 'Dónde mirar', hint: 'En qué zona buscar y qué comprobar, sin dar la solución.' },
  { level: 4, label: 'Un ejemplo', hint: 'El fragmento corregido, con el antes y el después.' },
];

/**
 * Help in steps: the learner chooses how much. A correction of their code is
 * only requested on purpose, shown as a comparison and applied if they accept.
 */
@Component({
  selector: 'app-lab-tutor',
  imports: [MarkdownComponent, RouterLink],
  templateUrl: './lab-tutor.component.html',
  styleUrl: './lab-tutor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabTutorComponent {
  protected readonly store = inject(LabStore);
  protected readonly levels = LEVELS;

  /** Undefined while the server is being asked whether it has a tutor. */
  protected readonly enabled = toSignal(inject(TutorService).isEnabled());
  protected readonly question = signal('');

  /** The proposed correction as a line-by-line comparison. */
  protected readonly comparison = computed(() => {
    const proposal = this.store.proposal();
    return proposal ? withContext(diffLines(proposal.before, proposal.after)) : [];
  });

  protected onQuestion(event: Event): void {
    this.question.set((event.target as HTMLInputElement).value);
  }

  protected ask(level: number): void {
    void this.store.help(level, this.question().trim());
    this.question.set('');
  }

  protected requestFix(): void {
    const file = this.store.activeFile();
    if (file) {
      void this.store.requestFix(file.path);
    }
  }

  /** Applies the correction and checks it for real, instead of trusting it. */
  protected acceptAndTest(): void {
    this.store.acceptProposal();
    void this.store.run(true);
  }
}
