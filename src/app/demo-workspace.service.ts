import { Injectable, computed, signal } from '@angular/core';
import type { NgxLowcodeNodeSchema, NgxLowcodePageSchema } from 'ngx-lowcode-core-types';
import { bindDatasourceToNode, createDatasourceDraftsFromModel, type NgxLowcodeDatasourceDraft } from 'ngx-lowcode-datasource';
import {
  appendColumnDraft,
  appendIndexDraft,
  appendRelationDraft,
  appendTableDraft,
  createCommerceModelPreset,
  createMetaColumnDraft,
  createMetaIndexDraft,
  createMetaRelationDraft,
  createMetaTableDraft,
  toMetaSchemaDraft,
  validateMetaModelDraft,
  type NgxLowcodeMetaColumnType,
  type NgxLowcodeMetaIndexDraft,
  type NgxLowcodeMetaModelDraft
} from 'ngx-lowcode-meta-model';
import { NgxLowcodeDesignerLocale } from 'ngx-lowcode-i18n';
import { createDemoGeneratedSchema, createOrdersDemoSchema } from './demo-project-schema';

@Injectable({ providedIn: 'root' })
export class DemoWorkspaceService {
  readonly projectId = signal<'commerce-core' | 'crm-ops'>('commerce-core');
  readonly tenantId = signal<'tenant-a' | 'tenant-b'>('tenant-a');
  readonly locale = signal<NgxLowcodeDesignerLocale>('zh-CN');
  readonly metaModel = signal<NgxLowcodeMetaModelDraft>(createCommerceModelPreset());
  readonly datasourceDrafts = signal<NgxLowcodeDatasourceDraft[]>(createDatasourceDraftsFromModel(this.metaModel()));
  readonly selectedTableId = signal(this.metaModel().tables[0]?.id ?? '');
  readonly selectedDatasourceId = signal('orders-resource');
  readonly schema = signal<NgxLowcodePageSchema>(createOrdersDemoSchema(this.tenantId()));
  readonly lastCommand = signal('workspace ready');
  readonly validationIssues = computed(() => validateMetaModelDraft(this.metaModel()));
  readonly metaSchemaDraft = computed(() => JSON.stringify(toMetaSchemaDraft(this.metaModel()), null, 2));
  readonly nodeCount = computed(() => this.countNodes(this.schema().layoutTree));
  readonly previewRoutePath = computed(() => `/preview/${this.schema().pageMeta.id}`);
  readonly routeMenuTitle = computed(() => `${this.projectId()}:${this.schema().pageMeta.title}`);
  readonly previewRouteConfig = computed(() =>
    JSON.stringify(
      {
        path: this.previewRoutePath(),
        component: 'LowcodePagePreviewComponent',
        pageId: this.schema().pageMeta.id,
        tenant: this.tenantId()
      },
      null,
      2
    )
  );
  readonly selectedDatasource = computed(
    () => this.datasourceDrafts().find((draft) => draft.id === this.selectedDatasourceId()) ?? this.datasourceDrafts()[0] ?? null
  );
  readonly selectedTable = computed(
    () => this.metaModel().tables.find((table) => table.id === this.selectedTableId()) ?? this.metaModel().tables[0] ?? null
  );

  switchTenant(tenantId: 'tenant-a' | 'tenant-b'): void {
    this.tenantId.set(tenantId);
    const selectedDatasource = this.selectedDatasource();
    if (selectedDatasource) {
      this.schema.set(
        createDemoGeneratedSchema(
          selectedDatasource,
          tenantId,
          this.schema().pageMeta.id.includes('query') ? 'query' : 'crud'
        )
      );
    }
    this.lastCommand.set(`tenant switched: ${tenantId}`);
  }

  switchProject(projectId: 'commerce-core' | 'crm-ops'): void {
    this.projectId.set(projectId);
    this.lastCommand.set(`project switched: ${projectId}`);
  }

  resetWorkspace(): void {
    this.metaModel.set(createCommerceModelPreset());
    const drafts = createDatasourceDraftsFromModel(this.metaModel());
    this.selectedTableId.set(this.metaModel().tables[0]?.id ?? '');
    this.datasourceDrafts.set(drafts);
    this.selectedDatasourceId.set(drafts[0]?.id ?? '');
    this.schema.set(createOrdersDemoSchema(this.tenantId()));
    this.lastCommand.set('workspace reset');
  }

  rebuildModelPreset(): void {
    this.metaModel.set(createCommerceModelPreset());
    this.selectedTableId.set(this.metaModel().tables[0]?.id ?? '');
    this.lastCommand.set('model preset rebuilt');
  }

