import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./app.component').then(m => m.AppComponent)
  },
  {
    path: 'rick-morty',
    loadComponent: () => import('./rick-morty-demo/rick-morty-demo.component').then(m => m.RickMortyDemoComponent)
  }
];
