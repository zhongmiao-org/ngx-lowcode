import { registerLowcodeMaterials } from 'ngx-lowcode-core';
import { NgxLowcodeComponentDefinition } from 'ngx-lowcode-core-types';
import { NgxLowcodeLocale } from 'ngx-lowcode-i18n';
import { getBuiltInMaterials } from '../definitions/built-in-materials.definitions';

export const builtInMaterials: NgxLowcodeComponentDefinition[] = getBuiltInMaterials();

export function provideNgxLowcodeMaterials(locale: NgxLowcodeLocale = 'zh-CN') {
  return registerLowcodeMaterials(getBuiltInMaterials(locale));
}
