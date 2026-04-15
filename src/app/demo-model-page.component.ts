import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { getDemoProjectI18n } from 'ngx-lowcode-i18n';
import { ThyButtonModule } from 'ngx-tethys/button';
import { ThyCardModule } from 'ngx-tethys/card';
import { ThyEmptyModule } from 'ngx-tethys/empty';
import { ThyResultModule } from 'ngx-tethys/result';
import { ThyTagModule } from 'ngx-tethys/tag';
import { DemoWorkspaceService } from './demo-workspace.service';

@Component({
  selector: 'app-demo-model-page',
  imports: [ThyCardModule, ThyButtonModule, ThyTagModule, ThyEmptyModule, ThyResultModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="workspace-page">
      <thy-card thyBordered="false" class="workspace-page__panel">
        <div class="workspace-page__header">
          <div>
            <p class="workspace-page__eyebrow">{{ copy().projectFlow }}</p>
            <h2>{{ copy().modelStage }}</h2>
          </div>
          <div class="workspace-page__actions">
            <button thyButton="outline-primary" size="sm" (click)="workspace.addTable()">{{ copy().addTable }}</button>
            <button thyButton="outline-primary" size="sm" (click)="workspace.addForeignKey()">{{ copy().addForeignKey }}</button>
            <button thyButton="outline-primary" size="sm" (click)="workspace.rebuildModelPreset()">{{ copy().createModel }}</button>
          </div>
        </div>

        @for (table of workspace.metaModel().tables; track table.id) {
          <div class="workspace-page__card">
            <div class="workspace-page__header">
              <div>
                <input
                  class="workspace-page__input"
                  [value]="table.label"
                  (input)="workspace.renameTable(table.id, $any($event.target).value)"
                />
                <div class="workspace-page__tags">
                  <thy-tag thyColor="primary" thyTheme="weak-fill" thySize="sm">{{ table.id }}</thy-tag>
                  <thy-tag thyColor="info" thyTheme="weak-fill" thySize="sm">{{ table.kind }}</thy-tag>
                  @if (table.parentTableId) {
                    <thy-tag thyColor="warning" thyTheme="weak-fill" thySize="sm">{{ table.parentTableId }}</thy-tag>
                  }
                </div>
              </div>
              <div class="workspace-page__actions">
                <button thyButton="outline-primary" size="sm" (click)="workspace.addColumn(table.id)">{{ copy().addColumn }}</button>
                <button thyButton="outline-primary" size="sm" (click)="workspace.addChildTable(table.id)">{{ copy().addChildTable }}</button>
                <button thyButton="outline-primary" size="sm" (click)="workspace.addIndex(table.id)">{{ copy().addIndex }}</button>
                <button thyButton="outline-danger" size="sm" (click)="workspace.removeTable(table.id)">Delete</button>
              </div>
            </div>

            <div class="workspace-page__list">
              @for (column of table.columns; track column.id) {
                <div class="workspace-page__row">
                      <input
                        class="workspace-page__input workspace-page__input--compact"
                        [value]="column.name"
                        (input)="workspace.renameColumn(table.id, column.id, $any($event.target).value)"
                      />
                      <thy-tag thyColor="default" thyTheme="outline" thySize="sm">{{ column.type }}</thy-tag>
                      <thy-tags>
                        <thy-tag [thyColor]="column.primary ? 'danger' : (column.required ? 'success' : 'default')" thyTheme="weak-fill" thySize="sm">
                          {{ column.primary ? 'PK' : (column.required ? 'REQ' : 'OPT') }}
                        </thy-tag>
                      </thy-tags>
                      <button thyButton="outline-danger" size="sm" (click)="workspace.removeColumn(table.id, column.id)">
                        Delete
                      </button>
                    </div>
                  }
                </div>
              </div>
            }
      </thy-card>

      <thy-card thyBordered="false" class="workspace-page__panel">
        <div class="workspace-page__header">
          <div>
            <p class="workspace-page__eyebrow">{{ copy().validationTitle }}</p>
            <h2>{{ copy().metaSchemaTitle }}</h2>
          </div>
        </div>
        @if (workspace.validationIssues().length === 0) {
          <thy-result thyStatus="success" [thyTitle]="copy().noValidationIssues" [thySubtitle]="copy().routeConfigDescription"></thy-result>
        } @else {
          <div class="workspace-page__list">
            @for (issue of workspace.validationIssues(); track issue.path + issue.message) {
              <div class="workspace-page__card">
                <strong>{{ issue.path }}</strong>
                <span>{{ issue.message }}</span>
              </div>
            }
          </div>
        }
        @if (workspace.metaSchemaDraft()) {
          <pre class="workspace-page__code">{{ workspace.metaSchemaDraft() }}</pre>
        } @else {
          <thy-empty thyIconName="file-text" [thyMessage]="copy().metaSchemaTitle"></thy-empty>
        }
      </thy-card>
    </div>
  `,
  styles: [
    `
      .workspace-page {
        margin: 0 auto;
        width: 100%;
        display: grid;
        grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
        gap: 12px;
      }
      .workspace-page__panel {
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid #dbe4ff;
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
        padding: 12px;
      }
      .workspace-page__header, .workspace-page__actions, .workspace-page__row {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
      }
      .workspace-page__eyebrow { text-transform: uppercase; letter-spacing: .12em; font-size: 11px; font-weight: 700; color: #0f766e; }
      .workspace-page__card { border: 1px solid #dbe4ff; border-radius: 12px; padding: 10px; display: grid; gap: 8px; margin-top: 8px; }
      .workspace-page__list { display: grid; gap: 6px; }
      .workspace-page__tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
      .workspace-page__input { border: 1px solid #cbd5e1; border-radius: 12px; background: #fff; }
      .workspace-page__input { padding: 8px 10px; }
      .workspace-page__input--compact { padding: 6px 8px; }
      .workspace-page__ok { color: #0f766e; font-weight: 600; }
      .workspace-page__code { background: #0f172a; color: #e2e8f0; padding: 10px; border-radius: 12px; overflow: auto; font-size: 11px; }
      @media (max-width: 1100px) { .workspace-page { grid-template-columns: 1fr; } }
    `
  ]
})
export class DemoModelPageComponent {
  protected readonly workspace = inject(DemoWorkspaceService);
  protected readonly copy = computed(() => getDemoProjectI18n(this.workspace.locale()));
}
