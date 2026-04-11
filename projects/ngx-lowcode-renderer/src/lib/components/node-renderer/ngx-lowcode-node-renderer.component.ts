import { CommonModule, NgComponentOutlet } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { NgxLowcodeMaterialRegistry } from 'ngx-lowcode-core';
import { NgxLowcodeDropTarget, NgxLowcodeNodeSchema, NgxLowcodeRuntimeContext } from 'ngx-lowcode-core-types';

@Component({
  selector: 'ngx-lowcode-node-renderer',
  standalone: true,
  imports: [CommonModule, NgComponentOutlet],
  templateUrl: './ngx-lowcode-node-renderer.component.html',
  styleUrl: './ngx-lowcode-node-renderer.component.scss'
})
export class NgxLowcodeNodeRendererComponent {
  private readonly registry = inject(NgxLowcodeMaterialRegistry);

  readonly node = input.required<NgxLowcodeNodeSchema>();
  readonly runtime = input.required<NgxLowcodeRuntimeContext>();
  readonly paletteDragging = input(false);
  readonly hoveredDropTarget = input<NgxLowcodeDropTarget | null>(null);
  readonly dropTargetChange = output<NgxLowcodeDropTarget | null>();

  readonly definition = computed(() => this.registry.get(this.node().componentType));
  readonly isDesignMode = computed(() => this.runtime().mode === 'design');
  readonly isSelected = computed(() => this.runtime().selection() === this.node().id);
  readonly canAcceptDrop = computed(() => Boolean(this.definition()?.canHaveChildren));
  readonly isDropTarget = computed(() => this.hoveredDropTarget()?.parentId === this.node().id);
  readonly dropHintLabel = computed(() => {
    const slot = this.hoveredDropTarget()?.slot;
    return slot ? `Drop ${slot}` : 'Drop Here';
  });

  selectNode(event: MouseEvent): void {
    if (!this.isDesignMode()) {
      return;
    }
    event.stopPropagation();
    this.runtime().setSelection(this.node().id);
  }

  handlePointerMove(event: MouseEvent): void {
    if (!this.paletteDragging() || !this.isDesignMode() || !this.canAcceptDrop()) {
      return;
    }

    const slot = this.resolveSlot(event);
    this.dropTargetChange.emit({
      parentId: this.node().id,
      slot
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

  private resolveSlot(event: MouseEvent): string | null {
    if (this.node().componentType !== 'section') {
      return null;
    }

    const layout = String(this.node().props['layout'] ?? 'stack');
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const relativeX = event.clientX - rect.left;
    const ratio = rect.width > 0 ? relativeX / rect.width : 0;

    if (layout === 'two-column') {
      return ratio < 0.5 ? 'col-1' : 'col-2';
    }

    if (layout === 'three-column') {
      if (ratio < 1 / 3) {
        return 'col-1';
      }
      if (ratio < 2 / 3) {
        return 'col-2';
      }
      return 'col-3';
    }

    return null;
  }
}
