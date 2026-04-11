import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { registerLowcodeMaterials } from 'ngx-lowcode-core';
import {
  NgxLowcodeComponentDefinition,
  NgxLowcodeMaterialCreateNodeOptions,
  NgxLowcodeNodeSchema,
  NgxLowcodeRuntimeContext
} from 'ngx-lowcode-core-types';
import { NgxLowcodeRenderChildrenComponent } from 'ngx-lowcode-renderer';
import { ThyButtonModule } from 'ngx-tethys/button';
import { ThyInputModule } from 'ngx-tethys/input';
import { ThyOption } from 'ngx-tethys/shared';
import { ThySelectModule } from 'ngx-tethys/select';

@Component({
  selector: 'ngx-lowcode-page-material',
  standalone: true,
  imports: [CommonModule, NgxLowcodeRenderChildrenComponent],
  template: `
    <div class="ngx-lowcode-page">
      <section class="ngx-lowcode-page__header">
        <h2>{{ title() }}</h2>
        @if (description(); as value) {
          <p>{{ value }}</p>
        }
      </section>
      <section class="ngx-lowcode-page__body">
        <ngx-lowcode-render-children [nodes]="node().children ?? []" [runtime]="runtime()"></ngx-lowcode-render-children>
        @if (showEmptyDropzone()) {
          <div class="ngx-lowcode-empty-dropzone">Drop components into this page</div>
        }
      </section>
    </div>
  `,
  styles: [
    `
      .ngx-lowcode-page {
        display: block;
        background: #f7fafc;
        border-radius: 16px;
        padding: 24px;
        min-height: 100%;
      }
      .ngx-lowcode-page__header {
        margin-bottom: 20px;
      }
      .ngx-lowcode-page__header h2 {
        margin: 0;
        font-size: 24px;
      }
      .ngx-lowcode-page__header p {
        margin: 8px 0 0;
        color: #667085;
      }
      .ngx-lowcode-empty-dropzone {
        border: 2px dashed #14b8a6;
        border-radius: 16px;
        padding: 24px;
        color: #0f766e;
        background: rgba(204, 251, 241, 0.35);
        text-align: center;
      }
    `
  ]
})
export class NgxLowcodePageMaterialComponent {
  readonly node = input.required<NgxLowcodeNodeSchema>();
  readonly runtime = input.required<NgxLowcodeRuntimeContext>();

  readonly title = computed(() => String(this.node().props['title'] ?? 'Page'));
  readonly description = computed(() => String(this.node().props['description'] ?? ''));
  readonly showEmptyDropzone = computed(() => {
    const dropTarget = this.runtime().dropTarget?.();
    return this.runtime().mode === 'design' && !this.node().children?.length && dropTarget?.parentId === this.node().id;
  });
}

@Component({
  selector: 'ngx-lowcode-section-material',
  standalone: true,
  imports: [CommonModule, NgxLowcodeRenderChildrenComponent],
  template: `
    <section class="ngx-lowcode-section" [ngStyle]="sectionStyle()">
      <header class="ngx-lowcode-section__header">{{ title() }}</header>
      <div class="ngx-lowcode-section__body" [ngStyle]="bodyStyle()">
        @for (column of distributedChildren(); track $index) {
          <div
            class="ngx-lowcode-section__column"
            [class.ngx-lowcode-section__column--active-drop]="activeDropSlot() === columnSlotName($index)"
            [class.ngx-lowcode-section__column--empty]="!column.length">
            <ngx-lowcode-render-children [nodes]="column" [runtime]="runtime()"></ngx-lowcode-render-children>
            @if (showColumnDropPlaceholder(column, $index)) {
              <div class="ngx-lowcode-section__drop-placeholder">{{ columnPlaceholderLabel($index) }}</div>
            }
          </div>
        }
      </div>
    </section>
  `,
  styles: [
    `
      .ngx-lowcode-section {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 14px;
        padding: 16px;
        margin-bottom: 16px;
        overflow: visible;
      }
      .ngx-lowcode-section__header {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 12px;
      }
      .ngx-lowcode-section__body {
        overflow: visible;
      }
      .ngx-lowcode-section__column {
        min-width: 0;
        min-height: 80px;
        position: relative;
      }
      .ngx-lowcode-section__column--active-drop {
        box-shadow: inset 0 0 0 2px rgba(13, 148, 136, 0.65);
        border-radius: 12px;
        background: linear-gradient(180deg, rgba(240, 253, 250, 0.9) 0%, rgba(236, 254, 255, 0.8) 100%);
      }
      .ngx-lowcode-section__column--empty {
        min-height: 120px;
      }
      .ngx-lowcode-section__drop-placeholder {
        border: 2px dashed #14b8a6;
        border-radius: 12px;
        padding: 18px 12px;
        color: #0f766e;
        background: rgba(204, 251, 241, 0.35);
        text-align: center;
      }
    `
  ]
})
export class NgxLowcodeSectionMaterialComponent {
  readonly node = input.required<NgxLowcodeNodeSchema>();
  readonly runtime = input.required<NgxLowcodeRuntimeContext>();

