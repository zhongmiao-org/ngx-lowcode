import { ENVIRONMENT_INITIALIZER, EnvironmentProviders, inject, makeEnvironmentProviders } from '@angular/core';
import {
  NGX_LOWCODE_ACTION_MANAGER,
  NGX_LOWCODE_CONFIG,
  NGX_LOWCODE_DATASOURCE_MANAGER,
  NGX_LOWCODE_WEBSOCKET_MANAGER,
  NgxLowcodeActionManager,
  NgxLowcodeActionExecutor,
  NgxLowcodeComponentDefinition,
  NgxLowcodeConfig,
  NgxLowcodeDataSourceManager,
  NgxLowcodeDatasourceExecutionResult,
  NgxLowcodeDatasourceExecutor,
  NgxLowcodeWebSocketManager
} from '@zhongmiao/ngx-lowcode-core-types';
import { NgxLowcodeMaterialRegistry } from '../material-registry';

export function defaultDataSourceManager(): NgxLowcodeDataSourceManager {
  const executor: NgxLowcodeDatasourceExecutor = async ({
    datasource
  }: Parameters<NgxLowcodeDatasourceExecutor>[0]): Promise<NgxLowcodeDatasourceExecutionResult> => {
    const data = datasource.mockData ?? [];
    return {
      data,
      meta: {
        status: 'success',
        rowCount: Array.isArray(data) ? data.length : undefined,
        source: datasource.command?.transport ?? datasource.type
      }
    };
  };
  return {
    execute: executor
  };
}

export function defaultActionManager(): NgxLowcodeActionManager {
  const executor: NgxLowcodeActionExecutor = async ({ step }: Parameters<NgxLowcodeActionExecutor>[0]) => {
    if (step.type === 'message' && step.message?.trim()) {
      console.info(step.message.trim());
    }
  };
  return {
    execute: executor
  };
}

export function defaultWebSocketManager(): NgxLowcodeWebSocketManager {
  return {
    connect: () => undefined,
    subscribe: () => undefined,
    unsubscribe: () => undefined,
    disconnect: () => undefined
  };
}

export function provideNgxLowcode(config: NgxLowcodeConfig = {}): EnvironmentProviders {
  const actionManager = config.actionManager ?? defaultActionManager();
  const dataSourceManager = config.dataSourceManager ?? defaultDataSourceManager();
  const webSocketManager = config.webSocketManager ?? defaultWebSocketManager();

  return makeEnvironmentProviders([
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
    }
  ]);
}

export function registerLowcodeMaterials(materials: NgxLowcodeComponentDefinition[]): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue: () => {
        inject(NgxLowcodeMaterialRegistry).registerMany(materials);
      }
    }
  ]);
}
