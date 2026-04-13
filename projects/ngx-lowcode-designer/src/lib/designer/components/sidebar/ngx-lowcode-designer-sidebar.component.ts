import { CdkDragEnd, CdkDragStart, DragDropModule } from '@angular/cdk/drag-drop';

import { ChangeDetectionStrategy, Component, OnChanges, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxLowcodeComponentDefinition, NgxLowcodeNodeSchema, NgxLowcodePageSchema } from 'ngx-lowcode-core-types';
import { getMaterialsI18n, NgxLowcodeDesignerI18n, NgxLowcodeLocale } from 'ngx-lowcode-i18n';
import { ThyButtonModule } from 'ngx-tethys/button';
import { ThyInputModule } from 'ngx-tethys/input';
import { ThyTreeEmitEvent, ThyTreeModule, ThyTreeNodeData } from 'ngx-tethys/tree';
import { resolveLowcodeMaterialIcon } from '../../../core';

@Component({
  selector: 'ngx-lowcode-designer-sidebar',
  imports: [DragDropModule, FormsModule, ThyButtonModule, ThyInputModule, ThyTreeModule],
  templateUrl: './ngx-lowcode-designer-sidebar.component.html',
  styleUrl: './ngx-lowcode-designer-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NgxLowcodeDesignerSidebarComponent implements OnChanges {
  readonly collapsed = input(false);
  readonly locale = input<NgxLowcodeLocale>('zh-CN');
  readonly t = input.required<NgxLowcodeDesignerI18n>();
  readonly availableMaterials = input<NgxLowcodeComponentDefinition[]>([]);
  readonly editorSchema = input.required<NgxLowcodePageSchema>();
  readonly selectedNodeId = input<string | null>(null);
  readonly paletteDropListId = input.required<string>();
  readonly stageDropListId = input.required<string>();

  readonly toggleCollapse = output<void>();
  readonly materialAdd = output<string>();
  readonly paletteDragStateChange = output<boolean>();
  readonly nodeSelect = output<string>();
  readonly nodeRename = output<{ nodeId: string; name: string }>();

  readonly editingOutlineNodeId = signal<string | null>(null);
  readonly outlineNameDraft = signal('');
  readonly expandedOutlineNodeIds = signal<string[]>([]);
  readonly knownOutlineNodeIds = signal<string[]>([]);
  readonly groupedMaterials = computed<Array<{ category: string; items: NgxLowcodeComponentDefinition[] }>>(() =>
    this.groupMaterials(this.availableMaterials())
  );
  readonly outlineTreeNodes = computed<ThyTreeNodeData[]>(() =>
    this.editorSchema().layoutTree.map((node) => this.mapOutlineNode(node))
  );
  readonly selectedOutlineKeys = computed(() => {
    const nodeId = this.selectedNodeId();
    return nodeId ? [nodeId] : [];
  });
  protected readonly buttonKind: any = 'default';
  protected readonly materialsI18n = computed(() => getMaterialsI18n(this.locale()));
  private suppressNextPaletteClick = false;
  private isPaletteDragging = false;

  ngOnChanges(): void {
    this.syncExpandedOutlineNodeIds();
  }

  handleMaterialClick(materialType: string): void {
    if (this.isPaletteDragging || this.suppressNextPaletteClick) {
      this.suppressNextPaletteClick = false;
      return;
    }
    this.materialAdd.emit(materialType);
  }

  handlePaletteDragStarted(_event: CdkDragStart<string>): void {
    this.isPaletteDragging = true;
    this.paletteDragStateChange.emit(true);
  }

  handlePaletteDragEnded(_event: CdkDragEnd<string>): void {
    this.isPaletteDragging = false;
    this.paletteDragStateChange.emit(false);
    this.suppressNextPaletteClick = true;
    queueMicrotask(() => {
      this.suppressNextPaletteClick = false;
    });
  }

  selectNode(nodeId: string): void {
    if (this.editingOutlineNodeId() && this.editingOutlineNodeId() !== nodeId) {
      this.cancelOutlineRename();
    }
    this.nodeSelect.emit(nodeId);
  }

  startOutlineRename(node: NgxLowcodeNodeSchema): void {
    this.selectNode(node.id);
    this.editingOutlineNodeId.set(node.id);
    this.outlineNameDraft.set(node.name ?? '');
  }

  commitOutlineRename(nodeId: string): void {
    this.nodeRename.emit({
      nodeId,
      name: this.outlineNameDraft()
    });
    this.cancelOutlineRename();
  }

  cancelOutlineRename(): void {
    this.editingOutlineNodeId.set(null);
    this.outlineNameDraft.set('');
  }

  handleOutlineClick(event: ThyTreeEmitEvent<NgxLowcodeNodeSchema>): void {
    const nodeId = this.extractOutlineNodeId(event);
    if (nodeId) {
      this.selectNode(nodeId);
    }
  }

  handleOutlineDoubleClick(event: ThyTreeEmitEvent<NgxLowcodeNodeSchema>): void {
    const node = event.node?.origin?.origin as NgxLowcodeNodeSchema | undefined;
    if (node) {
      this.startOutlineRename(node);
    }
  }

  handleOutlineExpandChange(event: ThyTreeEmitEvent<NgxLowcodeNodeSchema>): void {
    const nodeId = this.extractOutlineNodeId(event);
    if (!nodeId) {
      return;
    }
    const next = new Set(this.expandedOutlineNodeIds());
    if (event.node?.isExpanded) {
      next.add(nodeId);
    } else {
      next.delete(nodeId);
    }
    this.expandedOutlineNodeIds.set([...next]);
  }

  nodeDisplayName(node: NgxLowcodeNodeSchema): string {
    if (typeof node.name === 'string' && node.name.trim()) {
      return node.name.trim();
    }

    for (const key of ['title', 'label', 'text', 'placeholder', 'stateKey']) {
      const value = node.props[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return node.id;
  }

  materialIcon(material: NgxLowcodeComponentDefinition): string {
    return material.icon ?? resolveLowcodeMaterialIcon(material.type);
  }

  nodeTypeIcon(node: NgxLowcodeNodeSchema): string {
    return resolveLowcodeMaterialIcon(node.componentType);
  }

  materialDescription(material: NgxLowcodeComponentDefinition): string {
    return this.materialsI18n().descriptions[material.type] ?? material.category;
  }

  private mapOutlineNode(node: NgxLowcodeNodeSchema): ThyTreeNodeData<NgxLowcodeNodeSchema> {
    return {
      key: node.id,
      title: this.nodeDisplayName(node),
      origin: node,
      expanded: this.expandedOutlineNodeIds().includes(node.id),
      children: (node.children ?? []).map((child) => this.mapOutlineNode(child))
    };
  }

  private extractOutlineNodeId(event: ThyTreeEmitEvent<NgxLowcodeNodeSchema>): string | null {
    const origin = event.node?.origin?.origin as NgxLowcodeNodeSchema | undefined;
    return origin?.id ?? null;
  }

  private groupMaterials(
    materials: NgxLowcodeComponentDefinition[]
  ): Array<{ category: string; items: NgxLowcodeComponentDefinition[] }> {
    const categoryOrder = [
      this.materialsI18n().categories.common,
      this.materialsI18n().categories.layout,
      this.materialsI18n().categories.navigation,
      this.materialsI18n().categories.dataEntry,
      this.materialsI18n().categories.dataDisplay,
      this.materialsI18n().categories.feedback,
      this.materialsI18n().categories.other
    ];
    const groups = new Map<string, NgxLowcodeComponentDefinition[]>();
    for (const material of materials) {
      const category = material.category || this.materialsI18n().categories.other;
      groups.set(category, [...(groups.get(category) ?? []), material]);
    }
    return [...groups.entries()]
      .sort((a, b) => categoryOrder.indexOf(a[0]) - categoryOrder.indexOf(b[0]))
      .map(([category, items]) => ({ category, items }));
  }

  private syncExpandedOutlineNodeIds(): void {
    const outlineNodeIds = this.collectOutlineNodeIds(this.editorSchema().layoutTree);
    const knownIds = new Set(this.knownOutlineNodeIds());
    if (!this.expandedOutlineNodeIds().length) {
      this.expandedOutlineNodeIds.set(outlineNodeIds);
    } else {
      const nextExpanded = new Set(this.expandedOutlineNodeIds().filter((id) => outlineNodeIds.includes(id)));
      for (const nodeId of outlineNodeIds) {
        if (!knownIds.has(nodeId)) {
          nextExpanded.add(nodeId);
        }
      }
      this.expandedOutlineNodeIds.set([...nextExpanded]);
    }
    this.knownOutlineNodeIds.set(outlineNodeIds);
  }

  private collectOutlineNodeIds(nodes: NgxLowcodeNodeSchema[]): string[] {
    const ids: string[] = [];
    const visit = (node: NgxLowcodeNodeSchema) => {
      ids.push(node.id);
      for (const child of node.children ?? []) {
        visit(child);
      }
    };

    for (const node of nodes) {
      visit(node);
    }

    return ids;
  }
}