  readonly title = computed(() => String(this.node().props['title'] ?? 'Section'));
  readonly layout = computed(() => String(this.node().props['layout'] ?? 'stack'));
  readonly minHeight = computed(() => Number(this.node().props['minHeight'] ?? 240));
  readonly height = computed(() => {
    const value = this.node().props['height'];
    return value === undefined || value === null || value === '' ? null : `${Number(value)}px`;
  });
  readonly padding = computed(() => Number(this.node().props['padding'] ?? 16));
  readonly gap = computed(() => Number(this.node().props['gap'] ?? 16));
  readonly activeDropSlot = computed(() => {
    const dropTarget = this.runtime().dropTarget?.();
    if (dropTarget?.parentId !== this.node().id) {
      return null;
    }
    return dropTarget.slot ?? null;
  });
  readonly sectionStyle = computed<Record<string, string | number>>(() => ({
    ...(this.node().style ?? {}),
    minHeight: `${this.minHeight()}px`,
    height: this.height() ?? 'auto',
    padding: `${this.padding()}px`,
    overflow: 'visible'
  }));
  readonly bodyStyle = computed<Record<string, string | number>>(() => ({
    minHeight: `${Math.max(this.minHeight() - 64, 80)}px`,
    display: this.layout() === 'stack' ? 'block' : 'grid',
    gridTemplateColumns: this.resolveGridTemplateColumns(),
    gap: `${this.gap()}px`,
    overflow: 'visible'
  }));
  readonly distributedChildren = computed(() => {
    const children = this.node().children ?? [];
    const columnCount = this.resolveColumnCount();
    const slotOrder = Array.from({ length: columnCount }, (_, index: number) => `col-${index + 1}`);

    if (columnCount === 1) {
      return [children];
    }

    const hasExplicitSlots = children.some((child: NgxLowcodeNodeSchema) => Boolean(child.slot));
    if (hasExplicitSlots) {
      return slotOrder.map((slot) => children.filter((child: NgxLowcodeNodeSchema) => (child.slot ?? 'col-1') === slot));
    }

    return slotOrder.map((_, columnIndex: number) =>
      children.filter((_: NgxLowcodeNodeSchema, childIndex: number) => childIndex % columnCount === columnIndex)
    );
  });

  private resolveColumnCount(): number {
    if (this.layout() === 'two-column') {
      return 2;
    }
    if (this.layout() === 'three-column') {
      return 3;
    }
    return 1;
  }

  private resolveGridTemplateColumns(): string {
    if (this.layout() === 'two-column') {
      return 'repeat(2, minmax(0, 1fr))';
    }
    if (this.layout() === 'three-column') {
      return 'repeat(3, minmax(0, 1fr))';
    }
    return '1fr';
  }

  columnSlotName(index: number): string | null {
    return this.resolveColumnCount() > 1 ? `col-${index + 1}` : null;
  }

  columnPlaceholderLabel(index: number): string {
    const slot = this.columnSlotName(index);
    if (!slot) {
      return 'Drop components into this section';
    }
    return `Drop into ${slot.toUpperCase()}`;
  }

  showColumnDropPlaceholder(column: NgxLowcodeNodeSchema[], index: number): boolean {
    if (this.runtime().mode !== 'design') {
      return false;
    }
    const slot = this.columnSlotName(index);
    if (this.activeDropSlot() !== slot) {
      return false;
    }
    return !column.length || this.resolveColumnCount() > 1;
  }
}

