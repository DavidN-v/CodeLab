import { LessonRef } from './course.model';

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
}

export interface LessonCompletion {
  lessonId: number;
  completedAt: string;
  newlyCompleted: boolean;
  xpAwarded: number;
}
