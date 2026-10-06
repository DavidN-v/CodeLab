import { CourseRef, Difficulty, ExerciseSummary, ModuleRef } from './course.model';

export interface SampleTest {
  input: string;
  expectedOutput: string;
}

/** Mirrors the API's ExerciseDetail: no hidden tests, hints or solution. */
export interface ExerciseDetail {
  id: number;
  slug: string;
  title: string;
  summary: string;
  difficulty: Difficulty;
  statementMarkdown: string;
  starterCode: string;
  samples: SampleTest[];
  totalTests: number;
  hintCount: number;
  /** Experience for solving it without help. */
  xp: number;
  course: CourseRef;
  module: ModuleRef;
  previous: ExerciseSummary | null;
  next: ExerciseSummary | null;
}

export type SubmissionStatus =
  | 'ACCEPTED'
  | 'WRONG_ANSWER'
  | 'COMPILATION_ERROR'
  | 'RUNTIME_ERROR'
  | 'TIME_LIMIT_EXCEEDED';

export type TestOutcome = 'PASSED' | 'WRONG_OUTPUT' | 'RUNTIME_ERROR' | 'TIMEOUT' | 'NOT_RUN';

/** Input and outputs are only present for sample cases. */
export interface TestResult {
  position: number;
  sample: boolean;
  outcome: TestOutcome;
  input: string | null;
  expectedOutput: string | null;
  actualOutput: string | null;
  stderr: string | null;
}

export interface SubmissionResult {
  id: number;
  status: SubmissionStatus;
  passedTests: number;
  totalTests: number;
  executionTimeMs: number | null;
  compileOutput: string | null;
  tests: TestResult[];
  firstSolve: boolean;
  xpAwarded: number;
}

export interface SubmissionSummary {
  id: number;
  status: SubmissionStatus;
  passedTests: number;
  totalTests: number;
  createdAt: string;
}

export interface ExerciseProgress {
  attempts: number;
  solved: boolean;
  solvedAt: string | null;
  /** Hints revealed so far, in order. */
  hints: string[];
  hintCount: number;
  solutionViewed: boolean;
  /** Experience a correct submission would earn now, or did earn. */
  xp: number;
  lastSubmittedCode: string | null;
  recentSubmissions: SubmissionSummary[];
}

export interface Solution {
  solutionCode: string;
}
