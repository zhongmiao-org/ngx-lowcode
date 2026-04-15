import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { getDemoProjectI18n } from 'ngx-lowcode-i18n';
import { ThyActionModule } from 'ngx-tethys/action';
import { ThyBreadcrumbModule } from 'ngx-tethys/breadcrumb';
import { ThyButtonModule } from 'ngx-tethys/button';
import { ThyCardModule } from 'ngx-tethys/card';
import { ThyDividerModule } from 'ngx-tethys/divider';
import { ThyDropdownModule } from 'ngx-tethys/dropdown';
import { ThyIconModule } from 'ngx-tethys/icon';
import { ThyLayoutModule } from 'ngx-tethys/layout';
import { ThyMenuModule } from 'ngx-tethys/menu';
import { ThyNavModule } from 'ngx-tethys/nav';
import { ThySpaceModule } from 'ngx-tethys/space';
import { ThyStatisticModule } from 'ngx-tethys/statistic';
import { ThyTagModule } from 'ngx-tethys/tag';
import { filter, map, startWith } from 'rxjs';
import { DemoBffDatasourceExecutorService } from './demo-bff-datasource-executor.service';
import { DemoWorkspaceService } from './demo-workspace.service';

@Component({
  selector: 'app-demo-workspace-layout',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    ThyLayoutModule,
    ThyCardModule,
    ThyBreadcrumbModule,
    ThyButtonModule,
    ThyNavModule,
    ThyMenuModule,
    ThyDropdownModule,
    ThyStatisticModule,
    ThyTagModule,
    ThyDividerModule,
    ThyIconModule,
    ThyActionModule,
    ThySpaceModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <thy-layout class="workspace-layout">
      <thy-header thyDivided="true" class="workspace-layout__header">
        <ng-template #headerTitle>
          <a class="workspace-layout__home-link" routerLink="/">
            <thy-icon thyIconName="house-square" thyIconType="fill"></thy-icon>
          </a>
          <thy-icon class="workspace-layout__title-separator" thyIconName="angle-right"></thy-icon>
          <button type="button" class="workspace-layout__title-button" [thyDropdown]="projectMenu" thyTrigger="click">
            {{ projectTitle() }}
            <thy-icon thyIconName="angle-down"></thy-icon>
          </button>
          <thy-dropdown-menu #projectMenu>
            <a
              thyDropdownMenuItem
              href="javascript:;"
              [class.active]="workspace.projectId() === 'commerce-core'"
              (click)="workspace.switchProject('commerce-core')"
            >
              <span>Commerce Core</span>
            </a>
            <a
              thyDropdownMenuItem
              href="javascript:;"
              [class.active]="workspace.projectId() === 'crm-ops'"
              (click)="workspace.switchProject('crm-ops')"
            >
              <span>CRM Ops</span>
            </a>
          </thy-dropdown-menu>
          <thy-divider class="workspace-layout__title-divider" thyColor="light" thyVertical="true"></thy-divider>
          <button type="button" class="workspace-layout__title-button" [thyDropdown]="tenantMenu" thyTrigger="click">
            {{ workspace.tenantId() }}
            <thy-icon thyIconName="angle-down"></thy-icon>
          </button>
          <thy-dropdown-menu #tenantMenu>
            <a
              thyDropdownMenuItem
              href="javascript:;"
              [class.active]="workspace.tenantId() === 'tenant-a'"
              (click)="workspace.switchTenant('tenant-a')"
            >
              <span>Tenant A</span>
            </a>
            <a
              thyDropdownMenuItem
              href="javascript:;"
              [class.active]="workspace.tenantId() === 'tenant-b'"
              (click)="workspace.switchTenant('tenant-b')"
            >
              <span>Tenant B</span>
            </a>
          </thy-dropdown-menu>
          <thy-divider class="workspace-layout__title-divider" thyColor="light" thyVertical="true"></thy-divider>
          <thy-space thySize="xxs">
            <a
              *thySpaceItem
              href="javascript:;"
              thyAction
              class="text-warning"
              thyIcon="building"
              [thyActionActive]="workspace.projectId() === 'commerce-core'"
              (click)="workspace.switchProject('commerce-core')"
            ></a>
            <a
              *thySpaceItem
              href="javascript:;"
              thyAction
              thyIcon="blocks"
              [thyActionActive]="workspace.projectId() === 'crm-ops'"
              (click)="workspace.switchProject('crm-ops')"
            ></a>
            <a *thySpaceItem href="javascript:;" thyAction thyIcon="contacts"></a>
            <a *thySpaceItem href="javascript:;" thyAction thyIcon="deployment-unit"></a>
          </thy-space>
          <thy-divider class="workspace-layout__title-divider" thyColor="light" thyVertical="true"></thy-divider>
        </ng-template>
        <ng-template #headerContent>
          <div class="workspace-layout__header-content">
            <thy-nav thyType="pulled">
              <a thyNavItem [thyNavItemActive]="activeSection() === 'model'" routerLink="/studio/model">{{ copy().workspaceNavModel }}</a>
              <a thyNavItem [thyNavItemActive]="activeSection() === 'datasource'" routerLink="/studio/datasource">{{ copy().workspaceNavDatasource }}</a>
              <a thyNavItem [thyNavItemActive]="activeSection() === 'page'" routerLink="/studio/page/designer">{{ copy().workspaceNavPage }}</a>
            </thy-nav>
            <div class="workspace-layout__header-actions">
              <span>{{ copy().localeLabel }}</span>
              <button thyButton="outline-primary" size="sm" (click)="workspace.locale.set('zh-CN')">中文</button>
              <button thyButton="outline-primary" size="sm" (click)="workspace.locale.set('en-US')">EN</button>
            </div>
          </div>
        </ng-template>
      </thy-header>

      <thy-layout class="workspace-layout__body">
        @if (activeSection() !== 'page') {
          <thy-sidebar thyDivided="false" class="workspace-layout__sidebar">
            <div class="workspace-layout__sidebar-section">
              <thy-menu class="workspace-layout__menu">
                <a thyMenuItem thyIcon="dashboard" routerLink="/studio/model" routerLinkActive="workspace-layout__menu-item--active">
                  <span thyMenuItemName>{{ copy().workspaceNavModel }}</span>
                </a>
                <a thyMenuItem thyIcon="blocks" routerLink="/studio/datasource" routerLinkActive="workspace-layout__menu-item--active">
                  <span thyMenuItemName>{{ copy().workspaceNavDatasource }}</span>
                </a>
                <thy-divider></thy-divider>
                @if (activeSection() === 'model') {
                  <thy-menu-group [thyTitle]="copy().tableListTitle" [thyCollapsible]="true">
                    @for (table of workspace.metaModel().tables; track table.id) {
                      <a
                        thyMenuItem
                        thyIcon="inbox"
                        href="javascript:;"
                        [class.workspace-layout__menu-item--active]="workspace.selectedTableId() === table.id"
                        (click)="workspace.selectTable(table.id)"
                      >
                        <span thyMenuItemName>{{ table.label }}</span>
                        <thy-menu-item-action>
                          <a thyAction thyIcon="plus" (click)="$event.stopPropagation(); workspace.addColumn(table.id)"></a>
                        </thy-menu-item-action>
                      </a>
                    }
                  </thy-menu-group>
                } @else {
                  <thy-menu-group [thyTitle]="copy().datasourceListTitle" [thyCollapsible]="true">
                    @for (draft of workspace.datasourceDrafts(); track draft.id) {
                      <a
                        thyMenuItem
                        thyIcon="database"
                        href="javascript:;"
                        [class.workspace-layout__menu-item--active]="workspace.selectedDatasourceId() === draft.id"
                        (click)="workspace.selectDatasource(draft.id)"
                      >
                        <span thyMenuItemName>{{ draft.label }}</span>
                        <thy-menu-item-action>
                          <a thyAction thyIcon="link" (click)="$event.stopPropagation(); workspace.bindResultTable()"></a>
                        </thy-menu-item-action>
                      </a>
                    }
                  </thy-menu-group>
                }
                <thy-divider></thy-divider>
                <a thyMenuItem thyIcon="horizontal-two-lines" href="javascript:;">
                  <span thyMenuItemName>{{ copy().sectionTitle }}</span>
                </a>
              </thy-menu>
            </div>

          </thy-sidebar>
        }

        <thy-content class="workspace-layout__content" [class.workspace-layout__content--full]="activeSection() === 'page'">
          @if (activeSection() !== 'page') {
            <thy-card thyBordered="false" class="workspace-layout__summary">
              <thy-card-content>
                <div class="workspace-layout__summary-head">
                  <div>
                    <thy-breadcrumb [thySeparator]="'slash'">
                      <thy-breadcrumb-item><a routerLink="/">{{ copy().backHome }}</a></thy-breadcrumb-item>
                      <thy-breadcrumb-item>{{ copy().workspaceTitle }}</thy-breadcrumb-item>
                    </thy-breadcrumb>
                    <h1>{{ copy().workspaceTitle }}</h1>
                    <p>{{ copy().workspaceDescription }}</p>
                  </div>
                </div>
                <div class="workspace-layout__summary-grid">
                  <thy-statistic thyShape="card" thyColor="primary" [thyValue]="workspace.metaModel().tables.length" [thyTitle]="copy().modelTables"></thy-statistic>
                  <thy-statistic thyShape="card" thyColor="info" [thyValue]="workspace.metaModel().relations.length" [thyTitle]="copy().modelRelations"></thy-statistic>
                  <thy-statistic thyShape="card" thyColor="warning" [thyValue]="workspace.metaModel().indexes.length" [thyTitle]="copy().modelIndexes"></thy-statistic>
                  <thy-statistic thyShape="card" thyColor="success" [thyValue]="workspace.datasourceDrafts().length" [thyTitle]="copy().datasourceCount"></thy-statistic>
                  <thy-statistic thyShape="card" thyColor="primary" [thyValue]="workspace.schema().actions.length" [thyTitle]="copy().pageActions"></thy-statistic>
                  <thy-statistic thyShape="card" thyColor="info" [thyValue]="workspace.schema().datasources.length" [thyTitle]="copy().pageDatasources"></thy-statistic>
                  <thy-statistic thyShape="card" thyColor="warning" [thyValue]="workspace.nodeCount()" [thyTitle]="copy().pageNodeCount"></thy-statistic>
                  <thy-statistic thyShape="card" thyColor="success" [thyValue]="workspace.tenantId()" [thyTitle]="copy().activeTenant"></thy-statistic>
                </div>
              </thy-card-content>
            </thy-card>

            <thy-card thyBordered="false" class="workspace-layout__status">
              <thy-card-content class="workspace-layout__status-content">
                <span>{{ copy().commandStatus }}: {{ workspace.lastCommand() }}</span>
                <span>{{ copy().queryStatus }}: {{ queryStatus().status }} / {{ queryStatus().message }}</span>
              </thy-card-content>
            </thy-card>
          }

          <router-outlet></router-outlet>
        </thy-content>
      </thy-layout>
    </thy-layout>
  `,
  styles: [
    `
      .workspace-layout {
        min-height: 100vh;
        background:
          radial-gradient(circle at top left, rgba(14, 165, 233, 0.14), transparent 35%),
          linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
        color: #0f172a;
      }
      .workspace-layout__header,
      .workspace-layout__body {
        width: 100%;
      }
      .workspace-layout__body {
        padding: 12px 16px 16px;
        gap: 12px;
        align-items: stretch;
      }
      .workspace-layout__header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        width: 100%;
      }
      .workspace-layout__header-actions {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
      }
      .workspace-layout__home-link,
      .workspace-layout__title-button {
        color: inherit;
        text-decoration: none;
      }
      .workspace-layout__title-button {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border: 0;
        background: transparent;
        font-weight: 600;
        padding: 0;
      }
      .workspace-layout__title-separator {
        margin: 0 6px;
        color: #64748b;
      }
      .workspace-layout__title-divider {
        margin: 0 6px;
      }
      .workspace-layout__sidebar {
        width: 272px;
        flex: 0 0 272px;
        align-self: stretch;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.88);
        border: 1px solid #dbe4ff;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
        padding: 10px;
        display: grid;
        gap: 10px;
      }
      .workspace-layout__sidebar-section,
      .workspace-layout__sidebar-stack {
        display: grid;
        gap: 6px;
      }
      .workspace-layout__sidebar-eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 11px;
        font-weight: 700;
        color: #0f766e;
        margin: 0;
      }
      .workspace-layout__menu {
        background: transparent;
      }
      .workspace-layout__menu ::ng-deep .thy-menu-item,
      .workspace-layout__menu ::ng-deep .thy-menu-group-header {
        min-height: 34px;
      }
      .workspace-layout__menu ::ng-deep .thy-menu-item-name {
        font-size: 13px;
      }
      .workspace-layout__menu-item--active {
        background: #f0fdfa;
        color: #0f766e;
        border-radius: 8px;
      }
      .workspace-layout__content {
        min-width: 0;
        padding: 0;
      }
      .workspace-layout__content--full {
        width: 100%;
      }
      .workspace-layout__summary,
      .workspace-layout__status {
        margin-bottom: 10px;
      }
      .workspace-layout__summary-head h1 {
        margin: 4px 0;
        font-size: 26px;
      }
      .workspace-layout__summary-head p,
      .workspace-layout__summary-grid span,
      .workspace-layout__status-content span {
        color: #475467;
      }
      .workspace-layout__summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(128px, 1fr));
        gap: 8px;
      }
      .workspace-layout__status-content {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
      }
      @media (max-width: 1100px) {
        .workspace-layout__body {
          display: grid;
          padding: 10px;
        }
        .workspace-layout__header-content {
          display: grid;
        }
        .workspace-layout__sidebar {
          width: auto;
        }
      }
    `
  ]
})
export class DemoWorkspaceLayoutComponent {
  protected readonly workspace = inject(DemoWorkspaceService);
  private readonly executor = inject(DemoBffDatasourceExecutorService);
  private readonly router = inject(Router);
  protected readonly copy = computed(() => getDemoProjectI18n(this.workspace.locale()));
  protected readonly queryStatus = this.executor.lastExecution.asReadonly();
  protected readonly projectTitle = computed(() =>
    this.workspace.projectId() === 'commerce-core' ? 'Commerce Core' : 'CRM Ops'
  );
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );
  protected readonly activeSection = computed<'model' | 'datasource' | 'page'>(() => {
    const url = this.currentUrl();
    if (url.startsWith('/studio/datasource')) {
      return 'datasource';
    }
    if (url.startsWith('/studio/page')) {
      return 'page';
    }
    return 'model';
  });

  protected toggleProject(): void {
    this.workspace.switchProject(this.workspace.projectId() === 'commerce-core' ? 'crm-ops' : 'commerce-core');
  }
}
