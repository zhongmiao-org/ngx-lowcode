import { NgxLowcodeSetterDefinition } from '@zhongmiao/ngx-lowcode-core-types';
import { getMaterialsI18n, NgxLowcodeLocale } from '@zhongmiao/ngx-lowcode-i18n';
import { selectOption } from '../../core';

export function getPageLayoutSetters(locale: NgxLowcodeLocale): NgxLowcodeSetterDefinition[] {
  const t = getMaterialsI18n(locale);
  return [
    { key: 'thyGap', label: 'thyGap', type: 'text', group: 'layout', placeholder: t.placeholders.pageGap },
    {
      key: 'thyDirection',
      label: 'thyDirection',
      type: 'select',
      group: 'layout',
      options: [
        selectOption(t.options.row, 'row'),
        selectOption(t.options.column, 'column'),
        selectOption(t.options.rowReverse, 'row-reverse'),
        selectOption(t.options.columnReverse, 'column-reverse')
      ]
    },
    {
      key: 'thyWrap',
      label: 'thyWrap',
      type: 'select',
      group: 'layout',
      options: [
        selectOption(t.options.noWrap, 'nowrap'),
        selectOption(t.options.wrap, 'wrap'),
        selectOption(t.options.wrapReverse, 'wrap-reverse')
      ]
    },
    {
      key: 'thyJustifyContent',
      label: 'thyJustifyContent',
      type: 'select',
      group: 'layout',
      options: [
        selectOption(t.options.start, 'start'),
        selectOption(t.options.center, 'center'),
        selectOption(t.options.end, 'end'),
        selectOption(t.options.spaceBetween, 'space-between'),
        selectOption(t.options.spaceAround, 'space-around')
      ]
    },
    {
      key: 'thyAlignItems',
      label: 'thyAlignItems',
      type: 'select',
      group: 'layout',
      options: [
        selectOption(t.options.stretch, 'stretch'),
        selectOption(t.options.start, 'start'),
        selectOption(t.options.center, 'center'),
        selectOption(t.options.end, 'end'),
        selectOption(t.options.baseline, 'baseline')
      ]
    }
  ];
}

export function getPageItemLayoutSetters(locale: NgxLowcodeLocale): NgxLowcodeSetterDefinition[] {
  const t = getMaterialsI18n(locale);
  return [
    {
      key: 'thyGrow',
      label: 'thyGrow',
      type: 'select',
      group: 'layout',
      options: [selectOption('0', '0'), selectOption('1', '1')]
    },
    {
      key: 'thyShrink',
      label: 'thyShrink',
      type: 'select',
      group: 'layout',
      options: [selectOption('1', '1'), selectOption('0', '0')]
    },
    { key: 'thyBasis', label: 'thyBasis', type: 'text', group: 'layout', placeholder: t.placeholders.basis },
    { key: 'thyOrder', label: 'thyOrder', type: 'number', group: 'layout' },
    {
      key: 'thyAlignSelf',
      label: 'thyAlignSelf',
      type: 'select',
      group: 'layout',
      options: [
        selectOption(t.options.auto, 'auto'),
        selectOption(t.options.stretch, 'stretch'),
        selectOption(t.options.start, 'flex-start'),
        selectOption(t.options.center, 'center'),
        selectOption(t.options.end, 'flex-end'),
        selectOption(t.options.baseline, 'baseline')
      ]
    }
  ];
}

export function getSectionLayoutSetters(locale: NgxLowcodeLocale): NgxLowcodeSetterDefinition[] {
  const t = getMaterialsI18n(locale);
  return [
    { key: 'thyGap', label: 'thyGap', type: 'text', group: 'layout', placeholder: t.placeholders.sectionGap },
    ...getPageLayoutSetters(locale).filter((setter) => setter.key !== 'thyGap')
  ];
}

export function getFormLayoutSetters(locale: NgxLowcodeLocale): NgxLowcodeSetterDefinition[] {
  const t = getMaterialsI18n(locale);
  return [
    {
      key: 'thyLayout',
      label: 'thyLayout',
      type: 'select',
      group: 'layout',
      options: [selectOption(t.options.horizontal, 'horizontal'), selectOption(t.options.vertical, 'vertical')]
    }
  ];
}
