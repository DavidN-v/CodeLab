import { Routes } from '@angular/router';

/** Mounted at /learn. */
export const LEARNING_ROUTES: Routes = [
  {
    path: ':languageSlug/:moduleSlug/:lessonSlug',
    title: 'Lección',
    loadComponent: () =>
      import('./pages/lesson-page/lesson-page.component').then((m) => m.LessonPageComponent),
  },
];
