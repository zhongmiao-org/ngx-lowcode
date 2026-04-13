import { SUPPORTED_LOCALES } from '../constants';
import { NgxLowcodeLocale } from '../types';

export function resolveLocale(
  locale: NgxLowcodeLocale | undefined,
  fallback: NgxLowcodeLocale = 'zh-CN'
): NgxLowcodeLocale {
  return locale && SUPPORTED_LOCALES.includes(locale) ? locale : fallback;
}
