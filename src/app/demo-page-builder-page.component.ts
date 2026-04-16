import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { getDemoProjectI18n } from '@zhongmiao/ngx-lowcode-i18n';
import { ThyCardModule } from 'ngx-tethys/card';
import { ThyNavModule } from 'ngx-tethys/nav';
import { DemoWorkspaceService } from './demo-workspace.service';

@Component({
  selector: 'app-demo-page-builder-page',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ThyCardModule, ThyNavModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-shell">
      <thy-card thyBordered="false" class="page-shell__panel">
        <div class="page-shell__header">
          <div>
            <p class="page-shell__eyebrow">{{ copy().pageStage }}</p>
            <h2>{{ copy().generatedPageTitle }}</h2>
            <p class="page-shell__description">{{ workspace.schema().pageMeta.description || copy().noDescription }}</p>
          </div>
        </div>

        <thy-nav thyType="pills">
          <a thyNavItem routerLink="/studio/page/designer" routerLinkActive="active">{{ copy().pageNavDesigner }}</a>
          <a thyNavItem routerLink="/studio/page/preview" routerLinkActive="active">{{ copy().pageNavPreview }}</a>
          <a thyNavItem routerLink="/studio/page/route-config" routerLinkActive="active">{{
            copy().pageNavRouteConfig
          }}</a>
        </thy-nav>
      </thy-card>

      <router-outlet></router-outlet>
    </div>
  `,
  styles: [
    `
      .page-shell {
        display: grid;
        gap: 10px;
      }
      .page-shell__panel {
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid #dbe4ff;
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
        padding: 12px;
      }
      .page-shell__eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 11px;
        font-weight: 700;
        color: #0f766e;
      }
      .page-shell__description {
        color: #475467;
        margin: 2px 0 8px;
      }
    `
  ]
})
export class DemoPageBuilderPageComponent {
  protected readonly workspace = inject(DemoWorkspaceService);
  protected readonly copy = computed(() => getDemoProjectI18n(this.workspace.locale()));
}
