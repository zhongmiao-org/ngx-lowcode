import { CommonModule, NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { NgxLowcodeMaterialRegistry } from 'ngx-lowcode-core';
import { NgxLowcodeDropTarget, NgxLowcodeNodeSchema, NgxLowcodeRuntimeContext } from 'ngx-lowcode-core-types';

@Component({
  selector: 'ngx-lowcode-node-renderer',
  standalone: true,
  imports: [CommonModule, NgComponentOutlet],
  templateUrl: './ngx-lowcode-node-renderer.component.html',
  styleUrl: './ngx-lowcode-node-renderer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NgxLowcodeNodeRendererComponent {
  private readonly registry = inject(NgxLowcodeMaterialRegistry);

  readonly node = input.required<NgxLowcodeNodeSchema>();
  readonly parentId = input<string | null>(null);
  readonly slot = input<string | null>(null);
  readonly siblingIndex = input(0);
  readonly runtime = input.required<NgxLowcodeRuntimeContext>();
  readonly paletteDragging = input(false);
  readonly hoveredDropTarget = input<NgxLowcodeDropTarget | null>(null);
  readonly dropTargetChange = output<NgxLowcodeDropTarget | null>();

  readonly definition = computed(() => this.registry.get(this.node().componentType));
  readonly isDesignMode = computed(() => this.runtime().mode === 'design');
  readonly isSelected = computed(() => this.runtime().selection() === this.node().id);
  readonly canAcceptDrop = computed(() => Boolean(this.definition()?.canHaveChildren));
  readonly isDraggingNode = computed(() => this.runtime().draggingNode?.() === this.node().id);
  readonly isDropTarget = computed(() => this.hoveredDropTarget()?.parentId === this.node().id);
  readonly dropHintLabel = computed(() => {
    return 'Drop Here';
  });

  selectNode(event: MouseEvent): void {
    if (!this.isDesignMode()) {
      return;
    }
    event.stopPropagation();
    this.runtime().setSelection(this.node().id);
  }

  handlePointerMove(): void {
    if (!this.paletteDragging() || !this.isDesignMode() || !this.canAcceptDrop()) {
      return;
    }
    this.dropTargetChange.emit({
      parentId: this.node().id,
      slot: null,
      insertionIndex: null
    });
  }

  handleMouseLeave(): void {
    if (!this.paletteDragging() || !this.isDesignMode() || !this.canAcceptDrop()) {
      return;
    }
    if (this.isDropTarget()) {
      this.dropTargetChange.emit(null);
    }
  }

  requestDelete(event: MouseEvent): void {
    event.stopPropagation();
    this.runtime().requestNodeDelete?.(this.node().id);
  }
}
