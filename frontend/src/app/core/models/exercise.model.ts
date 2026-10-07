import { CourseRef, Difficulty, ExerciseKind, ExerciseSummary, ModuleRef } from './course.model';
import { Celebration } from './progress.model';

export interface SampleTest {
  input: string;
  /** Null for PREDICT exercises: the output is the answer. */
  expectedOutput: string | null;
}

/** Mirrors the API's ExerciseDetail: no hidden tests, hints or solution. */
export interface ExerciseDetail {
  id: number;
  slug: string;
  title: string;
  summary: string;
  difficulty: Difficulty;
  kind: ExerciseKind;
  statementMarkdown: string;
  /** FILL: with {{?}} blanks. PARSONS: with a {{lines}} line. PREDICT: the program to read. */
  starterCode: string;
  /** PARSONS only: the lines to order, shuffled, some of them extra. */
  parsonsLines: string[] | null;
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
  'ACCEPTED' | 'WRONG_ANSWER' | 'COMPILATION_ERROR' | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED';

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
  /** A plain-language note, e.g. which lines of a prediction are right. */
  feedback: string | null;
  /** This solve counted as a due spaced review. */
  reviewPassed: boolean;
  celebration: Celebration | null;
}

/** What is sent to grade an exercise. */
export interface SubmissionRequest {
  /** The program; for PREDICT, the predicted output. */
  sourceCode?: string;
  /** FILL: one answer per blank. PARSONS: the chosen lines in order. */
  parts?: string[];
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
  /** Solved, and due for a spaced review. */
  reviewDue: boolean;
}

export interface Solution {
  solutionCode: string;
}
