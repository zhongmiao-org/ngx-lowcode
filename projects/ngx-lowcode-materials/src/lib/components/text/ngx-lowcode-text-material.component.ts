import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { NgxLowcodeNodeSchema, NgxLowcodeRuntimeContext } from 'ngx-lowcode-core-types';
import { interpolateTemplate } from '../../utils/template.utils';

@Component({
  selector: 'ngx-lowcode-text-material',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ngx-lowcode-text-material.component.html',
  styleUrl: './ngx-lowcode-text-material.component.scss'
})
export class NgxLowcodeTextMaterialComponent {
  readonly node = input.required<NgxLowcodeNodeSchema>();
  readonly runtime = input.required<NgxLowcodeRuntimeContext>();

  readonly content = computed(() => interpolateTemplate(String(this.node().props['text'] ?? ''), this.runtime()));
}
