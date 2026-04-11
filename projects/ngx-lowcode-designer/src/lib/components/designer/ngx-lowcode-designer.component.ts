import { CdkDragDrop, CdkDragEnd, CdkDragStart, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, OnChanges, OnDestroy, SimpleChanges, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxLowcodeEditorStore, NgxLowcodeMaterialRegistry } from 'ngx-lowcode-core';
import { cloneSchema, createDefaultPageSchema, createNodeId, findNodeById } from 'ngx-lowcode-core-utils';
import {
  NgxLowcodeActionDefinition,
  NgxLowcodeComponentDefinition,
  NgxLowcodeDatasourceDefinition,
  NgxLowcodeDesignerCommand,
  NgxLowcodeDesignerConfig,
  NgxLowcodeDropTarget,
  NgxLowcodeNodeSchema,
  NgxLowcodePageSchema
} from 'ngx-lowcode-core-types';
import { getDesignerI18n, NgxLowcodeDesignerLocale } from 'ngx-lowcode-i18n';
import { NgxLowcodeRendererComponent } from 'ngx-lowcode-renderer';
import { ThyButtonModule } from 'ngx-tethys/button';
import { ThyColorPickerModule } from 'ngx-tethys/color-picker';
import { ThyInputModule } from 'ngx-tethys/input';
import { ThyOption } from 'ngx-tethys/shared';
import { ThySelectModule } from 'ngx-tethys/select';
import { ThySwitchModule } from 'ngx-tethys/switch';

@Component({
  selector: 'ngx-lowcode-designer',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    FormsModule,
    NgxLowcodeRendererComponent,
    ThyButtonModule,
    ThyColorPickerModule,
    ThyInputModule,
    ThySelectModule,
    ThyOption,
    ThySwitchModule
  ],
  providers: [NgxLowcodeEditorStore],
  templateUrl: './ngx-lowcode-designer.component.html',
  styleUrl: './ngx-lowcode-designer.component.scss'
})
export class NgxLowcodeDesignerComponent implements OnChanges, OnDestroy {
  private readonly registry = inject(NgxLowcodeMaterialRegistry);
  private readonly editorStore = inject(NgxLowcodeEditorStore);
  protected isPaletteDragging = false;
  private suppressNextPaletteClick = false;
  private resizeCleanup: (() => void) | null = null;

  readonly activeDropTarget = signal<NgxLowcodeDropTarget | null>(null);
  readonly activeModelTab = signal<'state' | 'datasources' | 'actions'>('state');
  readonly editingOutlineNodeId = signal<string | null>(null);
  readonly outlineNameDraft = signal('');
  readonly stateDraft = signal('{}');
  readonly datasourcesDraft = signal('[]');
  readonly actionsDraft = signal('[]');
  readonly stateDraftError = signal('');
  readonly datasourcesDraftError = signal('');
  readonly actionsDraftError = signal('');
  readonly leftSidebarWidth = signal(280);
  readonly rightSidebarWidth = signal(320);
  readonly leftSidebarCollapsed = signal(false);
  readonly rightSidebarCollapsed = signal(false);
  readonly styleUnits = ['px', '%', 'rem', 'vh', 'vw', 'em'] as const;
  readonly styleDimensions = computed(() => [
    { key: 'width', label: this.t().width },
    { key: 'height', label: this.t().height },
    { key: 'minWidth', label: this.t().minWidth },
    { key: 'minHeight', label: this.t().minHeight }
  ]);

  protected readonly buttonKinds: { default: any; primary: any; primaryOutline: any; dangerOutline: any } = {
    default: 'default',
    primary: 'primary',
    primaryOutline: 'primary-outline',
    dangerOutline: 'danger-outline'
  };
  protected readonly paletteDropListId = 'ngx-lowcode-material-palette';
  protected readonly stageDropListId = 'ngx-lowcode-stage-dropzone';

  readonly schema = input<NgxLowcodePageSchema>(createDefaultPageSchema());
  readonly materials = input<NgxLowcodeComponentDefinition[]>([]);
  readonly designerConfig = input<NgxLowcodeDesignerConfig>({});
  readonly locale = input<NgxLowcodeDesignerLocale>('zh-CN');

  readonly schemaChange = output<NgxLowcodePageSchema>();
  readonly selectionChange = output<NgxLowcodeNodeSchema | null>();
  readonly command = output<NgxLowcodeDesignerCommand>();
  readonly previewRequest = output<NgxLowcodePageSchema>();
  readonly save = output<NgxLowcodePageSchema>();
  readonly publishRequest = output<NgxLowcodePageSchema>();

