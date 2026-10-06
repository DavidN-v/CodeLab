import { Routes } from '@angular/router';

import { placeholderRoute } from '../../shared/components/page-placeholder/placeholder-route';

/** Mounted at /practice. */
export const PRACTICE_ROUTES: Routes = [
  placeholderRoute({
    path: '',
    heading: 'Práctica',
    description:
      'El playground: un editor con resaltado y autocompletado, botón de ejecutar y consola, sobre un entorno aislado.',
    phase: 4,
  }),
  placeholderRoute({
    path: ':exerciseSlug',
    heading: 'Ejercicio',
    description:
      'El enunciado junto al editor y la consola, con comprobación automática de la solución y pistas progresivas.',
    phase: 5,
  }),
];
