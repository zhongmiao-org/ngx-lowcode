import { InjectionToken, Signal, Type } from '@angular/core';

export type NgxLowcodeSetterType = 'text' | 'textarea' | 'number' | 'switch' | 'select' | 'color';
export type NgxLowcodeSetterGroup = 'properties' | 'layout' | 'style';
export type NgxLowcodeLayoutMode = 'flex';
export type NgxLowcodeFormLayout = 'horizontal' | 'vertical';

export interface NgxLowcodeSetterOption {
  label: string;
  value: string | number | boolean;
}

export interface NgxLowcodeSetterDefinition {
  key: string;
  label: string;
  type: NgxLowcodeSetterType;
  group?: NgxLowcodeSetterGroup;
  layoutModes?: NgxLowcodeLayoutMode[];
  placeholder?: string;
  options?: NgxLowcodeSetterOption[];
  suffix?: string;
  min?: number;
  max?: number;
}

export interface NgxLowcodeEventDefinition {
  name: string;
  label: string;
}

export interface NgxLowcodeSlotDefinition {
  name: string;
  label: string;
  accepts?: string[];
}

export interface NgxLowcodeNodeSchema {
  id: string;
  name?: string;
  componentType: string;
  slot?: string;
  props: Record<string, unknown>;
  style?: Record<string, string | number>;
  children?: NgxLowcodeNodeSchema[];
}

export interface NgxLowcodeDropTarget {
  parentId: string | null;
  slot?: string | null;
  insertionIndex?: number | null;
  position?: 'inside' | 'before' | 'after';
  targetNodeId?: string | null;
}

export interface NgxLowcodeDatasourceDefinition {
  id: string;
  type: 'mock' | 'rest' | 'middleware-command' | string;
  command?: {
    transport?: 'websocket' | 'http' | string;
    name?: string;
    target?: string;
    payloadTemplate?: Record<string, unknown>;
    timeoutMs?: number;
  };
  request?: {
    method?: string;
    url?: string;
    params?: Record<string, unknown>;
    body?: unknown;
  };
  responseMapping?: {
    stateKey?: string;
  };
  mockData?: unknown;
}

export interface NgxLowcodeActionStep {
  type: 'setState' | 'message' | 'callDatasource' | 'openModal' | 'startWorkflow' | string;
  patch?: Record<string, unknown>;
  message?: string;
  datasourceId?: string;
  stateKey?: string;
  modalId?: string;
  workflowName?: string;
  payloadTemplate?: Record<string, unknown>;
}

export interface NgxLowcodeActionDefinition {
  id: string;
  trigger?: string;
  steps: NgxLowcodeActionStep[];
}

export interface NgxLowcodePageSchema {
  schemaVersion: string;
  pageMeta: {
    id: string;
    title: string;
    description?: string;
  };
  state: Record<string, unknown>;
  datasources: NgxLowcodeDatasourceDefinition[];
  actions: NgxLowcodeActionDefinition[];
  layoutTree: NgxLowcodeNodeSchema[];
}

export interface NgxLowcodeMaterialCreateNodeOptions {
  id: string;
}

export interface NgxLowcodeComponentDefinition {
  type: string;
  title: string;
  category: string;
  icon?: string;
  canHaveChildren?: boolean;
  component: Type<unknown>;
  propsSchema?: Record<string, unknown>;
  setterSchema: NgxLowcodeSetterDefinition[];
  itemSetterSchema?: NgxLowcodeSetterDefinition[];
  events?: NgxLowcodeEventDefinition[];
  slots?: NgxLowcodeSlotDefinition[];
  createNode: (options: NgxLowcodeMaterialCreateNodeOptions) => NgxLowcodeNodeSchema;
}

export interface NgxLowcodeDatasourceRequest {
  datasource: NgxLowcodeDatasourceDefinition;
  state: Record<string, unknown>;
  payload?: unknown;
}

export interface NgxLowcodeActionExecutionRequest {
  action: NgxLowcodeActionDefinition;
  step: NgxLowcodeActionStep;
  schema: NgxLowcodePageSchema;
  state: Record<string, unknown>;
  payload?: unknown;
}

export type NgxLowcodeDatasourceExecutor = (request: NgxLowcodeDatasourceRequest) => Promise<unknown>;
export type NgxLowcodeActionExecutor = (request: NgxLowcodeActionExecutionRequest) => void | Promise<void>;

export interface NgxLowcodeDataSourceManager {
  execute: (request: NgxLowcodeDatasourceRequest) => Promise<unknown>;
}

export interface NgxLowcodeActionManager {
  execute: (request: NgxLowcodeActionExecutionRequest) => void | Promise<void>;
}

export type NgxLowcodeWebSocketEventHandler = (event: unknown) => void;

