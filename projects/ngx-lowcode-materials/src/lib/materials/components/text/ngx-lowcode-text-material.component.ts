import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { NgxLowcodeNodeSchema, NgxLowcodeRuntimeContext } from 'ngx-lowcode-core-types';
import { interpolateTemplate } from '../../utils/template.util';

@Component({
    selector: 'ngx-lowcode-text-material',
    imports: [CommonModule],
    templateUrl: './ngx-lowcode-text-material.component.html',
    styleUrl: './ngx-lowcode-text-material.component.scss'
})
export class NgxLowcodeTextMaterialComponent {
  readonly node = input.required<NgxLowcodeNodeSchema>();
  readonly runtime = input.required<NgxLowcodeRuntimeContext>();

  readonly content = computed(() => interpolateTemplate(String(this.node().props['text'] ?? ''), this.runtime()));
  readonly href = computed(() => String(this.node().props['href'] ?? '').trim());
  readonly target = computed(() => {
    const value = String(this.node().props['target'] ?? '').trim();
    return value || null;
  });
}
