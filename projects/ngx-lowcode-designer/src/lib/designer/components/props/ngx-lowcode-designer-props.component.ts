import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  output,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { findNodeById, findParentNode } from 'ngx-lowcode-core-utils';
import { NgxLowcodeMaterialRegistry } from 'ngx-lowcode-core';
import {
  NgxLowcodeActionDefinition,
  NgxLowcodeActionStep,
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
import { ThyTabsModule } from 'ngx-tethys/tabs';

type StateValueKind = 'string' | 'number' | 'boolean' | 'null' | 'json';

interface StateEntryDraft {
  key: string;
  kind: StateValueKind;
  textValue: string;
  booleanValue: boolean;
}

interface DatasourceDraft {
  id: string;
  type: string;
  transport: string;
  commandName: string;
  commandTarget: string;
  payloadTemplateText: string;
  timeoutMs: number | null;
  stateKey: string;
  mockDataText: string;
}

interface ActionStepDraft {
  type: string;
  message: string;
  datasourceId: string;
  stateKey: string;
  patchText: string;
  modalId: string;
  workflowName: string;
  payloadTemplateText: string;
}

interface ActionDraft {
  id: string;
  trigger: string;
  steps: ActionStepDraft[];
}

interface ComponentActionBinding {
  eventName: string;
  label: string;
  propKey: string;
  actionId: string;
}

interface ComponentStateReference {
  label: string;
  key: string;
}

interface SelectedDatasourceBinding {
  datasourceId: string;
  datasource: DatasourceDraft | null;
  index: number;
}

@Component({
  selector: 'ngx-lowcode-designer-props',
  imports: [
    FormsModule,
    ThyButtonModule,
    ThyCollapseModule,
    ThyColorPickerModule,
    ThyInputModule,
    ThyInputNumberModule,
    ThyPopoverModule,
    ThySelectModule,
    ThyOption,
    ThySwitchModule,
    ThyTabsModule
  ],
  templateUrl: './ngx-lowcode-designer-props.component.html',
  styleUrl: './ngx-lowcode-designer-props.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
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
  readonly actionsReplace = output<NgxLowcodeActionDefinition[]>();

  readonly activePanelTab = signal<'page' | 'properties' | 'state' | 'datasources' | 'actions'>('properties');
  readonly stateFormDraft = linkedSignal(() => this.mapStateToDraft(this.selectedComponentState()));
  readonly datasourcesFormDraft = linkedSignal(() => this.mapDatasourcesToDraft(this.editorSchema().datasources));
  readonly actionsFormDraft = linkedSignal(() => this.mapActionsToDraft(this.editorSchema().actions));
  readonly stateDraftError = signal('');
  readonly datasourcesDraftError = signal('');
  readonly actionsDraftError = signal('');
  readonly selectedComponentStateRefs = computed<ComponentStateReference[]>(() => {
    const node = this.selectedNode();
    if (!node) {
      return [];
    }

    const refs: ComponentStateReference[] = [];
    const stateKey = String(node.props['stateKey'] ?? '').trim();
    if (stateKey) {
      refs.push({ label: this.editorCopy().stateKey, key: stateKey });
    }
    if (node.componentType === 'form') {
      this.collectNodeStateRefs(node.children ?? [], refs, new Set(refs.map((entry) => entry.key)));
    }
    return refs;
  });
  readonly selectedComponentActionBindings = computed<ComponentActionBinding[]>(() => {
    const node = this.selectedNode();
    const definition = this.selectedDefinition();
    if (!node || !definition?.events?.length) {
      return [];
    }

    return definition.events
      .map((event) => {
        const propKey = this.resolveEventBindingProp(node.componentType, event.name);
        if (!propKey) {
          return null;
        }
        return {
          eventName: event.name,
          label: event.label,
          propKey,
          actionId: String(node.props[propKey] ?? '')
        } satisfies ComponentActionBinding;
      })
      .filter((binding): binding is ComponentActionBinding => Boolean(binding));
  });
  readonly selectedComponentActionIds = computed(() =>
    Array.from(
      new Set(
        this.selectedComponentActionBindings()
          .map((binding) => binding.actionId.trim())
          .filter(Boolean)
      )
    )
  );
  readonly selectedComponentActions = computed(() => {
    const actionIds = new Set(this.selectedComponentActionIds());
    return this.actionsFormDraft().filter((action) => actionIds.has(action.id));
  });
  readonly selectedComponentDatasourceRefs = computed(() => {
    const node = this.selectedNode();
    if (!node || !this.supportsNodeDatasource(node)) {
      return [];
    }
    const datasourceId = String(node.props['datasourceId'] ?? '').trim();
    return datasourceId ? [datasourceId] : [];
  });
  readonly selectedDatasourceBinding = computed<SelectedDatasourceBinding | null>(() => {
    const node = this.selectedNode();
    if (!node || !this.supportsNodeDatasource(node)) {
      return null;
    }
    const datasourceId = String(node.props['datasourceId'] ?? '').trim();
    const drafts = this.datasourcesFormDraft();
    const index = datasourceId ? drafts.findIndex((item) => item.id === datasourceId) : -1;
    return {
      datasourceId,
      datasource: index >= 0 ? drafts[index] : null,
      index
    };
  });
  readonly availableDatasourceIds = computed(() => this.datasourcesFormDraft().map((datasource) => datasource.id).filter(Boolean));
  readonly availableActionIds = computed(() => this.actionsFormDraft().map((action) => action.id).filter(Boolean));
  readonly editorCopy = computed(() =>
    this.locale() === 'zh-CN'
      ? {
          addEntry: '新增状态项',
          addStep: '新增步骤',
          bindAction: '绑定动作',
          remove: '删除',
          key: 'Key',
          value: 'Value',
          type: '类型',
          transport: '传输',
          commandName: '命令名',
          commandTarget: '命令目标',
          payloadTemplate: 'Payload JSON',
          timeoutMs: '超时(ms)',
          stateKey: '状态键',
          dataKey: '数据键',
          mockData: 'Mock Data JSON',
          trigger: '触发器',
          steps: '步骤',
          message: '消息',
          patch: 'Patch JSON',
          modalId: '弹框 ID',
          workflowName: '工作流',
          relatedState: '当前组件关联状态',
          relatedDatasources: '当前组件关联数据源',
          bindDatasource: '绑定数据源',
          noDatasourceSupport: '当前组件暂不支持数据源。',
          noDatasourceBound: '当前组件还没有绑定数据源。',
          eventBindings: '事件绑定',
          noComponentSelected: '请先选中一个组件，再配置动作。',
          noComponentEvents: '当前组件没有可配置的事件。',
          noBindings: '当前组件还没有绑定动作。',
          hiddenResultState: '结果数据由数据源和表格联动维护，这里不直接编辑。',
          invalidStateKey: '状态项的 key 不能为空。',
          duplicateStateKey: '状态项 key 不能重复。',
          invalidStateValue: '状态项值格式不合法。',
          invalidDatasourceId: '数据源 ID 不能为空。',
          invalidDatasourceJson: '数据源中的 JSON 字段格式不合法。',
          invalidActionId: '动作 ID 不能为空。',
          invalidActionJson: '动作中的 Patch JSON 格式不合法。'
        }
      : {
          addEntry: 'Add State Entry',
          addStep: 'Add Step',
          bindAction: 'Bind Action',
          remove: 'Remove',
          key: 'Key',
          value: 'Value',
          type: 'Type',
          transport: 'Transport',
          commandName: 'Command Name',
          commandTarget: 'Command Target',
          payloadTemplate: 'Payload JSON',
          timeoutMs: 'Timeout (ms)',
          stateKey: 'State Key',
          dataKey: 'Data Key',
          mockData: 'Mock Data JSON',
          trigger: 'Trigger',
          steps: 'Steps',
          message: 'Message',
          patch: 'Patch JSON',
          modalId: 'Modal ID',
          workflowName: 'Workflow',
          relatedState: 'Selected component state refs',
          relatedDatasources: 'Selected component datasources',
          bindDatasource: 'Bind Datasource',
          noDatasourceSupport: 'The selected component does not support datasources.',
          noDatasourceBound: 'The selected component has no datasource bound yet.',
          eventBindings: 'Event Bindings',
          noComponentSelected: 'Select a component before editing actions.',
          noComponentEvents: 'The selected component has no configurable events.',
          noBindings: 'The selected component has no bound actions yet.',
          hiddenResultState: 'Result data is maintained by datasource-table flow and is not edited here.',
          invalidStateKey: 'State entry key is required.',
          duplicateStateKey: 'State entry keys must be unique.',
          invalidStateValue: 'State entry value is invalid.',
          invalidDatasourceId: 'Datasource ID is required.',
          invalidDatasourceJson: 'Datasource JSON fields are invalid.',
          invalidActionId: 'Action ID is required.',
          invalidActionJson: 'Action patch JSON is invalid.'
        }
  );
  readonly stateTypeOptions = [
    { label: 'string', value: 'string' },
    { label: 'number', value: 'number' },
    { label: 'boolean', value: 'boolean' },
    { label: 'null', value: 'null' },
    { label: 'json', value: 'json' }
  ] as const;
  readonly datasourceTransportOptions = ['websocket', 'http'] as const;
  readonly actionStepTypeOptions = ['setState', 'message', 'callDatasource', 'openModal', 'startWorkflow'] as const;
  private readonly ensureVisiblePanelTab = effect(() => {
    if (this.activePanelTab() === 'state' && !this.supportsSelectedNodeState()) {
      this.activePanelTab.set('properties');
      return;
    }
    if (this.activePanelTab() === 'datasources' && !this.supportsSelectedNodeDatasource()) {
      this.activePanelTab.set('properties');
      return;
    }
    if (this.activePanelTab() === 'actions' && !this.supportsSelectedNodeActions()) {
      this.activePanelTab.set('properties');
    }
  });
  protected readonly buttonKinds: {
    default: any;
    primaryOutline: any;
    dangerOutline: any;
  } = {
    default: 'default',
    primaryOutline: 'primary-outline',
    dangerOutline: 'danger-outline'
  };

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

  supportsSelectedNodeDatasource(): boolean {
    return this.supportsNodeDatasource(this.selectedNode());
  }

  supportsSelectedNodeState(): boolean {
    return this.selectedComponentStateRefs().length > 0;
  }

  supportsSelectedNodeActions(): boolean {
    return this.selectedComponentActionBindings().length > 0;
  }

  addStateEntry(): void {
    this.stateFormDraft.update((entries) => [
      ...entries,
      { key: '', kind: 'string', textValue: '', booleanValue: false }
    ]);
  }

  removeStateEntry(index: number): void {
    this.stateFormDraft.update((entries) => entries.filter((_, currentIndex) => currentIndex !== index));
  }

  updateStateEntry(index: number, patch: Partial<StateEntryDraft>): void {
    this.stateFormDraft.update((entries) =>
      entries.map((entry, currentIndex) => (currentIndex === index ? { ...entry, ...patch } : entry))
    );
  }

  addDatasource(): void {
    this.datasourcesFormDraft.update((items) => [
      ...items,
      {
        id: '',
        type: 'middleware-command',
        transport: 'websocket',
        commandName: '',
        commandTarget: '',
        payloadTemplateText: '',
        timeoutMs: 10000,
        stateKey: '',
        mockDataText: ''
      }
    ]);
  }

  removeDatasource(index: number): void {
    this.datasourcesFormDraft.update((items) => items.filter((_, currentIndex) => currentIndex !== index));
  }

  updateDatasource(index: number, patch: Partial<DatasourceDraft>): void {
    this.datasourcesFormDraft.update((items) =>
      items.map((item, currentIndex) => (currentIndex === index ? { ...item, ...patch } : item))
    );
  }

  updateSelectedNodeActionBinding(propKey: string, actionId: string): void {
    const node = this.selectedNode();
    if (!node) {
      return;
    }
    this.nodePropChange.emit({
      nodeId: node.id,
      key: propKey,
      value: actionId
    });
  }

  updateSelectedNodeDatasourceBinding(datasourceId: string): void {
    const node = this.selectedNode();
    if (!node || !this.supportsNodeDatasource(node)) {
      return;
    }
    this.nodePropChange.emit({
      nodeId: node.id,
      key: 'datasourceId',
      value: datasourceId
    });
  }

  addBoundDatasource(): void {
    const node = this.selectedNode();
    if (!node || !this.supportsNodeDatasource(node)) {
      return;
    }

    const datasourceId = this.createUniqueDatasourceId(`${node.id}-datasource`);
    const stateKey =
      node.componentType === 'table'
        ? String(node.props['dataKey'] ?? '').trim()
        : this.findFirstTableDataKey(this.editorSchema().layoutTree);
    this.datasourcesFormDraft.update((items) => [
      ...items,
      {
        id: datasourceId,
        type: 'middleware-command',
        transport: 'websocket',
        commandName: datasourceId,
        commandTarget: '',
        payloadTemplateText: '',
        timeoutMs: 10000,
        stateKey,
        mockDataText: ''
      }
    ]);
    this.updateSelectedNodeDatasourceBinding(datasourceId);
  }

  updateSelectedDatasource(patch: Partial<DatasourceDraft>): void {
    const binding = this.selectedDatasourceBinding();
    if (!binding || binding.index < 0) {
      return;
    }
    this.updateDatasource(binding.index, patch);
  }

  removeSelectedDatasource(): void {
    const binding = this.selectedDatasourceBinding();
    if (!binding || binding.index < 0) {
      return;
    }
    this.removeDatasource(binding.index);
    this.updateSelectedNodeDatasourceBinding('');
  }

  addAction(): void {
    this.actionsFormDraft.update((items) => [
      ...items,
      {
        id: '',
        trigger: '',
        steps: [
          {
            type: 'callDatasource',
            message: '',
            datasourceId: '',
            stateKey: '',
            patchText: '',
            modalId: '',
            workflowName: '',
            payloadTemplateText: ''
          }
        ]
      }
    ]);
  }

  addBoundAction(propKey: string): void {
    const node = this.selectedNode();
    if (!node) {
      return;
    }

    const actionId = this.createUniqueActionId(`${node.id}-${propKey.replace(/ActionId$/, '')}-action`);
    this.actionsFormDraft.update((items) => [
      ...items,
      {
        id: actionId,
        trigger: '',
        steps: [
          {
            type: 'callDatasource',
            message: '',
            datasourceId: '',
            stateKey: '',
            patchText: '',
            modalId: '',
            workflowName: '',
            payloadTemplateText: ''
          }
        ]
      }
    ]);
    this.updateSelectedNodeActionBinding(propKey, actionId);
  }

  removeAction(index: number): void {
    this.actionsFormDraft.update((items) => items.filter((_, currentIndex) => currentIndex !== index));
  }

  updateAction(index: number, patch: Partial<ActionDraft>): void {
    this.actionsFormDraft.update((items) =>
      items.map((item, currentIndex) => (currentIndex === index ? { ...item, ...patch } : item))
    );
  }

  addActionStep(actionIndex: number): void {
    this.actionsFormDraft.update((items) =>
      items.map((item, currentIndex) =>
        currentIndex === actionIndex
          ? {
              ...item,
              steps: [
                ...item.steps,
                {
                  type: 'callDatasource',
                  message: '',
                  datasourceId: '',
                  stateKey: '',
                  patchText: '',
                  modalId: '',
                  workflowName: '',
                  payloadTemplateText: ''
                }
              ]
            }
          : item
      )
    );
  }

  removeActionStep(actionIndex: number, stepIndex: number): void {
    this.actionsFormDraft.update((items) =>
      items.map((item, currentIndex) =>
        currentIndex === actionIndex
          ? {
              ...item,
              steps: item.steps.filter((_, currentStepIndex) => currentStepIndex !== stepIndex)
            }
          : item
      )
    );
  }

  updateActionStep(actionIndex: number, stepIndex: number, patch: Partial<ActionStepDraft>): void {
    this.actionsFormDraft.update((items) =>
      items.map((item, currentIndex) =>
        currentIndex === actionIndex
          ? {
              ...item,
              steps: item.steps.map((step, currentStepIndex) =>
                currentStepIndex === stepIndex ? { ...step, ...patch } : step
              )
            }
          : item
      )
    );
  }

  updateSelectedAction(actionId: string, patch: Partial<ActionDraft>): void {
    const nextId = patch.id?.trim();
    this.actionsFormDraft.update((items) =>
      items.map((item) => (item.id === actionId ? { ...item, ...patch, id: nextId ?? item.id } : item))
    );
    if (nextId && nextId !== actionId) {
      for (const binding of this.selectedComponentActionBindings()) {
        if (binding.actionId === actionId) {
          this.updateSelectedNodeActionBinding(binding.propKey, nextId);
        }
      }
    }
  }

  removeSelectedAction(actionId: string): void {
    this.actionsFormDraft.update((items) => items.filter((item) => item.id !== actionId));
    for (const binding of this.selectedComponentActionBindings()) {
      if (binding.actionId === actionId) {
        this.updateSelectedNodeActionBinding(binding.propKey, '');
      }
    }
  }

  addSelectedActionStep(actionId: string): void {
    const actionIndex = this.actionsFormDraft().findIndex((item) => item.id === actionId);
    if (actionIndex >= 0) {
      this.addActionStep(actionIndex);
    }
  }

  removeSelectedActionStep(actionId: string, stepIndex: number): void {
    const actionIndex = this.actionsFormDraft().findIndex((item) => item.id === actionId);
    if (actionIndex >= 0) {
      this.removeActionStep(actionIndex, stepIndex);
    }
  }

  updateSelectedActionStep(actionId: string, stepIndex: number, patch: Partial<ActionStepDraft>): void {
    const actionIndex = this.actionsFormDraft().findIndex((item) => item.id === actionId);
    if (actionIndex >= 0) {
      this.updateActionStep(actionIndex, stepIndex, patch);
    }
  }

  applyStateForm(): void {
    const parsed = this.stateEntriesToValue(this.stateFormDraft());
    if (!parsed) {
      return;
    }
    this.stateDraftError.set('');
    const nextState = { ...this.editorSchema().state };
    for (const key of this.selectedComponentStateRefs().map((entry) => entry.key)) {
      delete nextState[key];
    }
    this.stateReplace.emit({
      ...nextState,
      ...parsed
    });
  }

  applyDatasourcesForm(): void {
    const parsed = this.datasourceDraftsToValue(this.datasourcesFormDraft());
    if (!parsed) {
      return;
    }
    this.datasourcesDraftError.set('');
    this.datasourcesReplace.emit(parsed);
  }

  applyActionsForm(): void {
    const parsed = this.actionDraftsToValue(this.actionsFormDraft());
    if (!parsed) {
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

  private parseJsonObject(value: string): Record<string, unknown> | null {
    const parsed = this.parseJson<Record<string, unknown>>(value);
    return parsed && !Array.isArray(parsed) ? parsed : null;
  }

  private mapStateToDraft(state: Record<string, unknown>): StateEntryDraft[] {
    return Object.entries(state).map(([key, value]) => {
      if (value === null) {
        return { key, kind: 'null', textValue: '', booleanValue: false };
      }
      if (typeof value === 'boolean') {
        return { key, kind: 'boolean', textValue: '', booleanValue: value };
      }
      if (typeof value === 'number') {
        return { key, kind: 'number', textValue: String(value), booleanValue: false };
      }
      if (typeof value === 'string') {
        return { key, kind: 'string', textValue: value, booleanValue: false };
      }
      return { key, kind: 'json', textValue: JSON.stringify(value, null, 2), booleanValue: false };
    });
  }

  private stateEntriesToValue(entries: StateEntryDraft[]): Record<string, unknown> | null {
    const result: Record<string, unknown> = {};
    const keys = new Set<string>();

    for (const entry of entries) {
      const key = entry.key.trim();
      if (!key) {
        this.stateDraftError.set(this.editorCopy().invalidStateKey);
        return null;
      }
      if (keys.has(key)) {
        this.stateDraftError.set(this.editorCopy().duplicateStateKey);
        return null;
      }
      keys.add(key);

      if (entry.kind === 'null') {
        result[key] = null;
        continue;
      }
      if (entry.kind === 'boolean') {
        result[key] = entry.booleanValue;
        continue;
      }
      if (entry.kind === 'number') {
        const parsed = Number(entry.textValue);
        if (Number.isNaN(parsed)) {
          this.stateDraftError.set(this.editorCopy().invalidStateValue);
          return null;
        }
        result[key] = parsed;
        continue;
      }
      if (entry.kind === 'string') {
        result[key] = entry.textValue;
        continue;
      }

      const parsed = this.parseJson<unknown>(entry.textValue || 'null');
      if (parsed === null && entry.textValue.trim() !== 'null') {
        this.stateDraftError.set(this.editorCopy().invalidStateValue);
        return null;
      }
      result[key] = parsed;
    }

    return result;
  }

  private mapDatasourcesToDraft(datasources: NgxLowcodeDatasourceDefinition[]): DatasourceDraft[] {
    return datasources.map((datasource) => ({
      id: datasource.id,
      type: datasource.type,
      transport: String(datasource.command?.transport ?? 'websocket'),
      commandName: String(datasource.command?.name ?? datasource.id),
      commandTarget: String(datasource.command?.target ?? datasource.request?.url ?? ''),
      payloadTemplateText:
        datasource.command?.payloadTemplate !== undefined
          ? JSON.stringify(datasource.command.payloadTemplate, null, 2)
          : datasource.request?.body !== undefined
            ? JSON.stringify(datasource.request.body, null, 2)
            : datasource.request?.params
              ? JSON.stringify(datasource.request.params, null, 2)
              : '',
      timeoutMs: datasource.command?.timeoutMs ?? null,
      stateKey: String(datasource.responseMapping?.stateKey ?? ''),
      mockDataText: datasource.mockData !== undefined ? JSON.stringify(datasource.mockData, null, 2) : ''
    }));
  }

  private datasourceDraftsToValue(drafts: DatasourceDraft[]): NgxLowcodeDatasourceDefinition[] | null {
    const result: NgxLowcodeDatasourceDefinition[] = [];
    for (const draft of drafts) {
      if (!draft.id.trim()) {
        this.datasourcesDraftError.set(this.editorCopy().invalidDatasourceId);
        return null;
      }

      const payloadTemplate = draft.payloadTemplateText.trim()
        ? this.parseJsonObject(draft.payloadTemplateText)
        : undefined;
      const mockData = draft.mockDataText.trim() ? this.parseJson<unknown>(draft.mockDataText) : undefined;

      if ((draft.payloadTemplateText.trim() && payloadTemplate === null) || (draft.mockDataText.trim() && mockData === null)) {
        this.datasourcesDraftError.set(this.editorCopy().invalidDatasourceJson);
        return null;
      }

      result.push({
        id: draft.id.trim(),
        type: draft.type.trim() || 'middleware-command',
        command:
          draft.type.trim() === 'mock' && !draft.commandName.trim() && !draft.commandTarget.trim() && !payloadTemplate
            ? undefined
            : {
                transport: draft.transport.trim() || undefined,
                name: draft.commandName.trim() || undefined,
                target: draft.commandTarget.trim() || undefined,
                payloadTemplate: payloadTemplate ?? undefined,
                timeoutMs: draft.timeoutMs ?? undefined
              },
        responseMapping: draft.stateKey.trim() ? { stateKey: draft.stateKey.trim() } : undefined,
        mockData
      });
    }

    return result;
  }

  private mapActionsToDraft(actions: NgxLowcodeActionDefinition[]): ActionDraft[] {
    return actions.map((action) => ({
      id: action.id,
      trigger: String(action.trigger ?? ''),
      steps: action.steps.map((step) => ({
        type: step.type,
        message: String(step.message ?? ''),
        datasourceId: String(step.datasourceId ?? ''),
        stateKey: String(step.stateKey ?? ''),
        patchText: step.patch ? JSON.stringify(step.patch, null, 2) : '',
        modalId: String(step.modalId ?? ''),
        workflowName: String(step.workflowName ?? ''),
        payloadTemplateText: step.payloadTemplate ? JSON.stringify(step.payloadTemplate, null, 2) : ''
      }))
    }));
  }

  private actionDraftsToValue(drafts: ActionDraft[]): NgxLowcodeActionDefinition[] | null {
    const result: NgxLowcodeActionDefinition[] = [];
    for (const draft of drafts) {
      if (!draft.id.trim()) {
        this.actionsDraftError.set(this.editorCopy().invalidActionId);
        return null;
      }

      const steps: NgxLowcodeActionStep[] = [];
      for (const step of draft.steps) {
        const parsedPatch = step.patchText.trim() ? this.parseJsonObject(step.patchText) : undefined;
        const parsedPayloadTemplate = step.payloadTemplateText.trim()
          ? this.parseJsonObject(step.payloadTemplateText)
          : undefined;
        if (step.patchText.trim() && !parsedPatch) {
          this.actionsDraftError.set(this.editorCopy().invalidActionJson);
          return null;
        }
        if (step.payloadTemplateText.trim() && !parsedPayloadTemplate) {
          this.actionsDraftError.set(this.editorCopy().invalidActionJson);
          return null;
        }

        const patch = parsedPatch ?? undefined;
        const payloadTemplate = parsedPayloadTemplate ?? undefined;

        steps.push({
          type: step.type.trim() || 'callDatasource',
          message: step.message.trim() || undefined,
          datasourceId: step.datasourceId.trim() || undefined,
          stateKey: step.stateKey.trim() || undefined,
          patch,
          modalId: step.modalId.trim() || undefined,
          workflowName: step.workflowName.trim() || undefined,
          payloadTemplate
        });
      }

      result.push({
        id: draft.id.trim(),
        trigger: draft.trigger.trim() || undefined,
        steps
      });
    }

    return result;
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
        return !this.isManagedInDedicatedPanel(setter.key);
      }
      return !this.isManagedInDedicatedPanel(setter.key) && (layoutMode ? setter.layoutModes.includes(layoutMode) : false);
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

  private resolveEventBindingProp(componentType: string, eventName: string): string | null {
    if (eventName === 'click' && componentType === 'button') {
      return 'actionId';
    }
    if (
      eventName === 'change' &&
      ['input', 'select', 'input-number', 'checkbox', 'radio', 'switch', 'date-picker', 'upload'].includes(
        componentType
      )
    ) {
      return 'changeActionId';
    }
    if (eventName === 'submit' && componentType === 'form') {
      return 'submitActionId';
    }
    if (eventName === 'rowClick' && componentType === 'table') {
      return 'rowClickActionId';
    }
    return null;
  }

  private supportsNodeDatasource(node: NgxLowcodeNodeSchema | null | undefined): boolean {
    return node?.componentType === 'form' || node?.componentType === 'table';
  }

  private isManagedInDedicatedPanel(setterKey: string): boolean {
    return ['actionId', 'changeActionId', 'submitActionId', 'rowClickActionId', 'datasourceId'].includes(setterKey);
  }

  private createUniqueDatasourceId(baseId: string): string {
    const existingIds = new Set(this.datasourcesFormDraft().map((datasource) => datasource.id));
    if (!existingIds.has(baseId)) {
      return baseId;
    }

    let index = 2;
    while (existingIds.has(`${baseId}-${index}`)) {
      index += 1;
    }
    return `${baseId}-${index}`;
  }

  private createUniqueActionId(baseId: string): string {
    const existingIds = new Set(this.actionsFormDraft().map((action) => action.id));
    if (!existingIds.has(baseId)) {
      return baseId;
    }

    let index = 2;
    while (existingIds.has(`${baseId}-${index}`)) {
      index += 1;
    }
    return `${baseId}-${index}`;
  }

  private findFirstTableDataKey(nodes: NgxLowcodeNodeSchema[]): string {
    for (const node of nodes) {
      if (node.componentType === 'table') {
        const dataKey = String(node.props['dataKey'] ?? '').trim();
        if (dataKey) {
          return dataKey;
        }
      }
      const nested = this.findFirstTableDataKey(node.children ?? []);
      if (nested) {
        return nested;
      }
    }
    return '';
  }

  private selectedComponentState(): Record<string, unknown> {
    const state = this.editorSchema().state;
    return Object.fromEntries(
      this.selectedComponentStateRefs()
        .map((entry) => entry.key)
        .filter((key, index, keys) => Boolean(key) && keys.indexOf(key) === index)
        .map((key) => [key, state[key]])
        .filter(([_, value]) => value !== undefined)
    );
  }

  private collectNodeStateRefs(
    nodes: NgxLowcodeNodeSchema[],
    refs: ComponentStateReference[],
    seenKeys: Set<string>
  ): void {
    for (const node of nodes) {
      const stateKey = String(node.props['stateKey'] ?? '').trim();
      if (stateKey && !seenKeys.has(stateKey)) {
        refs.push({
          label: String(node.props['label'] ?? node.name ?? stateKey),
          key: stateKey
        });
        seenKeys.add(stateKey);
      }
      this.collectNodeStateRefs(node.children ?? [], refs, seenKeys);
    }
  }
}
