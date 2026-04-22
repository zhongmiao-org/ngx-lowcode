import {
  appendIndexDraft,
  appendRelationDraft,
  appendTableDraft,
  createCommerceModelPreset,
  createMetaColumnDraft,
  createMetaIndexDraft,
  createMetaModelDraft,
  createMetaRelationDraft,
  createMetaTableDraft,
  toMetaSchemaDraft,
  validateMetaModelDraft
} from './meta-model.helpers';

describe('ngx-lowcode-meta-model', () => {
  it('creates a commerce preset with child tables, relations and indexes', () => {
    const model = createCommerceModelPreset();

    expect(model.tables.map((table) => table.id)).toEqual(['orders', 'order_items', 'customers']);
    expect(model.tables.find((table) => table.id === 'order_items')?.parentTableId).toBe('orders');
    expect(model.relations.length).toBe(2);
    expect(model.indexes.length).toBe(3);
    expect(validateMetaModelDraft(model)).toEqual([]);
  });

  it('reports duplicate columns, unknown foreign keys and invalid indexes', () => {
    let model = createMetaModelDraft();
    model = appendTableDraft(model, {
      ...createMetaTableDraft('orders', 'orders'),
      columns: [
        createMetaColumnDraft('id', 'id', 'string', { primary: true }),
        createMetaColumnDraft('dup-1', 'owner'),
        createMetaColumnDraft('dup-2', 'owner')
      ]
    });
    model = appendRelationDraft(
      model,
      createMetaRelationDraft('missing', 'bad fk', 'orders', 'missing_column', 'customers', 'id')
    );
    model = appendIndexDraft(model, createMetaIndexDraft('invalid', 'invalid_idx', 'orders', ['missing_column']));

    const issues = validateMetaModelDraft(model);

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'tables.0.columns.2.name' }),
        expect.objectContaining({ path: 'relations.0.fromColumnId' }),
        expect.objectContaining({ path: 'relations.0.toTableId' }),
        expect.objectContaining({ path: 'indexes.0.columnIds.0' })
      ])
    );
  });

  it('maps the draft into a meta-schema shaped payload', () => {
    const schemaDraft = toMetaSchemaDraft(createCommerceModelPreset());

    expect(schemaDraft.tables[0]).toEqual(
      expect.objectContaining({
        name: 'orders'
      })
    );
    expect(schemaDraft.relations[0]).toEqual(
      expect.objectContaining({
        fromTable: 'orders'
      })
    );
    expect(schemaDraft.indexes[0]).toEqual(
      expect.objectContaining({
        table: 'orders'
      })
    );
  });
});
