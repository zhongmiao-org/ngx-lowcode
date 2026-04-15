import type { NgxLowcodeMetaColumnDraft, NgxLowcodeMetaColumnType, NgxLowcodeMetaIndexDraft, NgxLowcodeMetaModelDraft, NgxLowcodeMetaModelValidationIssue, NgxLowcodeMetaRelationDraft, NgxLowcodeMetaTableDraft, NgxLowcodeMetaTableKind } from './meta-model.types';

export function createMetaModelDraft(
  id = 'commerce-workspace',
  name = 'Commerce Workspace',
  description = 'Design-time commerce model workspace.'
): NgxLowcodeMetaModelDraft {
  return {
    id,
    name,
    description,
    tables: [],
    relations: [],
    indexes: []
  };
}

export function createMetaTableDraft(
  id: string,
  name: string,
  label = humanize(name),
  kind: NgxLowcodeMetaTableKind = 'root',
  parentTableId?: string
): NgxLowcodeMetaTableDraft {
  return {
    id,
    name,
    label,
    kind,
    parentTableId,
    columns: []
  };
}

export function createMetaColumnDraft(
  id: string,
  name: string,
  type: NgxLowcodeMetaColumnType = 'string',
  options: Partial<Pick<NgxLowcodeMetaColumnDraft, 'required' | 'primary'>> = {}
): NgxLowcodeMetaColumnDraft {
  return {
    id,
    name,
    type,
    required: options.required ?? false,
    primary: options.primary ?? false
  };
}

export function createMetaRelationDraft(
  id: string,
  name: string,
  fromTableId: string,
  fromColumnId: string,
  toTableId: string,
  toColumnId: string,
  kind: NgxLowcodeMetaRelationDraft['kind'] = 'many-to-one'
): NgxLowcodeMetaRelationDraft {
  return {
    id,
    name,
    fromTableId,
    fromColumnId,
    toTableId,
    toColumnId,
    kind
  };
}

export function createMetaIndexDraft(
  id: string,
  name: string,
  tableId: string,
  columnIds: string[],
  unique = false
): NgxLowcodeMetaIndexDraft {
  return {
    id,
    name,
    tableId,
    columnIds,
    unique
  };
}

export function appendTableDraft(
  model: NgxLowcodeMetaModelDraft,
  table: NgxLowcodeMetaTableDraft
): NgxLowcodeMetaModelDraft {
  return {
    ...model,
    tables: [...model.tables, table]
  };
}

export function appendColumnDraft(
  model: NgxLowcodeMetaModelDraft,
  tableId: string,
  column: NgxLowcodeMetaColumnDraft
): NgxLowcodeMetaModelDraft {
  return {
    ...model,
    tables: model.tables.map((table) =>
      table.id === tableId
        ? {
            ...table,
            columns: [...table.columns, column]
          }
        : table
    )
  };
}

export function appendRelationDraft(
  model: NgxLowcodeMetaModelDraft,
  relation: NgxLowcodeMetaRelationDraft
): NgxLowcodeMetaModelDraft {
  return {
    ...model,
    relations: [...model.relations, relation]
  };
}

export function appendIndexDraft(
  model: NgxLowcodeMetaModelDraft,
  index: NgxLowcodeMetaIndexDraft
): NgxLowcodeMetaModelDraft {
  return {
    ...model,
    indexes: [...model.indexes, index]
  };
}

export function listTableColumns(model: NgxLowcodeMetaModelDraft, tableId: string): NgxLowcodeMetaColumnDraft[] {
  return model.tables.find((table) => table.id === tableId)?.columns ?? [];
}

export function validateMetaModelDraft(model: NgxLowcodeMetaModelDraft): NgxLowcodeMetaModelValidationIssue[] {
  const issues: NgxLowcodeMetaModelValidationIssue[] = [];
  const tableIds = new Set<string>();

  model.tables.forEach((table, tableIndex) => {
    if (!table.id.trim()) {
      issues.push({ path: `tables.${tableIndex}.id`, message: 'Table id is required.' });
    }
    if (tableIds.has(table.id)) {
      issues.push({ path: `tables.${tableIndex}.id`, message: `Duplicate table id "${table.id}".` });
    }
    tableIds.add(table.id);

    if (table.kind === 'child' && !table.parentTableId) {
      issues.push({ path: `tables.${tableIndex}.parentTableId`, message: 'Child tables must point to a parent table.' });
    }
    if (table.parentTableId && !model.tables.some((candidate) => candidate.id === table.parentTableId)) {
      issues.push({ path: `tables.${tableIndex}.parentTableId`, message: `Unknown parent table "${table.parentTableId}".` });
    }

    const columnNames = new Set<string>();
    table.columns.forEach((column, columnIndex) => {
      if (!column.id.trim()) {
        issues.push({ path: `tables.${tableIndex}.columns.${columnIndex}.id`, message: 'Column id is required.' });
      }
      if (!column.name.trim()) {
        issues.push({ path: `tables.${tableIndex}.columns.${columnIndex}.name`, message: 'Column name is required.' });
      }
      if (columnNames.has(column.name)) {
        issues.push({
          path: `tables.${tableIndex}.columns.${columnIndex}.name`,
          message: `Duplicate column name "${column.name}" in table "${table.id}".`
        });
      }
      columnNames.add(column.name);
    });
  });

  model.relations.forEach((relation, relationIndex) => {
    const fromColumns = listTableColumns(model, relation.fromTableId);
    const toColumns = listTableColumns(model, relation.toTableId);
    if (fromColumns.length === 0) {
      issues.push({ path: `relations.${relationIndex}.fromTableId`, message: `Unknown relation source table "${relation.fromTableId}".` });
    }
    if (toColumns.length === 0) {
      issues.push({ path: `relations.${relationIndex}.toTableId`, message: `Unknown relation target table "${relation.toTableId}".` });
    }
    if (!fromColumns.some((column) => column.id === relation.fromColumnId)) {
      issues.push({
        path: `relations.${relationIndex}.fromColumnId`,
        message: `Unknown source column "${relation.fromColumnId}" on table "${relation.fromTableId}".`
      });
    }
    if (!toColumns.some((column) => column.id === relation.toColumnId)) {
      issues.push({
        path: `relations.${relationIndex}.toColumnId`,
        message: `Unknown target column "${relation.toColumnId}" on table "${relation.toTableId}".`
      });
    }
  });

  model.indexes.forEach((index, indexIndex) => {
    const tableColumns = listTableColumns(model, index.tableId);
    if (tableColumns.length === 0) {
      issues.push({ path: `indexes.${indexIndex}.tableId`, message: `Unknown index table "${index.tableId}".` });
      return;
    }
    if (index.columnIds.length === 0) {
      issues.push({ path: `indexes.${indexIndex}.columnIds`, message: 'Index must include at least one column.' });
      return;
    }
    index.columnIds.forEach((columnId, columnIndex) => {
      if (!tableColumns.some((column) => column.id === columnId)) {
        issues.push({
          path: `indexes.${indexIndex}.columnIds.${columnIndex}`,
          message: `Unknown indexed column "${columnId}" on table "${index.tableId}".`
        });
      }
    });
  });

  return issues;
}

