import { registerLowcodeMaterials } from '@zhongmiao/ngx-lowcode-core';
import { NgxLowcodeComponentDefinition } from '@zhongmiao/ngx-lowcode-core-types';
import { NgxLowcodeLocale } from '@zhongmiao/ngx-lowcode-i18n';
import { getBuiltInMaterials } from '../definitions/built-in-materials.definitions';

export const builtInMaterials: NgxLowcodeComponentDefinition[] = getBuiltInMaterials();

export function provideNgxLowcodeMaterials(locale: NgxLowcodeLocale = 'zh-CN') {
  return registerLowcodeMaterials(getBuiltInMaterials(locale));
}
