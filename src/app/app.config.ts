import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import {
  defaultActionManager,
  NGX_LOWCODE_ACTION_MANAGER,
  NGX_LOWCODE_CONFIG,
  NGX_LOWCODE_DATASOURCE_MANAGER,
  NGX_LOWCODE_WEBSOCKET_MANAGER,
  NgxLowcodeDataSourceManager
} from '@zhongmiao/ngx-lowcode-core';
import { createBffDataSourceManager, createDefaultWebSocketManager } from '@zhongmiao/meta-lc-runtime-angular';
import { provideNgxLowcodeMaterials } from '@zhongmiao/ngx-lowcode-materials';
import { DemoRuntimeExecutionStatusService } from './demo-runtime-execution-status.service';

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
      useFactory: (status: DemoRuntimeExecutionStatusService): NgxLowcodeDataSourceManager => {
        const manager = createBffDataSourceManager({
          baseUrl: 'http://localhost:6000',
          onExecution: (snapshot) => status.recordTransport(snapshot)
        });
        return {
          execute: async (request) => {
            status.recordRequestContext(request.state);
            const result = await manager.execute(request);
            status.recordResult(result);
            return result;
          }
        };
      },
      deps: [DemoRuntimeExecutionStatusService]
    },
    {
      provide: NGX_LOWCODE_WEBSOCKET_MANAGER,
      useValue: createDefaultWebSocketManager()
    },
    {
      provide: NGX_LOWCODE_CONFIG,
      useFactory: (
        actionManager: ReturnType<typeof defaultActionManager>,
        dataSourceManager: NgxLowcodeDataSourceManager,
        webSocketManager: ReturnType<typeof createDefaultWebSocketManager>
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