@Component({
  selector: 'ngx-lowcode-form-material',
  standalone: true,
  imports: [CommonModule, NgxLowcodeRenderChildrenComponent],
  template: `
    <form class="ngx-lowcode-form">
      <div class="ngx-lowcode-form__title">{{ title() }}</div>
      <div class="ngx-lowcode-form__grid">
        <ngx-lowcode-render-children [nodes]="node().children ?? []" [runtime]="runtime()"></ngx-lowcode-render-children>
        @if (showEmptyDropzone()) {
          <div class="ngx-lowcode-form__drop-placeholder">Drop form fields here</div>
        }
      </div>
    </form>
  `,
  styles: [
    `
      .ngx-lowcode-form {
        padding: 16px;
        border: 1px solid #d0d5dd;
        border-radius: 12px;
        background: #fcfcfd;
      }
      .ngx-lowcode-form__title {
        margin-bottom: 12px;
        font-weight: 600;
      }
      .ngx-lowcode-form__grid {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }
      .ngx-lowcode-form__drop-placeholder {
        grid-column: 1 / -1;
        border: 2px dashed #14b8a6;
        border-radius: 12px;
        padding: 18px 12px;
        color: #0f766e;
        background: rgba(204, 251, 241, 0.35);
        text-align: center;
      }
    `
  ]
})
export class NgxLowcodeFormMaterialComponent {
  readonly node = input.required<NgxLowcodeNodeSchema>();
  readonly runtime = input.required<NgxLowcodeRuntimeContext>();

  readonly title = computed(() => String(this.node().props['title'] ?? 'Search Form'));
  readonly showEmptyDropzone = computed(() => {
    const dropTarget = this.runtime().dropTarget?.();
    return this.runtime().mode === 'design' && !this.node().children?.length && dropTarget?.parentId === this.node().id;
  });
}

