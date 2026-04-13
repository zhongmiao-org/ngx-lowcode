import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NGX_LOWCODE_CONFIG } from 'ngx-lowcode-core';
import {
  NgxLowcodeActionDefinition,
  NgxLowcodeActionExecutionRequest,
  NgxLowcodeActionExecutor,
  NgxLowcodeActionStep,
  NgxLowcodeConfig,
  NgxLowcodeDatasourceExecutor,
  NgxLowcodeDropTarget,
  NgxLowcodePageSchema,
  NgxLowcodeRuntimeContext
} from 'ngx-lowcode-core-types';
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
export class NgxLowcodeRendererComponent {
  private readonly config = inject(NGX_LOWCODE_CONFIG, { optional: true }) as NgxLowcodeConfig | null;

  readonly schema = input.required<NgxLowcodePageSchema>();
  readonly context = input<Record<string, unknown>>({});
  readonly datasourceExecutor = input<NgxLowcodeDatasourceExecutor | undefined>(undefined);
  readonly actionExecutor = input<NgxLowcodeActionExecutor | undefined>(undefined);
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

  private readonly stateSignal = signal<Record<string, unknown>>({});
  private readonly selectionSignal = signal<string | null>(null);
  private readonly dropTargetSignal = signal<NgxLowcodeDropTarget | null>(null);
  private readonly draggingNodeSignal = signal<string | null>(null);
  private readonly paletteDraggingSignal = signal(false);

  constructor() {
    effect(
      () => {
        this.stateSignal.set({
          ...this.schema().state,
          ...this.context()
        });
        this.selectionSignal.set(this.selectedNodeId());
        this.dropTargetSignal.set(this.hoveredDropTarget());
        this.draggingNodeSignal.set(this.draggingNodeId());
        this.paletteDraggingSignal.set(this.paletteDragging());
      },
      { allowSignalWrites: true }
    );
  }

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

        const executor = this.datasourceExecutor() ?? this.config?.datasourceExecutor;
        if (!executor) {
          return datasource.mockData;
        }

        return executor({
          datasource,
          payload,
          state: this.stateSignal()
        });
      }
    };
  });

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
      await this.runExternalActionExecutor(schema, action, step, payload);
      return;
    }

    if (step.type === 'callDatasource' && step.datasourceId) {
      const result = await this.runtime().executeDatasourceById(step.datasourceId, payload);
      const datasource = schema.datasources.find((item) => item.id === step.datasourceId);
      const stateKey = step.stateKey ?? datasource?.responseMapping?.stateKey;

      if (stateKey) {
        this.stateSignal.update((current) => ({
          ...current,
          [stateKey]: result
        }));
      }

      await this.runExternalActionExecutor(schema, action, step, payload);
      return;
    }

    await this.runExternalActionExecutor(schema, action, step, payload);
  }

  private async runExternalActionExecutor(
    schema: NgxLowcodePageSchema,
    action: NgxLowcodeActionDefinition,
    step: NgxLowcodeActionStep,
    payload?: unknown
  ): Promise<void> {
    const executor = this.actionExecutor() ?? this.config?.actionExecutor;
    if (!executor) {
      return;
    }

    const request: NgxLowcodeActionExecutionRequest = {
      action,
      step,
      schema,
      payload,
      state: this.stateSignal()
    };

    await executor(request);
  }
}
