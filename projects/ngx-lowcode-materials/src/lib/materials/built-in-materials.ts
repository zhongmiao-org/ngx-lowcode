import { registerLowcodeMaterials } from 'ngx-lowcode-core';
import { NgxLowcodeComponentDefinition, NgxLowcodeMaterialCreateNodeOptions, NgxLowcodeSetterDefinition } from 'ngx-lowcode-core-types';
import { NgxLowcodeButtonMaterialComponent } from '../components/button/ngx-lowcode-button-material.component';
import { NgxLowcodeFormMaterialComponent } from '../components/form/ngx-lowcode-form-material.component';
import { NgxLowcodeInputMaterialComponent } from '../components/input/ngx-lowcode-input-material.component';
import { NgxLowcodePageMaterialComponent } from '../components/page/ngx-lowcode-page-material.component';
import { NgxLowcodeSectionMaterialComponent } from '../components/section/ngx-lowcode-section-material.component';
import { NgxLowcodeSelectMaterialComponent } from '../components/select/ngx-lowcode-select-material.component';
import { NgxLowcodeTableMaterialComponent } from '../components/table/ngx-lowcode-table-material.component';
import { NgxLowcodeTethysMaterialComponent } from '../components/tethys/ngx-lowcode-tethys-material.component';
import { NgxLowcodeTextMaterialComponent } from '../components/text/ngx-lowcode-text-material.component';

const pageLayoutSetters: NgxLowcodeSetterDefinition[] = [
  { key: 'thyGap', label: 'thyGap', type: 'text', group: 'layout', placeholder: '0 or sm:8 md:16' },
  { key: 'thyDirection', label: 'thyDirection', type: 'select', group: 'layout', options: [
    { label: 'Row', value: 'row' },
    { label: 'Column', value: 'column' },
    { label: 'Row Reverse', value: 'row-reverse' },
    { label: 'Column Reverse', value: 'column-reverse' }
  ] },
  { key: 'thyWrap', label: 'thyWrap', type: 'select', group: 'layout', options: [
    { label: 'No Wrap', value: 'nowrap' },
    { label: 'Wrap', value: 'wrap' },
    { label: 'Wrap Reverse', value: 'wrap-reverse' }
  ] },
  { key: 'thyJustifyContent', label: 'thyJustifyContent', type: 'select', group: 'layout', options: [
    { label: 'Start', value: 'start' },
    { label: 'Center', value: 'center' },
    { label: 'End', value: 'end' },
    { label: 'Space Between', value: 'space-between' },
    { label: 'Space Around', value: 'space-around' }
  ] },
  { key: 'thyAlignItems', label: 'thyAlignItems', type: 'select', group: 'layout', options: [
    { label: 'Stretch', value: 'stretch' },
    { label: 'Start', value: 'start' },
    { label: 'Center', value: 'center' },
    { label: 'End', value: 'end' },
    { label: 'Baseline', value: 'baseline' }
  ] },
];

const pageItemLayoutSetters: NgxLowcodeSetterDefinition[] = [
  { key: 'thyGrow', label: 'thyGrow', type: 'select', group: 'layout', options: [
    { label: '0', value: '0' },
    { label: '1', value: '1' }
  ] },
  { key: 'thyShrink', label: 'thyShrink', type: 'select', group: 'layout', options: [
    { label: '1', value: '1' },
    { label: '0', value: '0' }
  ] },
  { key: 'thyBasis', label: 'thyBasis', type: 'text', group: 'layout', placeholder: 'auto or 240px' },
  { key: 'thyOrder', label: 'thyOrder', type: 'number', group: 'layout' },
  { key: 'thyAlignSelf', label: 'thyAlignSelf', type: 'select', group: 'layout', options: [
    { label: 'Auto', value: 'auto' },
    { label: 'Stretch', value: 'stretch' },
    { label: 'Start', value: 'flex-start' },
    { label: 'Center', value: 'center' },
    { label: 'End', value: 'flex-end' },
    { label: 'Baseline', value: 'baseline' }
  ] }
];

