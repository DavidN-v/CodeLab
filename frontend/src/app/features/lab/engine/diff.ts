export interface DiffLine {
  kind: 'same' | 'removed' | 'added';
  text: string;
  /** Line number in the old text, for `same` and `removed`. */
  before: number | null;
  /** Line number in the new text, for `same` and `added`. */
  after: number | null;
}

/**
 * Line-by-line comparison of two versions of a file (longest common
 * subsequence). Files in the lab are small, so the quadratic table is fine.
 */
export function diffLines(before: string, after: string): DiffLine[] {
  const a = before.split('\n');
  const b = after.split('\n');
  const common: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      common[i][j] = a[i] === b[j] ? common[i + 1][j + 1] + 1 : Math.max(common[i + 1][j], common[i][j + 1]);
    }
  }

  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      result.push({ kind: 'same', text: a[i], before: i + 1, after: j + 1 });
      i++;
      j++;
    } else if (j >= b.length || (i < a.length && common[i + 1][j] >= common[i][j + 1])) {
      result.push({ kind: 'removed', text: a[i], before: i + 1, after: null });
      i++;
    } else {
      result.push({ kind: 'added', text: b[j], before: null, after: j + 1 });
      j++;
    }
  }
  return result;
}

/** Keeps the changed lines and a few around them; `null` marks a skipped stretch. */
export function withContext(lines: readonly DiffLine[], context = 2): (DiffLine | null)[] {
  const keep = new Array<boolean>(lines.length).fill(false);
  lines.forEach((line, index) => {
    if (line.kind !== 'same') {
      for (let k = Math.max(0, index - context); k <= Math.min(lines.length - 1, index + context); k++) {
        keep[k] = true;
      }
    }
  });
  const result: (DiffLine | null)[] = [];
  lines.forEach((line, index) => {
    if (keep[index]) {
      result.push(line);
    } else if (result.length === 0 || result[result.length - 1] !== null) {
      result.push(null);
    }
  });
  return result;
}
