import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { NgxLowcodeNodeSchema, NgxLowcodeRuntimeContext } from 'ngx-lowcode-core-types';
import { NgxLowcodeRenderChildrenComponent } from 'ngx-lowcode-renderer';

@Component({
  selector: 'ngx-lowcode-section-material',
  standalone: true,
  imports: [CommonModule, NgxLowcodeRenderChildrenComponent],
  templateUrl: './ngx-lowcode-section-material.component.html',
  styleUrl: './ngx-lowcode-section-material.component.scss'
})
export class NgxLowcodeSectionMaterialComponent {
  readonly node = input.required<NgxLowcodeNodeSchema>();
  readonly runtime = input.required<NgxLowcodeRuntimeContext>();

  readonly title = computed(() => String(this.node().props['title'] ?? 'Section'));
  readonly layout = computed(() => String(this.node().props['layout'] ?? 'stack'));
  readonly minHeight = computed(() => Number(this.node().props['minHeight'] ?? 240));
  readonly height = computed(() => {
    const value = this.node().props['height'];
    return value === undefined || value === null || value === '' ? null : `${Number(value)}px`;
  });
  readonly padding = computed(() => Number(this.node().props['padding'] ?? 16));
  readonly gap = computed(() => Number(this.node().props['gap'] ?? 16));
  readonly activeDropSlot = computed(() => {
    const dropTarget = this.runtime().dropTarget?.();
    if (dropTarget?.parentId !== this.node().id) {
      return null;
    }
    return dropTarget.slot ?? null;
  });
  readonly sectionStyle = computed<Record<string, string | number>>(() => ({
    ...(this.node().style ?? {}),
    minHeight: `${this.minHeight()}px`,
    height: this.height() ?? 'auto',
    padding: `${this.padding()}px`,
    overflow: 'visible'
  }));
  readonly bodyStyle = computed<Record<string, string | number>>(() => ({
    minHeight: `${Math.max(this.minHeight() - 64, 80)}px`,
    display: this.layout() === 'stack' ? 'block' : 'grid',
    gridTemplateColumns: this.resolveGridTemplateColumns(),
    gap: `${this.gap()}px`,
    overflow: 'visible'
  }));
  readonly distributedChildren = computed(() => {
    const children = this.node().children ?? [];
    const columnCount = this.resolveColumnCount();
    const slotOrder = Array.from({ length: columnCount }, (_, index: number) => `col-${index + 1}`);

    if (columnCount === 1) {
      return [children];
    }

    const hasExplicitSlots = children.some((child: NgxLowcodeNodeSchema) => Boolean(child.slot));
    if (hasExplicitSlots) {
      return slotOrder.map((slot) => children.filter((child: NgxLowcodeNodeSchema) => (child.slot ?? 'col-1') === slot));
    }

    return slotOrder.map((_, columnIndex: number) =>
      children.filter((_: NgxLowcodeNodeSchema, childIndex: number) => childIndex % columnCount === columnIndex)
    );
  });

  columnSlotName(index: number): string | null {
    return this.resolveColumnCount() > 1 ? `col-${index + 1}` : null;
  }

  columnPlaceholderLabel(index: number): string {
    const slot = this.columnSlotName(index);
    if (!slot) {
      return 'Drop components into this section';
    }
    return `Drop into ${slot.toUpperCase()}`;
  }

  showColumnDropPlaceholder(column: NgxLowcodeNodeSchema[], index: number): boolean {
    if (this.runtime().mode !== 'design') {
      return false;
    }
    const slot = this.columnSlotName(index);
    if (this.activeDropSlot() !== slot) {
      return false;
    }
    return !column.length || this.resolveColumnCount() > 1;
  }

  private resolveColumnCount(): number {
    if (this.layout() === 'two-column') {
      return 2;
    }
    if (this.layout() === 'three-column') {
      return 3;
    }
    return 1;
  }

  private resolveGridTemplateColumns(): string {
    if (this.layout() === 'two-column') {
      return 'repeat(2, minmax(0, 1fr))';
    }
    if (this.layout() === 'three-column') {
      return 'repeat(3, minmax(0, 1fr))';
    }
    return '1fr';
  }
}
