import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  input,
  linkedSignal,
  output
} from '@angular/core';
import { DragDropModule } from '@angular/cdk/drag-drop';
import {
  NGX_LOWCODE_ACTION_MANAGER,
  NGX_LOWCODE_CONFIG,
  NGX_LOWCODE_DATASOURCE_MANAGER,
  NGX_LOWCODE_WEBSOCKET_MANAGER,
  NgxLowcodeActionDefinition,
  NgxLowcodeActionExecutionRequest,
  NgxLowcodeActionManager,
  NgxLowcodeActionStep,
  NgxLowcodeConfig,
  NgxLowcodeDataSourceManager,
  NgxLowcodeDatasourceDefinition,
  NgxLowcodeDatasourceExecutionMeta,
  NgxLowcodeDatasourceExecutionResult,
  NgxLowcodeDropTarget,
  NgxLowcodePageSchema,
  NgxLowcodeRuntimeContext,
  NgxLowcodeRuntimeManagerExecutedEvent,
  NgxLowcodeWebSocketManager
} from '@zhongmiao/ngx-lowcode-core-types';
import { NgxLowcodeRenderChildrenComponent } from '../render-children/ngx-lowcode-render-children.component';
import { NgxLowcodeDropListRegistryService } from '../../services/drop-list-registry.service';

@Component({
  selector: 'ngx-lowcode-renderer',
  imports: [DragDropModule, NgxLowcodeRenderChildrenComponent],
  templateUrl: './ngx-lowcode-renderer.component.html',
  styleUrl: './ngx-lowcode-renderer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [NgxLowcodeDropListRegistryService]
})
export class NgxLowcodeRendererComponent implements OnInit, OnDestroy {
  private static readonly runtimeDatasourceErrorsKey = '__runtimeDatasourceErrors';
  private static readonly runtimeExecutionKey = '__runtimeExecution';

  private readonly config = inject(NGX_LOWCODE_CONFIG, { optional: true }) as NgxLowcodeConfig | null;
  private readonly configuredActionManager = inject(NGX_LOWCODE_ACTION_MANAGER, { optional: true });
  private readonly configuredDataSourceManager = inject(NGX_LOWCODE_DATASOURCE_MANAGER, { optional: true });
  private readonly configuredWebSocketManager = inject(NGX_LOWCODE_WEBSOCKET_MANAGER, { optional: true });
  private readonly actionManager: NgxLowcodeActionManager = this.configuredActionManager ??
    this.config?.actionManager ?? {
      execute: () => undefined
    };
  private readonly dataSourceManager: NgxLowcodeDataSourceManager = this.configuredDataSourceManager ??
    this.config?.dataSourceManager ?? {
      execute: async ({ datasource }) => datasource.mockData
    };
  private readonly webSocketManager: NgxLowcodeWebSocketManager = this.configuredWebSocketManager ??
    this.config?.webSocketManager ?? {
      connect: () => undefined,
      subscribe: () => undefined,
      unsubscribe: () => undefined,
      disconnect: () => undefined
    };
  private runtimeRequestSequence = 0;

  readonly schema = input.required<NgxLowcodePageSchema>();
  readonly context = input<Record<string, unknown>>({});
  readonly mode = input<'design' | 'runtime'>('runtime');
  readonly selectedNodeId = input<string | null>(null);
  readonly paletteDragging = input(false);
  readonly draggingNodeId = input<string | null>(null);
  readonly hoveredDropTarget = input<NgxLowcodeDropTarget | null>(null);
  readonly selectionChange = output<string | null>();
  readonly dropTargetChange = output<NgxLowcodeDropTarget | null>();
  readonly nodeAddRequest = output<{ componentType: string; target: NgxLowcodeDropTarget }>();
  readonly nodeMoveRequest = output<{ nodeId: string; target: NgxLowcodeDropTarget }>();
  readonly nodeDeleteRequest = output<string>();
  private readonly webSocketSubscriptions: Array<{
    channel: string;
    handler: (event: unknown) => void;
  }> = [];

