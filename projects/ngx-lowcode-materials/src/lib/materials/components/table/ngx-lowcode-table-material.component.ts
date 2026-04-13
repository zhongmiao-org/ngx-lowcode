import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { NgxLowcodeNodeSchema, NgxLowcodeRuntimeContext } from 'ngx-lowcode-core-types';

@Component({
    selector: 'ngx-lowcode-table-material',
    imports: [CommonModule],
    templateUrl: './ngx-lowcode-table-material.component.html',
    styleUrl: './ngx-lowcode-table-material.component.scss'
})
export class NgxLowcodeTableMaterialComponent {
  readonly node = input.required<NgxLowcodeNodeSchema>();
  readonly runtime = input.required<NgxLowcodeRuntimeContext>();

  readonly tableStyle = computed<Record<string, string | number>>(() => ({
    ...(this.node().style ?? {})
  }));
  readonly title = computed(() => String(this.node().props['title'] ?? 'Results'));
  readonly dataKey = computed(() => String(this.node().props['dataKey'] ?? ''));
  readonly rows = computed<Record<string, unknown>[]>(() => {
    const value = this.runtime().state()[this.dataKey()];
    return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
  });
  readonly columns = computed(() => {
    const rows = this.rows();
    return rows.length ? Object.keys(rows[0]) : [];
  });
}
