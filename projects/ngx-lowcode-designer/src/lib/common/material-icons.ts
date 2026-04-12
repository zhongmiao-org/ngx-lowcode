export const LOWCODE_MATERIAL_ICONS: Record<string, string> = {
  page: 'ti ti-file-text',
  section: 'ti ti-layout-board-split',
  form: 'ti ti-forms',
  text: 'ti ti-typography',
  button: 'ti ti-click',
  input: 'ti ti-input-search',
  select: 'ti ti-selector',
  table: 'ti ti-table',
  icon: 'ti ti-star',
  divider: 'ti ti-separator-horizontal',
  image: 'ti ti-photo',
  space: 'ti ti-box-margin',
  anchor: 'ti ti-anchor',
  breadcrumb: 'ti ti-chevrons-right',
  tabs: 'ti ti-layout-navbar',
  menu: 'ti ti-menu-2',
  'input-number': 'ti ti-arrows-sort',
  checkbox: 'ti ti-checkbox',
  radio: 'ti ti-radio',
  switch: 'ti ti-toggle-right',
  'date-picker': 'ti ti-calendar-event',
  upload: 'ti ti-cloud-upload',
  card: 'ti ti-cards',
  list: 'ti ti-list-details',
  tag: 'ti ti-tag',
  avatar: 'ti ti-user-circle',
  progress: 'ti ti-chart-bar',
  statistic: 'ti ti-chart-bar',
  alert: 'ti ti-alert-triangle'
};

export function resolveLowcodeMaterialIcon(type: string, fallback = 'ti ti-star'): string {
  return LOWCODE_MATERIAL_ICONS[type] ?? fallback;
}
