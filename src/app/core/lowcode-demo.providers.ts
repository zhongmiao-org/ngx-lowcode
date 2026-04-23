import { ENVIRONMENT_INITIALIZER, EnvironmentProviders, inject, makeEnvironmentProviders } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  defaultActionManager,
  defaultDataSourceManager,
  defaultWebSocketManager,
  NGX_LOWCODE_ACTION_MANAGER,
  NGX_LOWCODE_CONFIG,
  NGX_LOWCODE_DATASOURCE_MANAGER,
  NGX_LOWCODE_WEBSOCKET_MANAGER,
  NgxLowcodeDataSourceManager,
  NgxLowcodeWebSocketManager
} from '@zhongmiao/ngx-lowcode-core';
import { provideNgxLowcodeMaterials } from '@zhongmiao/ngx-lowcode-materials';
import {
  createBffDataSourceManager,
  createDefaultWebSocketManager,
  createSocketIoWebSocketManager
} from '@zhongmiao/meta-lc-runtime-angular';
import { ThyIconRegistry } from 'ngx-tethys/icon';
import { demoRuntimeMode } from '../demo-runtime-mode';
import { resolveDemoBffBaseUrl } from './bff-url';

export const DEMO_RUNTIME_WEBSOCKET_NAMESPACE = '/runtime';
const TETHYS_ICON_SPRITE_PATH = '/assets/icons/defs/svg/sprite.defs.svg';

function createDemoDataSourceManager(): NgxLowcodeDataSourceManager {
  if (demoRuntimeMode === 'offline') {
    return defaultDataSourceManager();
  }

  return createBffDataSourceManager({
    baseUrl: resolveDemoBffBaseUrl()
  });
}

function createDemoWebSocketManager(): NgxLowcodeWebSocketManager {
  if (demoRuntimeMode === 'offline') {
    return defaultWebSocketManager();
  }

  try {
    return createSocketIoWebSocketManager({
      baseUrl: resolveDemoBffBaseUrl(),
      namespace: DEMO_RUNTIME_WEBSOCKET_NAMESPACE
    });
  } catch (error: unknown) {
    console.warn('[ngx-lowcode-demo] Falling back to no-op WebSocket manager.', error);
    return createDefaultWebSocketManager();
  }
}

export function provideNgxLowcodeDemo(): EnvironmentProviders {
  const actionManager = defaultActionManager();
  const dataSourceManager = createDemoDataSourceManager();
  const webSocketManager = createDemoWebSocketManager();

  return makeEnvironmentProviders([
    provideHttpClient(),
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue: () => {
        inject(ThyIconRegistry).addSvgIconSet(TETHYS_ICON_SPRITE_PATH);
      }
    },
    {
      provide: NGX_LOWCODE_ACTION_MANAGER,
      useValue: actionManager
    },
    {
      provide: NGX_LOWCODE_DATASOURCE_MANAGER,
      useValue: dataSourceManager
    },
    {
      provide: NGX_LOWCODE_WEBSOCKET_MANAGER,
      useValue: webSocketManager
    },
    {
      provide: NGX_LOWCODE_CONFIG,
      useValue: {
        actionManager,
        dataSourceManager,
        webSocketManager
      }
    },
    provideNgxLowcodeMaterials('zh-CN')
  ]);
}
