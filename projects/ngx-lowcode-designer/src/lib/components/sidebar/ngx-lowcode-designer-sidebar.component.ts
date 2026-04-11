import { CdkDragEnd, CdkDragStart, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxLowcodeComponentDefinition, NgxLowcodeNodeSchema, NgxLowcodePageSchema } from 'ngx-lowcode-core-types';
import { NgxLowcodeDesignerI18n } from 'ngx-lowcode-i18n';
import { ThyButtonModule } from 'ngx-tethys/button';
import { ThyInputModule } from 'ngx-tethys/input';

@Component({
  selector: 'ngx-lowcode-designer-sidebar',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule, ThyButtonModule, ThyInputModule],
  templateUrl: './ngx-lowcode-designer-sidebar.component.html',
  styleUrl: './ngx-lowcode-designer-sidebar.component.scss'
})
export class NgxLowcodeDesignerSidebarComponent {
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
  protected readonly buttonKind: any = 'default';
  private suppressNextPaletteClick = false;
  private isPaletteDragging = false;

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

  nodeDisplayName(node: NgxLowcodeNodeSchema): string {
    if (typeof node.name === 'string' && node.name.trim()) {
      return node.name.trim();
    }

    for (const key of ['title', 'label', 'text', 'placeholder', 'stateKey']) {
      const value = node.props[key];
      if (typeof value === 'string' && value.trim()) {
        return `${node.componentType} · ${value.trim()}`;
      }
    }

    return `${node.componentType} · ${node.id}`;
  }
}
