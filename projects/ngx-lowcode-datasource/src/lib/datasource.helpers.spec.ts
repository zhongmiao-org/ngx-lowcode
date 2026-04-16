import type { NgxLowcodeMetaTableDraft } from '@zhongmiao/ngx-lowcode-meta-model';
import {
  bindDatasourceToNode,
  createCrudPageSchema,
  createDatasourceDraftFromTable,
  createQueryPageSchema,
  labelizeField,
  validateDatasourceDraft
} from './datasource.helpers';

describe('ngx-lowcode-datasource', () => {
  const table: NgxLowcodeMetaTableDraft = {
    id: 'orders',
    name: 'orders',
    label: 'Orders',
    kind: 'root' as const,
    columns: [
      { id: 'id', name: 'id', type: 'string', required: true, primary: true },
      { id: 'owner', name: 'owner', type: 'string', required: true, primary: false },
      { id: 'status', name: 'status', type: 'string', required: false, primary: false },
      { id: 'tenant_id', name: 'tenant_id', type: 'string', required: true, primary: false }
    ]
  };

  it('creates datasource drafts from model tables and validates them', () => {
    const draft = createDatasourceDraftFromTable(table, table.columns);

    expect(draft.id).toBe('orders-resource');
    expect(draft.keyField).toBe('id');
    expect(draft.fields.map((field) => field.name)).toEqual(['id', 'owner', 'status']);
    expect(validateDatasourceDraft(draft)).toEqual([]);
  });

  it('generates query and crud schemas with datasource-backed actions', () => {
    const draft = createDatasourceDraftFromTable(table, table.columns);
    const querySchema = createQueryPageSchema(draft, 'tenant-a');
    const crudSchema = createCrudPageSchema(draft, 'tenant-a');

    expect(querySchema.datasources[0]?.id).toBe('orders-query-datasource');
    expect(querySchema.actions.map((action) => action.id)).toEqual(['search-action', 'reset-filters-action']);
    expect(crudSchema.actions.map((action) => action.id)).toEqual(
      jasmine.arrayContaining([
        'search-action',
        'create-record-action',
        'update-record-action',
        'delete-record-action',
        'select-row-action'
      ])
    );
  });

  it('binds datasource metadata onto a table node', () => {
    const draft = createDatasourceDraftFromTable(table, table.columns);
    const schema = createCrudPageSchema(draft, 'tenant-a');
    const bound = bindDatasourceToNode(schema, {
      nodeId: 'results-table',
      datasourceId: 'orders-query-datasource',
      dataKey: 'tableData',
      rowClickActionId: 'select-row-action'
    });
    const resultsTable = bound.layoutTree[0]?.children?.find((child) => child.id === 'results-table');

    expect(resultsTable?.props).toEqual(
      jasmine.objectContaining({
        datasourceId: 'orders-query-datasource',
        dataKey: 'tableData',
        rowClickActionId: 'select-row-action'
      })
    );
  });

  it('labelizes underscored field names for generated forms', () => {
    expect(labelizeField('customer_id')).toBe('Customer Id');
  });
});
