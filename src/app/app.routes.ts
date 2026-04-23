import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'renderer'
  },
  {
    path: 'renderer',
    loadChildren: () => import('./features/renderer/renderer-demo.routes').then((module) => module.routes)
  },
  {
    path: 'designer',
    loadChildren: () => import('./features/designer/designer-demo.routes').then((module) => module.routes)
  },
  {
    path: 'materials',
    loadChildren: () => import('./features/materials/materials-demo.routes').then((module) => module.routes)
  },
  {
    path: 'table',
    loadChildren: () => import('./features/table/table-demo.routes').then((module) => module.routes)
  },
  {
    path: '**',
    redirectTo: 'renderer'
  }
];
