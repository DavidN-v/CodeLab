import { Routes } from '@angular/router';

/** Mounted at /lab. */
export const LAB_ROUTES: Routes = [
  {
    path: '',
    title: 'Práctica general',
    loadComponent: () =>
      import('./pages/lab-workspace/lab-workspace.component').then((m) => m.LabWorkspaceComponent),
  },
];
