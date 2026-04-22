import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { NgxLowcodeRendererComponent } from '@zhongmiao/ngx-lowcode-renderer';
import { getBuiltInMaterials } from '@zhongmiao/ngx-lowcode-materials';
import { NgxLowcodeComponentDefinition } from '@zhongmiao/ngx-lowcode-core-types';
import { createSingleMaterialPreviewSchema } from '../../core/demo-page-schema';

@Component({
  selector: 'app-materials-demo',
  imports: [NgxLowcodeRendererComponent],
  templateUrl: './materials-demo.component.html',
  styleUrl: './materials-demo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MaterialsDemoComponent {
  protected readonly materials = getBuiltInMaterials('zh-CN').filter((material) => material.type !== 'page');
  protected readonly selectedType = signal(this.materials[0]?.type ?? '');
  protected readonly selectedMaterial = computed<NgxLowcodeComponentDefinition | undefined>(() =>
    this.materials.find((material) => material.type === this.selectedType())
  );
  protected readonly previewSchema = computed(() => {
    const material = this.selectedMaterial();
    const node = material?.createNode({ id: `preview-${material.type}` });
    return node ? createSingleMaterialPreviewSchema(node) : null;
  });

  protected selectMaterial(type: string): void {
    this.selectedType.set(type);
  }
}
