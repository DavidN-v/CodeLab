/** One line of an expected-versus-actual comparison. */
export interface DiffRow {
  number: number;
  expected: string | null;
  actual: string | null;
  same: boolean;
  /** Position of the first different character, when both lines exist. */
  firstDifference: number | null;
}

export interface OutputDiff {
  rows: DiffRow[];
  /** What the difference most likely is, in plain words. */
  hint: string | null;
}

/** Lines without trailing spaces, and without the blank lines at the end (the grader ignores both). */
function lines(output: string): string[] {
  const all = output
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd());
  while (all.length > 0 && all[all.length - 1] === '') {
    all.pop();
  }
  return all;
}

export function diffOutputs(expected: string, actual: string): OutputDiff {
  const want = lines(expected);
  const got = lines(actual);
  const rows: DiffRow[] = [];
  for (let i = 0; i < Math.max(want.length, got.length); i++) {
    const e = i < want.length ? want[i] : null;
    const a = i < got.length ? got[i] : null;
    rows.push({
      number: i + 1,
      expected: e,
      actual: a,
      same: e === a,
      firstDifference: e !== null && a !== null && e !== a ? firstDifference(e, a) : null,
    });
  }
  return { rows, hint: hint(want, got, rows) };
}

function firstDifference(a: string, b: string): number {
  let index = 0;
  while (index < a.length && index < b.length && a[index] === b[index]) {
    index++;
  }
  return index;
}

function hint(want: string[], got: string[], rows: DiffRow[]): string | null {
  const different = rows.filter((row) => !row.same);
  if (different.length === 0) {
    return null;
  }
  if (got.length === 0) {
    return 'Tu programa no ha escrito nada. ¿Falta un System.out.println?';
  }
  const both = different.filter((row) => row.expected !== null && row.actual !== null);
  if (
    both.length > 0 &&
    both.every((row) => row.expected!.toLowerCase() === row.actual!.toLowerCase())
  ) {
    return 'Solo cambian mayúsculas y minúsculas: Java las distingue, y la salida también.';
  }
  if (both.length > 0 && both.every((row) => squash(row.expected!) === squash(row.actual!))) {
    return 'El texto es el mismo, pero no los espacios. Fíjate en los espacios alrededor de los «+» y después de los «:» o las comas.';
  }
  if (
    both.length > 0 &&
    both.every((row) => withoutPunctuation(row.expected!) === withoutPunctuation(row.actual!))
  ) {
    return 'Cambia algún signo de puntuación (punto, coma, dos puntos…). Copia el formato exacto del enunciado.';
  }
  if (got.length < want.length && rows.slice(0, got.length).every((row) => row.same)) {
    return `Las primeras líneas están bien, pero faltan ${want.length - got.length}. ¿El programa termina antes de tiempo o un bucle da menos vueltas?`;
  }
  if (got.length > want.length && rows.slice(0, want.length).every((row) => row.same)) {
    return `Sobran ${got.length - want.length} líneas al final. ¿Un bucle da una vuelta de más o imprimes algo extra?`;
  }
  if (got.length === 1 && want.length > 1 && squash(got[0]) === squash(want.join(''))) {
    return 'Has escrito todo en una línea: usa println (con «ln») para saltar de línea.';
  }
  const first = different[0];
  return `La primera diferencia está en la línea ${first.number}.`;
}

function squash(text: string): string {
  return text.replace(/\s+/g, '');
}

function withoutPunctuation(text: string): string {
  return text
    .replace(/[.,;:¡!¿?]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
