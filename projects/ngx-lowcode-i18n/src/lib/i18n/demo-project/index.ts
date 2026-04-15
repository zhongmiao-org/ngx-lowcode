import { NgxLowcodeDemoProjectI18n, NgxLowcodeLocale, resolveLocale } from '../../core';
import { demoProjectI18nMap } from './constants/map.constant';

export function getDemoProjectI18n(locale: NgxLowcodeLocale): NgxLowcodeDemoProjectI18n {
  return demoProjectI18nMap[resolveLocale(locale)] ?? demoProjectI18nMap['zh-CN'];
}