  addTable(): void {
    const tableId = `table_${this.metaModel().tables.length + 1}`;
    this.metaModel.set(
      appendTableDraft(this.metaModel(), {
        ...createMetaTableDraft(tableId, tableId, `Generated ${this.metaModel().tables.length + 1}`),
        columns: [
          createMetaColumnDraft('id', 'id', 'string', { primary: true, required: true }),
          createMetaColumnDraft('name', 'name', 'string', { required: true }),
          createMetaColumnDraft('status', 'status', 'string')
        ]
      })
    );
    this.selectedTableId.set(tableId);
    this.lastCommand.set(`table added: ${tableId}`);
  }

  addColumn(tableId: string): void {
    const currentTable = this.metaModel().tables.find((table) => table.id === tableId);
    const nextIndex = (currentTable?.columns.length ?? 0) + 1;
    this.metaModel.set(
      appendColumnDraft(this.metaModel(), tableId, createMetaColumnDraft(`field_${nextIndex}`, `field_${nextIndex}`))
    );
    this.lastCommand.set(`column added: ${tableId}.field_${nextIndex}`);
  }

  addChildTable(parentTableId: string): void {
    const childId = `${parentTableId}_detail_${this.metaModel().tables.filter((table) => table.parentTableId === parentTableId).length + 1}`;
    this.metaModel.set(
      appendTableDraft(this.metaModel(), {
        ...createMetaTableDraft(childId, childId, `${this.findTableLabel(parentTableId)} Detail`, 'child', parentTableId),
        columns: [
          createMetaColumnDraft('id', 'id', 'string', { primary: true, required: true }),
          createMetaColumnDraft(`${parentTableId}_id`, `${parentTableId}_id`, 'string', { required: true }),
          createMetaColumnDraft('line_status', 'line_status', 'string')
        ]
      })
    );
    this.selectedTableId.set(childId);
    this.lastCommand.set(`child table added: ${childId}`);
  }

  addForeignKey(): void {
    const model = this.metaModel();
    const orders = model.tables.find((table) => table.id === 'orders') ?? model.tables[0];
    const customers = model.tables.find((table) => table.id === 'customers') ?? model.tables[1];
    if (!orders || !customers) {
      return;
    }
    const relationId = `${orders.id}-${customers.id}-${model.relations.length + 1}`;
    this.metaModel.set(
      appendRelationDraft(
        model,
        createMetaRelationDraft(relationId, `${orders.id} -> ${customers.id}`, orders.id, 'customer_id', customers.id, 'id')
      )
    );
    this.lastCommand.set(`foreign key added: ${relationId}`);
  }

  addIndex(tableId: string): void {
    const table = this.metaModel().tables.find((candidate) => candidate.id === tableId);
    if (!table || table.columns.length === 0) {
      return;
    }
    const columnIds = table.columns.slice(0, Math.min(2, table.columns.length)).map((column) => column.id);
    const indexId = `${tableId}-idx-${this.metaModel().indexes.length + 1}`;
    this.metaModel.set(
      appendIndexDraft(
        this.metaModel(),
        createMetaIndexDraft(indexId, `${tableId}_${columnIds.join('_')}_idx`, tableId, columnIds)
      )
    );
    this.lastCommand.set(`index added: ${indexId}`);
  }

  renameTable(tableId: string, label: string): void {
    this.metaModel.update((model) => ({
      ...model,
      tables: model.tables.map((table) => (table.id === tableId ? { ...table, label, name: slugify(label) } : table))
    }));
  }

  renameColumn(tableId: string, columnId: string, name: string): void {
    this.metaModel.update((model) => ({
      ...model,
      tables: model.tables.map((table) =>
        table.id === tableId
          ? {
              ...table,
              columns: table.columns.map((column) =>
                column.id === columnId ? { ...column, name: slugify(name) } : column
              )
            }
          : table
      )
    }));
  }

  setColumnType(tableId: string, columnId: string, type: NgxLowcodeMetaColumnType): void {
    this.metaModel.update((model) => ({
      ...model,
      tables: model.tables.map((table) =>
        table.id === tableId
          ? {
              ...table,
              columns: table.columns.map((column) => (column.id === columnId ? { ...column, type } : column))
            }
          : table
      )
    }));
    this.lastCommand.set(`column type updated: ${tableId}.${columnId} -> ${type}`);
  }

