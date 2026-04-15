import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { getDemoProjectI18n } from 'ngx-lowcode-i18n';
import { ThyButtonModule } from 'ngx-tethys/button';
import { ThyCardModule } from 'ngx-tethys/card';
import { ThyEmptyModule } from 'ngx-tethys/empty';
import { ThyStatisticModule } from 'ngx-tethys/statistic';
import { ThyTagModule } from 'ngx-tethys/tag';
import { DemoWorkspaceService } from './demo-workspace.service';

@Component({
  selector: 'app-demo-datasource-page',
  imports: [ThyCardModule, ThyButtonModule, ThyTagModule, ThyStatisticModule, ThyEmptyModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="workspace-page">
      <thy-card thyBordered="false" class="workspace-page__panel">
        <div class="workspace-page__header">
          <div>
            <p class="workspace-page__eyebrow">{{ copy().datasourceStage }}</p>
            <h2>{{ copy().datasourceSectionTitle }}</h2>
            <p class="workspace-page__description">{{ copy().homeDatasourceDescription }}</p>
          </div>
          <div class="workspace-page__actions">
            <button thyButton="outline-primary" size="sm" (click)="workspace.createDatasources()">{{ copy().createDatasource }}</button>
            <button thyButton="outline-primary" size="sm" (click)="workspace.bindResultTable()">{{ copy().bindDatasource }}</button>
          </div>
        </div>

        @if (workspace.selectedDatasource(); as selectedDatasource) {
          <div class="workspace-page__card">
            <strong>{{ selectedDatasource.label }}</strong>
            <div class="workspace-page__tags">
              <thy-tag thyColor="primary" thyTheme="weak-fill" thySize="sm">{{ selectedDatasource.id }}</thy-tag>
              <thy-tag thyColor="info" thyTheme="weak-fill" thySize="sm">{{ selectedDatasource.tableId }}</thy-tag>
              <thy-tag thyColor="warning" thyTheme="weak-fill" thySize="sm">key {{ selectedDatasource.keyField }}</thy-tag>
            </div>
            <span>{{ selectedDatasource.fields.map((field) => field.name).join(', ') }}</span>
          </div>
        } @else {
          <thy-empty thyIconName="inbox" [thyMessage]="copy().datasourceListTitle"></thy-empty>
        }
      </thy-card>

      <thy-card thyBordered="false" class="workspace-page__panel">
        <div class="workspace-page__header">
          <div>
            <p class="workspace-page__eyebrow">{{ copy().bindingStage }}</p>
            <h2>{{ copy().bindingSectionTitle }}</h2>
          </div>
        </div>
        <div class="workspace-page__card">
          <strong>{{ copy().generatedPageTitle }}</strong>
          <span>{{ workspace.schema().pageMeta.title }}</span>
          <span>{{ workspace.schema().pageMeta.description || copy().noDescription }}</span>
        </div>
        <div class="workspace-page__card">
          <div class="workspace-page__stats">
            <thy-statistic thyShape="card" thyColor="primary" [thyValue]="workspace.datasourceDrafts().length" [thyTitle]="copy().datasourceCount"></thy-statistic>
            <thy-statistic thyShape="card" thyColor="success" [thyValue]="workspace.selectedDatasource() ? workspace.selectedDatasource()!.fields.length : 0" thyTitle="Fields"></thy-statistic>
          </div>
        </div>
      </thy-card>
    </div>
  `,
  styles: [
    `
      .workspace-page {
        margin: 0 auto;
        width: 100%;
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(320px, 420px);
        gap: 12px;
      }
      .workspace-page__panel { background: rgba(255,255,255,.92); border: 1px solid #dbe4ff; border-radius: 16px; box-shadow: 0 10px 30px rgba(15,23,42,.06); padding: 12px; }
      .workspace-page__header, .workspace-page__actions { display: flex; justify-content: space-between; gap: 8px; align-items: center; flex-wrap: wrap; }
      .workspace-page__eyebrow { text-transform: uppercase; letter-spacing: .12em; font-size: 11px; font-weight: 700; color: #0f766e; }
      .workspace-page__description { color: #475467; }
      .workspace-page__card { border: 1px solid #dbe4ff; border-radius: 12px; padding: 10px; display: grid; gap: 6px; }
      .workspace-page__tags { display: flex; gap: 6px; flex-wrap: wrap; }
      .workspace-page__stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
      @media (max-width: 1000px) { .workspace-page { grid-template-columns: 1fr; } }
    `
  ]
})
export class DemoDatasourcePageComponent {
  protected readonly workspace = inject(DemoWorkspaceService);
  protected readonly copy = computed(() => getDemoProjectI18n(this.workspace.locale()));
}
