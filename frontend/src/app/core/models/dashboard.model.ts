import { CourseRef, LessonRef, ModuleRef } from './course.model';
import { SubmissionStatus } from './exercise.model';
import { User } from './auth.model';

export interface Level {
  number: number;
  title: string;
  currentLevelXp: number;
  /** Null at the top level. */
  nextLevelXp: number | null;
}

export interface Streak {
  current: number;
  longest: number;
  activeToday: boolean;
}

export interface ActivityDay {
  /** ISO date, e.g. 2026-10-06. */
  date: string;
  count: number;
}

export interface CourseCard {
  course: CourseRef;
  percent: number;
  completedLessons: number;
  totalLessons: number;
  solvedExercises: number;
  totalExercises: number;
  currentModule: ModuleRef | null;
  nextLesson: LessonRef | null;
}

export interface RecentSubmission {
  exerciseSlug: string;
  exerciseTitle: string;
  status: SubmissionStatus;
  passedTests: number;
  totalTests: number;
  createdAt: string;
}

export interface Achievement {
  code: string;
  title: string;
  description: string;
  earned: boolean;
}

/** Mirrors the API's Dashboard schema. */
export interface Dashboard {
  user: User;
  xp: number;
  level: Level;
  streak: Streak;
  totals: {
    lessonsCompleted: number;
    exercisesSolved: number;
    submissions: number;
    learningMinutes: number;
  };
  /** Last 12 weeks, oldest first. */
  activity: ActivityDay[];
  courses: CourseCard[];
  recentSubmissions: RecentSubmission[];
  achievements: Achievement[];
  dailyGoal: DailyGoal;
  /** Due for a spaced review, most overdue first (at most 3). */
  reviews: ReviewItem[];
  reviewsDue: number;
}

export interface DailyGoal {
  goalXp: number;
  todayXp: number;
}

export interface ReviewItem {
  exerciseSlug: string;
  exerciseTitle: string;
  moduleTitle: string;
  solvedAt: string;
}
