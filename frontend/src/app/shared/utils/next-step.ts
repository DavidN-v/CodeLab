import { NextStep } from '../../core/models/progress.model';

/** Router link to a step: the lesson page or the exercise page. */
export function stepLink(languageSlug: string, step: NextStep): string[] {
  return step.kind === 'LESSON'
    ? ['/learn', languageSlug, step.moduleSlug, step.slug]
    : ['/practice', step.slug];
}

/** "Lección: Tu primer programa" or "Ejercicio: Hola, mundo". */
export function stepLabel(step: NextStep): string {
  return `${step.kind === 'LESSON' ? 'Lección' : 'Ejercicio'}: ${step.title}`;
}
