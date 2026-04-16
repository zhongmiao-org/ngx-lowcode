import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { getDemoProjectI18n } from '@zhongmiao/ngx-lowcode-i18n';
import { ThyBreadcrumbModule } from 'ngx-tethys/breadcrumb';
import { ThyButtonModule } from 'ngx-tethys/button';
import { ThyCardModule } from 'ngx-tethys/card';
import { ThyLayoutModule } from 'ngx-tethys/layout';
import { DemoWorkspaceService } from './demo-workspace.service';

@Component({
  selector: 'app-demo-home',
  imports: [RouterLink, ThyLayoutModule, ThyCardModule, ThyBreadcrumbModule, ThyButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <thy-layout class="demo-home">
      <thy-header [thyHasBorder]="false" [thyShadow]="false" class="demo-home__header">
        <div class="demo-home__header-inner">
          <thy-breadcrumb [thySeparator]="'slash'">
            <thy-breadcrumb-item>ngx-lowcode</thy-breadcrumb-item>
            <thy-breadcrumb-item>demo</thy-breadcrumb-item>
          </thy-breadcrumb>
          <div class="demo-home__locale">
            <span>{{ copy().localeLabel }}</span>
            <button thyButton="outline-primary" size="sm" (click)="workspace.locale.set('zh-CN')">中文</button>
            <button thyButton="outline-primary" size="sm" (click)="workspace.locale.set('en-US')">EN</button>
          </div>
        </div>
      </thy-header>

      <thy-content class="demo-home__content">
        <div class="demo-home__hero">
          <p class="demo-home__eyebrow">Commercial Demo</p>
          <h1>{{ copy().heroTitle }}</h1>
          <p>{{ copy().heroDescription }}</p>
          <div class="demo-home__hero-actions">
            <a thyButton="primary" routerLink="/studio/model">{{ copy().workspaceNavModel }}</a>
            <a thyButton="outline-primary" routerLink="/studio/permission">{{ copy().workspaceNavPermission }}</a>
            <a thyButton="outline-primary" routerLink="/studio/page/designer">{{ copy().workspaceNavPage }}</a>
          </div>
        </div>

        <div class="demo-home__cards">
          <thy-card thyBordered="false" class="demo-home__card">
            <thy-card-header [thyTitle]="copy().workspaceNavModel" [thyDescription]="copy().homeModelDescription"></thy-card-header>
            <thy-card-content>
              <a thyButton="primary" routerLink="/studio/model">{{ copy().workspaceNavModel }}</a>
            </thy-card-content>
          </thy-card>
          <thy-card thyBordered="false" class="demo-home__card">
            <thy-card-header [thyTitle]="copy().workspaceNavDatasource" [thyDescription]="copy().homeDatasourceDescription"></thy-card-header>
            <thy-card-content>
              <a thyButton="primary" routerLink="/studio/datasource">{{ copy().workspaceNavDatasource }}</a>
            </thy-card-content>
          </thy-card>
          <thy-card thyBordered="false" class="demo-home__card">
            <thy-card-header [thyTitle]="copy().workspaceNavPermission" [thyDescription]="copy().permissionSectionTitle"></thy-card-header>
            <thy-card-content>
              <a thyButton="primary" routerLink="/studio/permission">{{ copy().workspaceNavPermission }}</a>
            </thy-card-content>
          </thy-card>
          <thy-card thyBordered="false" class="demo-home__card">
            <thy-card-header [thyTitle]="copy().workspaceNavPage" [thyDescription]="copy().homePageDescription"></thy-card-header>
            <thy-card-content>
              <a thyButton="primary" routerLink="/studio/page/designer">{{ copy().workspaceNavPage }}</a>
            </thy-card-content>
          </thy-card>
        </div>
      </thy-content>
    </thy-layout>
  `,
  styles: [
    `
      .demo-home {
        min-height: 100vh;
        background:
          radial-gradient(circle at top left, rgba(13, 148, 136, 0.2), transparent 30%),
          radial-gradient(circle at top right, rgba(59, 130, 246, 0.14), transparent 28%),
          linear-gradient(180deg, #f8fafc 0%, #eef6ff 55%, #f2f7f5 100%);
        color: #0f172a;
      }
      .demo-home__header,
      .demo-home__content {
        width: 100%;
      }
      .demo-home__header-inner,
      .demo-home__content {
        padding: 16px 20px;
      }
      .demo-home__header-inner {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
      }
      .demo-home__hero {
        margin-bottom: 14px;
        padding: 20px 22px;
        border-radius: 18px;
        background:
          linear-gradient(135deg, rgba(255,255,255,0.96), rgba(240,249,255,0.92)),
          linear-gradient(135deg, #ffffff, #ecfeff);
        border: 1px solid rgba(148, 163, 184, 0.25);
        box-shadow: 0 12px 36px rgba(15, 23, 42, 0.06);
      }
      .demo-home__eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 12px;
        font-weight: 700;
        color: #0f766e;
      }
      .demo-home__hero h1 {
        margin: 0 0 8px;
        font-size: 38px;
        line-height: 1.05;
        max-width: 760px;
      }
      .demo-home__hero p {
        color: #475467;
        max-width: 760px;
        font-size: 15px;
        margin: 0;
      }
      .demo-home__locale {
        display: flex;
        gap: 6px;
        align-items: center;
      }
      .demo-home__hero-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 14px;
      }
      .demo-home__cards {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
      }
      .demo-home__card {
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.9);
        box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
      }
      @media (max-width: 900px) {
        .demo-home__header-inner,
        .demo-home__content {
          padding: 14px;
        }
        .demo-home__hero h1 {
          font-size: 30px;
        }
        .demo-home__cards {
          grid-template-columns: 1fr;
        }
      }
    `
  ]
})
export class DemoHomeComponent {
  protected readonly workspace = inject(DemoWorkspaceService);
  protected readonly copy = computed(() => getDemoProjectI18n(this.workspace.locale()));
}
