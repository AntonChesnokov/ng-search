import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'angular-demo',
    pathMatch: 'full',
  },
  {
    path: 'angular-demo',
    loadComponent: () =>
      import('./angular-demo/angular-demo.component').then((m) => m.AngularDemoComponent),
  },
  {
    path: 'rick-morty',
    loadComponent: () =>
      import('./rick-morty-demo/rick-morty-demo.component').then((m) => m.RickMortyDemoComponent),
  },
  {
    path: 'countries',
    loadComponent: () =>
      import('./world-atlas-demo/world-atlas-demo.component').then(
        (m) => m.WorldAtlasDemoComponent
      ),
  },
];