  private readonly stateSignal = linkedSignal<Record<string, unknown>>(() => ({
    ...this.schema().state,
    ...this.context()
  }));
  private readonly selectionSignal = linkedSignal<string | null>(() => this.selectedNodeId());
  private readonly dropTargetSignal = linkedSignal<NgxLowcodeDropTarget | null>(() => this.hoveredDropTarget());
  private readonly draggingNodeSignal = linkedSignal<string | null>(() => this.draggingNodeId());
  private readonly paletteDraggingSignal = linkedSignal<boolean>(() => this.paletteDragging());

  readonly runtime = computed<NgxLowcodeRuntimeContext>(() => {
    const mode = this.mode();
    const schema = this.schema();

    return {
      mode,
      state: this.stateSignal.asReadonly(),
      selection: this.selectionSignal.asReadonly(),
      dropTarget: this.dropTargetSignal.asReadonly(),
      draggingNode: this.draggingNodeSignal.asReadonly(),
      paletteDragging: this.paletteDraggingSignal.asReadonly(),
      setSelection: (nodeId: string | null) => {
        this.selectionSignal.set(nodeId);
        this.selectionChange.emit(nodeId);
      },
      setState: (patch: Record<string, unknown>) => {
        this.stateSignal.update((current) => ({
          ...current,
          ...patch
        }));
      },
      setDropTarget: (target: NgxLowcodeDropTarget | null) => {
        this.dropTargetSignal.set(target);
        this.dropTargetChange.emit(target);
      },
      setDraggingNode: (nodeId: string | null) => {
        this.draggingNodeSignal.set(nodeId);
      },
      requestNodeAdd: (componentType: string, target: NgxLowcodeDropTarget) => {
        this.nodeAddRequest.emit({ componentType, target });
      },
      requestNodeMove: (nodeId: string, target: NgxLowcodeDropTarget) => {
        this.nodeMoveRequest.emit({ nodeId, target });
      },
      requestNodeDelete: (nodeId: string) => {
        this.nodeDeleteRequest.emit(nodeId);
      },
      executeActionById: async (actionId?: string, payload?: unknown) => {
        if (!actionId) {
          return;
        }

        const action = schema.actions.find((item: NgxLowcodeActionDefinition) => item.id === actionId);
        if (!action) {
          return;
        }

        for (const step of action.steps) {
          await this.executeStep(schema, action, step, payload);
        }
      },
      executeDatasourceById: async (datasourceId: string, payload?: unknown) => {
        const datasource = schema.datasources.find((item) => item.id === datasourceId);
        if (!datasource) {
          return undefined;
        }

        const result = await this.executeDatasourceRequest(datasource, payload);
        return result.data;
      }
    };
  });

  ngOnInit(): void {
    this.runWebSocketEffect('connect', () => this.webSocketManager.connect());
    for (const datasource of this.schema().datasources) {
      if (datasource.command?.transport !== 'websocket') {
        continue;
      }
      const channel = String(datasource.command.target ?? datasource.id).trim();
      if (!channel) {
        continue;
      }
      const handler = (event: unknown) => {
        this.runWebSocketEffect(`event:${channel}`, () => this.handleWebSocketEvent(event));
      };
      this.webSocketSubscriptions.push({ channel, handler });
      this.runWebSocketEffect(`subscribe:${channel}`, () => this.webSocketManager.subscribe(channel, handler));
    }
  }

  ngOnDestroy(): void {
    for (const subscription of this.webSocketSubscriptions) {
      this.runWebSocketEffect(`unsubscribe:${subscription.channel}`, () =>
        this.webSocketManager.unsubscribe(subscription.channel, subscription.handler)
      );
    }
    this.runWebSocketEffect('disconnect', () => this.webSocketManager.disconnect());
  }

