import { LabDiagnostic, LabFile } from '../models/lab.models';
import { CompiledProject } from './compile';
import { RuntimeTest } from './runtime';
import { SandboxDocument } from './sandbox-document';

/** What the lab asks its worker, which hosts the TypeScript compiler. */
export type EngineRequest =
  | { kind: 'build'; files: LabFile[]; tests: RuntimeTest[]; token: string }
  | { kind: 'analyze'; files: LabFile[] };

export interface BuildResult {
  compiled: CompiledProject;
  /** Null when there are syntax errors: nothing is run. */
  sandbox: SandboxDocument | null;
}

export interface AnalysisResult {
  diagnostics: LabDiagnostic[];
  /** False when the type libraries could not be loaded, so types were not checked. */
  typesChecked: boolean;
}

export interface EngineEnvelope {
  id: number;
  /** Where the compiler and its libraries are served from. */
  baseUrl: string;
  request: EngineRequest;
}

export type EngineReply =
  | { id: number; ok: true; result: BuildResult | AnalysisResult }
  | { id: number; ok: false; error: string };
