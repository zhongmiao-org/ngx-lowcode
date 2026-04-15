import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgxLowcodeDesignerComponent } from 'ngx-lowcode-designer';
import { getDemoProjectI18n } from 'ngx-lowcode-i18n';
import { ThyButtonModule } from 'ngx-tethys/button';
import { ThyCardModule } from 'ngx-tethys/card';
import { ThyStatisticModule } from 'ngx-tethys/statistic';
import { ThyTagModule } from 'ngx-tethys/tag';
import { DemoWorkspaceService } from './demo-workspace.service';

@Component({
  selector: 'app-demo-page-designer-page',
  imports: [NgxLowcodeDesignerComponent, ThyCardModule, ThyButtonModule, ThyStatisticModule, ThyTagModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <thy-card thyBordered="false" class="page-panel">
      <div class="page-panel__header">
        <div>
          <p class="page-panel__eyebrow">{{ copy().pageNavDesigner }}</p>
          <h2>{{ copy().generatedPageTitle }}</h2>
          <div class="page-panel__meta">
            <thy-tag thyColor="primary" thyTheme="weak-fill" thySize="sm">{{ workspace.schema().pageMeta.id }}</thy-tag>
            <thy-tag thyColor="success" thyTheme="weak-fill" thySize="sm">{{ workspace.previewRoutePath() }}</thy-tag>
          </div>
        </div>
        <div class="page-panel__actions">
          <button thyButton="outline-primary" size="sm" (click)="workspace.generateQueryPage()">{{ copy().generateQueryPage }}</button>
          <button thyButton="primary" size="sm" (click)="workspace.generateCrudPage()">{{ copy().generateCrudPage }}</button>
          <button thyButton="outline-primary" size="sm" (click)="workspace.resetWorkspace()">{{ copy().resetWorkspace }}</button>
        </div>
      </div>

      <div class="page-panel__stats">
        <thy-statistic thyShape="card" thyColor="primary" [thyValue]="workspace.schema().datasources.length" [thyTitle]="copy().pageDatasources"></thy-statistic>
        <thy-statistic thyShape="card" thyColor="info" [thyValue]="workspace.schema().actions.length" [thyTitle]="copy().pageActions"></thy-statistic>
        <thy-statistic thyShape="card" thyColor="warning" [thyValue]="workspace.nodeCount()" [thyTitle]="copy().pageNodeCount"></thy-statistic>
      </div>

      <ngx-lowcode-designer
        [schema]="workspace.schema()"
        [locale]="workspace.locale()"
        [designerConfig]="{ title: copy().workspaceTitle, allowDeleteRoot: false }"
        (schemaChange)="workspace.schema.set($event)"
        (save)="workspace.lastCommand.set('save emitted')"
        (previewRequest)="workspace.lastCommand.set('preview emitted')"
        (publishRequest)="workspace.lastCommand.set('publish emitted')"
      >
      </ngx-lowcode-designer>
    </thy-card>
  `,
  styles: [
    `
      .page-panel {
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid #dbe4ff;
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
        padding: 12px;
      }
      .page-panel__header,
      .page-panel__actions {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
      }
      .page-panel__eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 11px;
        font-weight: 700;
        color: #0f766e;
      }
      .page-panel__meta {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        margin-top: 6px;
      }
      .page-panel__stats {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        margin: 10px 0;
      }
      @media (max-width: 900px) {
        .page-panel__stats {
          grid-template-columns: 1fr;
        }
      }
    `
  ]
})
export class DemoPageDesignerPageComponent {
  protected readonly workspace = inject(DemoWorkspaceService);
  protected readonly copy = computed(() => getDemoProjectI18n(this.workspace.locale()));
}