export function toMetaSchemaDraft(model: NgxLowcodeMetaModelDraft): {
  tables: Array<{ name: string; fields: Array<{ name: string; type: string; required: boolean; primary: boolean }> }>;
  relations: Array<{ fromTable: string; fromColumn: string; toTable: string; toColumn: string; kind: string }>;
  indexes: Array<{ table: string; name: string; fields: string[]; unique: boolean }>;
} {
  return {
    tables: model.tables.map((table) => ({
      name: table.name,
      fields: table.columns.map((column) => ({
        name: column.name,
        type: column.type,
        required: column.required,
        primary: column.primary
      }))
    })),
    relations: model.relations.map((relation) => ({
      fromTable: relation.fromTableId,
      fromColumn: relation.fromColumnId,
      toTable: relation.toTableId,
      toColumn: relation.toColumnId,
      kind: relation.kind
    })),
    indexes: model.indexes.map((index) => ({
      table: index.tableId,
      name: index.name,
      fields: [...index.columnIds],
      unique: index.unique
    }))
  };
}

export function createCommerceModelPreset(): NgxLowcodeMetaModelDraft {
  let model = createMetaModelDraft(
    'commerce-demo',
    'Commerce Demo Workspace',
    'Order management workspace with child tables, foreign keys and indexes.'
  );

  const ordersTable = createMetaTableDraft('orders', 'orders', 'Orders');
  const orderItemsTable = createMetaTableDraft('order_items', 'order_items', 'Order Items', 'child', 'orders');
  const customersTable = createMetaTableDraft('customers', 'customers', 'Customers');

  model = appendTableDraft(model, {
    ...ordersTable,
    columns: [
      createMetaColumnDraft('id', 'id', 'string', { primary: true, required: true }),
      createMetaColumnDraft('owner', 'owner', 'string', { required: true }),
      createMetaColumnDraft('channel', 'channel', 'string'),
      createMetaColumnDraft('priority', 'priority', 'string'),
      createMetaColumnDraft('status', 'status', 'string'),
      createMetaColumnDraft('customer_id', 'customer_id', 'string'),
      createMetaColumnDraft('tenant_id', 'tenant_id', 'string', { required: true })
    ]
  });
  model = appendTableDraft(model, {
    ...orderItemsTable,
    columns: [
      createMetaColumnDraft('id', 'id', 'string', { primary: true, required: true }),
      createMetaColumnDraft('order_id', 'order_id', 'string', { required: true }),
      createMetaColumnDraft('sku', 'sku', 'string', { required: true }),
      createMetaColumnDraft('quantity', 'quantity', 'number', { required: true })
    ]
  });
  model = appendTableDraft(model, {
    ...customersTable,
    columns: [
      createMetaColumnDraft('id', 'id', 'string', { primary: true, required: true }),
      createMetaColumnDraft('name', 'name', 'string', { required: true }),
      createMetaColumnDraft('tier', 'tier', 'string')
    ]
  });

  model = appendRelationDraft(
    model,
    createMetaRelationDraft('orders-customer-fk', 'orders.customer_id -> customers.id', 'orders', 'customer_id', 'customers', 'id')
  );
  model = appendRelationDraft(
    model,
    createMetaRelationDraft('order-items-parent-fk', 'order_items.order_id -> orders.id', 'order_items', 'order_id', 'orders', 'id')
  );
  model = appendIndexDraft(model, createMetaIndexDraft('orders-owner-status-idx', 'orders_owner_status_idx', 'orders', ['owner', 'status']));
  model = appendIndexDraft(model, createMetaIndexDraft('orders-customer-idx', 'orders_customer_id_idx', 'orders', ['customer_id']));
  model = appendIndexDraft(model, createMetaIndexDraft('order-items-order-idx', 'order_items_order_id_idx', 'order_items', ['order_id']));

  return model;
}

function humanize(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (segment) => segment.toUpperCase());
}
