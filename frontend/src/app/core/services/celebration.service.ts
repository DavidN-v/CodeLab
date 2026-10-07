import { Injectable, signal } from '@angular/core';

import { Celebration } from '../models/progress.model';

export interface CelebrationMessage {
  icon: string;
  title: string;
  message: string;
}

/**
 * Milestones worth a moment of joy: a solved exercise (confetti), a new level
 * or a completed module (confetti and a card). Rendered by the celebration
 * outlet in the app shell.
 */
@Injectable({ providedIn: 'root' })
export class CelebrationService {
  /** Increments to fire a burst of confetti. */
  readonly bursts = signal(0);
  readonly message = signal<CelebrationMessage | null>(null);

  confetti(): void {
    this.bursts.update((count) => count + 1);
  }

  /** Confetti, plus a card when the action reached a milestone. */
  celebrate(celebration: Celebration | null): void {
    this.confetti();
    if (!celebration) {
      return;
    }
    if (celebration.completedModule) {
      const level = celebration.newLevel
        ? ` Y subes al nivel ${celebration.newLevel.number}: ${celebration.newLevel.title}.`
        : '';
      this.message.set({
        icon: '🏆',
        title: '¡Módulo completado!',
        message: `Has terminado «${celebration.completedModule.title}»: todas sus lecciones y ejercicios.${level}`,
      });
    } else if (celebration.newLevel) {
      this.message.set({
        icon: '⭐',
        title: `¡Nivel ${celebration.newLevel.number}!`,
        message: `Ahora eres ${celebration.newLevel.title}. Sigue así.`,
      });
    }
  }

  dismiss(): void {
    this.message.set(null);
  }
}
