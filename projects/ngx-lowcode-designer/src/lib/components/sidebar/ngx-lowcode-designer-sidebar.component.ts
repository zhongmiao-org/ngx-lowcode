import { CdkDragEnd, CdkDragStart, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxLowcodeComponentDefinition, NgxLowcodeNodeSchema, NgxLowcodePageSchema } from 'ngx-lowcode-core-types';
import { NgxLowcodeDesignerI18n } from 'ngx-lowcode-i18n';
import { ThyButtonModule } from 'ngx-tethys/button';
import { ThyInputModule } from 'ngx-tethys/input';
import { ThyTreeEmitEvent, ThyTreeModule, ThyTreeNodeData } from 'ngx-tethys/tree';
import { resolveLowcodeMaterialIcon } from '../../common/material-icons';

@Component({
  selector: 'ngx-lowcode-designer-sidebar',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule, ThyButtonModule, ThyInputModule, ThyTreeModule],
  templateUrl: './ngx-lowcode-designer-sidebar.component.html',
  styleUrl: './ngx-lowcode-designer-sidebar.component.scss'
})
export class NgxLowcodeDesignerSidebarComponent {
  private readonly categoryOrder = ['通用', '布局', '导航', '数据录入', '数据展示', '反馈', '其他'] as const;
  readonly collapsed = input(false);
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
  readonly groupedMaterials = signal<Array<{ category: string; items: NgxLowcodeComponentDefinition[] }>>([]);
  readonly outlineTreeNodes = computed<ThyTreeNodeData[]>(() => this.editorSchema().layoutTree.map((node) => this.mapOutlineNode(node)));
  readonly selectedOutlineKeys = computed(() => {
    const nodeId = this.selectedNodeId();
    return nodeId ? [nodeId] : [];
  });
  protected readonly buttonKind: any = 'default';
  private suppressNextPaletteClick = false;
  private isPaletteDragging = false;

  constructor() {
    this.groupedMaterials.set([]);
  }

  ngOnChanges(): void {
    const groups = new Map<string, NgxLowcodeComponentDefinition[]>();
    for (const material of this.availableMaterials()) {
      const category = material.category || '其他';
      groups.set(category, [...(groups.get(category) ?? []), material]);
    }
    const normalized = [...groups.entries()]
      .sort((a, b) => this.categoryOrder.indexOf(a[0] as any) - this.categoryOrder.indexOf(b[0] as any))
      .map(([category, items]) => ({ category, items }));
    this.groupedMaterials.set(normalized);

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
    const descriptionMap: Record<string, string> = {
      page: '页面根容器',
      section: '通用弹性布局容器',
      form: '表单语义容器',
      text: '展示一段文本内容',
      button: '触发动作或提交操作',
      input: '录入单行文本',
      select: '从选项中选择值',
      table: '展示表格数据',
      icon: '展示单个图标',
      divider: '分隔内容区域',
      image: '展示图片内容',
      space: '快速排布间距',
      anchor: '页内锚点导航',
      breadcrumb: '层级路径导航',
      tabs: '分组切换内容',
      menu: '竖向菜单导航',
      'input-number': '录入数值',
      checkbox: '布尔多选项',
      radio: '单选项组',
      switch: '开关状态切换',
      'date-picker': '选择日期',
      upload: '选择并上传文件',
      card: '摘要信息卡片',
      list: '展示列表项',
      tag: '状态标签',
      avatar: '用户头像',
      progress: '进度展示',
      statistic: '关键指标',
      alert: '提示与警告'
    };
    return descriptionMap[material.type] ?? `${material.category} 组件`;
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
