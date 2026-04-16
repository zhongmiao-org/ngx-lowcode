import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgxLowcodeNodeSchema, NgxLowcodeRuntimeContext } from '@zhongmiao/ngx-lowcode-core-types';
import { ThyButtonModule } from 'ngx-tethys/button';

@Component({
  selector: 'ngx-lowcode-button-material',
  imports: [ThyButtonModule],
  templateUrl: './ngx-lowcode-button-material.component.html',
  styleUrl: './ngx-lowcode-button-material.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NgxLowcodeButtonMaterialComponent {
  readonly node = input.required<NgxLowcodeNodeSchema>();
  readonly runtime = input.required<NgxLowcodeRuntimeContext>();

  readonly buttonStyle = computed<Record<string, string | number>>(() => ({
    ...(this.node().style ?? {})
  }));
  readonly label = computed(() => String(this.node().props['label'] ?? 'Button'));
  readonly buttonType = computed<any>(() => this.node().props['buttonType'] ?? 'primary');

  async triggerAction(): Promise<void> {
    await this.runtime().executeActionById(String(this.node().props['actionId'] ?? ''));
  }
}
