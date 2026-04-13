import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { NgxLowcodeMaterialRegistry } from 'ngx-lowcode-core';
import { NgxLowcodeDropTarget, NgxLowcodeNodeSchema, NgxLowcodeRuntimeContext } from 'ngx-lowcode-core-types';

@Component({
  selector: 'ngx-lowcode-node-renderer',
  imports: [NgComponentOutlet],
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
  readonly parentOrientation = input<'vertical' | 'horizontal'>('vertical');
  readonly disableSiblingHotspots = input(false);
  readonly runtime = input.required<NgxLowcodeRuntimeContext>();
  readonly paletteDragging = input(false);
  readonly hoveredDropTarget = input<NgxLowcodeDropTarget | null>(null);
  readonly dropTargetChange = output<NgxLowcodeDropTarget | null>();

  readonly definition = computed(() => this.registry.get(this.node().componentType));
  readonly isDesignMode = computed(() => this.runtime().mode === 'design');
  readonly isSelected = computed(() => this.runtime().selection() === this.node().id);
  readonly isDraggingNode = computed(() => this.runtime().draggingNode?.() === this.node().id);
  readonly activeDropTarget = computed(() => this.runtime().dropTarget?.() ?? this.hoveredDropTarget());

  selectNode(event: MouseEvent): void {
    if (!this.isDesignMode()) {
      return;
    }
    event.stopPropagation();
    this.runtime().setSelection(this.node().id);
  }

  handleBeforePointerMove(event: MouseEvent): void {
    if (!this.isDraggingActive() || this.disableSiblingHotspots()) {
      return;
    }
    event.stopPropagation();
    this.emitDropTarget({
      parentId: this.parentId(),
      slot: this.slot(),
      position: 'before',
      targetNodeId: this.node().id
    });
  }

  handleAfterPointerMove(event: MouseEvent): void {
    if (!this.isDraggingActive() || this.disableSiblingHotspots()) {
      return;
    }
    event.stopPropagation();
    this.emitDropTarget({
      parentId: this.parentId(),
      slot: this.slot(),
      position: 'after',
      targetNodeId: this.node().id
    });
  }

  requestDelete(event: MouseEvent): void {
    event.stopPropagation();
    this.runtime().requestNodeDelete?.(this.node().id);
  }

  private isDraggingActive(): boolean {
    return (
      this.isDesignMode() &&
      (this.paletteDragging() ||
        Boolean(this.runtime().paletteDragging?.()) ||
        Boolean(this.runtime().draggingNode?.()))
    );
  }

  private emitDropTarget(target: NgxLowcodeDropTarget): void {
    this.runtime().setDropTarget?.(target);
    this.dropTargetChange.emit(target);
  }
}
