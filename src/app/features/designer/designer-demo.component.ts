import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { NgxLowcodeDesignerComponent } from '@zhongmiao/ngx-lowcode-designer';
import { NgxLowcodePageSchema } from '@zhongmiao/ngx-lowcode-core-types';
import { ThyButtonModule } from 'ngx-tethys/button';
import { demoRuntimeMode } from '../../demo-runtime-mode';
import { resolveDemoBffBaseUrl } from '../../core/bff-url';
import { clonePageSchema, createDemoPageSchema } from '../../core/demo-page-schema';

@Component({
  selector: 'app-designer-demo',
  imports: [NgxLowcodeDesignerComponent, ThyButtonModule],
  templateUrl: './designer-demo.component.html',
  styleUrl: './designer-demo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DesignerDemoComponent {
  protected readonly runtimeMode = demoRuntimeMode;
  protected readonly bffBaseUrl = resolveDemoBffBaseUrl();
  protected readonly schema = signal<NgxLowcodePageSchema>(clonePageSchema(createDemoPageSchema('Designer Demo')));
  protected readonly schemaNodeCount = computed(() => this.countNodes(this.schema().layoutTree));
  protected readonly saveState = signal('Not saved');

  protected updateSchema(schema: NgxLowcodePageSchema): void {
    this.schema.set(clonePageSchema(schema));
    this.saveState.set('Changed locally');
  }

  protected markPreview(schema: NgxLowcodePageSchema): void {
    this.saveState.set(`Preview requested for ${schema.pageMeta.title}`);
  }

  protected markSave(schema: NgxLowcodePageSchema): void {
    this.schema.set(clonePageSchema(schema));
    this.saveState.set('Saved in demo memory');
  }

  protected markPublish(schema: NgxLowcodePageSchema): void {
    this.schema.set(clonePageSchema(schema));
    this.saveState.set('Publish requested in demo memory');
  }

  protected resetSchema(): void {
    this.schema.set(clonePageSchema(createDemoPageSchema('Designer Demo')));
    this.saveState.set('Reset to demo schema');
  }

  private countNodes(nodes: readonly { children?: unknown[] }[]): number {
    return nodes.reduce((total, node) => {
      const children = Array.isArray(node.children) ? node.children : [];
      return total + 1 + this.countNodes(children as readonly { children?: unknown[] }[]);
    }, 0);
  }
}
