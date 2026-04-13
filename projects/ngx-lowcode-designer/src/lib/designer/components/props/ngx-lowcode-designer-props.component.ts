import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { findNodeById, findParentNode } from 'ngx-lowcode-core-utils';
import { NgxLowcodeMaterialRegistry } from 'ngx-lowcode-core';
import {
  NgxLowcodeComponentDefinition,
  NgxLowcodeDatasourceDefinition,
  NgxLowcodeLayoutMode,
  NgxLowcodeNodeSchema,
  NgxLowcodePageSchema,
  NgxLowcodeSetterDefinition
} from 'ngx-lowcode-core-types';
import { NgxLowcodeDesignerI18n, NgxLowcodeLocale } from 'ngx-lowcode-i18n';
import { ThyButtonModule } from 'ngx-tethys/button';
import { ThyCollapseModule } from 'ngx-tethys/collapse';
import { ThyColorPickerModule } from 'ngx-tethys/color-picker';
import { ThyInputModule } from 'ngx-tethys/input';
import { ThyInputNumberModule } from 'ngx-tethys/input-number';
import { ThyPopoverModule } from 'ngx-tethys/popover';
import { ThyOption } from 'ngx-tethys/shared';
import { ThySelectModule } from 'ngx-tethys/select';
import { ThySwitchModule } from 'ngx-tethys/switch';

@Component({
  selector: 'ngx-lowcode-designer-props',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ThyButtonModule,
    ThyCollapseModule,
    ThyColorPickerModule,
    ThyInputModule,
    ThyInputNumberModule,
    ThyPopoverModule,
    ThySelectModule,
    ThyOption,
    ThySwitchModule
  ],
  templateUrl: './ngx-lowcode-designer-props.component.html',
  styleUrl: './ngx-lowcode-designer-props.component.scss'
})
export class NgxLowcodeDesignerPropsComponent {
  private readonly registry = inject(NgxLowcodeMaterialRegistry);

  readonly collapsed = input(false);
  readonly locale = input<NgxLowcodeLocale>('zh-CN');
  readonly t = input.required<NgxLowcodeDesignerI18n>();
  readonly editorSchema = input.required<NgxLowcodePageSchema>();
  readonly selectedNodeId = input<string | null>(null);
  readonly selectedNode = computed<NgxLowcodeNodeSchema | null>(() => {
    const nodeId = this.selectedNodeId();
    if (!nodeId) {
      return null;
    }
    return findNodeById(this.editorSchema().layoutTree, nodeId) ?? null;
  });
  readonly selectedDefinition = computed(() => {
    const node = this.selectedNode();
    return node ? this.registry.get(node.componentType) : undefined;
  });
  readonly selectedParentDefinition = computed<NgxLowcodeComponentDefinition | undefined>(() => {
    const node = this.selectedParentNode();
    return node ? this.registry.get(node.componentType) : undefined;
  });
  readonly selectedParentNode = computed<NgxLowcodeNodeSchema | null>(() => {
    const nodeId = this.selectedNodeId();
    if (!nodeId) {
      return null;
    }
    return findParentNode(this.editorSchema().layoutTree, nodeId) ?? null;
  });
  readonly styleUnits = input<readonly string[]>([]);
  readonly styleDimensions = input<Array<{ key: string; label: string }>>([]);
  readonly basicPanelExpanded = signal(true);
  readonly layoutPanelExpanded = signal(true);
  readonly stylePanelExpanded = signal(true);
  readonly selectedNodeEntries = computed(() => {
    const node = this.selectedNode();
    return node ? [node] : [];
  });
  readonly fixedUnitStyles = computed(() => [
    { key: 'paddingTop', label: this.t().paddingTop, unit: 'px' },
    { key: 'paddingRight', label: this.t().paddingRight, unit: 'px' },
    { key: 'paddingBottom', label: this.t().paddingBottom, unit: 'px' },
    { key: 'paddingLeft', label: this.t().paddingLeft, unit: 'px' },
    { key: 'marginTop', label: this.t().marginTop, unit: 'px' },
    { key: 'marginRight', label: this.t().marginRight, unit: 'px' },
    { key: 'marginBottom', label: this.t().marginBottom, unit: 'px' },
    { key: 'marginLeft', label: this.t().marginLeft, unit: 'px' }
  ]);
  readonly selectedNodeIsContainer = computed(() => (this.selectedDefinition()?.itemSetterSchema?.length ?? 0) > 0);
  readonly selectedNodeLayoutMode = computed<NgxLowcodeLayoutMode | null>(() => {
    if (!this.selectedNodeIsContainer()) {
      return null;
    }
    return this.resolveEffectiveLayoutMode(this.selectedNode());
  });
  readonly selectedParentLayoutMode = computed<NgxLowcodeLayoutMode | null>(() => {
    if ((this.selectedParentDefinition()?.itemSetterSchema?.length ?? 0) === 0) {
      return null;
    }
    return this.resolveEffectiveLayoutMode(this.selectedParentNode());
  });
  readonly propertySetters = computed(() => this.filterSetters(this.selectedDefinition()?.setterSchema, 'properties'));
  readonly layoutSetters = computed(() =>
    this.filterSetters(this.selectedDefinition()?.setterSchema, 'layout', this.selectedNodeLayoutMode())
  );
  readonly itemLayoutSetters = computed(() =>
    this.filterSetters(this.selectedParentDefinition()?.itemSetterSchema, 'layout', this.selectedParentLayoutMode())
  );
  readonly showLayoutPanel = computed(() => this.layoutSetters().length > 0 || this.itemLayoutSetters().length > 0);

