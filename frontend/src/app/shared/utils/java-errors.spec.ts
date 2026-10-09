import { explainCompileErrors, explainRuntimeError } from './java-errors';

describe('explainCompileErrors', () => {
  it('explains each javac error with its line', () => {
    const errors = explainCompileErrors(
      [
        "Main.java:3: error: ';' expected",
        '        System.out.println("Hola")',
        '                                  ^',
        'Main.java:5: error: cannot find symbol',
        '        int total = sumaa + 1;',
        '                    ^',
        '  symbol:   variable sumaa',
        '  location: class Main',
        '2 errors',
      ].join('\n'),
    );

    expect(errors).toHaveLength(2);
    expect(errors[0]).toMatchObject({ line: 3, title: 'Falta un punto y coma' });
    expect(errors[1].title).toBe('Java no conoce la variable «sumaa»');
  });

  it('turns lossy conversions into plain words', () => {
    const [error] = explainCompileErrors(
      'Main.java:4: error: incompatible types: possible lossy conversion from double to int',
    );

    expect(error.title).toBe('Un double no cabe en un int');
  });

  it('still says something useful for unknown messages', () => {
    const [error] = explainCompileErrors('Main.java:9: error: something new');

    expect(error).toMatchObject({ line: 9, title: 'Error de compilación' });
  });
});

describe('explainRuntimeError', () => {
  it('finds the exception and the line in the learner code', () => {
    const error = explainRuntimeError(
      [
        'Exception in thread "main" java.lang.ArrayIndexOutOfBoundsException: Index 3 out of bounds for length 3',
        '\tat Main.main(Main.java:6)',
      ].join('\n'),
    );

    expect(error).toMatchObject({ line: 6, title: 'Posición fuera del array' });
    expect(error?.explanation).toContain('de 0 a 2');
  });

  it('returns null when there is no exception', () => {
    expect(explainRuntimeError('aviso cualquiera')).toBeNull();
  });
});
