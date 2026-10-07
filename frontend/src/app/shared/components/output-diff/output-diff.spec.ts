import { diffOutputs } from './output-diff';

describe('diffOutputs', () => {
  it('ignores trailing spaces and blank lines, like the grader', () => {
    const diff = diffOutputs('a\nb\n', 'a  \nb\n\n');

    expect(diff.rows.every((row) => row.same)).toBe(true);
    expect(diff.hint).toBeNull();
  });

  it('points at the first different character', () => {
    const [row] = diffOutputs('Hola, Ana', 'Hola,Ana').rows;

    expect(row.firstDifference).toBe(5);
  });

  it('recognises the usual culprits', () => {
    expect(diffOutputs('Hola', 'hola').hint).toContain('mayúsculas');
    expect(diffOutputs('a = 1', 'a =1').hint).toContain('espacios');
    expect(diffOutputs('1\n2\n3', '1\n2').hint).toContain('faltan 1');
    expect(diffOutputs('1\n2', '1\n2\n3').hint).toContain('Sobran 1');
    expect(diffOutputs('x', '').hint).toContain('no ha escrito nada');
  });
});