  private async executeStep(
    schema: NgxLowcodePageSchema,
    action: NgxLowcodeActionDefinition,
    step: NgxLowcodeActionStep,
    payload?: unknown
  ): Promise<void> {
    if (step.type === 'setState' && step.patch) {
      this.stateSignal.update((current) => ({
        ...current,
        ...step.patch
      }));
      return;
    }

    if (step.type === 'message' && step.message) {
      console.info(step.message);
      await this.runActionManager(schema, action, step, payload);
      return;
    }

    if (step.type === 'callDatasource' && step.datasourceId) {
      const datasource = schema.datasources.find((item) => item.id === step.datasourceId);
      if (!datasource) {
        await this.runActionManager(schema, action, step, payload);
        return;
      }

      try {
        await this.executeDatasourceAndApplyState(datasource, payload, step.stateKey);
      } catch (error) {
        const message = this.resolveErrorMessage(error);
        this.setDatasourceRuntimeError(step.datasourceId, message);
        this.setRuntimeExecution(step.datasourceId, {
          requestId: this.createDatasourceRequestId(step.datasourceId),
          status: 'failure',
          message,
          source: this.resolveDatasourceExecutionSource(datasource)
        });
      }

      await this.runActionManager(schema, action, step, payload);
      return;
    }

    await this.runActionManager(schema, action, step, payload);
  }

  private async handleWebSocketEvent(event: unknown): Promise<void> {
    if (!this.isRuntimeManagerExecutedEvent(event)) {
      return;
    }

    this.stateSignal.update((current) => ({
      ...current,
      ...event.patchState
    }));

    const schema = this.schema();
    for (const datasourceId of event.refreshedDatasourceIds) {
      const datasource = schema.datasources.find((item) => item.id === datasourceId);
      if (!datasource) {
        continue;
      }

      try {
        await this.executeDatasourceAndApplyState(datasource, event);
      } catch (error) {
        const message = this.resolveErrorMessage(error);
        this.setDatasourceRuntimeError(datasourceId, message);
        this.setRuntimeExecution(datasourceId, {
          requestId: this.createDatasourceRequestId(datasourceId),
          status: 'failure',
          message,
          source: this.resolveDatasourceExecutionSource(datasource)
        });
      }
    }

    const runtime = this.runtime();
    for (const actionId of event.runActionIds) {
      await runtime.executeActionById(actionId, event);
    }
  }

  private isRuntimeManagerExecutedEvent(event: unknown): event is NgxLowcodeRuntimeManagerExecutedEvent {
    if (!event || typeof event !== 'object' || Array.isArray(event)) {
      return false;
    }

    const candidate = event as Partial<NgxLowcodeRuntimeManagerExecutedEvent>;
    const page = candidate.page as Partial<NgxLowcodeRuntimeManagerExecutedEvent['page']> | undefined;
    return (
      candidate.type === 'runtime.manager.executed' &&
      typeof candidate.topic === 'string' &&
      Boolean(page) &&
      typeof page === 'object' &&
      !Array.isArray(page) &&
      typeof page.tenantId === 'string' &&
      typeof page.pageId === 'string' &&
      typeof page.pageInstanceId === 'string' &&
      Boolean(candidate.patchState) &&
      typeof candidate.patchState === 'object' &&
      !Array.isArray(candidate.patchState) &&
      Array.isArray(candidate.refreshedDatasourceIds) &&
      Array.isArray(candidate.runActionIds)
    );
  }

  private async runActionManager(
    schema: NgxLowcodePageSchema,
    action: NgxLowcodeActionDefinition,
    step: NgxLowcodeActionStep,
    payload?: unknown
  ): Promise<void> {
    const request: NgxLowcodeActionExecutionRequest = {
      action,
      step,
      schema,
      payload,
      state: this.stateSignal()
    };

    await this.actionManager.execute(request);
  }

  private async executeDatasourceAndApplyState(
    datasource: NgxLowcodeDatasourceDefinition,
    payload?: unknown,
    stateKeyOverride?: string
  ): Promise<NgxLowcodeDatasourceExecutionResult> {
    const result = await this.executeDatasourceRequest(datasource, payload);
    const stateKey = stateKeyOverride ?? datasource.responseMapping?.stateKey;

    this.setRuntimeExecution(datasource.id, result.meta);

    if (result.meta.status === 'failure') {
      this.setDatasourceRuntimeError(datasource.id, result.meta.message ?? 'Datasource execution failed');
      return result;
    }

    if (stateKey) {
      this.stateSignal.update((current) => ({
        ...current,
        [stateKey]: result.data
      }));
    }

    this.clearDatasourceRuntimeError(datasource.id);
    return result;
  }