  readonly toggleCollapse = output<void>();
  readonly pageMetaChange = output<{ key: 'title' | 'description'; value: string }>();
  readonly nodeNameChange = output<{ nodeId: string; value: string }>();
  readonly nodePropChange = output<{ nodeId: string; key: string; value: unknown }>();
  readonly nodeStyleChange = output<{ nodeId: string; key: string; value: string }>();
  readonly duplicate = output<void>();
  readonly delete = output<void>();
  readonly stateReplace = output<Record<string, unknown>>();
  readonly datasourcesReplace = output<NgxLowcodeDatasourceDefinition[]>();
  readonly actionsReplace = output<any[]>();

  readonly activeModelTab = signal<'state' | 'datasources' | 'actions'>('state');
  readonly stateDraft = signal('{}');
  readonly datasourcesDraft = signal('[]');
  readonly actionsDraft = signal('[]');
  readonly stateDraftError = signal('');
  readonly datasourcesDraftError = signal('');
  readonly actionsDraftError = signal('');
  protected readonly buttonKinds: {
    default: any;
    primaryOutline: any;
    dangerOutline: any;
  } = {
    default: 'default',
    primaryOutline: 'primary-outline',
    dangerOutline: 'danger-outline'
  };

  constructor() {
    effect(
      () => {
        const schema = this.editorSchema();
        this.stateDraft.set(JSON.stringify(schema.state, null, 2));
        this.datasourcesDraft.set(JSON.stringify(schema.datasources, null, 2));
        this.actionsDraft.set(JSON.stringify(schema.actions, null, 2));
        this.stateDraftError.set('');
        this.datasourcesDraftError.set('');
        this.actionsDraftError.set('');
      },
      { allowSignalWrites: true }
    );
  }

  stringProp(node: NgxLowcodeNodeSchema, key: string): string {
    return String(node.props[key] ?? '');
  }

  numberProp(node: NgxLowcodeNodeSchema, key: string): number {
    return Number(node.props[key] ?? 0);
  }

