import { LessonRef, ModuleRef } from './course.model';
import { Level } from './dashboard.model';

export interface ModuleProgress {
  moduleId: number;
  slug: string;
  completedLessons: number;
  totalLessons: number;
  solvedExercises: number;
  totalExercises: number;
  completed: boolean;
}

export interface CourseProgress {
  courseId: number;
  completedLessons: number;
  totalLessons: number;
  solvedExercises: number;
  totalExercises: number;
  percent: number;
  completedLessonIds: number[];
  solvedExerciseSlugs: string[];
  /** Submitted at least once, not solved yet. */
  attemptedExerciseSlugs: string[];
  modules: ModuleProgress[];
  /** First lesson not completed yet; null when all are done. */
  nextLesson: LessonRef | null;
  /** Next lesson or exercise on the path; null when the course is finished. */
  nextStep: NextStep | null;
}

/** One step on the path: a module's lessons in order, then its exercises, then the next module. */
export interface NextStep {
  kind: 'LESSON' | 'EXERCISE';
  slug: string;
  title: string;
  moduleSlug: string;
  moduleTitle: string;
  modulePosition: number;
}

export interface LessonCompletion {
  lessonId: number;
  completedAt: string;
  newlyCompleted: boolean;
  xpAwarded: number;
  celebration: Celebration | null;
}

/** Milestones reached by the action that returned it. */
export interface Celebration {
  newLevel: Level | null;
  completedModule: ModuleRef | null;
}
