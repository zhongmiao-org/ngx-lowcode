import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { getDemoProjectI18n } from '@zhongmiao/ngx-lowcode-i18n';
import { ThyCardModule } from 'ngx-tethys/card';
import { DemoWorkspaceService } from './demo-workspace.service';

@Component({
  selector: 'app-demo-page-route-config-page',
  imports: [ThyCardModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="route-config">
      <thy-card thyBordered="false" class="route-config__panel">
        <div class="route-config__header">
          <div>
            <p class="route-config__eyebrow">{{ copy().pageNavRouteConfig }}</p>
            <h2>{{ copy().routeConfigTitle }}</h2>
            <p class="route-config__description">{{ copy().routeConfigDescription }}</p>
          </div>
        </div>

        <div class="route-config__meta">
          <div><strong>{{ workspace.previewRoutePath() }}</strong><span>{{ copy().routeConfigPathLabel }}</span></div>
          <div><strong>{{ workspace.routeMenuTitle() }}</strong><span>{{ copy().routeConfigMenuLabel }}</span></div>
        </div>

        <pre class="route-config__code">{{ workspace.previewRouteConfig() }}</pre>
      </thy-card>
    </div>
  `,
  styles: [
    `
      .route-config {
        display: grid;
      }
      .route-config__panel {
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid #dbe4ff;
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
        padding: 12px;
      }
      .route-config__header {
        margin-bottom: 10px;
      }
      .route-config__eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 11px;
        font-weight: 700;
        color: #0f766e;
      }
      .route-config__description {
        color: #475467;
      }
      .route-config__meta {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 8px;
        margin-bottom: 10px;
      }
      .route-config__meta div {
        display: grid;
        gap: 2px;
        padding: 8px 10px;
        border-radius: 10px;
        background: #eff6ff;
        border: 1px solid #bfdbfe;
      }
      .route-config__code {
        background: #0f172a;
        color: #e2e8f0;
        padding: 10px;
        border-radius: 12px;
        overflow: auto;
        font-size: 11px;
      }
    `
  ]
})
export class DemoPageRouteConfigPageComponent {
  protected readonly workspace = inject(DemoWorkspaceService);
  protected readonly copy = computed(() => getDemoProjectI18n(this.workspace.locale()));
}
