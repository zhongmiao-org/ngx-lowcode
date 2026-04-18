export type NgxLowcodeIconNodeTag =
  | 'path'
  | 'line'
  | 'polyline'
  | 'polygon'
  | 'rect'
  | 'circle'
  | 'ellipse';

export type NgxLowcodeIconNodeAttributes = Record<string, string | number>;

export type NgxLowcodeIconNode = [NgxLowcodeIconNodeTag, NgxLowcodeIconNodeAttributes];

export type NgxLowcodeMaterialIconKey =
  | 'page'
  | 'section'
  | 'form'
  | 'text'
  | 'button'
  | 'input'
  | 'select'
  | 'table'
  | 'icon'
  | 'divider'
  | 'image'
  | 'space'
  | 'anchor'
  | 'breadcrumb'
  | 'tabs'
  | 'menu'
  | 'input-number'
  | 'checkbox'
  | 'radio'
  | 'switch'
  | 'date-picker'
  | 'upload'
  | 'card'
  | 'list'
  | 'tag'
  | 'avatar'
  | 'progress'
  | 'statistic'
  | 'alert';

const MATERIAL_ICON_NODES: Record<NgxLowcodeMaterialIconKey, readonly NgxLowcodeIconNode[]> = {
  page: [
    ['path', { d: 'M14 3v4a1 1 0 0 0 1 1h4' }],
    ['path', { d: 'M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2' }],
    ['path', { d: 'M9 9l1 0' }],
    ['path', { d: 'M9 13l6 0' }],
    ['path', { d: 'M9 17l6 0' }],
  ],
  section: [
    ['path', { d: 'M4 6a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2l0 -12' }],
    ['path', { d: 'M4 12h8' }],
    ['path', { d: 'M12 15h8' }],
    ['path', { d: 'M12 9h8' }],
    ['path', { d: 'M12 4v16' }],
  ],
  form: [
    ['path', { d: 'M12 3a3 3 0 0 0 -3 3v12a3 3 0 0 0 3 3' }],
    ['path', { d: 'M6 3a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3' }],
    ['path', { d: 'M13 7h7a1 1 0 0 1 1 1v8a1 1 0 0 1 -1 1h-7' }],
    ['path', { d: 'M5 7h-1a1 1 0 0 0 -1 1v8a1 1 0 0 0 1 1h1' }],
    ['path', { d: 'M17 12h.01' }],
    ['path', { d: 'M13 12h.01' }],
  ],
  text: [
    ['path', { d: 'M4 20l3 0' }],
    ['path', { d: 'M14 20l7 0' }],
    ['path', { d: 'M6.9 15l6.9 0' }],
    ['path', { d: 'M10.2 6.3l5.8 13.7' }],
    ['path', { d: 'M5 20l6 -16l2 0l7 16' }],
  ],
  button: [
    ['path', { d: 'M3 12l3 0' }],
    ['path', { d: 'M12 3l0 3' }],
    ['path', { d: 'M7.8 7.8l-2.2 -2.2' }],
    ['path', { d: 'M16.2 7.8l2.2 -2.2' }],
    ['path', { d: 'M7.8 16.2l-2.2 2.2' }],
    ['path', { d: 'M12 12l9 3l-4 2l-2 4l-3 -9' }],
  ],
  input: [
    ['path', { d: 'M20 11v-2a2 2 0 0 0 -2 -2h-12a2 2 0 0 0 -2 2v5a2 2 0 0 0 2 2h5' }],
    ['path', { d: 'M15 18a3 3 0 1 0 6 0a3 3 0 1 0 -6 0' }],
    ['path', { d: 'M20.2 20.2l1.8 1.8' }],
  ],
  select: [
    ['path', { d: 'M8 9l4 -4l4 4' }],
    ['path', { d: 'M16 15l-4 4l-4 -4' }],
  ],
  table: [
    ['path', { d: 'M3 5a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-14' }],
    ['path', { d: 'M3 10h18' }],
    ['path', { d: 'M10 3v18' }],
  ],
  icon: [['path', { d: 'M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873l-6.158 -3.245' }]],
  divider: [
    ['path', { d: 'M4 12l16 0' }],
    ['path', { d: 'M8 8l4 -4l4 4' }],
    ['path', { d: 'M16 16l-4 4l-4 -4' }],
  ],
  image: [
    ['path', { d: 'M15 8h.01' }],
    ['path', { d: 'M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12' }],
    ['path', { d: 'M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5' }],
    ['path', { d: 'M14 14l1 -1c.928 -.893 2.072 -.893 3 0l3 3' }],
  ],
  space: [
    ['path', { d: 'M8 8h8v8h-8l0 -8' }],
    ['path', { d: 'M4 4v.01' }],
    ['path', { d: 'M8 4v.01' }],
    ['path', { d: 'M12 4v.01' }],
    ['path', { d: 'M16 4v.01' }],
    ['path', { d: 'M20 4v.01' }],
    ['path', { d: 'M4 20v.01' }],
    ['path', { d: 'M8 20v.01' }],
    ['path', { d: 'M12 20v.01' }],
    ['path', { d: 'M16 20v.01' }],
    ['path', { d: 'M20 20v.01' }],
    ['path', { d: 'M20 16v.01' }],
    ['path', { d: 'M20 12v.01' }],
    ['path', { d: 'M20 8v.01' }],
    ['path', { d: 'M4 16v.01' }],
    ['path', { d: 'M4 12v.01' }],
    ['path', { d: 'M4 8v.01' }],
  ],
  anchor: [
    ['path', { d: 'M12 9v12m-8 -8a8 8 0 0 0 16 0m1 0h-2m-14 0h-2' }],
    ['path', { d: 'M9 6a3 3 0 1 0 6 0a3 3 0 1 0 -6 0' }],
  ],
  breadcrumb: [
    ['path', { d: 'M7 7l5 5l-5 5' }],
    ['path', { d: 'M13 7l5 5l-5 5' }],
  ],
  tabs: [
    ['path', { d: 'M4 6a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2l0 -12' }],
    ['path', { d: 'M4 9l16 0' }],
  ],
  menu: [
    ['path', { d: 'M4 6l16 0' }],
    ['path', { d: 'M4 12l16 0' }],
    ['path', { d: 'M4 18l16 0' }],
  ],
  'input-number': [
    ['path', { d: 'M3 9l4 -4l4 4m-4 -4v14' }],
    ['path', { d: 'M21 15l-4 4l-4 -4m4 4v-14' }],
  ],
  checkbox: [
    ['path', { d: 'M9 11l3 3l8 -8' }],
    ['path', { d: 'M20 12v6a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h9' }],
  ],
  radio: [
    ['path', { d: 'M14 3l-9.371 3.749a1 1 0 0 0 -.629 .928v11.323a1 1 0 0 0 1 1h14a1 1 0 0 0 1 -1v-11a1 1 0 0 0 -1 -1h-14.5' }],
    ['path', { d: 'M4 12h16' }],
    ['path', { d: 'M7 12v-2' }],
    ['path', { d: 'M17 16v.01' }],
    ['path', { d: 'M13 16v.01' }],
  ],
  switch: [
    ['path', { d: 'M14 12a2 2 0 1 0 4 0a2 2 0 1 0 -4 0' }],
    ['path', { d: 'M2 12a6 6 0 0 1 6 -6h8a6 6 0 0 1 6 6a6 6 0 0 1 -6 6h-8a6 6 0 0 1 -6 -6' }],
  ],
  'date-picker': [
    ['path', { d: 'M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2l0 -12' }],
    ['path', { d: 'M16 3l0 4' }],
    ['path', { d: 'M8 3l0 4' }],
    ['path', { d: 'M4 11l16 0' }],
    ['path', { d: 'M8 15h2v2h-2l0 -2' }],
  ],
  upload: [
    ['path', { d: 'M7 18a4.6 4.4 0 0 1 0 -9a5 4.5 0 0 1 11 2h1a3.5 3.5 0 0 1 0 7h-1' }],
    ['path', { d: 'M9 15l3 -3l3 3' }],
    ['path', { d: 'M12 12l0 9' }],
  ],
  card: [
    ['path', { d: 'M3.604 7.197l7.138 -3.109a.96 .96 0 0 1 1.27 .527l4.924 11.902a1 1 0 0 1 -.514 1.304l-7.137 3.109a.96 .96 0 0 1 -1.271 -.527l-4.924 -11.903a1 1 0 0 1 .514 -1.304l0 .001' }],
    ['path', { d: 'M15 4h1a1 1 0 0 1 1 1v3.5' }],
    ['path', { d: 'M20 6c.264 .112 .52 .217 .768 .315a1 1 0 0 1 .53 1.311l-2.298 5.374' }],
  ],
  list: [
    ['path', { d: 'M13 5h8' }],
    ['path', { d: 'M13 9h5' }],
    ['path', { d: 'M13 15h8' }],
    ['path', { d: 'M13 19h5' }],
    ['path', { d: 'M3 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4' }],
    ['path', { d: 'M3 15a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -4' }],
  ],
  tag: [
    ['path', { d: 'M6.5 7.5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0' }],
    ['path', { d: 'M3 6v5.172a2 2 0 0 0 .586 1.414l7.71 7.71a2.41 2.41 0 0 0 3.408 0l5.592 -5.592a2.41 2.41 0 0 0 0 -3.408l-7.71 -7.71a2 2 0 0 0 -1.414 -.586h-5.172a3 3 0 0 0 -3 3' }],
  ],
  avatar: [
    ['path', { d: 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0' }],
    ['path', { d: 'M9 10a3 3 0 1 0 6 0a3 3 0 1 0 -6 0' }],
    ['path', { d: 'M6.168 18.849a4 4 0 0 1 3.832 -2.849h4a4 4 0 0 1 3.834 2.855' }],
  ],
  progress: [
    ['path', { d: 'M3 13a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -6' }],
    ['path', { d: 'M15 9a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -10' }],
    ['path', { d: 'M9 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -14' }],
    ['path', { d: 'M4 20h14' }],
  ],
  statistic: [
    ['path', { d: 'M3 13a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -6' }],
    ['path', { d: 'M15 9a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -10' }],
    ['path', { d: 'M9 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -14' }],
    ['path', { d: 'M4 20h14' }],
  ],
  alert: [
    ['path', { d: 'M12 9v4' }],
    ['path', { d: 'M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0' }],
    ['path', { d: 'M12 16h.01' }],
  ],
};

export function resolveLowcodeMaterialIconNodes(
  key: NgxLowcodeMaterialIconKey,
): readonly NgxLowcodeIconNode[] {
  return MATERIAL_ICON_NODES[key] ?? MATERIAL_ICON_NODES['icon'];
}
