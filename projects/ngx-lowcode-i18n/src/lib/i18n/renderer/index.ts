import { NgxLowcodeLocale, NgxLowcodeRendererI18n, resolveLocale } from '../../core';
import { rendererI18nMap } from './constants/map.constant';

export function getRendererI18n(locale: NgxLowcodeLocale): NgxLowcodeRendererI18n {
  return rendererI18nMap[resolveLocale(locale)] ?? rendererI18nMap['zh-CN'];
}