  readonly effectiveConfig = computed(() => this.designerConfig());
  readonly t = computed(() => getDesignerI18n(this.locale()));
  readonly layoutColumns = computed(() => {
    const leftWidth = this.leftSidebarCollapsed() ? 52 : this.leftSidebarWidth();
    const rightWidth = this.rightSidebarCollapsed() ? 52 : this.rightSidebarWidth();
    return `${leftWidth}px 8px minmax(0, 1fr) 8px ${rightWidth}px`;
  });
  readonly availableMaterials = computed(() => this.registry.list().filter((definition) => definition.type !== 'page'));
  readonly editorSchema = this.editorStore.schema;
  readonly selectedNodeId = this.editorStore.selectedNodeId;
  readonly selectedNode = this.editorStore.selectedNode;
  readonly selectedDefinition = computed(() => {
    const node = this.selectedNode();
    return node ? this.registry.get(node.componentType) : undefined;
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['materials']) {
      this.registry.registerMany(this.materials());
    }

    if (changes['schema']) {
      const nextSchema = this.normalizeIncomingSchema(this.schema());
      this.editorStore.dispatch({
        type: 'replace-schema',
        schema: nextSchema,
        resetHistory: true,
        preserveSelection: true
      });
      this.syncRuntimeDrafts(nextSchema);
    }
  }

  ngOnDestroy(): void {
    this.resizeCleanup?.();
  }

  addMaterial(materialType: string): void {
    this.editorStore.dispatch({
      type: 'add-node',
      componentType: materialType,
      parentId: this.resolveInsertionTarget().parentId,
      slot: this.resolveInsertionTarget().slot
    });
    this.activeDropTarget.set(null);
    this.emitSchemaChange();
    this.emitSelectionChange();
  }

  handleMaterialClick(materialType: string): void {
    if (this.isPaletteDragging || this.suppressNextPaletteClick) {
      this.suppressNextPaletteClick = false;
      return;
    }
    this.addMaterial(materialType);
  }

  handleMaterialDrop(event: CdkDragDrop<NgxLowcodeNodeSchema[], NgxLowcodeComponentDefinition[], string>): void {
    if (event.previousContainer.id === event.container.id) {
      return;
    }
    const materialType = String(event.item.data ?? '');
    if (!materialType) {
      return;
    }
    this.addMaterial(materialType);
  }

  handlePaletteDragStarted(_event: CdkDragStart<string>): void {
    this.isPaletteDragging = true;
    this.activeDropTarget.set(null);
  }

  handlePaletteDragEnded(_event: CdkDragEnd<string>): void {
    this.isPaletteDragging = false;
    this.activeDropTarget.set(null);
    this.suppressNextPaletteClick = true;
    queueMicrotask(() => {
      this.suppressNextPaletteClick = false;
    });
  }

  handleRendererSelectionChange(nodeId: string | null): void {
    if (!nodeId) {
      return;
    }
    this.selectNode(nodeId);
  }

  handleRendererDropTargetChange(target: NgxLowcodeDropTarget | null): void {
    if (!this.isPaletteDragging) {
      return;
    }
    this.activeDropTarget.set(target);
  }

  selectNode(nodeId: string): void {
    if (this.editingOutlineNodeId() && this.editingOutlineNodeId() !== nodeId) {
      this.cancelOutlineRename();
    }
    this.editorStore.dispatch({ type: 'select-node', nodeId });
    this.emitSelectionChange();
  }

  updateNodeProp(nodeId: string, key: string, value: unknown): void {
    this.editorStore.dispatch({ type: 'update-node-props', nodeId, patch: { [key]: value } });
    this.emitSchemaChange();
  }

  updateNodeName(nodeId: string, value: string): void {
    this.editorStore.dispatch({ type: 'update-node-name', nodeId, name: value });
    this.emitSchemaChange();
  }

  updatePageMeta(key: 'title' | 'description', value: string): void {
    this.editorStore.dispatch({ type: 'update-page-meta', patch: { [key]: value } });
    this.emitSchemaChange();
  }

