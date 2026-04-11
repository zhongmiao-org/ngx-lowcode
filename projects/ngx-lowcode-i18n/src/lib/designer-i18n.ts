export type NgxLowcodeLocale = 'zh-CN' | 'en-US';

export type NgxLowcodeDesignerLocale = NgxLowcodeLocale;

export interface NgxLowcodeDesignerI18n {
  materials: string;
  outline: string;
  page: string;
  properties: string;
  style: string;
  runtimeModel: string;
  state: string;
  datasources: string;
  actions: string;
  pageTitle: string;
  pageDescription: string;
  pageId: string;
  nodeCount: string;
  nodeName: string;
  nodeNamePlaceholder: string;
  selectNodeHint: string;
  duplicate: string;
  delete: string;
  undo: string;
  redo: string;
  preview: string;
  save: string;
  publish: string;
  applyState: string;
  applyDatasources: string;
  applyActions: string;
  stateJsonError: string;
  datasourcesJsonError: string;
  actionsJsonError: string;
  textColor: string;
  background: string;
  padding: string;
  marginBottom: string;
  width: string;
  height: string;
  minWidth: string;
  minHeight: string;
  unit: string;
  collapseLeft: string;
  expandLeft: string;
  collapseRight: string;
  expandRight: string;
}

export const designerI18nMap: Record<NgxLowcodeDesignerLocale, NgxLowcodeDesignerI18n> = {
  'zh-CN': {
    materials: '物料',
    outline: '大纲',
    page: '页面',
    properties: '属性',
    style: '样式',
    runtimeModel: '运行时模型',
    state: '状态',
    datasources: '数据源',
    actions: '动作',
    pageTitle: '页面标题',
    pageDescription: '页面描述',
    pageId: '页面 ID',
    nodeCount: '节点数',
    nodeName: '节点名称',
    nodeNamePlaceholder: '为大纲输入一个更易读的名称',
    selectNodeHint: '请选择一个节点后再编辑属性。',
    duplicate: '复制',
    delete: '删除',
    undo: '撤销',
    redo: '重做',
    preview: '预览',
    save: '保存',
    publish: '发布',
    applyState: '应用状态',
    applyDatasources: '应用数据源',
    applyActions: '应用动作',
    stateJsonError: 'State 必须是 JSON 对象。',
    datasourcesJsonError: 'Datasources 必须是 JSON 数组。',
    actionsJsonError: 'Actions 必须是 JSON 数组。',
    textColor: '文字颜色',
    background: '背景',
    padding: '内边距',
    marginBottom: '下边距',
    width: '宽度',
    height: '高度',
    minWidth: '最小宽度',
    minHeight: '最小高度',
    unit: '单位',
    collapseLeft: '收起左侧',
    expandLeft: '展开左侧',
    collapseRight: '收起右侧',
    expandRight: '展开右侧'
  },
  'en-US': {
    materials: 'Materials',
    outline: 'Outline',
    page: 'Page',
    properties: 'Properties',
    style: 'Style',
    runtimeModel: 'Runtime Model',
    state: 'State',
    datasources: 'Datasources',
    actions: 'Actions',
    pageTitle: 'Page Title',
    pageDescription: 'Page Description',
    pageId: 'Page ID',
    nodeCount: 'Nodes',
    nodeName: 'Node Name',
    nodeNamePlaceholder: 'Give this outline node a readable name',
    selectNodeHint: 'Select a node to edit its props.',
    duplicate: 'Duplicate',
    delete: 'Delete',
    undo: 'Undo',
    redo: 'Redo',
    preview: 'Preview',
    save: 'Save',
    publish: 'Publish',
    applyState: 'Apply State',
    applyDatasources: 'Apply Datasources',
    applyActions: 'Apply Actions',
    stateJsonError: 'State must be a JSON object.',
    datasourcesJsonError: 'Datasources must be a JSON array.',
    actionsJsonError: 'Actions must be a JSON array.',
    textColor: 'Text Color',
    background: 'Background',
    padding: 'Padding',
    marginBottom: 'Margin Bottom',
    width: 'Width',
    height: 'Height',
    minWidth: 'Min Width',
    minHeight: 'Min Height',
    unit: 'Unit',
    collapseLeft: 'Collapse left',
    expandLeft: 'Expand left',
    collapseRight: 'Collapse right',
    expandRight: 'Expand right'
  }
};

export function getDesignerI18n(locale: NgxLowcodeDesignerLocale): NgxLowcodeDesignerI18n {
  return designerI18nMap[locale] ?? designerI18nMap['zh-CN'];
}
