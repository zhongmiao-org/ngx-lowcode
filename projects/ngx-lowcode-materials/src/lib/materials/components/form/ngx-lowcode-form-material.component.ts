import { CdkDragDrop, CdkDragEnter, CdkDragExit, DragDropModule } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  NgxLowcodeDropTarget,
  NgxLowcodeFormLayout,
  NgxLowcodeNodeSchema,
  NgxLowcodeRuntimeContext
} from 'ngx-lowcode-core-types';
import { getMaterialsI18n } from 'ngx-lowcode-i18n';
import { ThyFormModule } from 'ngx-tethys/form';
import { ThyGridModule } from 'ngx-tethys/grid';
import { NgxLowcodeNodeRendererComponent } from 'ngx-lowcode-renderer';
type DropListOrientation = 'horizontal' | 'vertical' | 'mixed';

const defaultMaterialsI18n = getMaterialsI18n('zh-CN');

@Component({
  selector: 'ngx-lowcode-form-material',
  imports: [FormsModule, DragDropModule, ThyFormModule, ThyGridModule, NgxLowcodeNodeRendererComponent],
  templateUrl: './ngx-lowcode-form-material.component.html',
  styleUrl: './ngx-lowcode-form-material.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NgxLowcodeFormMaterialComponent {
  readonly suppressedDragNodeId = signal<string | null>(null);

  readonly node = input.required<NgxLowcodeNodeSchema>();
  readonly runtime = input.required<NgxLowcodeRuntimeContext>();

  readonly title = computed(() => String(this.node().props['title'] ?? defaultMaterialsI18n.defaults.formTitle));
  readonly formStyle = computed<Record<string, string | number>>(() => ({
    ...(this.node().style ?? {})
  }));
  readonly thyLayout = computed<NgxLowcodeFormLayout>(() => {
    const value = String(this.node().props['thyLayout'] ?? 'horizontal');
    return value === 'vertical' ? 'vertical' : 'horizontal';
  });
  readonly dropListData = computed(() => ({
    parentId: this.node().id,
    slot: null,
    nodes: this.node().children ?? []
  }));
  readonly dropListOrientation = computed<DropListOrientation>(() => 'vertical');
  handleDrop(
    event: CdkDragDrop<{ parentId: string | null; slot: string | null; nodes: NgxLowcodeNodeSchema[] }, any, any>
  ): void {
    const target = this.createDropTarget(event.currentIndex);
    const data = event.item.data;
    console.debug('[lowcode:dnd:form:drop]', {
      formId: this.node().id,
      previousContainerParentId: event.previousContainer.data?.parentId ?? null,
      currentContainerParentId: event.container.data?.parentId ?? null,
      previousIndex: event.previousIndex,
      currentIndex: event.currentIndex,
      data
    });

    if (typeof data === 'string' && data.trim()) {
      if (!this.canAcceptComponentType(data)) {
        console.debug('[lowcode:dnd:form:reject:add]', {
          formId: this.node().id,
          componentType: data
        });
        return;
      }
      this.runtime().requestNodeAdd?.(data, target);
      return;
    }

    const nodeId = data?.id;
    if (!nodeId) {
      return;
    }
    if (!this.canAcceptComponentType(String(data?.componentType ?? ''))) {
      console.debug('[lowcode:dnd:form:reject:move]', {
        formId: this.node().id,
        nodeId,
        componentType: String(data?.componentType ?? '')
      });
      return;
    }
    if (
      event.previousContainer === event.container &&
      event.previousIndex === event.currentIndex &&
      (target.position ?? 'inside') === 'inside' &&
      !target.targetNodeId
    ) {
      return;
    }

    this.runtime().requestNodeMove?.(nodeId, target);
  }

  logDropListEntered(
    event: CdkDragEnter<{ parentId: string | null; slot: string | null; nodes: NgxLowcodeNodeSchema[] }>
  ): void {
    console.debug('[lowcode:dnd:form:entered]', {
      formId: this.node().id,
      dragData: event.item.data,
      containerParentId: event.container.data?.parentId ?? null
    });
  }

  logDropListExited(
    event: CdkDragExit<{ parentId: string | null; slot: string | null; nodes: NgxLowcodeNodeSchema[] }>
  ): void {
    console.debug('[lowcode:dnd:form:exited]', {
      formId: this.node().id,
      dragData: event.item.data,
      containerParentId: event.container.data?.parentId ?? null
    });
  }

  handleDragStart(nodeId: string): void {
    this.suppressedDragNodeId.set(null);
    console.debug('[lowcode:dnd:form:start]', {
      formId: this.node().id,
      nodeId
    });
    this.runtime().setDraggingNode?.(nodeId);
  }

  handleDragEnd(): void {
    this.suppressedDragNodeId.set(null);
    console.debug('[lowcode:dnd:form:end]', {
      formId: this.node().id,
      draggingNodeId: this.runtime().draggingNode?.() ?? null
    });
    this.runtime().setDraggingNode?.(null);
  }

  prepareDrag(event: PointerEvent, nodeId: string): void {
    const ownerNodeId = this.resolveOwnerNodeId(event);
    this.suppressedDragNodeId.set(ownerNodeId && ownerNodeId !== nodeId ? nodeId : null);
  }

  clearPreparedDrag(nodeId: string): void {
    if (this.suppressedDragNodeId() === nodeId) {
      this.suppressedDragNodeId.set(null);
    }
  }

  isDragSuppressed(nodeId: string): boolean {
    return this.suppressedDragNodeId() === nodeId;
  }

  canDragChild(_node: NgxLowcodeNodeSchema): boolean {
    return true;
  }

  dragPreviewLabel(node: NgxLowcodeNodeSchema): string {
    const definition = String(node.componentType);
    const name = String(node.name ?? node.props['title'] ?? node.props['label'] ?? node.props['text'] ?? '').trim();
    return name ? `${definition} · ${name}` : definition;
  }

  private createDropTarget(insertionIndex: number | null | undefined): NgxLowcodeDropTarget {
    return {
      parentId: this.node().id,
      slot: null,
      insertionIndex: insertionIndex ?? (this.node().children ?? []).length,
      position: 'inside'
    };
  }

  private resolveOwnerNodeId(event: PointerEvent): string | null {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return null;
    }
    return target.closest<HTMLElement>('[data-node-id]')?.dataset['nodeId'] ?? null;
  }

  private canAcceptComponentType(componentType: string): boolean {
    return [
      'section',
      'button',
      'input',
      'select',
      'input-number',
      'checkbox',
      'radio',
      'switch',
      'date-picker',
      'upload'
    ].includes(componentType);
  }
}
