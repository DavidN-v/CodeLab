/** Mirrors the API's TraceResult: a program run step by step. */
export interface TraceResult {
  status: 'TRACED' | 'COMPILATION_ERROR' | 'TOO_LONG';
  compileOutput: string;
  trace: Trace | null;
}

export interface Trace {
  steps: TraceStep[];
  stdout: string;
  stderr: string;
  exitCode: number | null;
  /** The exception that stopped the program, if any. */
  exception: { type: string; message: string | null; line: number } | null;
  /** Why the trace was cut short: too many steps or too much time. */
  stopped: 'steps' | 'time' | null;
}

/** The program just before running `line`. */
export interface TraceStep {
  line: number;
  /** Innermost call first. */
  frames: TraceFrame[];
  statics: { class: string; vars: TraceVar[] }[];
  /** Objects reachable from the variables, by id. */
  heap: Record<string, HeapObject>;
  /** Printed since the previous step. */
  out?: string;
  err?: string;
  /** A method that just returned, and its value. */
  returned?: { method: string; value: TraceValue };
}

export interface TraceFrame {
  class: string;
  method: string;
  line: number;
  vars: TraceVar[];
}

export type TraceVar = [name: string, value: TraceValue];

/**
 * p: primitive or box (t is the type), s: string, e: enum constant,
 * r: reference to a heap object, o: an object not drawn, null.
 */
export type TraceValue =
  | { k: 'p'; t: string; v: number | string | boolean }
  | { k: 's'; v: string }
  | { k: 'e'; t: string; v: string }
  | { k: 'r'; id: number }
  | { k: 'o'; t: string }
  | { k: 'null' };

export type HeapObject =
  | { kind: 'array'; type: string; length: number; items: TraceValue[] }
  | { kind: 'list' | 'set'; type: string; items: TraceValue[] }
  | { kind: 'map'; type: string; entries: [TraceValue, TraceValue][] }
  | { kind: 'object'; type: string; fields: TraceVar[] }
  | { kind: 'text'; type: string; text: string }
  | { kind: 'opaque'; type: string };
