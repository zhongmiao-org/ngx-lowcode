import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import {
  defaultActionManager,
  defaultWebSocketManager,
  NGX_LOWCODE_ACTION_MANAGER,
  NGX_LOWCODE_CONFIG,
  NGX_LOWCODE_DATASOURCE_MANAGER,
  NGX_LOWCODE_WEBSOCKET_MANAGER
} from '@zhongmiao/ngx-lowcode-core';
import { provideNgxLowcodeMaterials } from '@zhongmiao/ngx-lowcode-materials';
import { DemoBffDatasourceExecutorService } from './demo-bff-datasource-executor.service';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(),
    provideAnimations(),
    provideRouter(routes),
    {
      provide: NGX_LOWCODE_ACTION_MANAGER,
      useValue: defaultActionManager()
    },
    {
      provide: NGX_LOWCODE_DATASOURCE_MANAGER,
      useFactory: (executor: DemoBffDatasourceExecutorService) => ({
        execute: executor.execute
      }),
      deps: [DemoBffDatasourceExecutorService]
    },
    {
      provide: NGX_LOWCODE_WEBSOCKET_MANAGER,
      useValue: defaultWebSocketManager()
    },
    {
      provide: NGX_LOWCODE_CONFIG,
      useFactory: (
        actionManager: ReturnType<typeof defaultActionManager>,
        dataSourceManager: { execute: DemoBffDatasourceExecutorService['execute'] },
        webSocketManager: ReturnType<typeof defaultWebSocketManager>
      ) => ({
        actionManager,
        dataSourceManager,
        webSocketManager
      }),
      deps: [NGX_LOWCODE_ACTION_MANAGER, NGX_LOWCODE_DATASOURCE_MANAGER, NGX_LOWCODE_WEBSOCKET_MANAGER]
    },
    provideNgxLowcodeMaterials()
  ]
};
