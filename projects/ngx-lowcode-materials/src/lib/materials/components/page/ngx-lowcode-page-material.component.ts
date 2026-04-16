import { CdkDragDrop, CdkDragEnter, CdkDragExit, DragDropModule } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import {
  NgxLowcodeDropTarget,
  NgxLowcodeNodeSchema,
  NgxLowcodeRuntimeContext
} from '@zhongmiao/ngx-lowcode-core-types';
import { NgxLowcodeNodeRendererComponent } from '@zhongmiao/ngx-lowcode-renderer';
import { ThyGridModule } from 'ngx-tethys/grid';

type ThyFlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';
type ThyFlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse';
type ThyFlexJustifyContent =
  | 'start'
  | 'end'
  | 'flex-start'
  | 'flex-end'
  | 'center'
  | 'space-between'
  | 'space-around'
  | 'initial'
  | 'inherit';
type ThyFlexAlignItems =
  | 'start'
  | 'end'
  | 'stretch'
  | 'center'
  | 'flex-start'
  | 'flex-end'
  | 'baseline'
  | 'initial'
  | 'inherit';
type ThyFlexAlignSelf = 'auto' | 'stretch' | 'center' | 'baseline' | 'flex-start' | 'flex-end';
type DropListOrientation = 'horizontal' | 'vertical' | 'mixed';

