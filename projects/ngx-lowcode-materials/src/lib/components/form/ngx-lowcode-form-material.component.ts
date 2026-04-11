import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { NgxLowcodeNodeSchema, NgxLowcodeRuntimeContext } from 'ngx-lowcode-core-types';
import { NgxLowcodeRenderChildrenComponent } from 'ngx-lowcode-renderer';

@Component({
  selector: 'ngx-lowcode-form-material',
  standalone: true,
  imports: [CommonModule, NgxLowcodeRenderChildrenComponent],
  templateUrl: './ngx-lowcode-form-material.component.html',
  styleUrl: './ngx-lowcode-form-material.component.scss'
})
export class NgxLowcodeFormMaterialComponent {
  readonly node = input.required<NgxLowcodeNodeSchema>();
  readonly runtime = input.required<NgxLowcodeRuntimeContext>();

  readonly title = computed(() => String(this.node().props['title'] ?? 'Search Form'));
  readonly showEmptyDropzone = computed(() => {
    const dropTarget = this.runtime().dropTarget?.();
    return this.runtime().mode === 'design' && !this.node().children?.length && dropTarget?.parentId === this.node().id;
  });
}