@Component({
  selector: 'ngx-lowcode-text-material',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ngx-lowcode-text" [ngStyle]="node().style ?? null">{{ content() }}</div>
  `,
  styles: [
    `
      .ngx-lowcode-text {
        color: #1d2939;
        line-height: 1.6;
      }
    `
  ]
})
export class NgxLowcodeTextMaterialComponent {
  readonly node = input.required<NgxLowcodeNodeSchema>();
  readonly runtime = input.required<NgxLowcodeRuntimeContext>();

  readonly content = computed(() => interpolateTemplate(String(this.node().props['text'] ?? ''), this.runtime()));
}

@Component({
  selector: 'ngx-lowcode-button-material',
  standalone: true,
  imports: [CommonModule, ThyButtonModule],
  template: `
    <button [thyButton]="buttonType()" thySize="md" (click)="handleClick()">
      {{ label() }}
    </button>
  `
})
export class NgxLowcodeButtonMaterialComponent {
  readonly node = input.required<NgxLowcodeNodeSchema>();
  readonly runtime = input.required<NgxLowcodeRuntimeContext>();

  readonly label = computed(() => String(this.node().props['label'] ?? 'Button'));
  readonly buttonType = computed<any>(() => this.node().props['buttonType'] ?? 'primary');

  async handleClick(): Promise<void> {
    await this.runtime().executeActionById(String(this.node().props['actionId'] ?? ''));
  }
}

@Component({
  selector: 'ngx-lowcode-input-material',
  standalone: true,
  imports: [CommonModule, FormsModule, ThyInputModule],
  template: `
    <label class="ngx-lowcode-field">
      <span>{{ label() }}</span>
      <input
        thyInput
        [placeholder]="placeholder()"
        [ngModel]="value()"
        (ngModelChange)="updateValue($event)" />
    </label>
  `,
  styles: [
    `
      .ngx-lowcode-field {
        display: grid;
        gap: 8px;
      }
      .ngx-lowcode-field span {
        font-size: 13px;
        color: #344054;
      }
    `
  ]
})
export class NgxLowcodeInputMaterialComponent {
  readonly node = input.required<NgxLowcodeNodeSchema>();
  readonly runtime = input.required<NgxLowcodeRuntimeContext>();

  readonly label = computed(() => String(this.node().props['label'] ?? 'Input'));
  readonly placeholder = computed(() => String(this.node().props['placeholder'] ?? ''));
  readonly stateKey = computed(() => String(this.node().props['stateKey'] ?? ''));
  readonly value = computed(() => String(this.runtime().state()[this.stateKey()] ?? ''));

  updateValue(value: string): void {
    if (!this.stateKey()) {
      return;
    }
    this.runtime().setState({
      [this.stateKey()]: value
    });
  }
}

@Component({
  selector: 'ngx-lowcode-select-material',
  standalone: true,
  imports: [CommonModule, FormsModule, ThySelectModule, ThyOption],
  template: `
    <label class="ngx-lowcode-field">
      <span>{{ label() }}</span>
      <thy-select
        class="ngx-lowcode-select"
        thySize="md"
        [ngModel]="value()"
        [thyPlaceHolder]="placeholder()"
        (ngModelChange)="updateValue($event)">
        @for (option of options(); track option.value) {
          <thy-option [thyValue]="option.value" [thyLabelText]="option.label"></thy-option>
        }
      </thy-select>
    </label>
  `,
  styles: [
    `
      .ngx-lowcode-field {
        display: grid;
        gap: 8px;
      }
      .ngx-lowcode-field span {
        font-size: 13px;
        color: #344054;
      }
      .ngx-lowcode-select {
        display: block;
        width: 100%;
      }
    `
  ]
})
export class NgxLowcodeSelectMaterialComponent {
  readonly node = input.required<NgxLowcodeNodeSchema>();
  readonly runtime = input.required<NgxLowcodeRuntimeContext>();

  readonly label = computed(() => String(this.node().props['label'] ?? 'Select'));
  readonly placeholder = computed(() => String(this.node().props['placeholder'] ?? 'Select'));
  readonly stateKey = computed(() => String(this.node().props['stateKey'] ?? ''));
  readonly value = computed(() => this.runtime().state()[this.stateKey()] ?? null);
  readonly options = computed(() => {
    const options = this.node().props['options'];
    return Array.isArray(options) ? options.map((option) => option as { label: string; value: unknown }) : [];
  });

  updateValue(value: unknown): void {
    if (!this.stateKey()) {
      return;
    }
    this.runtime().setState({
      [this.stateKey()]: value
    });
  }
}

@Component({
  selector: 'ngx-lowcode-table-material',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="ngx-lowcode-table">
      <header class="ngx-lowcode-table__header">{{ title() }}</header>
      @if (rows().length) {
        <div class="ngx-lowcode-table__wrap">
          <table>
            <thead>
              <tr>
                @for (column of columns(); track column) {
                  <th>{{ column }}</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (row of rows(); track $index) {
                <tr>
                  @for (column of columns(); track column) {
                    <td>{{ row[column] }}</td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <div class="ngx-lowcode-table__empty">No data</div>
      }
    </section>
  `,
  styles: [
    `
      .ngx-lowcode-table {
        border: 1px solid #d0d5dd;
        border-radius: 12px;
        background: #ffffff;
        overflow: hidden;
      }
      .ngx-lowcode-table__header {
        padding: 12px 16px;
        font-weight: 600;
        border-bottom: 1px solid #eaecf0;
      }
      .ngx-lowcode-table__wrap {
        overflow: auto;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th,
      td {
        padding: 12px 16px;
        border-bottom: 1px solid #f2f4f7;
        text-align: left;
        font-size: 14px;
      }
      .ngx-lowcode-table__empty {
        padding: 20px 16px;
        color: #667085;
      }
    `
  ]
})
export class NgxLowcodeTableMaterialComponent {
  readonly node = input.required<NgxLowcodeNodeSchema>();
  readonly runtime = input.required<NgxLowcodeRuntimeContext>();

  readonly title = computed(() => String(this.node().props['title'] ?? 'Results'));
  readonly dataKey = computed(() => String(this.node().props['dataKey'] ?? ''));
  readonly rows = computed<Record<string, unknown>[]>(() => {
    const value = this.runtime().state()[this.dataKey()];
    return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
  });
  readonly columns = computed(() => {
    const rows = this.rows();
    if (!rows.length) {
      return [];
    }
    return Object.keys(rows[0]);
  });
}

function interpolateTemplate(template: string, runtime: NgxLowcodeRuntimeContext): string {
  return template.replace(/\{\{\s*state\.([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
    const value = runtime.state()[key];
    return value === undefined || value === null ? '' : String(value);
  });
}

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
      {
        key: 'layout',
        label: 'Layout',
        type: 'select',
        options: [
          { label: 'Stack', value: 'stack' },
          { label: '2 Columns', value: 'two-column' },
          { label: '3 Columns', value: 'three-column' }
        ]
      },
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
      props: {
        title: 'Query Form'
      },
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
      props: {
        text: 'Text block'
      }
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
      {
        key: 'buttonType',
        label: 'Type',
        type: 'select',
        options: [
          { label: 'Primary', value: 'primary' },
          { label: 'Primary Outline', value: 'primary-outline' },
          { label: 'Default', value: 'default' }
        ]
      },
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
