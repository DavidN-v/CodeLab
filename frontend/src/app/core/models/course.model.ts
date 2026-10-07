import { Language } from './language.model';

/** Mirrors the API's CourseSummary schema. */
export interface CourseSummary {
  id: number;
  slug: string;
  title: string;
  summary: string;
  languageSlug: string;
}

/** A module as listed in its course outline. Mirrors ModuleSummary. */
export interface ModuleSummary {
  id: number;
  slug: string;
  title: string;
  summary: string;
  /** 1-based position inside the course. */
  position: number;
  published: boolean;
  lessonCount: number;
  exerciseCount: number;
  estimatedMinutes: number;
}

export interface CourseDetail {
  id: number;
  slug: string;
  title: string;
  summary: string;
  description: string | null;
  language: Language;
  modules: ModuleSummary[];
}

export interface CourseRef {
  id: number;
  slug: string;
  title: string;
  languageSlug: string;
  languageName: string;
}

export interface ModuleRef {
  id: number;
  slug: string;
  title: string;
  position: number;
}

/** A lesson to link to, possibly in another module. */
export interface LessonRef {
  id: number;
  slug: string;
  title: string;
  moduleSlug: string;
  moduleTitle: string;
}

export interface LessonSummary {
  id: number;
  slug: string;
  title: string;
  summary: string;
  estimatedMinutes: number;
  position: number;
}

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

/** What the learner does: write, repair, complete, order, predict, or build a project. */
export type ExerciseKind = 'CODE' | 'FIX' | 'FILL' | 'PARSONS' | 'PREDICT' | 'PROJECT';

export interface ExerciseSummary {
  id: number;
  slug: string;
  title: string;
  summary: string;
  difficulty: Difficulty;
  kind: ExerciseKind;
  module: ModuleRef;
}

export interface ModuleDetail {
  id: number;
  slug: string;
  title: string;
  summary: string;
  position: number;
  course: CourseRef;
  lessons: LessonSummary[];
  exercises: ExerciseSummary[];
  previous: ModuleRef | null;
  next: ModuleRef | null;
}

export interface LessonDetail {
  id: number;
  slug: string;
  title: string;
  summary: string;
  estimatedMinutes: number;
  position: number;
  /** CommonMark. */
  contentMarkdown: string;
  course: CourseRef;
  module: ModuleRef;
  previous: LessonRef | null;
  next: LessonRef | null;
  /** Questions at the end of the lesson; empty when it has none. */
  quiz: QuizQuestion[];
}

/** A self-assessment question. The answer travels with it. */
export interface QuizQuestion {
  type: 'CHOICE' | 'OUTPUT';
  /** CommonMark. */
  prompt: string;
  code: string | null;
  /** CHOICE only. */
  options: string[] | null;
  correctOption: number | null;
  /** OUTPUT only. */
  expectedOutput: string | null;
  input: string | null;
  /** CommonMark. */
  explanation: string;
}

export interface GlossaryTerm {
  term: string;
  aliases: string[];
  definition: string;
}
