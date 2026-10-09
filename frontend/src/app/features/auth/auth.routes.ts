import { Routes } from '@angular/router';

/** Mounted at the root: /login and /register. */
export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    title: 'Entrar',
    loadComponent: () =>
      import('./pages/login-page/login-page.component').then((m) => m.LoginPageComponent),
  },
  {
    path: 'register',
    title: 'Crear cuenta',
    loadComponent: () =>
      import('./pages/register-page/register-page.component').then((m) => m.RegisterPageComponent),
  },
];
