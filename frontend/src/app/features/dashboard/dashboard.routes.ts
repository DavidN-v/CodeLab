import { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth.guard';

/** Mounted at /dashboard. */
export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    title: 'Panel',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/dashboard-page/dashboard-page.component').then(
        (m) => m.DashboardPageComponent,
      ),
  },
];
