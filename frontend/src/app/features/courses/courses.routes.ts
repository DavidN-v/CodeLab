import { Routes } from '@angular/router';

import { placeholderRoute } from '../../shared/components/page-placeholder/placeholder-route';

/** Mounted at /languages. */
export const COURSES_ROUTES: Routes = [
  placeholderRoute({
    path: '',
    heading: 'Lenguajes',
    description:
      'El catálogo completo de lenguajes y tecnologías, con el curso y el recorrido de módulos de cada uno.',
    phase: 2,
  }),
  placeholderRoute({
    path: ':languageSlug',
    heading: 'Curso',
    description:
      'La portada del lenguaje: tu progreso, el módulo actual, la próxima lección y el índice completo de módulos.',
    phase: 2,
  }),
];
