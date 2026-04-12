import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgxLowcodeNodeSchema, NgxLowcodeRuntimeContext } from 'ngx-lowcode-core-types';
import { NgxLowcodeNodeRendererComponent } from 'ngx-lowcode-renderer';
import { ThyGridModule } from 'ngx-tethys/grid';

type ThyResponsiveMode = 'none' | 'self' | 'screen';
type ThyFlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';
type ThyFlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse';
type ThyFlexJustifyContent = 'start' | 'end' | 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'initial' | 'inherit';
type ThyFlexAlignItems = 'start' | 'end' | 'stretch' | 'center' | 'flex-start' | 'flex-end' | 'baseline' | 'initial' | 'inherit';

@Component({
  selector: 'ngx-lowcode-section-material',
  standalone: true,
  imports: [CommonModule, DragDropModule, NgxLowcodeNodeRendererComponent, ThyGridModule],
  templateUrl: './ngx-lowcode-section-material.component.html',
  styleUrl: './ngx-lowcode-section-material.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NgxLowcodeSectionMaterialComponent {
  readonly node = input.required<NgxLowcodeNodeSchema>();
  readonly runtime = input.required<NgxLowcodeRuntimeContext>();

  readonly title = computed(() => String(this.node().props['title'] ?? 'Section'));
  readonly layoutMode = computed<'grid' | 'flex-grid' | 'flex'>(() => {
    const value = String(this.node().props['layoutMode'] ?? 'grid');
    return value === 'flex-grid' || value === 'flex' || value === 'grid' ? value : 'grid';
  });
  readonly thyResponsive = computed<ThyResponsiveMode>(() => {
    const value = String(this.node().props['thyResponsive'] ?? this.node().props['responsiveMode'] ?? 'screen');
    return value === 'none' || value === 'self' || value === 'screen' ? value : 'screen';
  });
  readonly thyCols = computed<string | number>(() => this.layoutValue('thyCols', 24));
  readonly thyXGap = computed<string | number>(() => this.layoutValue('thyXGap', 0));
  readonly thyYGap = computed<string | number>(() => this.layoutValue('thyYGap', 0));
  readonly thyGap = computed<string | number>(() => this.layoutValue('thyGap', 16));
  readonly thyDirection = computed<ThyFlexDirection>(() => {
    const value = String(this.node().props['thyDirection'] ?? 'row');
    return value === 'column' || value === 'row-reverse' || value === 'column-reverse' ? value : 'row';
  });
  readonly thyWrap = computed<ThyFlexWrap>(() => {
    const value = String(this.node().props['thyWrap'] ?? 'wrap');
    return value === 'nowrap' || value === 'wrap-reverse' ? value : 'wrap';
  });
  readonly thyJustifyContent = computed<ThyFlexJustifyContent>(() => {
    const value = String(this.node().props['thyJustifyContent'] ?? 'start');
    return ['start', 'end', 'flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'initial', 'inherit'].includes(value)
      ? (value as ThyFlexJustifyContent)
      : 'start';
  });
  readonly thyAlignItems = computed<ThyFlexAlignItems>(() => {
    const value = String(this.node().props['thyAlignItems'] ?? 'stretch');
    return ['start', 'end', 'stretch', 'center', 'flex-start', 'flex-end', 'baseline', 'initial', 'inherit'].includes(value)
      ? (value as ThyFlexAlignItems)
      : 'stretch';
  });
  readonly minHeight = computed(() => Number(this.node().props['minHeight'] ?? 240));
  readonly height = computed(() => {
    const value = this.node().props['height'];
    return value === undefined || value === null || value === '' ? null : `${Number(value)}px`;
  });
  readonly padding = computed(() => Number(this.node().props['padding'] ?? 16));
  readonly activeDropIndex = computed(() => {
    const dropTarget = this.runtime().dropTarget?.();
    if (dropTarget?.parentId !== this.node().id) {
      return null;
    }
    return dropTarget.insertionIndex ?? null;
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
    overflow: 'visible'
  }));
  readonly renderedChildren = computed(() =>
    (this.node().children ?? []).map((child) => ({
      child,
      span: this.resolveChildSpan(child),
      offset: this.resolveChildOffset(child),
      flexItem: this.resolveFlexItem(child)
    }))
  );
  readonly dropListData = computed(() => ({
    parentId: this.node().id,
    slot: null,
    nodes: this.node().children ?? []
  }));
  readonly showDropPlaceholder = computed(() => this.runtime().mode === 'design' && (this.node().children ?? []).length === 0);

  trackChild(index: number, item: { child: NgxLowcodeNodeSchema }): string {
    return item.child.id;
  }

  handleDrop(event: CdkDragDrop<{ parentId: string | null; slot: string | null; nodes: NgxLowcodeNodeSchema[] }, any, any>): void {
    const nodeId = event.item.data?.id;
    if (!nodeId) {
      return;
    }
    if (event.previousContainer === event.container && event.previousIndex === event.currentIndex) {
      return;
    }
    this.runtime().requestNodeMove?.(nodeId, {
      parentId: this.node().id,
      slot: null,
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

  coerceNumericSpan(value: string | number): number {
    if (typeof value === 'number') {
      return value;
    }
    const match = String(value).match(/^\s*(\d+)/);
    return match ? Number(match[1]) : 24;
  }

  coerceNumericGap(value: string | number): number {
    if (typeof value === 'number') {
      return value;
    }
    const match = String(value).match(/^\s*(\d+)/);
    return match ? Number(match[1]) : 0;
  }

  private layoutValue(key: string, fallback: string | number): string | number {
    const value = this.node().props[key];
    if (typeof value === 'number' || typeof value === 'string') {
      return value;
    }
    if (key === 'thyGap') {
      const legacyGap = this.node().props['gap'];
      if (typeof legacyGap === 'number' || typeof legacyGap === 'string') {
        return legacyGap;
      }
    }
    return fallback;
  }

  private resolveChildSpan(node: NgxLowcodeNodeSchema): string | number {
    const explicit = node.props['thySpan'];
    if (typeof explicit === 'number' || typeof explicit === 'string') {
      return explicit;
    }
    const legacy = node.props['gridSpan'];
    if (typeof legacy === 'number' || typeof legacy === 'string') {
      return legacy;
    }
    const legacyPreset = String(this.node().props['gridPreset'] ?? '');
    if (legacyPreset === 'thirds') {
      return '24 md:8';
    }
    if (legacyPreset === 'sidebar-left') {
      return '24 lg:8';
    }
    if (legacyPreset === 'sidebar-right') {
      return '24 lg:16';
    }
    if (legacyPreset === 'quarters') {
      return '24 sm:12 lg:6';
    }
    if (legacyPreset === 'halves') {
      return '24 md:12';
    }
    return this.layoutMode() === 'grid' ? '24' : 24;
  }

  private resolveChildOffset(node: NgxLowcodeNodeSchema): string | number {
    const value = node.props['thyOffset'];
    if (typeof value === 'number' || typeof value === 'string') {
      return value;
    }
    return 0;
  }

  private resolveFlexItem(node: NgxLowcodeNodeSchema): { grow: 0 | 1; shrink: 0 | 1; basis: string } {
    const basis = String(node.props['thyBasis'] ?? 'auto');
    const grow = String(node.props['thyGrow'] ?? '0') === '1' ? 1 : 0;
    const shrink = String(node.props['thyShrink'] ?? '1') === '0' ? 0 : 1;
    return { grow, shrink, basis };
  }
}
