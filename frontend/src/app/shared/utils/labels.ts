import { Difficulty, ExerciseKind } from '../../core/models/course.model';
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

export const KIND_LABELS: Readonly<Record<ExerciseKind, string>> = {
  CODE: 'Escribe el programa',
  FIX: 'Encuentra el error',
  FILL: 'Completa los huecos',
  PARSONS: 'Ordena las líneas',
  PREDICT: '¿Qué imprime?',
  PROJECT: 'Proyecto',
};

/** Short icon shown next to the kind in listings. */
export const KIND_ICONS: Readonly<Record<ExerciseKind, string>> = {
  CODE: '⌨',
  FIX: '🐞',
  FILL: '▭',
  PARSONS: '⇅',
  PREDICT: '👁',
  PROJECT: '🛠',
};

/** What to do, in one sentence, above the work area. */
export const KIND_INSTRUCTIONS: Readonly<Record<ExerciseKind, string>> = {
  CODE: 'Escribe el programa en el editor, pruébalo con «Ejecutar» y envíalo cuando funcione.',
  FIX: 'Este programa tiene un error. Encuéntralo, arréglalo y envíalo.',
  FILL: 'Escribe en cada hueco lo que falta para que el programa funcione.',
  PARSONS: 'Pon las líneas en el orden correcto. Ojo: puede que sobre alguna.',
  PREDICT: 'Lee el código sin ejecutarlo y escribe exactamente lo que pide el enunciado.',
  PROJECT: 'Un programa más grande: avanza paso a paso y ejecuta a menudo.',
};
