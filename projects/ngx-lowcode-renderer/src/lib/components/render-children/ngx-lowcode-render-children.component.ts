import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { NgxLowcodeDropTarget, NgxLowcodeNodeSchema, NgxLowcodeRuntimeContext } from 'ngx-lowcode-core-types';
import { NgxLowcodeNodeRendererComponent } from '../node-renderer/ngx-lowcode-node-renderer.component';

@Component({
  selector: 'ngx-lowcode-render-children',
  standalone: true,
  imports: [CommonModule, DragDropModule, NgxLowcodeNodeRendererComponent],
  templateUrl: './ngx-lowcode-render-children.component.html',
  styleUrl: './ngx-lowcode-render-children.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NgxLowcodeRenderChildrenComponent {
  readonly suppressedDragNodeId = signal<string | null>(null);

  readonly nodes = input<NgxLowcodeNodeSchema[]>([]);
  readonly parentId = input<string | null>(null);
  readonly slot = input<string | null>(null);
  readonly runtime = input.required<NgxLowcodeRuntimeContext>();
  readonly parentOrientation = input<'vertical' | 'horizontal'>('vertical');
  readonly paletteDragging = input(false);
  readonly hoveredDropTarget = input<NgxLowcodeDropTarget | null>(null);
  readonly dropTargetChange = output<NgxLowcodeDropTarget | null>();
  readonly dropListData = computed(() => ({
    parentId: this.parentId(),
    slot: this.slot(),
    nodes: this.nodes()
  }));
  handleDrop(event: CdkDragDrop<{ parentId: string | null; slot: string | null; nodes: NgxLowcodeNodeSchema[] }>): void {
    const target = this.createDropTarget(event.currentIndex);
    const data = event.item.data;
    console.debug('[lowcode:dnd:children:drop]', {
      parentId: this.parentId(),
      slot: this.slot(),
      previousContainerParentId: event.previousContainer.data?.parentId ?? null,
      currentContainerParentId: event.container.data?.parentId ?? null,
      previousIndex: event.previousIndex,
      currentIndex: event.currentIndex,
      data
    });

    if (typeof data === 'string' && data.trim()) {
      this.runtime().requestNodeAdd?.(data, target);
      return;
    }

    const nodeId = data?.id;
    if (!nodeId) {
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

  handleDragStart(nodeId: string): void {
    this.suppressedDragNodeId.set(null);
    console.debug('[lowcode:dnd:children:start]', {
      parentId: this.parentId(),
      slot: this.slot(),
      nodeId
    });
    this.runtime().setDraggingNode?.(nodeId);
  }

  handleDragEnd(): void {
    this.suppressedDragNodeId.set(null);
    console.debug('[lowcode:dnd:children:end]', {
      parentId: this.parentId(),
      slot: this.slot(),
      draggingNodeId: this.runtime().draggingNode?.() ?? null
    });
    this.runtime().setDropTarget?.(null);
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

  canDragNode(node: NgxLowcodeNodeSchema): boolean {
    return !this.isContainerNode(node);
  }

  dragPreviewLabel(node: NgxLowcodeNodeSchema): string {
    const definition = String(node.componentType);
    const name = String(node.name ?? node.props['title'] ?? node.props['label'] ?? node.props['text'] ?? '').trim();
    return name ? `${definition} · ${name}` : definition;
  }

  private createDropTarget(insertionIndex: number | null | undefined): NgxLowcodeDropTarget {
    return {
      parentId: this.parentId(),
      slot: this.slot(),
      insertionIndex: insertionIndex ?? this.nodes().length,
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

  private isContainerNode(node: NgxLowcodeNodeSchema): boolean {
    return node.componentType === 'page' || node.componentType === 'form' || node.componentType === 'section';
  }
}
