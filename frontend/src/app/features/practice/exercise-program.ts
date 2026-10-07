import { ExerciseDetail } from '../../core/models/exercise.model';

const BLANK = '{{?}}';
const LINES = '{{lines}}';

/** The starter of a fill exercise with each blank replaced by its answer. */
export function fillProgram(template: string, answers: readonly string[]): string {
  const pieces = template.split(BLANK);
  return pieces.reduce(
    (program, piece, index) => (index === 0 ? piece : program + (answers[index - 1] ?? '') + piece),
    '',
  );
}

/** The skeleton of a parsons exercise with the chosen lines in place. */
export function parsonsProgram(template: string, lines: readonly string[]): string {
  return template
    .split('\n')
    .flatMap((line) => (line.trim() === LINES ? lines : [line]))
    .join('\n');
}

export function blankCount(exercise: ExerciseDetail): number {
  return exercise.starterCode.split(BLANK).length - 1;
}
