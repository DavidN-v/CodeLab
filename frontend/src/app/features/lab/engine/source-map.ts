const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Reads the `mappings` of a source map and returns, for each generated line
 * (0-based index), the original line (1-based) its first token came from, or
 * 0 when the line has no mapping. Enough to point an error at the learner's
 * own line after TypeScript has been compiled.
 */
export function originalLines(mappings: string): number[] {
  const result: number[] = [];
  let sourceLine = 0;
  for (const line of mappings.split(';')) {
    let first = 0;
    for (const segment of line.split(',')) {
      if (!segment) {
        continue;
      }
      const fields = decodeSegment(segment);
      // [generatedColumn, sourceIndex, sourceLine, sourceColumn, name?]
      if (fields.length >= 4) {
        sourceLine += fields[2];
        first ||= sourceLine + 1;
      }
    }
    result.push(first);
  }
  return result;
}

function decodeSegment(segment: string): number[] {
  const values: number[] = [];
  let value = 0;
  let shift = 0;
  for (const char of segment) {
    const digit = BASE64.indexOf(char);
    if (digit < 0) {
      return values;
    }
    value += (digit & 31) << shift;
    if (digit & 32) {
      shift += 5;
    } else {
      values.push(value & 1 ? -(value >> 1) : value >> 1);
      value = 0;
      shift = 0;
    }
  }
  return values;
}