  private setDatasourceRuntimeError(datasourceId: string, message: string): void {
    this.stateSignal.update((current) => {
      const currentErrors = this.getDatasourceRuntimeErrors(current);
      return {
        ...current,
        [NgxLowcodeRendererComponent.runtimeDatasourceErrorsKey]: {
          ...currentErrors,
          [datasourceId]: message
        }
      };
    });
  }

  private clearDatasourceRuntimeError(datasourceId: string): void {
    this.stateSignal.update((current) => {
      const currentErrors = this.getDatasourceRuntimeErrors(current);
      if (!(datasourceId in currentErrors)) {
        return current;
      }

      const { [datasourceId]: _removed, ...nextErrors } = currentErrors;
      return {
        ...current,
        [NgxLowcodeRendererComponent.runtimeDatasourceErrorsKey]: nextErrors
      };
    });
  }

  private setRuntimeExecution(datasourceId: string, meta: NgxLowcodeDatasourceExecutionMeta): void {
    this.stateSignal.update((current) => ({
      ...current,
      [NgxLowcodeRendererComponent.runtimeExecutionKey]: {
        datasourceId,
        requestId: meta.requestId,
        status: meta.status,
        rowCount: meta.rowCount,
        message: meta.message,
        source: meta.source
      }
    }));
  }

  private async executeDatasourceRequest(
    datasource: NgxLowcodeDatasourceDefinition,
    payload?: unknown
  ): Promise<NgxLowcodeDatasourceExecutionResult> {
    const result = await this.dataSourceManager.execute({
      datasource,
      payload,
      state: this.stateSignal()
    });
    return this.normalizeDatasourceExecutionResult(datasource, result);
  }

  private normalizeDatasourceExecutionResult(
    datasource: NgxLowcodeDatasourceDefinition,
    result: unknown | NgxLowcodeDatasourceExecutionResult
  ): NgxLowcodeDatasourceExecutionResult {
    if (this.isDatasourceExecutionResult(result)) {
      return {
        data: result.data,
        meta: {
          requestId: result.meta.requestId ?? this.createDatasourceRequestId(datasource.id),
          status: result.meta.status,
          rowCount: result.meta.rowCount ?? this.resolveDatasourceRowCount(result.data),
          message: result.meta.message,
          source: result.meta.source ?? this.resolveDatasourceExecutionSource(datasource)
        }
      };
    }

    return {
      data: result,
      meta: {
        requestId: this.createDatasourceRequestId(datasource.id),
        status: 'success',
        rowCount: this.resolveDatasourceRowCount(result),
        source: this.resolveDatasourceExecutionSource(datasource)
      }
    };
  }

  private isDatasourceExecutionResult(value: unknown): value is NgxLowcodeDatasourceExecutionResult {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return false;
    }

    const candidate = value as Partial<NgxLowcodeDatasourceExecutionResult>;
    const meta = candidate.meta;
    return Boolean(
      meta &&
      typeof meta === 'object' &&
      !Array.isArray(meta) &&
      (meta.status === 'success' || meta.status === 'failure') &&
      'data' in candidate
    );
  }

  private resolveDatasourceRowCount(value: unknown): number | undefined {
    return Array.isArray(value) ? value.length : undefined;
  }

  private resolveDatasourceExecutionSource(datasource: NgxLowcodeDatasourceDefinition): string {
    return String(datasource.command?.transport ?? datasource.type ?? 'unknown');
  }

  private createDatasourceRequestId(datasourceId: string): string {
    this.runtimeRequestSequence += 1;
    return `${datasourceId}-${this.runtimeRequestSequence}`;
  }

  private runWebSocketEffect(label: string, operation: () => void | Promise<void>): void {
    void Promise.resolve()
      .then(operation)
      .catch((error) => {
        console.warn(`[ngx-lowcode] websocket lifecycle failed: ${label}`, error);
      });
  }

  private getDatasourceRuntimeErrors(state: Record<string, unknown>): Record<string, string> {
    const value = state[NgxLowcodeRendererComponent.runtimeDatasourceErrorsKey];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const raw = value as Record<string, unknown>;
      return Object.entries(raw).reduce<Record<string, string>>((acc, [key, item]) => {
        acc[key] = String(item ?? '');
        return acc;
      }, {});
    }
    return {};
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error ?? 'Unknown datasource error');
  }
}