export interface NgxLowcodeWebSocketManager {
  connect: () => void | Promise<void>;
  subscribe: (channel: string, handler: NgxLowcodeWebSocketEventHandler) => void | Promise<void>;
  unsubscribe: (channel: string, handler: NgxLowcodeWebSocketEventHandler) => void | Promise<void>;
  disconnect: () => void | Promise<void>;
}

export interface NgxLowcodeRuntimeContext {
  mode: 'design' | 'runtime';
  state: Signal<Record<string, unknown>>;
  selection: Signal<string | null>;
  dropTarget?: Signal<NgxLowcodeDropTarget | null>;
  draggingNode?: Signal<string | null>;
  paletteDragging?: Signal<boolean>;
  setSelection: (nodeId: string | null) => void;
  setState: (patch: Record<string, unknown>) => void;
  setDropTarget?: (target: NgxLowcodeDropTarget | null) => void;
  setDraggingNode?: (nodeId: string | null) => void;
  requestNodeAdd?: (componentType: string, target: NgxLowcodeDropTarget) => void;
  requestNodeMove?: (nodeId: string, target: NgxLowcodeDropTarget) => void;
  requestNodeDelete?: (nodeId: string) => void;
  executeActionById: (actionId?: string, payload?: unknown) => Promise<void>;
  executeDatasourceById: (datasourceId: string, payload?: unknown) => Promise<unknown>;
}

export interface NgxLowcodeDesignerConfig {
  title?: string;
  allowDeleteRoot?: boolean;
}

export interface NgxLowcodeDesignerCommand {
  type: 'save' | 'preview' | 'publish';
  schema: NgxLowcodePageSchema;
}

export interface NgxLowcodeEditorState {
  schema: NgxLowcodePageSchema;
  selectedNodeId: string | null;
  history: NgxLowcodePageSchema[];
  future: NgxLowcodePageSchema[];
}

export type NgxLowcodeEditorCommand =
  | {
      type: 'replace-schema';
      schema: NgxLowcodePageSchema;
      resetHistory?: boolean;
      preserveSelection?: boolean;
    }
  | {
      type: 'select-node';
      nodeId: string | null;
    }
  | {
      type: 'add-node';
      componentType: string;
      parentId?: string | null;
      slot?: string | null;
      insertionIndex?: number | null;
    }
  | {
      type: 'move-node';
      nodeId: string;
      parentId?: string | null;
      slot?: string | null;
      insertionIndex?: number | null;
    }
  | {
      type: 'duplicate-node';
      nodeId: string;
    }
  | {
      type: 'remove-node';
      nodeId: string;
    }
  | {
      type: 'update-node-props';
      nodeId: string;
      patch: Record<string, unknown>;
      trackHistory?: boolean;
    }
  | {
      type: 'update-node-name';
      nodeId: string;
      name?: string;
      trackHistory?: boolean;
    }
  | {
      type: 'update-node-style';
      nodeId: string;
      patch: Record<string, string | number | null | undefined>;
      trackHistory?: boolean;
    }
  | {
      type: 'update-page-meta';
      patch: Partial<NgxLowcodePageSchema['pageMeta']>;
      trackHistory?: boolean;
    }
  | {
      type: 'replace-state';
      state: Record<string, unknown>;
      trackHistory?: boolean;
    }
  | {
      type: 'replace-datasources';
      datasources: NgxLowcodeDatasourceDefinition[];
      trackHistory?: boolean;
    }
  | {
      type: 'replace-actions';
      actions: NgxLowcodeActionDefinition[];
      trackHistory?: boolean;
    }
  | {
      type: 'undo';
    }
  | {
      type: 'redo';
    };

export interface NgxLowcodeExternalMaterialAdapter {
  source: string;
  adapt(): NgxLowcodeComponentDefinition[];
}

export interface NgxLowcodeConfig {
  actionManager?: NgxLowcodeActionManager;
  dataSourceManager?: NgxLowcodeDataSourceManager;
  webSocketManager?: NgxLowcodeWebSocketManager;
}

export const NGX_LOWCODE_CONFIG = new InjectionToken<NgxLowcodeConfig>('NGX_LOWCODE_CONFIG');
export const NGX_LOWCODE_ACTION_MANAGER = new InjectionToken<NgxLowcodeActionManager>('NGX_LOWCODE_ACTION_MANAGER');
export const NGX_LOWCODE_DATASOURCE_MANAGER = new InjectionToken<NgxLowcodeDataSourceManager>(
  'NGX_LOWCODE_DATASOURCE_MANAGER'
);
export const NGX_LOWCODE_WEBSOCKET_MANAGER = new InjectionToken<NgxLowcodeWebSocketManager>(
  'NGX_LOWCODE_WEBSOCKET_MANAGER'
);
