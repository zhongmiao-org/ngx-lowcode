import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';

import { Component, OnChanges, OnDestroy, SimpleChanges, computed, inject, input, output, signal } from '@angular/core';
import { NgxLowcodeEditorStore, NgxLowcodeMaterialRegistry } from '@zhongmiao/ngx-lowcode-core';
import {
  cloneSchema,
  createDefaultPageSchema,
  createNodeId,
  findNodeById,
  resolveDropTargetInsertion
} from '@zhongmiao/ngx-lowcode-core-utils';
import {
  NgxLowcodeActionDefinition,
  NgxLowcodeComponentDefinition,
  NgxLowcodeDatasourceDefinition,
  NgxLowcodeDesignerCommand,
  NgxLowcodeDesignerConfig,
  NgxLowcodeDropTarget,
  NgxLowcodeNodeSchema,
  NgxLowcodePageSchema
} from '@zhongmiao/ngx-lowcode-core-types';
import { getDesignerI18n, NgxLowcodeDesignerLocale } from '@zhongmiao/ngx-lowcode-i18n';
import { NgxLowcodeRendererComponent } from '@zhongmiao/ngx-lowcode-renderer';
import { NgxLowcodeDesignerPropsComponent } from '../props/ngx-lowcode-designer-props.component';
import { NgxLowcodeDesignerSidebarComponent } from '../sidebar/ngx-lowcode-designer-sidebar.component';
import { ThyButtonModule } from 'ngx-tethys/button';

@Component({
  selector: 'ngx-lowcode-designer',
  imports: [
    DragDropModule,
    NgxLowcodeRendererComponent,
    NgxLowcodeDesignerSidebarComponent,
    NgxLowcodeDesignerPropsComponent,
    ThyButtonModule
  ],
  providers: [NgxLowcodeEditorStore],
  templateUrl: './ngx-lowcode-designer.component.html',
  styleUrl: './ngx-lowcode-designer.component.scss'
})
export class NgxLowcodeDesignerComponent implements OnChanges, OnDestroy {
  private readonly registry = inject(NgxLowcodeMaterialRegistry);
  private readonly editorStore = inject(NgxLowcodeEditorStore);
  protected isPaletteDragging = false;
  protected draggingNodeId: string | null = null;
  private resizeCleanup: (() => void) | null = null;

  readonly activeDropTarget = signal<NgxLowcodeDropTarget | null>(null);
  readonly leftSidebarWidth = signal(340);
  readonly rightSidebarWidth = signal(420);
  readonly leftSidebarCollapsed = signal(false);
  readonly rightSidebarCollapsed = signal(false);
  readonly styleUnits = ['px', '%', 'rem', 'vh', 'vw', 'em'] as const;
  readonly styleDimensions = computed(() => [
    ...(this.selectedNode()?.componentType === 'button'
      ? [
          { key: 'width', label: this.t().width },
          { key: 'minWidth', label: this.t().minWidth }
        ]
      : []),
    { key: 'height', label: this.t().height },
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
    }
  }

  ngOnDestroy(): void {
    this.resizeCleanup?.();
  }

