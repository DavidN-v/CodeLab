import { Routes } from '@angular/router';

import { placeholderRoute } from '../../shared/components/page-placeholder/placeholder-route';

/** Mounted at /learn. */
export const LEARNING_ROUTES: Routes = [
  placeholderRoute({
    path: ':languageSlug/:moduleSlug/:lessonSlug',
    heading: 'Lección',
    description:
      'La vista de estudio en tres columnas: índice del módulo, contenido de la lección y progreso con los conceptos tratados.',
    phase: 3,
  }),
];
