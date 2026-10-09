import { fillProgram, parsonsProgram } from './exercise-program';

describe('exercise programs', () => {
  it('fills each blank with its answer, leaving missing ones empty', () => {
    expect(fillProgram('for (int i = {{?}}; i {{?}} 3; i++)', ['0', '<'])).toBe(
      'for (int i = 0; i < 3; i++)',
    );
    expect(fillProgram('a{{?}}b{{?}}c', ['1'])).toBe('a1bc');
  });

  it('puts the chosen lines where the marker is', () => {
    expect(parsonsProgram('class A {\n{{lines}}\n}', ['  int a;', '  int b;'])).toBe(
      'class A {\n  int a;\n  int b;\n}',
    );
  });
});
