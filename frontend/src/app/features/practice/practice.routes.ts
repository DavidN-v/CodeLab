import { Routes } from '@angular/router';

/** Mounted at /practice. */
export const PRACTICE_ROUTES: Routes = [
  {
    path: '',
    title: 'Práctica',
    loadComponent: () =>
      import('./pages/practice-page/practice-page.component').then((m) => m.PracticePageComponent),
  },
  {
    path: 'playground',
    title: 'Playground',
    loadComponent: () =>
      import('./pages/playground-page/playground-page.component').then(
        (m) => m.PlaygroundPageComponent,
      ),
  },
  {
    path: ':exerciseSlug',
    title: 'Ejercicio',
    loadComponent: () =>
      import('./pages/exercise-page/exercise-page.component').then((m) => m.ExercisePageComponent),
  },
];
