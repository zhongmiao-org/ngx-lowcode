import { NgxLowcodeComponentDefinition } from '@zhongmiao/ngx-lowcode-core-types';
import { NgxLowcodeLocale } from '@zhongmiao/ngx-lowcode-i18n';

export type NgxLowcodeMaterialDefinitionFactory = (locale?: NgxLowcodeLocale) => NgxLowcodeComponentDefinition[];
