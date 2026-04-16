import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { getDemoProjectI18n } from '@zhongmiao/ngx-lowcode-i18n';
import { ThyButtonModule } from 'ngx-tethys/button';
import { ThyCardModule } from 'ngx-tethys/card';
import { ThyEmptyModule } from 'ngx-tethys/empty';
import { ThyResultModule } from 'ngx-tethys/result';
import { ThyTagModule } from 'ngx-tethys/tag';
import type { NgxLowcodeMetaColumnType } from '@zhongmiao/ngx-lowcode-meta-model';
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
                      <select
                        class="workspace-page__select workspace-page__input--compact"
                        [value]="column.type"
                        (change)="workspace.setColumnType(table.id, column.id, toColumnType($any($event.target).value))"
                      >
                        @for (type of columnTypes; track type) {
                          <option [value]="type">{{ type }}</option>
                        }
                      </select>
                      <thy-tags>
                        <thy-tag [thyColor]="column.primary ? 'danger' : (column.required ? 'success' : 'default')" thyTheme="weak-fill" thySize="sm">
                          {{ column.primary ? 'PK' : (column.required ? 'REQ' : 'OPT') }}
                        </thy-tag>
                      </thy-tags>
                      <label class="workspace-page__switch">
                        <input
                          type="checkbox"
                          [checked]="column.required"
                          [disabled]="column.primary"
                          (change)="workspace.setColumnRequired(table.id, column.id, $any($event.target).checked)"
                        />
                        Required
                      </label>
                      <label class="workspace-page__switch">
                        <input
                          type="checkbox"
                          [checked]="column.primary"
                          (change)="workspace.setColumnPrimary(table.id, column.id, $any($event.target).checked)"
                        />
                        Primary
                      </label>
                      <button thyButton="outline-danger" size="sm" (click)="workspace.removeColumn(table.id, column.id)">
                        Delete
                      </button>
                    </div>
                  }
                </div>
              </div>
            }

            <div class="workspace-page__card">
              <div class="workspace-page__header">
                <div>
                  <p class="workspace-page__eyebrow">ER</p>
                  <h3>Relations</h3>
                </div>
                <div class="workspace-page__actions">
                  <button thyButton="outline-primary" size="sm" (click)="addRelationRow()">Add Relation</button>
                </div>
              </div>

              @if (workspace.metaModel().relations.length === 0) {
                <div class="workspace-page__row">
                  <span>No relation configured yet.</span>
                </div>
              } @else {
                <div class="workspace-page__list">
                  @for (relation of workspace.metaModel().relations; track relation.id) {
                    <div class="workspace-page__row">
                      <select
                        class="workspace-page__select workspace-page__input--compact"
                        [value]="relation.fromTableId"
                        (change)="onRelationFromTableChange(relation.id, $any($event.target).value)"
                      >
                        @for (tableId of tableIds(); track tableId) {
                          <option [value]="tableId">{{ tableId }}</option>
                        }
                      </select>
                      <select
                        class="workspace-page__select workspace-page__input--compact"
                        [value]="relation.fromColumnId"
                        (change)="workspace.updateRelation(relation.id, { fromColumnId: $any($event.target).value })"
                      >
                        @for (columnId of columnsForTable(relation.fromTableId); track columnId) {
                          <option [value]="columnId">{{ columnId }}</option>
                        }
                      </select>
                      <select
                        class="workspace-page__select workspace-page__input--compact"
                        [value]="relation.kind"
                        (change)="workspace.updateRelation(relation.id, { kind: toRelationKind($any($event.target).value) })"
                      >
                        <option value="many-to-one">many-to-one</option>
                        <option value="one-to-many">one-to-many</option>
                      </select>
                      <select
                        class="workspace-page__select workspace-page__input--compact"
                        [value]="relation.toTableId"
                        (change)="onRelationToTableChange(relation.id, $any($event.target).value)"
                      >
                        @for (tableId of tableIds(); track tableId) {
                          <option [value]="tableId">{{ tableId }}</option>
                        }
                      </select>
                      <select
                        class="workspace-page__select workspace-page__input--compact"
                        [value]="relation.toColumnId"
                        (change)="workspace.updateRelation(relation.id, { toColumnId: $any($event.target).value })"
                      >
                        @for (columnId of columnsForTable(relation.toTableId); track columnId) {
                          <option [value]="columnId">{{ columnId }}</option>
                        }
                      </select>
                      <button thyButton="outline-danger" size="sm" (click)="workspace.removeRelation(relation.id)">Delete</button>
                    </div>
                  }
                </div>
              }
            </div>
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
      .workspace-page__select {
        border: 1px solid #cbd5e1;
        border-radius: 12px;
        background: #fff;
        padding: 6px 8px;
        min-width: 98px;
      }
      .workspace-page__switch {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #334155;
      }
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
  protected readonly tableIds = computed(() => this.workspace.metaModel().tables.map((table) => table.id));
  protected readonly columnTypes: readonly NgxLowcodeMetaColumnType[] = [
    'string',
    'text',
    'number',
    'boolean',
    'date',
    'datetime',
    'json'
  ];

  protected toColumnType(value: string): NgxLowcodeMetaColumnType {
    return this.columnTypes.includes(value as NgxLowcodeMetaColumnType)
      ? (value as NgxLowcodeMetaColumnType)
      : 'string';
  }

  protected addRelationRow(): void {
    const tableIds = this.tableIds();
    const fromTableId = tableIds[0] ?? '';
    const toTableId = tableIds[1] ?? tableIds[0] ?? '';
    const fromColumnId = this.columnsForTable(fromTableId)[0] ?? '';
    const toColumnId = this.columnsForTable(toTableId)[0] ?? '';
    this.workspace.addRelation(fromTableId, fromColumnId, toTableId, toColumnId);
  }

  protected columnsForTable(tableId: string): string[] {
    return this.workspace.metaModel().tables.find((table) => table.id === tableId)?.columns.map((column) => column.id) ?? [];
  }

  protected onRelationFromTableChange(relationId: string, tableId: string): void {
    const defaultColumnId = this.columnsForTable(tableId)[0] ?? '';
    this.workspace.updateRelation(relationId, { fromTableId: tableId, fromColumnId: defaultColumnId });
  }

  protected onRelationToTableChange(relationId: string, tableId: string): void {
    const defaultColumnId = this.columnsForTable(tableId)[0] ?? '';
    this.workspace.updateRelation(relationId, { toTableId: tableId, toColumnId: defaultColumnId });
  }

  protected toRelationKind(value: string): 'many-to-one' | 'one-to-many' {
    return value === 'one-to-many' ? 'one-to-many' : 'many-to-one';
  }
}
