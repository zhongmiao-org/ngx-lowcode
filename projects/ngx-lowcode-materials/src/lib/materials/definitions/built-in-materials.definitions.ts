import {
  NgxLowcodeComponentDefinition as MaterialDefinition,
  NgxLowcodeMaterialCreateNodeOptions
} from 'ngx-lowcode-core-types';
import { getMaterialsI18n, NgxLowcodeLocale } from 'ngx-lowcode-i18n';
import { NgxLowcodeButtonMaterialComponent } from '../components/button/ngx-lowcode-button-material.component';
import { NgxLowcodeFormMaterialComponent } from '../components/form/ngx-lowcode-form-material.component';
import { NgxLowcodeInputMaterialComponent } from '../components/input/ngx-lowcode-input-material.component';
import { NgxLowcodePageMaterialComponent } from '../components/page/ngx-lowcode-page-material.component';
import { NgxLowcodeSectionMaterialComponent } from '../components/section/ngx-lowcode-section-material.component';
import { NgxLowcodeSelectMaterialComponent } from '../components/select/ngx-lowcode-select-material.component';
import { NgxLowcodeTableMaterialComponent } from '../components/table/ngx-lowcode-table-material.component';
import { NgxLowcodeTethysMaterialComponent } from '../components/tethys/ngx-lowcode-tethys-material.component';
import { NgxLowcodeTextMaterialComponent } from '../components/text/ngx-lowcode-text-material.component';
import { selectOption } from '../../core';
import {
  getFormLayoutSetters,
  getPageItemLayoutSetters,
  getPageLayoutSetters,
  getSectionLayoutSetters
} from '../factories/layout-setters.factory';

