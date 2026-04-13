import { NgxLowcodeLocale, NgxLowcodeMaterialsI18n, resolveLocale } from '../../core';
import { materialsI18nMap } from './constants/map.constant';

export function getMaterialsI18n(locale: NgxLowcodeLocale): NgxLowcodeMaterialsI18n {
  return materialsI18nMap[resolveLocale(locale)] ?? materialsI18nMap['zh-CN'];
}
