import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'votar' },
  {
    path: 'votar',
    title: 'Registrar voto',
    loadComponent: () => import('./paginas/votar/votar').then((m) => m.Votar),
  },
  {
    path: 'log-servidor',
    title: 'Log del servidor',
    loadComponent: () => import('./paginas/log-servidor/log-servidor').then((m) => m.LogServidor),
  },
  {
    path: 'procesamiento',
    title: 'Procesamiento del voto',
    loadComponent: () => import('./paginas/procesamiento/procesamiento').then((m) => m.Procesamiento),
  },
  {
    path: 'log-usuario',
    title: 'Log del usuario',
    loadComponent: () => import('./paginas/log-usuario/log-usuario').then((m) => m.LogUsuario),
  },
  { path: '**', redirectTo: 'votar' },
];