export function getBuiltInMaterials(locale: NgxLowcodeLocale = 'zh-CN'): MaterialDefinition[] {
  const t = getMaterialsI18n(locale);

  return [
    {
      type: 'page',
      title: t.materials.page,
      category: t.categories.layout,
      canHaveChildren: true,
      component: NgxLowcodePageMaterialComponent,
      setterSchema: [
        { key: 'title', label: t.setters.title, type: 'text' },
        { key: 'description', label: t.setters.description, type: 'textarea' },
        ...getPageLayoutSetters(locale)
      ],
      itemSetterSchema: [...getPageItemLayoutSetters(locale)],
      createNode: (options: NgxLowcodeMaterialCreateNodeOptions) => ({
        id: options.id,
        componentType: 'page',
        props: {
          title: t.defaults.pageTitle,
          description: t.defaults.pageDescription,
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
      title: t.materials.section,
      category: t.categories.layout,
      canHaveChildren: true,
      component: NgxLowcodeSectionMaterialComponent,
      setterSchema: [
        { key: 'title', label: t.setters.title, type: 'text', group: 'properties' },
        ...getSectionLayoutSetters(locale)
      ],
      itemSetterSchema: [...getPageItemLayoutSetters(locale)],
      createNode: (options: NgxLowcodeMaterialCreateNodeOptions) => ({
        id: options.id,
        componentType: 'section',
        props: {
          title: t.defaults.sectionTitle,
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
      title: t.materials.form,
      category: t.categories.layout,
      canHaveChildren: true,
      component: NgxLowcodeFormMaterialComponent,
      setterSchema: [
        { key: 'title', label: t.setters.title, type: 'text', group: 'properties' },
        ...getFormLayoutSetters(locale)
      ],
      createNode: (options: NgxLowcodeMaterialCreateNodeOptions) => ({
        id: options.id,
        componentType: 'form',
        props: {
          title: t.defaults.formTitle,
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
      title: t.materials.text,
      category: t.categories.common,
      component: NgxLowcodeTextMaterialComponent,
      setterSchema: [
        { key: 'text', label: t.setters.text, type: 'textarea' },
        { key: 'href', label: t.setters.href, type: 'text' },
        { key: 'target', label: t.setters.target, type: 'text', placeholder: t.placeholders.targetBlank }
      ],
      createNode: (options: NgxLowcodeMaterialCreateNodeOptions) => ({
        id: options.id,
        componentType: 'text',
        props: { text: t.defaults.text }
      })
    },
    {
      type: 'button',
      title: t.materials.button,
      category: t.categories.common,
      component: NgxLowcodeButtonMaterialComponent,
      events: [{ name: 'click', label: t.options.click }],
      setterSchema: [
        { key: 'label', label: t.setters.label, type: 'text' },
        {
          key: 'buttonType',
          label: t.setters.type,
          type: 'select',
          options: [
            selectOption(t.options.primary, 'primary'),
            selectOption(t.options.primaryOutline, 'primary-outline'),
            selectOption(t.options.default, 'default')
          ]
        },
        { key: 'actionId', label: t.setters.actionId, type: 'text' }
      ],
      createNode: (options: NgxLowcodeMaterialCreateNodeOptions) => ({
        id: options.id,
        componentType: 'button',
        props: { label: t.defaults.button, buttonType: 'primary', actionId: 'search-action' }
      })
    },
    {
      type: 'input',
      title: t.materials.input,
      category: t.categories.dataEntry,
      component: NgxLowcodeInputMaterialComponent,
      setterSchema: [
        { key: 'label', label: t.setters.label, type: 'text' },
        { key: 'placeholder', label: t.setters.placeholder, type: 'text' },
        { key: 'stateKey', label: t.setters.stateKey, type: 'text' }
      ],
      createNode: (options: NgxLowcodeMaterialCreateNodeOptions) => ({
        id: options.id,
        componentType: 'input',
        props: { label: t.defaults.inputLabel, placeholder: t.placeholders.inputKeyword, stateKey: 'keyword' }
      })
    },
    {
      type: 'select',
      title: t.materials.select,
      category: t.categories.dataEntry,
      component: NgxLowcodeSelectMaterialComponent,
      setterSchema: [
        { key: 'label', label: t.setters.label, type: 'text' },
        { key: 'placeholder', label: t.setters.placeholder, type: 'text' },
        { key: 'stateKey', label: t.setters.stateKey, type: 'text' }
      ],
      createNode: (options: NgxLowcodeMaterialCreateNodeOptions) => ({
        id: options.id,
        componentType: 'select',
        props: {
          label: t.defaults.selectLabel,
          placeholder: t.placeholders.selectStatus,
          stateKey: 'status',
          options: [
            selectOption(t.options.all, 'all'),
            selectOption(t.options.active, 'active'),
            selectOption(t.options.paused, 'paused')
          ]
        }
      })
    },
    {
      type: 'table',
      title: t.materials.table,
      category: t.categories.dataDisplay,
      component: NgxLowcodeTableMaterialComponent,
      setterSchema: [
        { key: 'title', label: t.setters.title, type: 'text' },
        { key: 'dataKey', label: t.setters.dataKey, type: 'text' }
      ],
      createNode: (options: NgxLowcodeMaterialCreateNodeOptions) => ({
        id: options.id,
        componentType: 'table',
        props: { title: t.defaults.tableTitle, dataKey: 'tableData', thyBasis: '100%', thySpan: 24, thyOffset: 0 }
      })
    },
    {
      type: 'icon',
      title: t.materials.icon,
      category: t.categories.common,
      component: NgxLowcodeTethysMaterialComponent,
      setterSchema: [{ key: 'iconName', label: t.setters.icon, type: 'text' }],
      createNode: (options) => ({ id: options.id, componentType: 'icon', props: { iconName: 'mail' } })
    },
    {
      type: 'divider',
      title: t.materials.divider,
      category: t.categories.common,
      component: NgxLowcodeTethysMaterialComponent,
      setterSchema: [{ key: 'title', label: t.setters.text, type: 'text' }],
      createNode: (options) => ({
        id: options.id,
        componentType: 'divider',
        props: { title: t.defaults.dividerTitle, thyBasis: '100%' }
      })
    },
    {
      type: 'image',
      title: t.materials.image,
      category: t.categories.common,
      component: NgxLowcodeTethysMaterialComponent,
      setterSchema: [
        { key: 'title', label: t.setters.alt, type: 'text' },
        { key: 'src', label: t.setters.src, type: 'text' }
      ],
      createNode: (options) => ({
        id: options.id,
        componentType: 'image',
        props: { title: t.defaults.imageTitle, src: t.defaults.imageSrc }
      })
    },
    {
      type: 'space',
      title: t.materials.space,
      category: t.categories.layout,
      component: NgxLowcodeTethysMaterialComponent,
      setterSchema: [],
      createNode: (options) => ({ id: options.id, componentType: 'space', props: {} })
    },
    {
      type: 'anchor',
      title: t.materials.anchor,
      category: t.categories.layout,
      component: NgxLowcodeTethysMaterialComponent,
      setterSchema: [{ key: 'items', label: t.setters.items, type: 'textarea' }],
      createNode: (options) => ({ id: options.id, componentType: 'anchor', props: { items: t.defaults.anchorItems } })
    },
    {
      type: 'breadcrumb',
      title: t.materials.breadcrumb,
      category: t.categories.navigation,
      component: NgxLowcodeTethysMaterialComponent,
      setterSchema: [{ key: 'items', label: t.setters.items, type: 'textarea' }],
      createNode: (options) => ({
        id: options.id,
        componentType: 'breadcrumb',
        props: { items: t.defaults.breadcrumbItems }
      })
    },
    {
      type: 'tabs',
      title: t.materials.tabs,
      category: t.categories.navigation,
      component: NgxLowcodeTethysMaterialComponent,
      setterSchema: [{ key: 'items', label: t.setters.items, type: 'textarea' }],
      createNode: (options) => ({
        id: options.id,
        componentType: 'tabs',
        props: { items: t.defaults.tabItems, thyBasis: '100%' }
      })
    },
    {
      type: 'menu',
      title: t.materials.menu,
      category: t.categories.navigation,
      component: NgxLowcodeTethysMaterialComponent,
      setterSchema: [{ key: 'items', label: t.setters.items, type: 'textarea' }],
      createNode: (options) => ({ id: options.id, componentType: 'menu', props: { items: t.defaults.menuItems } })
    },
    {
      type: 'input-number',
      title: t.materials['input-number'],
      category: t.categories.dataEntry,
      component: NgxLowcodeTethysMaterialComponent,
      setterSchema: [
        { key: 'label', label: t.setters.label, type: 'text' },
        { key: 'stateKey', label: t.setters.stateKey, type: 'text' },
        { key: 'value', label: t.setters.value, type: 'number' }
      ],
      createNode: (options) => ({
        id: options.id,
        componentType: 'input-number',
        props: { label: t.defaults.inputNumberLabel, stateKey: 'amount', value: 0 }
      })
    },
    {
      type: 'checkbox',
      title: t.materials.checkbox,
      category: t.categories.dataEntry,
      component: NgxLowcodeTethysMaterialComponent,
      setterSchema: [
        { key: 'label', label: t.setters.label, type: 'text' },
        { key: 'stateKey', label: t.setters.stateKey, type: 'text' }
      ],
      createNode: (options) => ({
        id: options.id,
        componentType: 'checkbox',
        props: { label: t.defaults.checkboxLabel, stateKey: 'enabled' }
      })
    },
    {
      type: 'radio',
      title: t.materials.radio,
      category: t.categories.dataEntry,
      component: NgxLowcodeTethysMaterialComponent,
      setterSchema: [
        { key: 'label', label: t.setters.label, type: 'text' },
        { key: 'items', label: t.setters.items, type: 'textarea' },
        { key: 'stateKey', label: t.setters.stateKey, type: 'text' }
      ],
      createNode: (options) => ({
        id: options.id,
        componentType: 'radio',
        props: { label: t.defaults.radioLabel, items: t.defaults.radioItems, stateKey: 'radioValue', thyBasis: '100%' }
      })
    },
    {
      type: 'switch',
      title: t.materials.switch,
      category: t.categories.dataEntry,
      component: NgxLowcodeTethysMaterialComponent,
      setterSchema: [
        { key: 'label', label: t.setters.label, type: 'text' },
        { key: 'stateKey', label: t.setters.stateKey, type: 'text' }
      ],
      createNode: (options) => ({
        id: options.id,
        componentType: 'switch',
        props: { label: t.defaults.switchLabel, stateKey: 'switchValue' }
      })
    },
    {
      type: 'date-picker',
      title: t.materials['date-picker'],
      category: t.categories.dataEntry,
      component: NgxLowcodeTethysMaterialComponent,
      setterSchema: [
        { key: 'label', label: t.setters.label, type: 'text' },
        { key: 'stateKey', label: t.setters.stateKey, type: 'text' }
      ],
      createNode: (options) => ({
        id: options.id,
        componentType: 'date-picker',
        props: { label: t.defaults.datePickerLabel, stateKey: 'selectedDate' }
      })
    },
    {
      type: 'upload',
      title: t.materials.upload,
      category: t.categories.dataEntry,
      component: NgxLowcodeTethysMaterialComponent,
      setterSchema: [
        { key: 'label', label: t.setters.label, type: 'text' },
        { key: 'stateKey', label: t.setters.stateKey, type: 'text' }
      ],
      createNode: (options) => ({
        id: options.id,
        componentType: 'upload',
        props: { label: t.defaults.uploadLabel, stateKey: 'uploadedFiles', thyBasis: '100%' }
      })
    },
    {
      type: 'card',
      title: t.materials.card,
      category: t.categories.dataDisplay,
      component: NgxLowcodeTethysMaterialComponent,
      setterSchema: [
        { key: 'title', label: t.setters.title, type: 'text' },
        { key: 'description', label: t.setters.description, type: 'text' },
        { key: 'text', label: t.setters.content, type: 'textarea' }
      ],
      createNode: (options) => ({
        id: options.id,
        componentType: 'card',
        props: { title: t.defaults.cardTitle, description: t.defaults.cardDescription, text: t.defaults.cardText }
      })
    },
    {
      type: 'list',
      title: t.materials.list,
      category: t.categories.dataDisplay,
      component: NgxLowcodeTethysMaterialComponent,
      setterSchema: [{ key: 'items', label: t.setters.items, type: 'textarea' }],
      createNode: (options) => ({ id: options.id, componentType: 'list', props: { items: t.defaults.listItems } })
    },
    {
      type: 'tag',
      title: t.materials.tag,
      category: t.categories.dataDisplay,
      component: NgxLowcodeTethysMaterialComponent,
      setterSchema: [
        { key: 'title', label: t.setters.text, type: 'text' },
        { key: 'color', label: t.setters.color, type: 'text' },
        {
          key: 'theme',
          label: t.setters.theme,
          type: 'select',
          options: [
            selectOption(t.options.weakFill, 'weak-fill'),
            selectOption(t.options.fill, 'fill'),
            selectOption(t.options.outline, 'outline')
          ]
        }
      ],
      createNode: (options) => ({
        id: options.id,
        componentType: 'tag',
        props: { title: t.defaults.tagTitle, color: 'primary', theme: 'weak-fill' }
      })
    },
    {
      type: 'avatar',
      title: t.materials.avatar,
      category: t.categories.dataDisplay,
      component: NgxLowcodeTethysMaterialComponent,
      setterSchema: [{ key: 'title', label: t.setters.name, type: 'text' }],
      createNode: (options) => ({ id: options.id, componentType: 'avatar', props: { title: t.defaults.avatarTitle } })
    },
    {
      type: 'progress',
      title: t.materials.progress,
      category: t.categories.dataDisplay,
      component: NgxLowcodeTethysMaterialComponent,
      setterSchema: [{ key: 'value', label: t.setters.value, type: 'number', min: 0, max: 100 }],
      createNode: (options) => ({ id: options.id, componentType: 'progress', props: { value: 68, thyBasis: '100%' } })
    },
    {
      type: 'statistic',
      title: t.materials.statistic,
      category: t.categories.dataDisplay,
      component: NgxLowcodeTethysMaterialComponent,
      setterSchema: [
        { key: 'title', label: t.setters.title, type: 'text' },
        { key: 'value', label: t.setters.value, type: 'text' }
      ],
      createNode: (options) => ({
        id: options.id,
        componentType: 'statistic',
        props: { title: t.defaults.statisticTitle, value: 1128 }
      })
    },
    {
      type: 'alert',
      title: t.materials.alert,
      category: t.categories.feedback,
      component: NgxLowcodeTethysMaterialComponent,
      setterSchema: [
        { key: 'title', label: t.setters.text, type: 'text' },
        {
          key: 'type',
          label: t.setters.type,
          type: 'select',
          options: [
            selectOption(t.options.info, 'info'),
            selectOption(t.options.success, 'success'),
            selectOption(t.options.warning, 'warning'),
            selectOption(t.options.danger, 'danger')
          ]
        }
      ],
      createNode: (options) => ({
        id: options.id,
        componentType: 'alert',
        props: { title: t.defaults.alertTitle, type: 'info' }
      })
    }
  ];
}