  setColumnRequired(tableId: string, columnId: string, required: boolean): void {
    this.metaModel.update((model) => ({
      ...model,
      tables: model.tables.map((table) =>
        table.id === tableId
          ? {
              ...table,
              columns: table.columns.map((column) =>
                column.id === columnId ? { ...column, required: column.primary ? true : required } : column
              )
            }
          : table
      )
    }));
    this.lastCommand.set(`column required updated: ${tableId}.${columnId} -> ${required}`);
  }

  setColumnPrimary(tableId: string, columnId: string, primary: boolean): void {
    this.metaModel.update((model) => ({
      ...model,
      tables: model.tables.map((table) =>
        table.id === tableId
          ? {
              ...table,
              columns: table.columns.map((column) => {
                if (primary) {
                  return column.id === columnId
                    ? { ...column, primary: true, required: true }
                    : { ...column, primary: false };
                }
                return column.id === columnId ? { ...column, primary: false } : column;
              })
            }
          : table
      )
    }));
    this.lastCommand.set(`column primary updated: ${tableId}.${columnId} -> ${primary}`);
  }

  removeTable(tableId: string): void {
    this.metaModel.update((model) => ({
      ...model,
      tables: model.tables.filter((table) => table.id !== tableId && table.parentTableId !== tableId),
      relations: model.relations.filter((relation) => relation.fromTableId !== tableId && relation.toTableId !== tableId),
      indexes: model.indexes.filter((index) => index.tableId !== tableId)
    }));
    if (this.selectedTableId() === tableId) {
      const nextTable = this.metaModel().tables.find((table) => table.id !== tableId && table.parentTableId !== tableId);
      this.selectedTableId.set(nextTable?.id ?? '');
    }
    this.lastCommand.set(`table removed: ${tableId}`);
  }

  removeColumn(tableId: string, columnId: string): void {
    this.metaModel.update((model) => ({
      ...model,
      tables: model.tables.map((table) =>
        table.id === tableId
          ? {
              ...table,
              columns: table.columns.filter((column) => column.id !== columnId)
            }
          : table
      ),
      relations: model.relations.filter(
        (relation) =>
          !(
            (relation.fromTableId === tableId && relation.fromColumnId === columnId) ||
            (relation.toTableId === tableId && relation.toColumnId === columnId)
          )
      ),
      indexes: model.indexes.map((index: NgxLowcodeMetaIndexDraft) =>
        index.tableId === tableId
          ? {
              ...index,
              columnIds: index.columnIds.filter((candidate) => candidate !== columnId)
            }
          : index
      )
    }));
    this.lastCommand.set(`column removed: ${tableId}.${columnId}`);
  }

  createDatasources(): void {
    const drafts = createDatasourceDraftsFromModel(this.metaModel());
    this.datasourceDrafts.set(drafts);
    this.selectedDatasourceId.set(drafts[0]?.id ?? '');
    this.lastCommand.set('datasources regenerated from model');
  }

  selectTable(tableId: string): void {
    this.selectedTableId.set(tableId);
  }

  selectDatasource(datasourceId: string): void {
    this.selectedDatasourceId.set(datasourceId);
  }

  bindResultTable(): void {
    const selectedDatasource = this.selectedDatasource();
    if (!selectedDatasource) {
      return;
    }
    this.schema.set(
      bindDatasourceToNode(this.schema(), {
        nodeId: 'results-table',
        datasourceId: `${selectedDatasource.tableId}-query-datasource`,
        dataKey: 'tableData',
        rowClickActionId: 'select-row-action'
      })
    );
    this.lastCommand.set(`bound datasource: ${selectedDatasource.tableId}`);
  }

  generateCrudPage(): void {
    const selectedDatasource = this.selectedDatasource();
    if (!selectedDatasource) {
      return;
    }
    this.schema.set(createDemoGeneratedSchema(selectedDatasource, this.tenantId(), 'crud'));
    this.lastCommand.set(`crud page generated: ${selectedDatasource.tableId}`);
  }

  generateQueryPage(): void {
    const selectedDatasource = this.selectedDatasource();
    if (!selectedDatasource) {
      return;
    }
    this.schema.set(createDemoGeneratedSchema(selectedDatasource, this.tenantId(), 'query'));
    this.lastCommand.set(`query page generated: ${selectedDatasource.tableId}`);
  }

  private countNodes(nodes: NgxLowcodeNodeSchema[]): number {
    return nodes.reduce((total, node) => total + 1 + this.countNodes(node.children ?? []), 0);
  }

  private findTableLabel(tableId: string): string {
    return this.metaModel().tables.find((table) => table.id === tableId)?.label ?? tableId;
  }
}

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
