import { Difficulty } from '../../core/models/course.model';
import { SubmissionStatus, TestOutcome } from '../../core/models/exercise.model';

export const DIFFICULTY_LABELS: Readonly<Record<Difficulty, string>> = {
  EASY: 'Fácil',
  MEDIUM: 'Media',
  HARD: 'Difícil',
};

/** Modifier of the `.tag` class for each difficulty. */
export const DIFFICULTY_TAGS: Readonly<Record<Difficulty, string>> = {
  EASY: 'tag--easy',
  MEDIUM: 'tag--medium',
  HARD: 'tag--hard',
};

export const SUBMISSION_LABELS: Readonly<Record<SubmissionStatus, string>> = {
  ACCEPTED: 'Correcto',
  WRONG_ANSWER: 'Respuesta incorrecta',
  COMPILATION_ERROR: 'Error de compilación',
  RUNTIME_ERROR: 'Error de ejecución',
  TIME_LIMIT_EXCEEDED: 'Tiempo agotado',
};

export const TEST_OUTCOME_LABELS: Readonly<Record<TestOutcome, string>> = {
  PASSED: 'Superado',
  WRONG_OUTPUT: 'Salida distinta',
  RUNTIME_ERROR: 'Error de ejecución',
  TIMEOUT: 'Tiempo agotado',
  NOT_RUN: 'No ejecutado',
};

/** "1 lección", "3 lecciones". */
export function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}
