import { Routes } from '@angular/router';

import { placeholderRoute } from '../../shared/components/page-placeholder/placeholder-route';

/** Mounted at /dashboard. */
export const DASHBOARD_ROUTES: Routes = [
  placeholderRoute({
    path: '',
    heading: 'Panel',
    description:
      'Tu punto de reanudación: curso y módulo actuales, racha, ejercicios completados, tiempo de aprendizaje y próximos objetivos.',
    phase: 2,
  }),
];
