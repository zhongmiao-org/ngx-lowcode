import { Injectable, computed, inject, signal } from '@angular/core';
import {
  cloneSchema,
  createDefaultPageSchema,
  createNodeFromDefinition,
  duplicateNodeAndReturnId,
  findNodeById,
  insertNode,
  moveNode,
  removeNodeById,
  updateNodeById
} from 'ngx-lowcode-core-utils';
import { NgxLowcodeEditorCommand, NgxLowcodeEditorState, NgxLowcodeNodeSchema, NgxLowcodePageSchema } from 'ngx-lowcode-core-types';
import { NgxLowcodeMaterialRegistry } from '../material-registry';

function createInitialEditorState(schema: NgxLowcodePageSchema = createDefaultPageSchema()): NgxLowcodeEditorState {
  return {
    schema,
    selectedNodeId: schema.layoutTree[0]?.id ?? null,
    history: [],
    future: []
  };
}

@Injectable()
export class NgxLowcodeEditorStore {
  private readonly registry = inject(NgxLowcodeMaterialRegistry);
  private readonly stateSignal = signal<NgxLowcodeEditorState>(createInitialEditorState());

  readonly state = this.stateSignal.asReadonly();
  readonly schema = computed(() => this.stateSignal().schema);
  readonly selectedNodeId = computed(() => this.stateSignal().selectedNodeId);
  readonly history = computed(() => this.stateSignal().history);
  readonly future = computed(() => this.stateSignal().future);
  readonly canUndo = computed(() => this.history().length > 0);
  readonly canRedo = computed(() => this.future().length > 0);
  readonly selectedNode = computed<NgxLowcodeNodeSchema | null>(() => {
    const nodeId = this.selectedNodeId();
    if (!nodeId) {
      return null;
    }
    return findNodeById(this.schema().layoutTree, nodeId) ?? null;
  });

  dispatch(command: NgxLowcodeEditorCommand): void {
    switch (command.type) {
      case 'replace-schema':
        this.replaceSchema(command.schema, command.resetHistory ?? true, command.preserveSelection ?? true);
        return;
      case 'select-node':
        this.updateSelection(command.nodeId);
        return;
      case 'add-node':
        this.addNode(command.componentType, command.parentId ?? null, command.slot ?? null, command.insertionIndex ?? null);
        return;
      case 'move-node':
        this.moveNode(command.nodeId, command.parentId ?? null, command.slot ?? null, command.insertionIndex ?? null);
        return;
      case 'duplicate-node':
        this.duplicateNode(command.nodeId);
        return;
      case 'remove-node':
        this.removeNode(command.nodeId);
        return;
      case 'update-node-props':
        this.updateNodeProps(command.nodeId, command.patch, command.trackHistory ?? true);
        return;
      case 'update-node-name':
        this.updateNodeName(command.nodeId, command.name, command.trackHistory ?? true);
        return;
      case 'update-node-style':
        this.updateNodeStyle(command.nodeId, command.patch, command.trackHistory ?? true);
        return;
      case 'update-page-meta':
        this.updatePageMeta(command.patch, command.trackHistory ?? true);
        return;
      case 'replace-state':
        this.replaceState(command.state, command.trackHistory ?? true);
        return;
      case 'replace-datasources':
        this.replaceDatasources(command.datasources, command.trackHistory ?? true);
        return;
      case 'replace-actions':
        this.replaceActions(command.actions, command.trackHistory ?? true);
        return;
      case 'undo':
        this.undo();
        return;
      case 'redo':
        this.redo();
        return;
    }
  }

  snapshot(): NgxLowcodeEditorState {
    return cloneEditorState(this.stateSignal());
  }

  private replaceSchema(schema: NgxLowcodePageSchema, resetHistory: boolean, preserveSelection: boolean): void {
    const nextSchema = cloneSchema(schema);
    const currentState = this.stateSignal();
    const nextSelectedNodeId = preserveSelection
      ? this.resolveSelection(nextSchema, currentState.selectedNodeId)
      : this.resolveSelection(nextSchema, null);

    this.stateSignal.set({
      schema: nextSchema,
      selectedNodeId: nextSelectedNodeId,
      history: resetHistory ? [] : currentState.history,
      future: resetHistory ? [] : currentState.future
    });
  }

  private updateSelection(nodeId: string | null): void {
    const currentState = this.stateSignal();
    this.stateSignal.set({
      ...currentState,
      selectedNodeId: this.resolveSelection(currentState.schema, nodeId)
    });
  }

  private addNode(componentType: string, parentId: string | null, slot: string | null, insertionIndex: number | null): void {
    const definition = this.registry.get(componentType);
    if (!definition) {
      return;
    }

    const currentState = this.stateSignal();
    const nextNode = createNodeFromDefinition(definition);
    if (slot) {
      nextNode.slot = slot;
    }
    const nextSchema = cloneSchema(currentState.schema);
    nextSchema.layoutTree = insertNode(nextSchema.layoutTree, parentId, nextNode, slot, insertionIndex);

    this.commitSchema(nextSchema, nextNode.id, true);
  }

  private duplicateNode(nodeId: string): void {
    const currentState = this.stateSignal();
    const nextSchema = cloneSchema(currentState.schema);
    const result = duplicateNodeAndReturnId(nextSchema.layoutTree, nodeId);
    if (!result.duplicatedNodeId) {
      return;
    }

    nextSchema.layoutTree = result.nodes;
    this.commitSchema(nextSchema, result.duplicatedNodeId, true);
  }

  private moveNode(nodeId: string, parentId: string | null, slot: string | null, insertionIndex: number | null): void {
    const currentState = this.stateSignal();
    const nextSchema = cloneSchema(currentState.schema);
    nextSchema.layoutTree = moveNode(nextSchema.layoutTree, nodeId, parentId, slot, insertionIndex);

    this.commitSchema(nextSchema, nodeId, true);
  }

