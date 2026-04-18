import { NgxLowcodeMaterialIconKey } from './material-icon-nodes.constant';

export const LOWCODE_MATERIAL_ICONS: Record<string, NgxLowcodeMaterialIconKey> = {
  page: 'page',
  section: 'section',
  form: 'form',
  text: 'text',
  button: 'button',
  input: 'input',
  select: 'select',
  table: 'table',
  icon: 'icon',
  divider: 'divider',
  image: 'image',
  space: 'space',
  anchor: 'anchor',
  breadcrumb: 'breadcrumb',
  tabs: 'tabs',
  menu: 'menu',
  'input-number': 'input-number',
  checkbox: 'checkbox',
  radio: 'radio',
  switch: 'switch',
  'date-picker': 'date-picker',
  upload: 'upload',
  card: 'card',
  list: 'list',
  tag: 'tag',
  avatar: 'avatar',
  progress: 'progress',
  statistic: 'statistic',
  alert: 'alert',
};

export function resolveLowcodeMaterialIcon(
  type: string,
  fallback: NgxLowcodeMaterialIconKey = 'icon',
): NgxLowcodeMaterialIconKey {
  return LOWCODE_MATERIAL_ICONS[type] ?? fallback;
}
