import type TypeScript from 'typescript';

export type Ts = typeof TypeScript;

/** Called at the top of every loop iteration; defined by the run harness. */
export const GUARD_CALL = '__labGuard();';

/**
 * Makes every loop call the guard on each iteration, so a loop that never
 * ends is stopped with an error instead of freezing the page. The edits are
 * inserted on the same line as the code they wrap: line numbers do not move.
 * Code that does not parse is returned untouched; it will not run anyway.
 */
export function guardLoops(ts: Ts, source: string, fileName: string): string {
  const file = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true);
  const edits: { at: number; text: string }[] = [];

  const visit = (node: TypeScript.Node): void => {
    if (ts.isIterationStatement(node, false)) {
      const body = node.statement;
      if (ts.isBlock(body)) {
        edits.push({ at: body.getStart(file) + 1, text: GUARD_CALL });
      } else {
        edits.push({ at: body.getStart(file), text: `{${GUARD_CALL}` });
        edits.push({ at: body.getEnd(), text: '}' });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(file);

  // Later positions first, so earlier offsets stay valid. At the same position
  // the order of the original pushes is kept (closing braces of nested loops).
  edits
    .map((edit, index) => ({ ...edit, index }))
    .sort((a, b) => b.at - a.at || b.index - a.index)
    .forEach((edit) => {
      source = source.slice(0, edit.at) + edit.text + source.slice(edit.at);
    });
  return source;
}
