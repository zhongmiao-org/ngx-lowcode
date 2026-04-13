import { Component, computed, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxLowcodeNodeSchema, NgxLowcodeRuntimeContext } from 'ngx-lowcode-core-types';
import { ThyFormModule } from 'ngx-tethys/form';
import { ThyInputModule } from 'ngx-tethys/input';

@Component({
  selector: 'ngx-lowcode-input-material',
  imports: [FormsModule, ThyFormModule, ThyInputModule],
  templateUrl: './ngx-lowcode-input-material.component.html',
  styleUrl: './ngx-lowcode-input-material.component.scss'
})
export class NgxLowcodeInputMaterialComponent {
  readonly node = input.required<NgxLowcodeNodeSchema>();
  readonly runtime = input.required<NgxLowcodeRuntimeContext>();

  readonly label = computed(() => String(this.node().props['label'] ?? 'Input'));
  readonly placeholder = computed(() => String(this.node().props['placeholder'] ?? ''));
  readonly stateKey = computed(() => String(this.node().props['stateKey'] ?? ''));
  readonly value = computed(() => String(this.runtime().state()[this.stateKey()] ?? ''));

  updateValue(value: string): void {
    if (!this.stateKey()) {
      return;
    }
    this.runtime().setState({ [this.stateKey()]: value });
  }
}
