import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNgxLowcode } from 'ngx-lowcode-core';
import { provideNgxLowcodeMaterials } from 'ngx-lowcode-materials';
import { mockActionExecutor, mockDatasourceExecutor } from 'ngx-lowcode-testing';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideNgxLowcode({
      actionExecutor: mockActionExecutor,
      datasourceExecutor: mockDatasourceExecutor
    }),
    provideNgxLowcodeMaterials()
  ]
};
