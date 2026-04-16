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

export type DemoPermissionScope = 'SELF' | 'DEPT' | 'DEPT_AND_CHILDREN' | 'CUSTOM_ORG_SET' | 'TENANT_ALL';

export interface DemoPermissionApiConfig {
  queryEndpoint: string;
  mutationEndpoint: string;
  roles: string[];
  selectedOrgId: string;
  permissionScope: DemoPermissionScope;
  customOrgIds: string[];
  stateKeys: {
    tenantId: string;
    userId: string;
    roles: string;
    selectedRecordId: string;
  };
  orgIdStateKeys: string[];
}

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
  readonly permissionApiConfig = computed(() => this.readPermissionApiConfig());
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
    this.addRelation(orders.id, 'customer_id', customers.id, 'id', 'many-to-one');
  }

  addRelation(
    fromTableId: string,
    fromColumnId: string,
    toTableId: string,
    toColumnId: string,
    kind: 'many-to-one' | 'one-to-many' = 'many-to-one'
  ): void {
    const model = this.metaModel();
    if (!fromTableId || !fromColumnId || !toTableId || !toColumnId) {
      return;
    }
    const fromExists = model.tables.some((table) => table.id === fromTableId && table.columns.some((column) => column.id === fromColumnId));
    const toExists = model.tables.some((table) => table.id === toTableId && table.columns.some((column) => column.id === toColumnId));
    if (!fromExists || !toExists) {
      return;
    }
    const relationId = this.nextRelationId();
    this.metaModel.set(
      appendRelationDraft(
        model,
        createMetaRelationDraft(relationId, `${fromTableId}.${fromColumnId} -> ${toTableId}.${toColumnId}`, fromTableId, fromColumnId, toTableId, toColumnId, kind)
      )
    );
    this.lastCommand.set(`relation added: ${relationId}`);
  }

  updateRelation(
    relationId: string,
    patch: Partial<{
      fromTableId: string;
      fromColumnId: string;
      toTableId: string;
      toColumnId: string;
      kind: 'many-to-one' | 'one-to-many';
    }>
  ): void {
    this.metaModel.update((model) => ({
      ...model,
      relations: model.relations.map((relation) => {
        if (relation.id !== relationId) {
          return relation;
        }
        const next = {
          ...relation,
          ...patch
        };
        return {
          ...next,
          name: `${next.fromTableId}.${next.fromColumnId} -> ${next.toTableId}.${next.toColumnId}`
        };
      })
    }));
    this.lastCommand.set(`relation updated: ${relationId}`);
  }

  removeRelation(relationId: string): void {
    this.metaModel.update((model) => ({
      ...model,
      relations: model.relations.filter((relation) => relation.id !== relationId)
    }));
    this.lastCommand.set(`relation removed: ${relationId}`);
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

  updatePermissionApiConfig(config: Partial<DemoPermissionApiConfig>): void {
    this.schema.update((schema) => {
      const current = this.readPermissionApiConfig(schema);
      const nextRoles = config.roles ? normalizeRoles(config.roles) : current.roles;
      const nextSelectedOrgId = config.selectedOrgId ?? current.selectedOrgId;
      const nextScope = config.permissionScope ?? current.permissionScope;
      const nextCustomOrgIds = config.customOrgIds ? normalizeOrgIds(config.customOrgIds) : current.customOrgIds;
      const nextStateKeys = {
        ...current.stateKeys,
        ...(config.stateKeys ?? {})
      };
      const nextOrgIdStateKeys = config.orgIdStateKeys ? normalizeOrgIdStateKeys(config.orgIdStateKeys) : current.orgIdStateKeys;

      return {
        ...schema,
        state: {
          ...schema.state,
          roles: nextRoles,
          selectedOrgId: nextSelectedOrgId
        },
        datasources: schema.datasources.map((datasource) =>
          this.patchDatasourcePermissionApiConfig(
            datasource,
            {
              queryEndpoint: config.queryEndpoint ?? current.queryEndpoint,
              mutationEndpoint: config.mutationEndpoint ?? current.mutationEndpoint,
              permissionScope: nextScope,
              customOrgIds: nextCustomOrgIds,
              stateKeys: nextStateKeys,
              orgIdStateKeys: nextOrgIdStateKeys
            }
          )
        )
      };
    });
    this.lastCommand.set('permission/api config updated');
  }

  private countNodes(nodes: NgxLowcodeNodeSchema[]): number {
    return nodes.reduce((total, node) => total + 1 + this.countNodes(node.children ?? []), 0);
  }

  private findTableLabel(tableId: string): string {
    return this.metaModel().tables.find((table) => table.id === tableId)?.label ?? tableId;
  }

  private readPermissionApiConfig(schema = this.schema()): DemoPermissionApiConfig {
    const queryDatasource =
      schema.datasources.find((datasource) => datasource.id.endsWith('-query-datasource')) ?? schema.datasources[0];
    const mutationDatasource =
      schema.datasources.find((datasource) => datasource.id.endsWith('-update-datasource')) ??
      schema.datasources.find((datasource) => datasource.id.endsWith('-create-datasource')) ??
      schema.datasources.find((datasource) => datasource.id.endsWith('-delete-datasource')) ??
      schema.datasources[0];
    const queryParams = (queryDatasource?.request?.params as Record<string, unknown> | undefined) ?? {};
    const mutationParams = (mutationDatasource?.request?.params as Record<string, unknown> | undefined) ?? {};
    const queryStateKeys = (queryParams['stateKeys'] as Record<string, unknown> | undefined) ?? {};
    const mutationStateKeys = (mutationParams['stateKeys'] as Record<string, unknown> | undefined) ?? {};
    const orgIdStateKeys =
      (mutationParams['orgIdStateKeys'] as string[] | undefined) ??
      (queryParams['orgIdStateKeys'] as string[] | undefined) ??
      ['selectedOrgId', 'orgId', 'form_org_id', 'org_id'];
    const permissionScopeRaw = mutationParams['permissionScope'] ?? queryParams['permissionScope'];
    const customOrgIdsRaw = mutationParams['customOrgIds'] ?? queryParams['customOrgIds'];

    return {
      queryEndpoint: String(queryDatasource?.request?.url ?? '/query'),
      mutationEndpoint: String(mutationDatasource?.request?.url ?? '/mutation'),
      roles: normalizeRoles(schema.state['roles']),
      selectedOrgId: String(schema.state['selectedOrgId'] ?? ''),
      permissionScope: isPermissionScope(permissionScopeRaw) ? permissionScopeRaw : 'DEPT',
      customOrgIds: normalizeOrgIds(customOrgIdsRaw),
      stateKeys: {
        tenantId: String(queryStateKeys['tenantId'] ?? 'tenantId'),
        userId: String(queryStateKeys['userId'] ?? 'userId'),
        roles: String(queryStateKeys['roles'] ?? 'roles'),
        selectedRecordId: String(mutationStateKeys['selectedRecordId'] ?? 'selectedOrderId')
      },
      orgIdStateKeys: normalizeOrgIdStateKeys(orgIdStateKeys)
    };
  }

  private patchDatasourcePermissionApiConfig(
    datasource: NgxLowcodePageSchema['datasources'][number],
    config: Omit<DemoPermissionApiConfig, 'roles' | 'selectedOrgId'>
  ): NgxLowcodePageSchema['datasources'][number] {
    const params = {
      ...(datasource.request?.params ?? {})
    };
    const baseRequest = {
      ...(datasource.request ?? {})
    };
    const isQuery = datasource.id.endsWith('-query-datasource');
    const isMutation =
      datasource.id.endsWith('-create-datasource') ||
      datasource.id.endsWith('-update-datasource') ||
      datasource.id.endsWith('-delete-datasource');

    if (!isQuery && !isMutation) {
      return datasource;
    }

    const stateKeys = {
      tenantId: config.stateKeys.tenantId,
      userId: config.stateKeys.userId,
      roles: config.stateKeys.roles,
      ...(isMutation ? { selectedRecordId: config.stateKeys.selectedRecordId } : {})
    };

    return {
      ...datasource,
      request: {
        ...baseRequest,
        url: isQuery ? config.queryEndpoint : config.mutationEndpoint,
        params: {
          ...params,
          stateKeys,
          orgIdStateKeys: [...config.orgIdStateKeys],
          permissionScope: config.permissionScope,
          customOrgIds: [...config.customOrgIds]
        }
      }
    };
  }

  private nextRelationId(): string {
    const existingIds = new Set(this.metaModel().relations.map((relation) => relation.id));
    let nextIndex = this.metaModel().relations.length + 1;
    let nextId = `relation_${nextIndex}`;
    while (existingIds.has(nextId)) {
      nextIndex += 1;
      nextId = `relation_${nextIndex}`;
    }
    return nextId;
  }
}

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function normalizeRoles(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input
      .map((item) => String(item).trim())
      .filter((item) => item.length > 0);
  }
  if (typeof input === 'string') {
    return input
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return ['USER'];
}

function normalizeOrgIds(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input
      .map((item) => String(item).trim())
      .filter((item) => item.length > 0);
  }
  if (typeof input === 'string') {
    return input
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return [];
}

function normalizeOrgIdStateKeys(input: unknown): string[] {
  const keys = normalizeOrgIds(input);
  return keys.length > 0 ? keys : ['selectedOrgId', 'orgId', 'form_org_id', 'org_id'];
}

function isPermissionScope(input: unknown): input is DemoPermissionScope {
  return input === 'SELF' || input === 'DEPT' || input === 'DEPT_AND_CHILDREN' || input === 'CUSTOM_ORG_SET' || input === 'TENANT_ALL';
}
