import { Trace, TraceStep } from '../../../core/models/trace.model';
import { changedVariables, describeStep, objectNumbers, outputUpTo } from './trace-steps';

const int = (v: number) => ({ k: 'p' as const, t: 'int', v });

function step(
  line: number,
  vars: [string, ReturnType<typeof int>][],
  extra: Partial<TraceStep> = {},
): TraceStep {
  return {
    line,
    frames: [{ class: 'Main', method: 'main', line, vars }],
    statics: [],
    heap: {},
    ...extra,
  };
}

const TRACE: Trace = {
  steps: [
    step(3, []),
    step(4, [['suma', int(0)]]),
    step(
      5,
      [
        ['suma', int(0)],
        ['i', int(1)],
      ],
      { heap: { '987': { kind: 'opaque', type: 'Scanner' } } },
    ),
    step(
      6,
      [
        ['suma', int(1)],
        ['i', int(1)],
      ],
      { out: 'uno\n' },
    ),
  ],
  stdout: 'uno\ndos\n',
  stderr: '',
  exitCode: 0,
  exception: null,
  stopped: null,
};

describe('trace steps', () => {
  it('numbers objects from 1 in order of appearance', () => {
    expect(objectNumbers(TRACE).get(987)).toBe(1);
  });

  it('describes new and changed variables in plain words', () => {
    const numbers = objectNumbers(TRACE);

    expect(describeStep(null, TRACE.steps[0], numbers)[0]).toContain('El programa empieza');
    expect(describeStep(TRACE.steps[0], TRACE.steps[1], numbers)).toEqual([
      'Se crea la variable suma = 0.',
    ]);
    expect(describeStep(TRACE.steps[2], TRACE.steps[3], numbers)).toEqual([
      'suma cambia de 0 a 1.',
      'Imprimió "uno\\n".',
    ]);
  });

  it('marks the variables that changed in the current call', () => {
    expect([...changedVariables(TRACE.steps[2], TRACE.steps[3])]).toEqual(['suma']);
  });

  it('accumulates output, adding what was printed after the last step', () => {
    expect(outputUpTo(TRACE, 2)).toBe('');
    expect(outputUpTo(TRACE, 3)).toBe('uno\ndos\n');
  });
});
