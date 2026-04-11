import { ENVIRONMENT_INITIALIZER, EnvironmentProviders, inject, makeEnvironmentProviders } from '@angular/core';
import {
  NGX_LOWCODE_CONFIG,
  NgxLowcodeActionExecutor,
  NgxLowcodeComponentDefinition,
  NgxLowcodeConfig,
  NgxLowcodeDatasourceExecutor
} from 'ngx-lowcode-core-types';
import {
  NgxLowcodeMaterialRegistry
} from './material-registry';

export function defaultDatasourceExecutor(): NgxLowcodeDatasourceExecutor {
  return async ({ datasource }: Parameters<NgxLowcodeDatasourceExecutor>[0]) => datasource.mockData ?? [];
}

export function defaultActionExecutor(): NgxLowcodeActionExecutor {
  return async ({ step }: Parameters<NgxLowcodeActionExecutor>[0]) => {
    if (step.type === 'message' && step.message) {
      console.info(step.message);
    }
  };
}

export function provideNgxLowcode(config: NgxLowcodeConfig = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: NGX_LOWCODE_CONFIG,
      useValue: {
        actionExecutor: config.actionExecutor ?? defaultActionExecutor(),
        datasourceExecutor: config.datasourceExecutor ?? defaultDatasourceExecutor()
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
