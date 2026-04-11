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
      { key: 'layout', label: 'Layout', type: 'select', options: [
        { label: 'Stack', value: 'stack' },
        { label: '2 Columns', value: 'two-column' },
        { label: '3 Columns', value: 'three-column' }
      ] },
      { key: 'minHeight', label: 'Min Height', type: 'number', min: 80 },
      { key: 'height', label: 'Fixed Height', type: 'number', min: 0 },
      { key: 'padding', label: 'Padding', type: 'number', min: 0 },
      { key: 'gap', label: 'Gap', type: 'number', min: 0 }
    ],
    createNode: (options: NgxLowcodeMaterialCreateNodeOptions) => ({
      id: options.id,
      componentType: 'section',
      props: {
        title: 'Section',
        layout: 'stack',
        minHeight: 240,
        height: '',
        padding: 16,
        gap: 16
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