  private removeNode(nodeId: string): void {
    const currentState = this.stateSignal();
    const nextSchema = cloneSchema(currentState.schema);
    nextSchema.layoutTree = removeNodeById(nextSchema.layoutTree, nodeId);

    this.commitSchema(nextSchema, this.resolveSelection(nextSchema, currentState.selectedNodeId), true);
  }

  private updateNodeProps(nodeId: string, patch: Record<string, unknown>, trackHistory: boolean): void {
    const currentState = this.stateSignal();
    const nextSchema = cloneSchema(currentState.schema);
    nextSchema.layoutTree = updateNodeById(nextSchema.layoutTree, nodeId, (node: NgxLowcodeNodeSchema) => ({
      ...node,
      props: {
        ...node.props,
        ...patch
      }
    }));

    this.commitSchema(nextSchema, currentState.selectedNodeId, trackHistory);
  }

  private updateNodeName(nodeId: string, name: string | undefined, trackHistory: boolean): void {
    const currentState = this.stateSignal();
    const nextSchema = cloneSchema(currentState.schema);
    const normalizedName = name?.trim();

    nextSchema.layoutTree = updateNodeById(nextSchema.layoutTree, nodeId, (node: NgxLowcodeNodeSchema) => ({
      ...node,
      name: normalizedName || undefined
    }));

    this.commitSchema(nextSchema, currentState.selectedNodeId, trackHistory);
  }

  private updateNodeStyle(
    nodeId: string,
    patch: Record<string, string | number | null | undefined>,
    trackHistory: boolean
  ): void {
    const currentState = this.stateSignal();
    const nextSchema = cloneSchema(currentState.schema);

    nextSchema.layoutTree = updateNodeById(nextSchema.layoutTree, nodeId, (node: NgxLowcodeNodeSchema) => {
      const nextStyle = {
        ...(node.style ?? {})
      };

      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === undefined || value === '') {
          delete nextStyle[key];
          continue;
        }
        nextStyle[key] = value;
      }

      return {
        ...node,
        style: Object.keys(nextStyle).length ? nextStyle : undefined
      };
    });

    this.commitSchema(nextSchema, currentState.selectedNodeId, trackHistory);
  }

  private updatePageMeta(patch: Partial<NgxLowcodePageSchema['pageMeta']>, trackHistory: boolean): void {
    const currentState = this.stateSignal();
    const nextSchema = cloneSchema(currentState.schema);
    nextSchema.pageMeta = {
      ...nextSchema.pageMeta,
      ...patch
    };

    this.commitSchema(nextSchema, currentState.selectedNodeId, trackHistory);
  }

  private replaceState(state: Record<string, unknown>, trackHistory: boolean): void {
    const currentState = this.stateSignal();
    const nextSchema = cloneSchema(currentState.schema);
    nextSchema.state = structuredClone(state);

    this.commitSchema(nextSchema, currentState.selectedNodeId, trackHistory);
  }

  private replaceDatasources(datasources: NgxLowcodePageSchema['datasources'], trackHistory: boolean): void {
    const currentState = this.stateSignal();
    const nextSchema = cloneSchema(currentState.schema);
    nextSchema.datasources = structuredClone(datasources);

    this.commitSchema(nextSchema, currentState.selectedNodeId, trackHistory);
  }

  private replaceActions(actions: NgxLowcodePageSchema['actions'], trackHistory: boolean): void {
    const currentState = this.stateSignal();
    const nextSchema = cloneSchema(currentState.schema);
    nextSchema.actions = structuredClone(actions);

    this.commitSchema(nextSchema, currentState.selectedNodeId, trackHistory);
  }

  private undo(): void {
    const currentState = this.stateSignal();
    const previous = currentState.history.at(-1);
    if (!previous) {
      return;
    }

    this.stateSignal.set({
      schema: previous,
      selectedNodeId: this.resolveSelection(previous, currentState.selectedNodeId),
      history: currentState.history.slice(0, -1),
      future: [cloneSchema(currentState.schema), ...currentState.future]
    });
  }

  private redo(): void {
    const currentState = this.stateSignal();
    const [next, ...rest] = currentState.future;
    if (!next) {
      return;
    }

    this.stateSignal.set({
      schema: next,
      selectedNodeId: this.resolveSelection(next, currentState.selectedNodeId),
      history: [...currentState.history, cloneSchema(currentState.schema)],
      future: rest
    });
  }

  private commitSchema(nextSchema: NgxLowcodePageSchema, nextSelectedNodeId: string | null, trackHistory: boolean): void {
    const currentState = this.stateSignal();
    this.stateSignal.set({
      schema: nextSchema,
      selectedNodeId: this.resolveSelection(nextSchema, nextSelectedNodeId),
      history: trackHistory ? [...currentState.history, cloneSchema(currentState.schema)] : currentState.history,
      future: trackHistory ? [] : currentState.future
    });
  }

  private resolveSelection(schema: NgxLowcodePageSchema, candidateNodeId: string | null): string | null {
    if (candidateNodeId && findNodeById(schema.layoutTree, candidateNodeId)) {
      return candidateNodeId;
    }
    return schema.layoutTree[0]?.id ?? null;
  }
}

function cloneEditorState(state: NgxLowcodeEditorState): NgxLowcodeEditorState {
  return {
    schema: cloneSchema(state.schema),
    selectedNodeId: state.selectedNodeId,
    history: state.history.map((item: NgxLowcodePageSchema) => cloneSchema(item)),
    future: state.future.map((item: NgxLowcodePageSchema) => cloneSchema(item))
  };
}