const sectionLayoutSetters: NgxLowcodeSetterDefinition[] = [
  { key: 'thyGap', label: 'thyGap', type: 'text', group: 'layout', placeholder: '8 or 12 or 16' },
  { key: 'thyDirection', label: 'thyDirection', type: 'select', group: 'layout', options: [
    { label: 'Row', value: 'row' },
    { label: 'Column', value: 'column' },
    { label: 'Row Reverse', value: 'row-reverse' },
    { label: 'Column Reverse', value: 'column-reverse' }
  ] },
  { key: 'thyWrap', label: 'thyWrap', type: 'select', group: 'layout', options: [
    { label: 'No Wrap', value: 'nowrap' },
    { label: 'Wrap', value: 'wrap' },
    { label: 'Wrap Reverse', value: 'wrap-reverse' }
  ] },
  { key: 'thyJustifyContent', label: 'thyJustifyContent', type: 'select', group: 'layout', options: [
    { label: 'Start', value: 'start' },
    { label: 'Center', value: 'center' },
    { label: 'End', value: 'end' },
    { label: 'Space Between', value: 'space-between' },
    { label: 'Space Around', value: 'space-around' }
  ] },
  { key: 'thyAlignItems', label: 'thyAlignItems', type: 'select', group: 'layout', options: [
    { label: 'Stretch', value: 'stretch' },
    { label: 'Start', value: 'start' },
    { label: 'Center', value: 'center' },
    { label: 'End', value: 'end' },
    { label: 'Baseline', value: 'baseline' }
  ] },
];

const sectionItemLayoutSetters: NgxLowcodeSetterDefinition[] = [
  { key: 'thyGrow', label: 'thyGrow', type: 'select', group: 'layout', options: [
    { label: '0', value: '0' },
    { label: '1', value: '1' }
  ] },
  { key: 'thyShrink', label: 'thyShrink', type: 'select', group: 'layout', options: [
    { label: '1', value: '1' },
    { label: '0', value: '0' }
  ] },
  { key: 'thyBasis', label: 'thyBasis', type: 'text', group: 'layout', placeholder: 'auto or 240px' },
  { key: 'thyOrder', label: 'thyOrder', type: 'number', group: 'layout' },
  { key: 'thyAlignSelf', label: 'thyAlignSelf', type: 'select', group: 'layout', options: [
    { label: 'Auto', value: 'auto' },
    { label: 'Stretch', value: 'stretch' },
    { label: 'Start', value: 'flex-start' },
    { label: 'Center', value: 'center' },
    { label: 'End', value: 'flex-end' },
    { label: 'Baseline', value: 'baseline' }
  ] }
];

const formLayoutSetters: NgxLowcodeSetterDefinition[] = [
  {
    key: 'thyLayout',
    label: 'thyLayout',
    type: 'select',
    group: 'layout',
    options: [
      { label: 'Horizontal', value: 'horizontal' },
      { label: 'Vertical', value: 'vertical' }
    ]
  }
];

