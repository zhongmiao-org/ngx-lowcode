import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgxLowcodeRendererComponent } from '@zhongmiao/ngx-lowcode-renderer';
import { clonePageSchema, createDemoPageSchema } from '../../core/demo-page-schema';

@Component({
  selector: 'app-renderer-demo',
  imports: [NgxLowcodeRendererComponent],
  templateUrl: './renderer-demo.component.html',
  styleUrl: './renderer-demo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RendererDemoComponent {
  protected readonly schema = clonePageSchema(createDemoPageSchema('Renderer Demo'));
}
