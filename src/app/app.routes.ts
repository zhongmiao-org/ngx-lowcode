import { Routes } from '@angular/router';
import { DemoDatasourcePageComponent } from './demo-datasource-page.component';
import { DemoHomeComponent } from './demo-home.component';
import { DemoModelPageComponent } from './demo-model-page.component';
import { DemoPageBuilderPageComponent } from './demo-page-builder-page.component';
import { DemoPageDesignerPageComponent } from './demo-page-designer-page.component';
import { DemoPagePreviewPageComponent } from './demo-page-preview-page.component';
import { DemoPageRouteConfigPageComponent } from './demo-page-route-config-page.component';
import { DemoPermissionApiPageComponent } from './demo-permission-api-page.component';
import { DemoWorkspaceLayoutComponent } from './demo-workspace-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: DemoHomeComponent
  },
  {
    path: 'studio',
    component: DemoWorkspaceLayoutComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'model'
      },
      {
        path: 'model',
        component: DemoModelPageComponent
      },
      {
        path: 'datasource',
        component: DemoDatasourcePageComponent
      },
      {
        path: 'permission',
        component: DemoPermissionApiPageComponent
      },
      {
        path: 'page',
        component: DemoPageBuilderPageComponent,
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: 'designer'
          },
          {
            path: 'designer',
            component: DemoPageDesignerPageComponent
          },
          {
            path: 'preview',
            component: DemoPagePreviewPageComponent
          },
          {
            path: 'route-config',
            component: DemoPageRouteConfigPageComponent
          }
        ]
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
