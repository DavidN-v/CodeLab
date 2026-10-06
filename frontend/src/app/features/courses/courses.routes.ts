import { Routes } from '@angular/router';

/** Mounted at /languages. */
export const COURSES_ROUTES: Routes = [
  {
    path: '',
    title: 'Lenguajes',
    loadComponent: () =>
      import('./pages/languages-page/languages-page.component').then((m) => m.LanguagesPageComponent),
  },
  {
    path: ':languageSlug',
    title: 'Curso',
    loadComponent: () =>
      import('./pages/course-page/course-page.component').then((m) => m.CoursePageComponent),
  },
  {
    path: ':languageSlug/modules/:moduleSlug',
    title: 'Módulo',
    loadComponent: () =>
      import('./pages/module-page/module-page.component').then((m) => m.ModulePageComponent),
  },
];
