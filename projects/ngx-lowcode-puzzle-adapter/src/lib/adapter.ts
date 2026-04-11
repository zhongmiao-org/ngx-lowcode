import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from '@angular/core';
import { registerLowcodeMaterials } from 'ngx-lowcode-core';
import { NgxLowcodeComponentDefinition, NgxLowcodeExternalMaterialAdapter } from 'ngx-lowcode-core-types';

export interface NgxLowcodePuzzleAdapterConfig {
  materials?: NgxLowcodeComponentDefinition[];
}

export const NGX_LOWCODE_PUZZLE_ADAPTER_CONFIG = new InjectionToken<NgxLowcodePuzzleAdapterConfig>(
  'NGX_LOWCODE_PUZZLE_ADAPTER_CONFIG'
);

export class NgxLowcodePuzzleAdapter implements NgxLowcodeExternalMaterialAdapter {
  readonly source = 'ngx-puzzle';

  constructor(private readonly materials: NgxLowcodeComponentDefinition[] = []) {}

  adapt(): NgxLowcodeComponentDefinition[] {
    return this.materials;
  }
}

export function provideNgxLowcodePuzzleAdapter(config: NgxLowcodePuzzleAdapterConfig = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: NGX_LOWCODE_PUZZLE_ADAPTER_CONFIG,
      useValue: config
    },
    registerLowcodeMaterials(config.materials ?? [])
  ]);
}
