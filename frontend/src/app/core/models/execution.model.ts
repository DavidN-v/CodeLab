export type ExecutionOutcome = 'SUCCESS' | 'COMPILATION_ERROR' | 'RUNTIME_ERROR' | 'TIMEOUT';

/** Mirrors the API's ExecutionResult. */
export interface ExecutionResult {
  status: ExecutionOutcome;
  compileOutput: string;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number;
  outputTruncated: boolean;
}
