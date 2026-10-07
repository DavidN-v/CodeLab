import {
  HeapObject,
  Trace,
  TraceStep,
  TraceValue,
  TraceVar,
} from '../../../core/models/trace.model';

/**
 * Objects keep their JVM id across steps, which is a large arbitrary number.
 * The learner sees them numbered 1, 2, 3… in order of first appearance.
 */
export function objectNumbers(trace: Trace): Map<number, number> {
  const numbers = new Map<number, number>();
  for (const step of trace.steps) {
    for (const id of Object.keys(step.heap)) {
      const key = Number(id);
      if (!numbers.has(key)) {
        numbers.set(key, numbers.size + 1);
      }
    }
  }
  return numbers;
}

/** Everything printed up to and including a step. */
export function outputUpTo(trace: Trace, index: number): string {
  let output = '';
  for (let i = 0; i <= index && i < trace.steps.length; i++) {
    output += trace.steps[i].out ?? '';
    output += trace.steps[i].err ?? '';
  }
  return index >= trace.steps.length - 1 ? output + remainingOutput(trace, output) : output;
}

/** Output printed after the last traced step, e.g. by the final println. */
function remainingOutput(trace: Trace, shown: string): string {
  return trace.stdout.startsWith(shown) ? trace.stdout.slice(shown.length) : '';
}

/** A value as a short text: 5, "hola", 'a', true, null, objeto 2. */
export function formatValue(value: TraceValue, numbers: Map<number, number>): string {
  switch (value.k) {
    case 'p':
      return value.t === 'char' || value.t === 'Character' ? `'${value.v}'` : String(value.v);
    case 's':
      return JSON.stringify(value.v);
    case 'e':
      return `${value.t}.${value.v}`;
    case 'r':
      return `objeto ${numbers.get(value.id) ?? '?'}`;
    case 'o':
      return value.t;
    case 'null':
      return 'null';
  }
}

function sameValue(a: TraceValue, b: TraceValue): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Variables of the current frame that are new or changed since the previous step. */
export function changedVariables(previous: TraceStep | null, step: TraceStep): Set<string> {
  const changed = new Set<string>();
  const current = step.frames[0];
  if (!current) {
    return changed;
  }
  const before = previous?.frames.find(
    (frame) =>
      frame.method === current.method &&
      frame.class === current.class &&
      previous.frames.length - previous.frames.indexOf(frame) === step.frames.length,
  );
  for (const [name, value] of current.vars) {
    const old = before?.vars.find(([oldName]) => oldName === name);
    if (!old || !sameValue(old[1], value) || heapChanged(previous, step, value)) {
      changed.add(name);
    }
  }
  return changed;
}

/** Whether the object a variable points to changed inside (an array cell, a field…). */
function heapChanged(previous: TraceStep | null, step: TraceStep, value: TraceValue): boolean {
  if (value.k !== 'r' || !previous) {
    return false;
  }
  const before = previous.heap[value.id];
  const after = step.heap[value.id];
  return (
    before !== undefined && after !== undefined && JSON.stringify(before) !== JSON.stringify(after)
  );
}

/**
 * What happened between the previous step and this one, in plain words:
 * a method was called or returned, variables changed, something was printed.
 */
export function describeStep(
  previous: TraceStep | null,
  step: TraceStep,
  numbers: Map<number, number>,
): string[] {
  const notes: string[] = [];
  if (!previous) {
    notes.push(`El programa empieza. La primera línea que se ejecuta es la ${step.line}.`);
    return notes;
  }
  if (step.frames.length > previous.frames.length && step.frames[0]) {
    const args = step.frames[0].vars.filter(([name]) => name !== 'this');
    notes.push(
      `Se llama al método ${step.frames[0].method}` +
        (args.length > 0
          ? ` con ${args.map(([name, value]) => `${name} = ${formatValue(value, numbers)}`).join(', ')}.`
          : '.'),
    );
  }
  if (step.returned) {
    notes.push(
      `${step.returned.method} terminó y devolvió ${formatValue(step.returned.value, numbers)}.`,
    );
  } else if (step.frames.length < previous.frames.length && previous.frames[0]) {
    notes.push(`${previous.frames[0].method} terminó.`);
  }
  if (step.frames.length === previous.frames.length) {
    for (const note of variableNotes(previous, step, numbers)) {
      notes.push(note);
    }
  }
  if (step.out) {
    notes.push(`Imprimió ${JSON.stringify(step.out)}.`);
  }
  if (notes.length === 0) {
    notes.push(
      step.line < previous.line
        ? `Vuelve a la línea ${step.line}: empieza otra vuelta o se comprueba la condición.`
        : `Pasa a la línea ${step.line}.`,
    );
  }
  return notes;
}

function variableNotes(
  previous: TraceStep,
  step: TraceStep,
  numbers: Map<number, number>,
): string[] {
  const notes: string[] = [];
  const before = new Map<string, TraceValue>(previous.frames[0]?.vars ?? []);
  for (const [name, value] of step.frames[0]?.vars ?? []) {
    const old = before.get(name);
    if (old === undefined) {
      notes.push(`Se crea la variable ${name} = ${formatValue(value, numbers)}.`);
    } else if (!sameValue(old, value)) {
      notes.push(
        `${name} cambia de ${formatValue(old, numbers)} a ${formatValue(value, numbers)}.`,
      );
    } else if (heapChanged(previous, step, value)) {
      notes.push(
        `Cambia el contenido de ${name} (objeto ${numbers.get((value as { id: number }).id)}).`,
      );
    }
  }
  return notes;
}

/** Rows to draw for an object, whatever its kind. */
export function objectRows(object: HeapObject): { label: string; value: TraceValue }[] {
  switch (object.kind) {
    case 'array':
    case 'list':
      return object.items.map((value, index) => ({ label: String(index), value }));
    case 'set':
      return object.items.map((value) => ({ label: '•', value }));
    case 'object':
      return object.fields.map(([label, value]: TraceVar) => ({ label, value }));
    default:
      return [];
  }
}