export const builtInMaterials: NgxLowcodeComponentDefinition[] = [
  {
    type: 'page',
    title: 'Page',
    category: '布局',
    canHaveChildren: true,
    component: NgxLowcodePageMaterialComponent,
    setterSchema: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      ...pageLayoutSetters
    ],
    itemSetterSchema: [...pageItemLayoutSetters],
    createNode: (options: NgxLowcodeMaterialCreateNodeOptions) => ({
      id: options.id,
      componentType: 'page',
      props: {
        title: 'Demo Page',
        description: 'Build pages with registered materials.',
        thyGap: 16,
        thyDirection: 'row',
        thyWrap: 'wrap',
        thyJustifyContent: 'start',
        thyAlignItems: 'stretch',
        minHeight: 240,
        height: '',
        padding: 0
      },
      children: []
    })
  },
  {
    type: 'section',
    title: 'Section',
    category: '布局',
    canHaveChildren: true,
    component: NgxLowcodeSectionMaterialComponent,
    setterSchema: [
      { key: 'title', label: 'Title', type: 'text', group: 'properties' },
      ...sectionLayoutSetters
    ],
    itemSetterSchema: [...sectionItemLayoutSetters],
    createNode: (options: NgxLowcodeMaterialCreateNodeOptions) => ({
      id: options.id,
      componentType: 'section',
      props: {
        title: 'Section',
        thyGap: 16,
        thyDirection: 'row',
        thyWrap: 'wrap',
        thyJustifyContent: 'start',
        thyAlignItems: 'stretch',
        minHeight: 240,
        height: '',
        padding: 16
      },
      children: []
    })
  },
  {
    type: 'form',
    title: 'Form',
    category: '布局',
    canHaveChildren: true,
    component: NgxLowcodeFormMaterialComponent,
    setterSchema: [
      { key: 'title', label: 'Title', type: 'text', group: 'properties' },
      ...formLayoutSetters
    ],
    createNode: (options: NgxLowcodeMaterialCreateNodeOptions) => ({
      id: options.id,
      componentType: 'form',
      props: {
        title: 'Query Form',
        thyLayout: 'horizontal',
        thyBasis: '100%',
        thySpan: 24,
        thyOffset: 0
      },
      children: []
    })
  },
  {
    type: 'text',
    title: 'Text',
    category: '通用',
    component: NgxLowcodeTextMaterialComponent,
    setterSchema: [
      { key: 'text', label: 'Text', type: 'textarea' },
      { key: 'href', label: 'Href', type: 'text' },
      { key: 'target', label: 'Target', type: 'text', placeholder: '_blank' }
    ],
    createNode: (options: NgxLowcodeMaterialCreateNodeOptions) => ({
      id: options.id,
      componentType: 'text',
      props: { text: 'Text block' }
    })
  },
  {
    type: 'button',
    title: 'Button',
    category: '通用',
    component: NgxLowcodeButtonMaterialComponent,
    events: [{ name: 'click', label: 'Click' }],
    setterSchema: [
      { key: 'label', label: 'Label', type: 'text' },
      { key: 'buttonType', label: 'Type', type: 'select', options: [
        { label: 'Primary', value: 'primary' },
        { label: 'Primary Outline', value: 'primary-outline' },
        { label: 'Default', value: 'default' }
      ] },
      { key: 'actionId', label: 'Action ID', type: 'text' }
    ],
    createNode: (options: NgxLowcodeMaterialCreateNodeOptions) => ({
      id: options.id,
      componentType: 'button',
      props: {
        label: 'Search',
        buttonType: 'primary',
        actionId: 'search-action'
      }
    })
  },
  {
    type: 'input',
    title: 'Input',
    category: '数据录入',
    component: NgxLowcodeInputMaterialComponent,
    setterSchema: [
      { key: 'label', label: 'Label', type: 'text' },
      { key: 'placeholder', label: 'Placeholder', type: 'text' },
      { key: 'stateKey', label: 'State Key', type: 'text' }
    ],
    createNode: (options: NgxLowcodeMaterialCreateNodeOptions) => ({
      id: options.id,
      componentType: 'input',
      props: {
        label: 'Keyword',
        placeholder: 'Search keyword',
        stateKey: 'keyword'
      }
    })
  },
  {
    type: 'select',
    title: 'Select',
    category: '数据录入',
    component: NgxLowcodeSelectMaterialComponent,
    setterSchema: [
      { key: 'label', label: 'Label', type: 'text' },
      { key: 'placeholder', label: 'Placeholder', type: 'text' },
      { key: 'stateKey', label: 'State Key', type: 'text' }
    ],
    createNode: (options: NgxLowcodeMaterialCreateNodeOptions) => ({
      id: options.id,
      componentType: 'select',
      props: {
        label: 'Status',
        placeholder: 'Select status',
        stateKey: 'status',
        options: [
          { label: 'All', value: 'all' },
          { label: 'Active', value: 'active' },
          { label: 'Paused', value: 'paused' }
        ]
      }
    })
  },
  {
    type: 'table',
    title: 'Table',
    category: '数据展示',
    component: NgxLowcodeTableMaterialComponent,
    setterSchema: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'dataKey', label: 'Data Key', type: 'text' }
    ],
    createNode: (options: NgxLowcodeMaterialCreateNodeOptions) => ({
      id: options.id,
      componentType: 'table',
      props: {
        title: 'Results',
        dataKey: 'tableData',
        thyBasis: '100%',
        thySpan: 24,
        thyOffset: 0
      }
    })
  },
  {
    type: 'icon',
    title: '图标',
    category: '通用',
    component: NgxLowcodeTethysMaterialComponent,
    setterSchema: [
      { key: 'iconName', label: 'Icon', type: 'text' }
    ],
    createNode: (options) => ({
      id: options.id,
      componentType: 'icon',
      props: { iconName: 'mail' }
    })
  },
  {
    type: 'divider',
    title: '分割线',
    category: '通用',
    component: NgxLowcodeTethysMaterialComponent,
    setterSchema: [
      { key: 'title', label: 'Text', type: 'text' }
    ],
    createNode: (options) => ({
      id: options.id,
      componentType: 'divider',
      props: { title: '分割线', thyBasis: '100%' }
    })
  },
  {
    type: 'image',
    title: '图片',
    category: '通用',
    component: NgxLowcodeTethysMaterialComponent,
    setterSchema: [
      { key: 'title', label: 'Alt', type: 'text' },
      { key: 'src', label: 'Src', type: 'text' }
    ],
    createNode: (options) => ({
      id: options.id,
      componentType: 'image',
      props: {
        title: 'Image',
        src: 'https://via.placeholder.com/480x240?text=Image'
      }
    })
  },
  {
    type: 'space',
    title: '间距',
    category: '布局',
    component: NgxLowcodeTethysMaterialComponent,
    setterSchema: [],
    createNode: (options) => ({
      id: options.id,
      componentType: 'space',
      props: {}
    })
  },
  {
    type: 'anchor',
    title: '锚点',
    category: '布局',
    component: NgxLowcodeTethysMaterialComponent,
    setterSchema: [
      { key: 'items', label: 'Items', type: 'textarea' }
    ],
    createNode: (options) => ({
      id: options.id,
      componentType: 'anchor',
      props: { items: '基础信息,操作记录,附件' }
    })
  },
  {
    type: 'breadcrumb',
    title: '面包屑',
    category: '导航',
    component: NgxLowcodeTethysMaterialComponent,
    setterSchema: [
      { key: 'items', label: 'Items', type: 'textarea' }
    ],
    createNode: (options) => ({
      id: options.id,
      componentType: 'breadcrumb',
      props: { items: '首页,项目,详情' }
    })
  },
  {
    type: 'tabs',
    title: '选项卡',
    category: '导航',
    component: NgxLowcodeTethysMaterialComponent,
    setterSchema: [
      { key: 'items', label: 'Items', type: 'textarea' }
    ],
    createNode: (options) => ({
      id: options.id,
      componentType: 'tabs',
      props: { items: '概览,分析,日志', thyBasis: '100%' }
    })
  },
  {
    type: 'menu',
    title: '菜单',
    category: '导航',
    component: NgxLowcodeTethysMaterialComponent,
    setterSchema: [
      { key: 'items', label: 'Items', type: 'textarea' }
    ],
    createNode: (options) => ({
      id: options.id,
      componentType: 'menu',
      props: { items: '概览,详情,设置' }
    })
  },
  {
    type: 'input-number',
    title: '数字输入框',
    category: '数据录入',
    component: NgxLowcodeTethysMaterialComponent,
    setterSchema: [
      { key: 'label', label: 'Label', type: 'text' },
      { key: 'stateKey', label: 'State Key', type: 'text' },
      { key: 'value', label: 'Default Value', type: 'number' }
    ],
    createNode: (options) => ({
      id: options.id,
      componentType: 'input-number',
      props: { label: '数量', stateKey: 'amount', value: 0 }
    })
  },
  {
    type: 'checkbox',
    title: '多选框',
    category: '数据录入',
    component: NgxLowcodeTethysMaterialComponent,
    setterSchema: [
      { key: 'label', label: 'Label', type: 'text' },
      { key: 'stateKey', label: 'State Key', type: 'text' }
    ],
    createNode: (options) => ({
      id: options.id,
      componentType: 'checkbox',
      props: { label: '启用筛选', stateKey: 'enabled' }
    })
  },
  {
    type: 'radio',
    title: '单选框',
    category: '数据录入',
    component: NgxLowcodeTethysMaterialComponent,
    setterSchema: [
      { key: 'label', label: 'Label', type: 'text' },
      { key: 'items', label: 'Items', type: 'textarea' },
      { key: 'stateKey', label: 'State Key', type: 'text' }
    ],
    createNode: (options) => ({
      id: options.id,
      componentType: 'radio',
      props: { label: '审批状态', items: '选项一,选项二,选项三', stateKey: 'radioValue', thyBasis: '100%' }
    })
  },
  {
    type: 'switch',
    title: '开关',
    category: '数据录入',
    component: NgxLowcodeTethysMaterialComponent,
    setterSchema: [
      { key: 'label', label: 'Label', type: 'text' },
      { key: 'stateKey', label: 'State Key', type: 'text' }
    ],
    createNode: (options) => ({
      id: options.id,
      componentType: 'switch',
      props: { label: '启用', stateKey: 'switchValue' }
    })
  },
  {
    type: 'date-picker',
    title: '日期选择',
    category: '数据录入',
    component: NgxLowcodeTethysMaterialComponent,
    setterSchema: [
      { key: 'label', label: 'Label', type: 'text' },
      { key: 'stateKey', label: 'State Key', type: 'text' }
    ],
    createNode: (options) => ({
      id: options.id,
      componentType: 'date-picker',
      props: { label: '日期', stateKey: 'selectedDate' }
    })
  },
  {
    type: 'upload',
    title: '上传',
    category: '数据录入',
    component: NgxLowcodeTethysMaterialComponent,
    setterSchema: [
      { key: 'label', label: 'Label', type: 'text' },
      { key: 'stateKey', label: 'State Key', type: 'text' }
    ],
    createNode: (options) => ({
      id: options.id,
      componentType: 'upload',
      props: { label: '附件', stateKey: 'uploadedFiles', thyBasis: '100%' }
    })
  },
  {
    type: 'card',
    title: '卡片',
    category: '数据展示',
    component: NgxLowcodeTethysMaterialComponent,
    setterSchema: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'text', label: 'Content', type: 'textarea' }
    ],
    createNode: (options) => ({
      id: options.id,
      componentType: 'card',
      props: { title: '卡片标题', description: '卡片描述', text: '卡片内容预览' }
    })
  },
  {
    type: 'list',
    title: '列表',
    category: '数据展示',
    component: NgxLowcodeTethysMaterialComponent,
    setterSchema: [
      { key: 'items', label: 'Items', type: 'textarea' }
    ],
    createNode: (options) => ({
      id: options.id,
      componentType: 'list',
      props: { items: '列表项 A,列表项 B,列表项 C' }
    })
  },
  {
    type: 'tag',
    title: '标签',
    category: '数据展示',
    component: NgxLowcodeTethysMaterialComponent,
    setterSchema: [
      { key: 'title', label: 'Text', type: 'text' },
      { key: 'color', label: 'Color', type: 'text' },
      { key: 'theme', label: 'Theme', type: 'select', options: [
        { label: 'Weak Fill', value: 'weak-fill' },
        { label: 'Fill', value: 'fill' },
        { label: 'Outline', value: 'outline' }
      ] }
    ],
    createNode: (options) => ({
      id: options.id,
      componentType: 'tag',
      props: { title: '标签', color: 'primary', theme: 'weak-fill' }
    })
  },
  {
    type: 'avatar',
    title: '头像',
    category: '数据展示',
    component: NgxLowcodeTethysMaterialComponent,
    setterSchema: [
      { key: 'title', label: 'Name', type: 'text' }
    ],
    createNode: (options) => ({
      id: options.id,
      componentType: 'avatar',
      props: { title: 'Lowcode' }
    })
  },
  {
    type: 'progress',
    title: '进度条',
    category: '数据展示',
    component: NgxLowcodeTethysMaterialComponent,
    setterSchema: [
      { key: 'value', label: 'Value', type: 'number', min: 0, max: 100 }
    ],
    createNode: (options) => ({
      id: options.id,
      componentType: 'progress',
      props: { value: 68, thyBasis: '100%' }
    })
  },
  {
    type: 'statistic',
    title: '数据统计',
    category: '数据展示',
    component: NgxLowcodeTethysMaterialComponent,
    setterSchema: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'value', label: 'Value', type: 'text' }
    ],
    createNode: (options) => ({
      id: options.id,
      componentType: 'statistic',
      props: { title: '成交金额', value: 1128 }
    })
  },
  {
    type: 'alert',
    title: '警告框',
    category: '反馈',
    component: NgxLowcodeTethysMaterialComponent,
    setterSchema: [
      { key: 'title', label: 'Text', type: 'text' },
      { key: 'type', label: 'Type', type: 'select', options: [
        { label: 'Info', value: 'info' },
        { label: 'Success', value: 'success' },
        { label: 'Warning', value: 'warning' },
        { label: 'Danger', value: 'danger' }
      ] }
    ],
    createNode: (options) => ({
      id: options.id,
      componentType: 'alert',
      props: { title: '这是一条提示信息', type: 'info' }
    })
  },
];

export function provideNgxLowcodeMaterials() {
  return registerLowcodeMaterials(builtInMaterials);
}
