import { NgxLowcodeLocale, resolveLocale,NgxLowcodeCoreI18n } from '../../core';
import { coreI18nMap } from './constants/map.constant';

export function getCoreI18n(locale: NgxLowcodeLocale): NgxLowcodeCoreI18n {
  return coreI18nMap[resolveLocale(locale)] ?? coreI18nMap['zh-CN'];
}
