import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { defaultActionExecutor, NGX_LOWCODE_CONFIG } from 'ngx-lowcode-core';
import { provideNgxLowcodeMaterials } from 'ngx-lowcode-materials';
import { DemoBffDatasourceExecutorService } from './demo-bff-datasource-executor.service';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(),
    provideAnimations(),
    provideRouter(routes),
    {
      provide: NGX_LOWCODE_CONFIG,
      useFactory: (executor: DemoBffDatasourceExecutorService) => ({
        actionExecutor: defaultActionExecutor(),
        datasourceExecutor: executor.execute
      }),
      deps: [DemoBffDatasourceExecutorService]
    },
    provideNgxLowcodeMaterials()
  ]
};
