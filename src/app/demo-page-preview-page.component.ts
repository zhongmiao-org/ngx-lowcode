import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgxLowcodeRendererComponent } from '@zhongmiao/ngx-lowcode-renderer';
import { getDemoProjectI18n } from '@zhongmiao/ngx-lowcode-i18n';
import { ThyCardModule } from 'ngx-tethys/card';
import { DemoBffDatasourceExecutorService } from './demo-bff-datasource-executor.service';
import { DemoWorkspaceService } from './demo-workspace.service';

@Component({
  selector: 'app-demo-page-preview-page',
  imports: [NgxLowcodeRendererComponent, ThyCardModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="preview-grid">
      <thy-card thyBordered="false" class="preview-grid__panel">
        <div class="preview-grid__header">
          <div>
            <p class="preview-grid__eyebrow">{{ copy().previewTitle }}</p>
            <h2>{{ workspace.schema().pageMeta.title }}</h2>
          </div>
        </div>

        <div class="preview-grid__status-grid">
          <div>
            <strong>{{ queryStatus().requestId }}</strong
            ><span>{{ copy().requestId }}</span>
          </div>
          <div>
            <strong>{{ queryStatus().source }}</strong
            ><span>{{ copy().querySource }}</span>
          </div>
          <div>
            <strong>{{ queryStatus().status }}</strong
            ><span>{{ copy().queryStatus }}</span>
          </div>
          <div>
            <strong>{{ queryStatus().rowCount }}</strong
            ><span>{{ copy().queryRows }}</span>
          </div>
          <div>
            <strong>{{ queryStatus().message }}</strong
            ><span>{{ copy().queryMessage }}</span>
          </div>
        </div>

        <ngx-lowcode-renderer [schema]="workspace.schema()"></ngx-lowcode-renderer>
      </thy-card>
    </div>
  `,
  styles: [
    `
      .preview-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 12px;
      }
      .preview-grid__panel {
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid #dbe4ff;
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
        padding: 12px;
      }
      .preview-grid__header {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
        margin-bottom: 10px;
      }
      .preview-grid__eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 11px;
        font-weight: 700;
        color: #0f766e;
      }
      .preview-grid__status-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 8px;
        margin-bottom: 10px;
      }
      .preview-grid__status-grid div {
        display: grid;
        gap: 2px;
        padding: 8px 10px;
        border-radius: 10px;
        background: #f0fdf4;
        border: 1px solid #86efac;
      }
      .preview-grid__status-grid span {
        color: #166534;
        font-size: 12px;
      }
    `
  ]
})
export class DemoPagePreviewPageComponent {
  protected readonly workspace = inject(DemoWorkspaceService);
  private readonly executor = inject(DemoBffDatasourceExecutorService);
  protected readonly copy = computed(() => getDemoProjectI18n(this.workspace.locale()));
  protected readonly queryStatus = this.executor.lastExecution.asReadonly();
}
