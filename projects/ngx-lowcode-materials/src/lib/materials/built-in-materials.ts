import { registerLowcodeMaterials } from 'ngx-lowcode-core';
import { NgxLowcodeComponentDefinition, NgxLowcodeMaterialCreateNodeOptions } from 'ngx-lowcode-core-types';
import { NgxLowcodeButtonMaterialComponent } from '../components/button/ngx-lowcode-button-material.component';
import { NgxLowcodeFormMaterialComponent } from '../components/form/ngx-lowcode-form-material.component';
import { NgxLowcodeInputMaterialComponent } from '../components/input/ngx-lowcode-input-material.component';
import { NgxLowcodePageMaterialComponent } from '../components/page/ngx-lowcode-page-material.component';
import { NgxLowcodeSectionMaterialComponent } from '../components/section/ngx-lowcode-section-material.component';
import { NgxLowcodeSelectMaterialComponent } from '../components/select/ngx-lowcode-select-material.component';
import { NgxLowcodeTableMaterialComponent } from '../components/table/ngx-lowcode-table-material.component';
import { NgxLowcodeTextMaterialComponent } from '../components/text/ngx-lowcode-text-material.component';

export const builtInMaterials: NgxLowcodeComponentDefinition[] = [
  {
    type: 'page',
    title: 'Page',
    category: 'layout',
    canHaveChildren: true,
    component: NgxLowcodePageMaterialComponent,
    setterSchema: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' }
    ],
    createNode: (options: NgxLowcodeMaterialCreateNodeOptions) => ({
      id: options.id,
      componentType: 'page',
      props: {
        title: 'Demo Page',
        description: 'Build pages with registered materials.'
      },
      children: []
    })
  },
  {
    type: 'section',
    title: 'Section',
    category: 'layout',
    canHaveChildren: true,
    component: NgxLowcodeSectionMaterialComponent,
    setterSchema: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'layoutMode', label: 'Layout Mode', type: 'select', options: [
        { label: 'Grid', value: 'grid' },
        { label: 'Flex Grid', value: 'flex-grid' },
        { label: 'Flex', value: 'flex' }
      ] },
      { key: 'thyCols', label: 'thyCols', type: 'text', placeholder: '24 or 24 md:12' },
      { key: 'thyXGap', label: 'thyXGap', type: 'text', placeholder: '0 or sm:8 md:16' },
      { key: 'thyYGap', label: 'thyYGap', type: 'text', placeholder: '0 or sm:8 md:16' },
      { key: 'thyGap', label: 'thyGap', type: 'text', placeholder: '0 or sm:8 md:16' },
      { key: 'thyResponsive', label: 'thyResponsive', type: 'select', options: [
        { label: 'None', value: 'none' },
        { label: 'Self', value: 'self' },
        { label: 'Screen', value: 'screen' }
      ] },
      { key: 'thyDirection', label: 'thyDirection', type: 'select', options: [
        { label: 'Row', value: 'row' },
        { label: 'Column', value: 'column' },
        { label: 'Row Reverse', value: 'row-reverse' },
        { label: 'Column Reverse', value: 'column-reverse' }
      ] },
      { key: 'thyWrap', label: 'thyWrap', type: 'select', options: [
        { label: 'No Wrap', value: 'nowrap' },
        { label: 'Wrap', value: 'wrap' },
        { label: 'Wrap Reverse', value: 'wrap-reverse' }
      ] },
      { key: 'thyJustifyContent', label: 'thyJustifyContent', type: 'select', options: [
        { label: 'Start', value: 'start' },
        { label: 'Center', value: 'center' },
        { label: 'End', value: 'end' },
        { label: 'Space Between', value: 'space-between' },
        { label: 'Space Around', value: 'space-around' }
      ] },
      { key: 'thyAlignItems', label: 'thyAlignItems', type: 'select', options: [
        { label: 'Stretch', value: 'stretch' },
        { label: 'Start', value: 'start' },
        { label: 'Center', value: 'center' },
        { label: 'End', value: 'end' },
        { label: 'Baseline', value: 'baseline' }
      ] },
      { key: 'minHeight', label: 'Min Height', type: 'number', min: 80, suffix: 'px' },
      { key: 'height', label: 'Height', type: 'number', min: 0, suffix: 'px' },
      { key: 'padding', label: 'Padding', type: 'number', min: 0, suffix: 'px' }
    ],
    createNode: (options: NgxLowcodeMaterialCreateNodeOptions) => ({
      id: options.id,
      componentType: 'section',
      props: {
        title: 'Section',
        layoutMode: 'grid',
        thyCols: 24,
        thyGap: 16,
        thyResponsive: 'screen',
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
    category: 'layout',
    canHaveChildren: true,
    component: NgxLowcodeFormMaterialComponent,
    setterSchema: [{ key: 'title', label: 'Title', type: 'text' }],
    createNode: (options: NgxLowcodeMaterialCreateNodeOptions) => ({
      id: options.id,
      componentType: 'form',
      props: { title: 'Query Form' },
      children: []
    })
  },
  {
    type: 'text',
    title: 'Text',
    category: 'basic',
    component: NgxLowcodeTextMaterialComponent,
    setterSchema: [{ key: 'text', label: 'Text', type: 'textarea' }],
    createNode: (options: NgxLowcodeMaterialCreateNodeOptions) => ({
      id: options.id,
      componentType: 'text',
      props: { text: 'Text block' }
    })
  },
  {
    type: 'button',
    title: 'Button',
    category: 'basic',
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
    category: 'form',
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
    category: 'form',
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
    category: 'data',
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
        dataKey: 'tableData'
      }
    })
  }
];

export function provideNgxLowcodeMaterials() {
  return registerLowcodeMaterials(builtInMaterials);
}
