/** Languages the lab can edit, analyse and run. */
export type LabLanguage = 'html' | 'css' | 'javascript' | 'typescript' | 'java' | 'text';

export interface LabFile {
  /** Path inside the project, e.g. `index.html` or `js/main.ts`. */
  path: string;
  content: string;
}

export type LabMode = 'free' | 'tutor' | 'challenge' | 'debug';

/** Who wrote a test: it decides how much the learner should trust it as "the" requirement. */
export type LabTestOrigin = 'student' | 'tutor' | 'catalog';

export interface LabTest {
  id: string;
  description: string;
  /** JavaScript evaluated after the project's code has loaded, e.g. `sumar(2, 3)`. */
  expression: string;
  /** JavaScript with the expected value, e.g. `5` or `"hola"`. */
  expected: string;
  origin: LabTestOrigin;
}

/** An idea turned into something programmable; written by the tutor, edited by the learner. */
export interface LabPlan {
  goal: string;
  questions: string[];
  requirements: string[];
  steps: string[];
  concepts: string[];
}

/** Everything the frontend keeps about a project; stored by the API as one JSON document. */
export interface LabContent {
  idea: string;
  files: LabFile[];
  tests: LabTest[];
  plan: LabPlan | null;
  /** Steps of the plan the learner has ticked. */
  doneSteps: number[];
  /** The challenge or debugging exercise this project started from, if any. */
  catalogId: string | null;
}

export interface LabProject extends LabContent {
  /** Null until it is saved in the learner's account. */
  id: number | null;
  name: string;
  description: string;
  mode: LabMode;
  /** The learner's own grouping ("Java", "HTML"); empty when it is in no folder. */
  folder: string;
}

export interface LabProjectSummary {
  id: number;
  name: string;
  description: string;
  mode: LabMode;
  folder: string;
  updatedAt: string;
}

export interface LabVersion {
  id: number;
  label: string;
  createdAt: string;
}

export type DiagnosticCategory = 'syntax' | 'types' | 'runtime' | 'logic' | 'practice' | 'security';

export type DiagnosticSeverity = 'error' | 'warning' | 'info';

/** The seven things the learner should know about a problem. */
export interface DiagnosticLesson {
  why: string;
  consequence: string;
  fix: string;
  example: string;
  concept: string;
}

export interface LabDiagnostic {
  category: DiagnosticCategory;
  severity: DiagnosticSeverity;
  /**
   * True when a tool demonstrated it (the compiler, the browser, a failing
   * test). False for a rule that only suspects a problem from reading the code.
   */
  confirmed: boolean;
  /** Which tool reported it, shown to the learner. */
  source: string;
  code: string;
  message: string;
  /** Null when the problem is not tied to a file, e.g. a failing test. */
  path: string | null;
  /** 1-based; 0 when unknown. */
  line: number;
  column: number;
  lesson: DiagnosticLesson | null;
}

export type ConsoleLevel = 'log' | 'info' | 'warn' | 'error' | 'debug' | 'system';

export interface ConsoleEntry {
  level: ConsoleLevel;
  text: string;
  /** Where a runtime error happened, when the browser reported it. */
  path?: string;
  line?: number;
}

export type RunStatus = 'idle' | 'running' | 'ok' | 'error' | 'timeout' | 'blocked';

export type TestStatus = 'pass' | 'fail' | 'error';

export interface TestOutcome {
  testId: string;
  status: TestStatus;
  /** What the expression really produced, formatted. */
  actual: string;
  /** What the expected value evaluated to, formatted. */
  expected: string;
  /** Why it could not be evaluated, when status is `error`. */
  error: string;
}

/** A correction proposed by the tutor, waiting for the learner's decision. */
export interface LabProposal {
  path: string;
  before: string;
  after: string;
  explanation: string;
}

export const EMPTY_CONTENT: LabContent = {
  idea: '',
  files: [],
  tests: [],
  plan: null,
  doneSteps: [],
  catalogId: null,
};