  updateNodeStyle(nodeId: string, key: string, value: string): void {
    this.editorStore.dispatch({
      type: 'update-node-style',
      nodeId,
      patch: { [key]: value.trim() ? value : undefined }
    });
    this.emitSchemaChange();
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

  updateStyleDimensionValue(nodeId: string, key: string, value: string | number | null): void {
    const nextValue = value === null || value === '' ? null : Number(value);
    const currentNode = this.selectedNode();
    const currentDimension = currentNode ? this.styleDimension(currentNode, key) : { value: null, unit: 'px' };
    this.commitStyleDimension(nodeId, key, nextValue, currentDimension.unit);
  }

  updateStyleDimensionUnit(nodeId: string, key: string, unit: string): void {
    const currentNode = this.selectedNode();
    const currentDimension = currentNode ? this.styleDimension(currentNode, key) : { value: null, unit: 'px' };
    this.commitStyleDimension(nodeId, key, currentDimension.value, unit);
  }

  duplicateSelected(): void {
    const nodeId = this.selectedNodeId();
    if (!nodeId) {
      return;
    }
    this.editorStore.dispatch({ type: 'duplicate-node', nodeId });
    this.emitSchemaChange();
    this.emitSelectionChange();
  }

  deleteSelected(): void {
    const nodeId = this.selectedNodeId();
    if (!nodeId) {
      return;
    }

    const isRoot = this.editorSchema().layoutTree.some((node) => node.id === nodeId);
    if (isRoot && this.effectiveConfig().allowDeleteRoot === false) {
      return;
    }

    this.editorStore.dispatch({ type: 'remove-node', nodeId });
    this.emitSchemaChange();
    this.emitSelectionChange();
  }

  undo(): void {
    if (!this.editorStore.canUndo()) {
      return;
    }
    this.editorStore.dispatch({ type: 'undo' });
    this.emitSchemaChange();
    this.emitSelectionChange();
    this.syncRuntimeDrafts(this.editorSchema());
  }

  redo(): void {
    if (!this.editorStore.canRedo()) {
      return;
    }
    this.editorStore.dispatch({ type: 'redo' });
    this.emitSchemaChange();
    this.emitSelectionChange();
    this.syncRuntimeDrafts(this.editorSchema());
  }

  toggleLeftSidebar(): void {
    this.leftSidebarCollapsed.update((current) => !current);
  }

  toggleRightSidebar(): void {
    this.rightSidebarCollapsed.update((current) => !current);
  }

  startResize(event: PointerEvent, side: 'left' | 'right'): void {
    event.preventDefault();

    if (side === 'left' && this.leftSidebarCollapsed()) {
      this.leftSidebarCollapsed.set(false);
    }
    if (side === 'right' && this.rightSidebarCollapsed()) {
      this.rightSidebarCollapsed.set(false);
    }

    const moveHandler = (moveEvent: PointerEvent) => {
      if (side === 'left') {
        this.leftSidebarWidth.set(Math.min(Math.max(moveEvent.clientX, 220), 420));
        return;
      }
      this.rightSidebarWidth.set(Math.min(Math.max(window.innerWidth - moveEvent.clientX, 260), 460));
    };

    const upHandler = () => {
      window.removeEventListener('pointermove', moveHandler);
      window.removeEventListener('pointerup', upHandler);
      this.resizeCleanup = null;
    };

    this.resizeCleanup?.();
    this.resizeCleanup = upHandler;
    window.addEventListener('pointermove', moveHandler);
    window.addEventListener('pointerup', upHandler, { once: true });
  }

  emitPreview(): void {
    const schema = cloneSchema(this.editorSchema());
    this.previewRequest.emit(schema);
    this.command.emit({ type: 'preview', schema });
  }

  emitSave(): void {
    const schema = cloneSchema(this.editorSchema());
    this.save.emit(schema);
    this.command.emit({ type: 'save', schema });
  }

  emitPublish(): void {
    const schema = cloneSchema(this.editorSchema());
    this.publishRequest.emit(schema);
    this.command.emit({ type: 'publish', schema });
  }

  applyStateDraft(): void {
    const parsed = this.parseJsonDraft<Record<string, unknown>>(this.stateDraft());
    if (!parsed) {
      this.stateDraftError.set(this.t().stateJsonError);
      return;
    }
    this.stateDraftError.set('');
    this.editorStore.dispatch({ type: 'replace-state', state: parsed });
    this.emitSchemaChange();
    this.syncRuntimeDrafts(this.editorSchema());
  }

  applyDatasourcesDraft(): void {
    const parsed = this.parseJsonDraft<NgxLowcodeDatasourceDefinition[]>(this.datasourcesDraft());
    if (!Array.isArray(parsed)) {
      this.datasourcesDraftError.set(this.t().datasourcesJsonError);
      return;
    }
    this.datasourcesDraftError.set('');
    this.editorStore.dispatch({ type: 'replace-datasources', datasources: parsed });
    this.emitSchemaChange();
    this.syncRuntimeDrafts(this.editorSchema());
  }

  applyActionsDraft(): void {
    const parsed = this.parseJsonDraft<NgxLowcodeActionDefinition[]>(this.actionsDraft());
    if (!Array.isArray(parsed)) {
      this.actionsDraftError.set(this.t().actionsJsonError);
      return;
    }
    this.actionsDraftError.set('');
    this.editorStore.dispatch({ type: 'replace-actions', actions: parsed });
    this.emitSchemaChange();
    this.syncRuntimeDrafts(this.editorSchema());
  }

  stringProp(node: NgxLowcodeNodeSchema, key: string): string {
    return String(node.props[key] ?? '');
  }

  numberProp(node: NgxLowcodeNodeSchema, key: string): number {
    return Number(node.props[key] ?? 0);
  }

  booleanProp(node: NgxLowcodeNodeSchema, key: string): boolean {
    return Boolean(node.props[key]);
  }

  styleProp(node: NgxLowcodeNodeSchema, key: string): string {
    const value = node.style?.[key];
    return value === undefined || value === null ? '' : String(value);
  }

  countNodes(nodes: NgxLowcodeNodeSchema[]): number {
    return nodes.reduce((total, node) => total + 1 + this.countNodes(node.children ?? []), 0);
  }

  nodeDisplayName(node: NgxLowcodeNodeSchema): string {
    if (typeof node.name === 'string' && node.name.trim()) {
      return node.name.trim();
    }

    const titleKeys = ['title', 'label', 'text', 'placeholder', 'stateKey'];
    for (const key of titleKeys) {
      const value = node.props[key];
      if (typeof value === 'string' && value.trim()) {
        return `${node.componentType} · ${value.trim()}`;
      }
    }
    return `${node.componentType} · ${node.id}`;
  }

  toNumber(value: string | number): number {
    return Number(value);
  }

  startOutlineRename(node: NgxLowcodeNodeSchema): void {
    this.selectNode(node.id);
    this.editingOutlineNodeId.set(node.id);
    this.outlineNameDraft.set(node.name ?? '');
  }

  commitOutlineRename(nodeId: string): void {
    this.updateNodeName(nodeId, this.outlineNameDraft());
    this.editingOutlineNodeId.set(null);
    this.outlineNameDraft.set('');
  }

  cancelOutlineRename(): void {
    this.editingOutlineNodeId.set(null);
    this.outlineNameDraft.set('');
  }

  private resolveInsertionTarget(): NgxLowcodeDropTarget {
    const hoveredTarget = this.activeDropTarget();
    if (hoveredTarget) {
      return hoveredTarget;
    }

    const selected = this.selectedNode();
    if (!selected) {
      return { parentId: this.editorSchema().layoutTree[0]?.id ?? null, slot: null };
    }

    const definition = this.registry.get(selected.componentType);
    if (definition?.canHaveChildren) {
      return { parentId: selected.id, slot: null };
    }

    return { parentId: this.editorSchema().layoutTree[0]?.id ?? null, slot: null };
  }

  private emitSchemaChange(): void {
    this.schemaChange.emit(cloneSchema(this.editorSchema()));
  }

  private emitSelectionChange(): void {
    const nodeId = this.selectedNodeId();
    this.selectionChange.emit(nodeId ? findNodeById(this.editorSchema().layoutTree, nodeId) ?? null : null);
  }

  private normalizeIncomingSchema(schema: NgxLowcodePageSchema): NgxLowcodePageSchema {
    const nextSchema = cloneSchema(schema);
    if (nextSchema.layoutTree.length > 0) {
      return nextSchema;
    }

    const pageDefinition = this.registry.get('page');
    const rootPage = pageDefinition
      ? pageDefinition.createNode({ id: createNodeId('page') })
      : {
          id: createNodeId('page'),
          componentType: 'page',
          props: {
            title: nextSchema.pageMeta.title || 'Page',
            description: nextSchema.pageMeta.description || ''
          },
          children: []
        };

    nextSchema.layoutTree = [rootPage];
    return nextSchema;
  }

  private syncRuntimeDrafts(schema: NgxLowcodePageSchema): void {
    this.stateDraft.set(this.stringifyJson(schema.state));
    this.datasourcesDraft.set(this.stringifyJson(schema.datasources));
    this.actionsDraft.set(this.stringifyJson(schema.actions));
    this.stateDraftError.set('');
    this.datasourcesDraftError.set('');
    this.actionsDraftError.set('');
  }

  private stringifyJson(value: unknown): string {
    return JSON.stringify(value, null, 2);
  }

  private commitStyleDimension(nodeId: string, key: string, value: number | null, unit: string): void {
    this.editorStore.dispatch({
      type: 'update-node-style',
      nodeId,
      patch: { [key]: value === null || Number.isNaN(value) ? undefined : `${value}${unit}` }
    });
    this.emitSchemaChange();
  }

  private parseJsonDraft<T>(value: string): T | null {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }
}