  addMaterial(materialType: string): void {
    const insertionTarget = this.resolveCommandTarget(this.resolveInsertionTarget());
    this.editorStore.dispatch({
      type: 'add-node',
      componentType: materialType,
      parentId: insertionTarget.parentId,
      slot: insertionTarget.slot,
      insertionIndex: insertionTarget.insertionIndex ?? null
    });
    this.activeDropTarget.set(null);
    this.emitSchemaChange();
    this.emitSelectionChange();
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

  handlePaletteDragStateChange(isDragging: boolean): void {
    this.isPaletteDragging = isDragging;
    if (isDragging) {
      this.draggingNodeId = null;
    }
    this.activeDropTarget.set(null);
  }

  handleRendererSelectionChange(nodeId: string | null): void {
    if (!nodeId) {
      return;
    }
    this.selectNode(nodeId);
  }

  handleRendererDropTargetChange(target: NgxLowcodeDropTarget | null): void {
    if (!this.isPaletteDragging && !this.draggingNodeId) {
      return;
    }
    this.activeDropTarget.set(target);
  }

  handleNodeDragStateChange(event: { nodeId: string | null; dragging: boolean }): void {
    this.draggingNodeId = event.dragging ? event.nodeId : null;
    if (event.dragging) {
      this.isPaletteDragging = false;
    }
    if (!event.dragging) {
      this.activeDropTarget.set(null);
    }
  }

  handleNodeMove(event: { nodeId: string; target: NgxLowcodeDropTarget }): void {
    const insertionTarget = this.resolveCommandTarget(event.target);
    console.debug('[lowcode:dnd:designer:move]', {
      nodeId: event.nodeId,
      rawTarget: event.target,
      resolvedTarget: insertionTarget
    });
    this.editorStore.dispatch({
      type: 'move-node',
      nodeId: event.nodeId,
      parentId: insertionTarget.parentId,
      slot: insertionTarget.slot,
      insertionIndex: insertionTarget.insertionIndex
    });
    this.draggingNodeId = null;
    this.activeDropTarget.set(null);
    this.emitSchemaChange();
    this.emitSelectionChange();
  }

  handleNodeAdd(event: { componentType: string; target: NgxLowcodeDropTarget }): void {
    const insertionTarget = this.resolveCommandTarget(event.target);
    this.editorStore.dispatch({
      type: 'add-node',
      componentType: event.componentType,
      parentId: insertionTarget.parentId,
      slot: insertionTarget.slot,
      insertionIndex: insertionTarget.insertionIndex
    });
    this.activeDropTarget.set(null);
    this.emitSchemaChange();
    this.emitSelectionChange();
  }

  handleNodeDelete(nodeId: string): void {
    this.editorStore.dispatch({ type: 'select-node', nodeId });
    this.deleteSelected();
  }

  handleStageDragOver(event: DragEvent): void {
    if (!this.draggingNodeId) {
      return;
    }
    event.preventDefault();
    this.activeDropTarget.set({
      parentId: this.editorSchema().layoutTree[0]?.id ?? null,
      slot: null,
      position: 'inside'
    });
  }

  handleStageDrop(event: DragEvent): void {
    if (!this.draggingNodeId) {
      return;
    }
    event.preventDefault();
    const target = this.activeDropTarget() ?? {
      parentId: this.editorSchema().layoutTree[0]?.id ?? null,
      slot: null,
      position: 'inside' as const
    };
    this.handleNodeMove({ nodeId: this.draggingNodeId, target });
  }

  selectNode(nodeId: string): void {
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
    if (isRoot && !this.effectiveConfig().allowDeleteRoot) {
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
  }

  redo(): void {
    if (!this.editorStore.canRedo()) {
      return;
    }
    this.editorStore.dispatch({ type: 'redo' });
    this.emitSchemaChange();
    this.emitSelectionChange();
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
        this.leftSidebarWidth.set(Math.min(Math.max(moveEvent.clientX, 260), 520));
        return;
      }
      this.rightSidebarWidth.set(Math.min(Math.max(window.innerWidth - moveEvent.clientX, 320), 620));
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

  replaceState(state: Record<string, unknown>): void {
    this.editorStore.dispatch({ type: 'replace-state', state });
    this.emitSchemaChange();
  }

  replaceDatasources(datasources: NgxLowcodeDatasourceDefinition[]): void {
    this.editorStore.dispatch({ type: 'replace-datasources', datasources });
    this.emitSchemaChange();
  }

  replaceActions(actions: NgxLowcodeActionDefinition[]): void {
    this.editorStore.dispatch({ type: 'replace-actions', actions });
    this.emitSchemaChange();
  }

  private resolveInsertionTarget(): NgxLowcodeDropTarget {
    const hoveredTarget = this.activeDropTarget();
    if (hoveredTarget) {
      return hoveredTarget;
    }

    const selected = this.selectedNode();
    if (!selected) {
      return { parentId: this.editorSchema().layoutTree[0]?.id ?? null, slot: null, position: 'inside' };
    }

    const definition = this.registry.get(selected.componentType);
    if (definition?.canHaveChildren) {
      return { parentId: selected.id, slot: null, position: 'inside' };
    }

    return { parentId: this.editorSchema().layoutTree[0]?.id ?? null, slot: null, position: 'inside' };
  }

  private resolveCommandTarget(target: NgxLowcodeDropTarget): {
    parentId: string | null;
    slot: string | null;
    insertionIndex: number | null;
  } {
    return resolveDropTargetInsertion(this.editorSchema().layoutTree, target);
  }

  private emitSchemaChange(): void {
    this.schemaChange.emit(cloneSchema(this.editorSchema()));
  }

  private emitSelectionChange(): void {
    const nodeId = this.selectedNodeId();
    this.selectionChange.emit(nodeId ? (findNodeById(this.editorSchema().layoutTree, nodeId) ?? null) : null);
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
}
