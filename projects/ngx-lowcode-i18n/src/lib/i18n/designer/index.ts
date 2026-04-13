import { NgxLowcodeDesignerI18n, NgxLowcodeLocale, resolveLocale } from '../../core';
import { designerI18nMap } from './constants/map.constant';

export function getDesignerI18n(locale: NgxLowcodeLocale): NgxLowcodeDesignerI18n {
  return designerI18nMap[resolveLocale(locale)] ?? designerI18nMap['zh-CN'];
}
