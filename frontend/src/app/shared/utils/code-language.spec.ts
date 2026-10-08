import { guessLanguage, isRunnable } from './code-language';

describe('code language', () => {
  it('only runs Java', () => {
    expect(isRunnable('java')).toBe(true);
    expect(isRunnable('angular')).toBe(false);
  });

  it('tells Java, templates and TypeScript apart', () => {
    expect(guessLanguage('public class Main {}')).toBe('java');
    expect(guessLanguage('<h1>{{ titulo() }}</h1>')).toBe('xml');
    expect(guessLanguage("const nombre = signal('Ada');")).toBe('typescript');
  });
});
