import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxLowcodeNodeSchema, NgxLowcodeRuntimeContext } from 'ngx-lowcode-core-types';
import { ThyFormModule } from 'ngx-tethys/form';
import { ThyOption } from 'ngx-tethys/shared';
import { ThySelectModule } from 'ngx-tethys/select';

@Component({
  selector: 'ngx-lowcode-select-material',
  imports: [FormsModule, ThyFormModule, ThySelectModule, ThyOption],
  templateUrl: './ngx-lowcode-select-material.component.html',
  styleUrl: './ngx-lowcode-select-material.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NgxLowcodeSelectMaterialComponent {
  readonly node = input.required<NgxLowcodeNodeSchema>();
  readonly runtime = input.required<NgxLowcodeRuntimeContext>();

  readonly label = computed(() => String(this.node().props['label'] ?? 'Select'));
  readonly placeholder = computed(() => String(this.node().props['placeholder'] ?? 'Select'));
  readonly stateKey = computed(() => String(this.node().props['stateKey'] ?? ''));
  readonly value = computed(() => this.runtime().state()[this.stateKey()] ?? null);
  readonly options = computed(() => {
    const options = this.node().props['options'];
    return Array.isArray(options) ? options.map((option) => option as { label: string; value: unknown }) : [];
  });

  updateValue(value: unknown): void {
    if (!this.stateKey()) {
      return;
    }
    this.runtime().setState({ [this.stateKey()]: value });
  }
}
