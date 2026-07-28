import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/app-shell/app-shell.component').then((m) => m.AppShellComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  { path: '**', redirectTo: '' },
];
