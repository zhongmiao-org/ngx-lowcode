import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
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
  readonly nodes = input<NgxLowcodeNodeSchema[]>([]);
  readonly parentId = input<string | null>(null);
  readonly slot = input<string | null>(null);
  readonly runtime = input.required<NgxLowcodeRuntimeContext>();
  readonly paletteDragging = input(false);
  readonly hoveredDropTarget = input<NgxLowcodeDropTarget | null>(null);
  readonly dropTargetChange = output<NgxLowcodeDropTarget | null>();
  readonly dropListData = computed(() => ({
    parentId: this.parentId(),
    slot: this.slot(),
    nodes: this.nodes()
  }));

  handleDrop(event: CdkDragDrop<{ parentId: string | null; slot: string | null; nodes: NgxLowcodeNodeSchema[] }>): void {
    const nodeId = event.item.data?.id;
    if (!nodeId) {
      return;
    }
    if (event.previousContainer === event.container && event.previousIndex === event.currentIndex) {
      return;
    }
    this.runtime().requestNodeMove?.(nodeId, {
      parentId: this.parentId(),
      slot: this.slot(),
      insertionIndex: event.currentIndex
    });
  }

  handleDragStart(nodeId: string): void {
    this.runtime().setDraggingNode?.(nodeId);
  }

  handleDragEnd(): void {
    this.runtime().setDraggingNode?.(null);
  }

  dragPreviewLabel(node: NgxLowcodeNodeSchema): string {
    const definition = String(node.componentType);
    const name = String(node.name ?? node.props['title'] ?? node.props['label'] ?? node.props['text'] ?? '').trim();
    return name ? `${definition} · ${name}` : definition;
  }
}