@Component({
  selector: 'ngx-lowcode-page-material',
  imports: [DragDropModule, NgxLowcodeNodeRendererComponent, ThyGridModule],
  templateUrl: './ngx-lowcode-page-material.component.html',
  styleUrl: './ngx-lowcode-page-material.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NgxLowcodePageMaterialComponent {
  readonly suppressedDragNodeId = signal<string | null>(null);
  readonly isDesignMode = computed(() => this.runtime().mode === 'design');

  readonly node = input.required<NgxLowcodeNodeSchema>();
  readonly runtime = input.required<NgxLowcodeRuntimeContext>();

  readonly title = computed(() => String(this.node().props['title'] ?? 'Page'));
  readonly description = computed(() => String(this.node().props['description'] ?? ''));
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
    return [
      'start',
      'end',
      'flex-start',
      'flex-end',
      'center',
      'space-between',
      'space-around',
      'initial',
      'inherit'
    ].includes(value)
      ? (value as ThyFlexJustifyContent)
      : 'start';
  });
  readonly thyAlignItems = computed<ThyFlexAlignItems>(() => {
    const value = String(this.node().props['thyAlignItems'] ?? 'stretch');
    return ['start', 'end', 'stretch', 'center', 'flex-start', 'flex-end', 'baseline', 'initial', 'inherit'].includes(
      value
    )
      ? (value as ThyFlexAlignItems)
      : 'stretch';
  });
  readonly minHeight = computed(() => Number(this.node().props['minHeight'] ?? 240));
  readonly childFlowOrientation = computed<'vertical' | 'horizontal'>(() => {
    const direction = this.thyDirection();
    return direction === 'column' || direction === 'column-reverse' ? 'vertical' : 'horizontal';
  });
  readonly height = computed(() => {
    const value = this.node().props['height'];
    return value === undefined || value === null || value === '' ? null : `${Number(value)}px`;
  });
  readonly padding = computed(() => Number(this.node().props['padding'] ?? 0));
  readonly pageBodyStyle = computed<Record<string, string | number>>(() => ({
    minHeight: `${this.minHeight()}px`,
    height: this.height() ?? 'auto',
    padding: `${this.padding()}px`
  }));
  readonly designContainerStyle = computed<Record<string, string | number>>(() => {
    const style: Record<string, string | number> = {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      alignItems: 'stretch',
      gap: '0px'
    };
    style['flexDirection'] = this.mapCssFlexDirection(this.thyDirection());
    style['flexWrap'] = this.thyWrap();
    style['justifyContent'] = this.mapCssMainAxis(this.thyJustifyContent());
    style['alignItems'] = this.mapCssCrossAxis(this.thyAlignItems());
    style['gap'] = `${this.coerceNumericGap(this.thyGap())}px`;
    return style;
  });
  readonly dropListData = computed(() => ({
    parentId: this.node().id,
    slot: null,
    nodes: this.node().children ?? []
  }));
  readonly designDropListOrientation = computed<DropListOrientation>(() => {
    return this.thyDirection() === 'column' || this.thyDirection() === 'column-reverse' ? 'vertical' : 'mixed';
  });
  handleDrop(
    event: CdkDragDrop<{ parentId: string | null; slot: string | null; nodes: NgxLowcodeNodeSchema[] }, any, any>
  ): void {
    const target = this.createDropTarget(event.currentIndex);
    const data = event.item.data;
    console.debug('[lowcode:dnd:page:drop]', {
      pageId: this.node().id,
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

  logDropListEntered(
    event: CdkDragEnter<{ parentId: string | null; slot: string | null; nodes: NgxLowcodeNodeSchema[] }>
  ): void {
    console.debug('[lowcode:dnd:page:entered]', {
      pageId: this.node().id,
      dragData: event.item.data,
      containerParentId: event.container.data?.parentId ?? null
    });
  }

  logDropListExited(
    event: CdkDragExit<{ parentId: string | null; slot: string | null; nodes: NgxLowcodeNodeSchema[] }>
  ): void {
    console.debug('[lowcode:dnd:page:exited]', {
      pageId: this.node().id,
      dragData: event.item.data,
      containerParentId: event.container.data?.parentId ?? null
    });
  }

  handleDragStart(nodeId: string): void {
    this.suppressedDragNodeId.set(null);
    console.debug('[lowcode:dnd:page:start]', {
      pageId: this.node().id,
      nodeId
    });
    this.runtime().setDraggingNode?.(nodeId);
  }

  handleDragEnd(): void {
    this.suppressedDragNodeId.set(null);
    console.debug('[lowcode:dnd:page:end]', {
      pageId: this.node().id,
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

  designItemStyle(child: NgxLowcodeNodeSchema): Record<string, string | number> {
    const flexItem = this.resolveFlexItem(child);
    if (this.isSectionNode(child)) {
      return {
        minWidth: '0',
        flex: '0 0 100%',
        maxWidth: '100%',
        marginLeft: '0px',
        order: flexItem.order,
        alignSelf: flexItem.alignSelf
      };
    }

    return {
      minWidth: '0',
      flexGrow: flexItem.grow,
      flexShrink: flexItem.shrink,
      flexBasis: flexItem.basis,
      order: flexItem.order,
      alignSelf: flexItem.alignSelf
    };
  }

  private layoutValue(key: string, fallback: string | number): string | number {
    const value = this.node().props[key];
    return typeof value === 'number' || typeof value === 'string' ? value : fallback;
  }

  private createDropTarget(insertionIndex: number | null | undefined): NgxLowcodeDropTarget {
    return {
      parentId: this.node().id,
      slot: null,
      insertionIndex: insertionIndex ?? (this.node().children ?? []).length,
      position: 'inside'
    };
  }

  resolveFlexItem(node: NgxLowcodeNodeSchema): {
    grow: 0 | 1;
    shrink: 0 | 1;
    basis: string;
    order: number;
    alignSelf: ThyFlexAlignSelf;
  } {
    if (this.isSectionNode(node)) {
      return {
        grow: 0,
        shrink: 0,
        basis: '100%',
        order: 0,
        alignSelf: 'stretch'
      };
    }
    const basis = String(node.props['thyBasis'] ?? 'auto');
    const grow = String(node.props['thyGrow'] ?? '0') === '1' ? 1 : 0;
    const shrink = String(node.props['thyShrink'] ?? '1') === '0' ? 0 : 1;
    const orderValue = node.props['thyOrder'];
    const order = typeof orderValue === 'number' ? orderValue : Number(orderValue ?? 0);
    const alignSelfValue = String(node.props['thyAlignSelf'] ?? 'auto');
    const alignSelf: ThyFlexAlignSelf = ['auto', 'stretch', 'center', 'baseline', 'flex-start', 'flex-end'].includes(
      alignSelfValue
    )
      ? (alignSelfValue as ThyFlexAlignSelf)
      : 'auto';

    return {
      grow,
      shrink,
      basis,
      order: Number.isFinite(order) ? order : 0,
      alignSelf
    };
  }

  private resolveOwnerNodeId(event: PointerEvent): string | null {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return null;
    }
    return target.closest<HTMLElement>('[data-node-id]')?.dataset['nodeId'] ?? null;
  }

  private isSectionNode(node: NgxLowcodeNodeSchema | null | undefined): boolean {
    return node?.componentType === 'section';
  }

  private mapCssFlexDirection(direction: ThyFlexDirection): string {
    return direction;
  }

  private mapCssMainAxis(value: ThyFlexJustifyContent): string {
    if (value === 'start') {
      return 'flex-start';
    }
    if (value === 'end') {
      return 'flex-end';
    }
    return value;
  }

  private mapCssCrossAxis(value: ThyFlexAlignItems): string {
    if (value === 'start') {
      return 'flex-start';
    }
    if (value === 'end') {
      return 'flex-end';
    }
    return value;
  }
}
