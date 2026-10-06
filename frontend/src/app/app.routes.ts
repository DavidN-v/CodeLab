import { Routes } from '@angular/router';

import { HomePageComponent } from './features/home/pages/home-page/home-page.component';

// Home is the landing page, so it ships in the initial bundle. Every other
// feature is a lazy chunk with its own routes file.
export const routes: Routes = [
  { path: '', pathMatch: 'full', component: HomePageComponent },
  {
    path: 'languages',
    loadChildren: () => import('./features/courses/courses.routes').then((m) => m.COURSES_ROUTES),
  },
  {
    path: 'learn',
    loadChildren: () => import('./features/learning/learning.routes').then((m) => m.LEARNING_ROUTES),
  },
  {
    path: 'practice',
    loadChildren: () => import('./features/practice/practice.routes').then((m) => m.PRACTICE_ROUTES),
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
  },
  {
    path: '**',
    title: 'Página no encontrada',
    loadComponent: () =>
      import('./features/not-found/pages/not-found-page/not-found-page.component').then(
        (m) => m.NotFoundPageComponent,
      ),
  },
];
