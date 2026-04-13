import { NgxLowcodeComponentDefinition } from 'ngx-lowcode-core-types';
import { NgxLowcodeLocale } from 'ngx-lowcode-i18n';

export type NgxLowcodeMaterialDefinitionFactory = (locale?: NgxLowcodeLocale) => NgxLowcodeComponentDefinition[];