  numberInputProp(node: NgxLowcodeNodeSchema, key: string): number | null {
    const value = node.props[key];
    if (value === undefined || value === null || value === '') {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  booleanProp(node: NgxLowcodeNodeSchema, key: string): boolean {
    return Boolean(node.props[key]);
  }

  styleProp(node: NgxLowcodeNodeSchema, key: string): string {
    const value = node.style?.[key];
    return value === undefined || value === null ? '' : String(value);
  }

  styleDimension(node: NgxLowcodeNodeSchema, key: string): { value: number | null; unit: string } {
    const raw = this.styleProp(node, key).trim();
    if (!raw) {
      return { value: null, unit: 'px' };
    }

    const match = raw.match(/^(-?\d+(?:\.\d+)?)([a-z%]+)$/i);
    if (!match) {
      return { value: Number(raw) || null, unit: 'px' };
    }

    return { value: Number(match[1]), unit: match[2] };
  }

  fixedUnitStyleValue(node: NgxLowcodeNodeSchema, key: string): number | null {
    const raw = this.styleProp(node, key).trim();
    if (!raw) {
      return null;
    }

    const match = raw.match(/^(-?\d+(?:\.\d+)?)([a-z%]+)?$/i);
    return match ? Number(match[1]) : null;
  }

  updateStyleDimensionValue(nodeId: string, key: string, value: string | number | null): void {
    const node = this.selectedNode();
    const currentDimension = node ? this.styleDimension(node, key) : { value: null, unit: 'px' };
    const nextValue = value === null || value === '' ? null : Number(value);
    this.emitDimensionStyle(nodeId, key, nextValue, currentDimension.unit);
  }

  updateStyleDimensionUnit(nodeId: string, key: string, unit: string): void {
    const node = this.selectedNode();
    const currentDimension = node ? this.styleDimension(node, key) : { value: null, unit: 'px' };
    this.emitDimensionStyle(nodeId, key, currentDimension.value, unit);
  }

  countNodes(nodes: NgxLowcodeNodeSchema[]): number {
    return nodes.reduce((total, node) => total + 1 + this.countNodes(node.children ?? []), 0);
  }

  toNumber(value: string | number): number {
    return Number(value);
  }

  updateFixedUnitStyle(nodeId: string, key: string, unit: string, value: number | null): void {
    this.nodeStyleChange.emit({
      nodeId,
      key,
      value: value === null || Number.isNaN(value) ? '' : `${value}${unit}`
    });
  }

  layoutProp(node: NgxLowcodeNodeSchema, key: string): string {
    const value = node.props[key];
    return value === undefined || value === null ? '' : String(value);
  }

  inputNumberSuffix(suffix?: string): string {
    return suffix ?? '';
  }

  renderSetterAsFullWidth(setter: NgxLowcodeSetterDefinition): boolean {
    return setter.type === 'textarea';
  }

  setterModelValue(node: NgxLowcodeNodeSchema, setter: NgxLowcodeSetterDefinition): unknown {
    if (setter.type === 'number') {
      return this.numberInputProp(node, setter.key);
    }
    if (setter.type === 'switch') {
      return this.booleanProp(node, setter.key);
    }
    if (setter.type === 'select') {
      return node.props[setter.key] ?? null;
    }
    return this.stringProp(node, setter.key);
  }

  emitSetterChange(nodeId: string, setter: NgxLowcodeSetterDefinition, value: unknown): void {
    this.nodePropChange.emit({
      nodeId,
      key: setter.key,
      value: setter.type === 'number' && (value === '' || value === null) ? null : value
    });
  }

  applyStateDraft(): void {
    const parsed = this.parseJson<Record<string, unknown>>(this.stateDraft());
    if (!parsed || Array.isArray(parsed)) {
      this.stateDraftError.set(this.t().stateJsonError);
      return;
    }
    this.stateDraftError.set('');
    this.stateReplace.emit(parsed);
  }

  applyDatasourcesDraft(): void {
    const parsed = this.parseJson<NgxLowcodeDatasourceDefinition[]>(this.datasourcesDraft());
    if (!Array.isArray(parsed)) {
      this.datasourcesDraftError.set(this.t().datasourcesJsonError);
      return;
    }
    this.datasourcesDraftError.set('');
    this.datasourcesReplace.emit(parsed);
  }

  applyActionsDraft(): void {
    const parsed = this.parseJson<any[]>(this.actionsDraft());
    if (!Array.isArray(parsed)) {
      this.actionsDraftError.set(this.t().actionsJsonError);
      return;
    }
    this.actionsDraftError.set('');
    this.actionsReplace.emit(parsed);
  }

  private emitDimensionStyle(nodeId: string, key: string, value: number | null, unit: string): void {
    this.nodeStyleChange.emit({
      nodeId,
      key,
      value: value === null || Number.isNaN(value) ? '' : `${value}${unit}`
    });
  }

  private parseJson<T>(value: string): T | null {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  private filterSetters(
    setters: NgxLowcodeSetterDefinition[] | undefined,
    group: NgxLowcodeSetterDefinition['group'],
    layoutMode?: NgxLowcodeLayoutMode | null
  ): NgxLowcodeSetterDefinition[] {
    return (setters ?? []).filter((setter) => {
      const setterGroup = setter.group ?? 'properties';
      if (setterGroup !== group) {
        return false;
      }
      if (!setter.layoutModes?.length) {
        return true;
      }
      return layoutMode ? setter.layoutModes.includes(layoutMode) : false;
    });
  }

  private resolveLayoutMode(): NgxLowcodeLayoutMode {
    return 'flex';
  }

  private resolveEffectiveLayoutMode(node: NgxLowcodeNodeSchema | null | undefined): NgxLowcodeLayoutMode | null {
    if (!node) {
      return null;
    }
    if (node.componentType === 'section' || node.componentType === 'page') {
      return 'flex';
    }
    return this.resolveLayoutMode();
  }
}
