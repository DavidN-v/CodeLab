import { NextStep } from '../../core/models/progress.model';
import { stepLabel, stepLink } from './next-step';

const step = (kind: NextStep['kind']): NextStep => ({
  kind,
  slug: 'hola-mundo',
  title: 'Hola, mundo',
  moduleSlug: 'fundamentos',
  moduleTitle: 'Fundamentos',
  modulePosition: 1,
});

describe('next step', () => {
  it('links lessons to the lesson page and exercises to the exercise page', () => {
    expect(stepLink('java', step('LESSON'))).toEqual([
      '/learn',
      'java',
      'fundamentos',
      'hola-mundo',
    ]);
    expect(stepLink('java', step('EXERCISE'))).toEqual(['/practice', 'hola-mundo']);
  });

  it('says what kind of step it is', () => {
    expect(stepLabel(step('EXERCISE'))).toBe('Ejercicio: Hola, mundo');
  });
});
