import { TestBed } from '@angular/core/testing';
import { DemoWorkspaceService } from './demo-workspace.service';

describe('DemoWorkspaceService', () => {
  let service: DemoWorkspaceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DemoWorkspaceService);
  });

  it('keeps model, datasource and generated page workflow available', () => {
    expect(service.metaModel().tables.length).toBeGreaterThanOrEqual(3);

    service.addTable();
    service.addChildTable('orders');
    service.addForeignKey();
    service.createDatasources();
    service.selectedDatasourceId.set('customers-resource');
    service.generateQueryPage();
    expect(service.datasourceDrafts().map((draft) => draft.tableId)).toContain('customers');
    expect(service.schema().pageMeta.title).toContain('Customers');

    service.selectedDatasourceId.set('orders-resource');
    service.generateCrudPage();
    expect(service.schema().pageMeta.title).toContain('Orders');
  });

  it('switches tenant while preserving generated-route semantics', () => {
    service.generateQueryPage();
    service.switchTenant('tenant-b');

    expect(service.tenantId()).toBe('tenant-b');
    expect(service.schema().pageMeta.id).toContain('query');
  });

  it('supports table-designer field modeling for type/required/primary', () => {
    service.addTable();
    const tableId = service.selectedTableId();
    service.addColumn(tableId);
    const columnId = service
      .metaModel()
      .tables.find((table) => table.id === tableId)
      ?.columns.at(-1)?.id;
    expect(columnId).toBeTruthy();
    if (!columnId) {
      return;
    }

    service.setColumnType(tableId, columnId, 'number');
    service.setColumnRequired(tableId, columnId, true);
    let column = service
      .metaModel()
      .tables.find((table) => table.id === tableId)
      ?.columns.find((item) => item.id === columnId);
    expect(column?.type).toBe('number');
    expect(column?.required).toBeTrue();
    expect(column?.primary).toBeFalse();

    service.setColumnPrimary(tableId, columnId, true);
    column = service
      .metaModel()
      .tables.find((table) => table.id === tableId)
      ?.columns.find((item) => item.id === columnId);
    expect(column?.primary).toBeTrue();
    expect(column?.required).toBeTrue();

    service.setColumnRequired(tableId, columnId, false);
    column = service
      .metaModel()
      .tables.find((table) => table.id === tableId)
      ?.columns.find((item) => item.id === columnId);
    expect(column?.required).toBeTrue();
  });

  it('supports relation-designer modeling for add/update/remove relation', () => {
    const initialCount = service.metaModel().relations.length;
    service.addRelation('orders', 'customer_id', 'customers', 'id', 'many-to-one');
    expect(service.metaModel().relations.length).toBe(initialCount + 1);

    const relationId = service.metaModel().relations.at(-1)?.id;
    expect(relationId).toBeTruthy();
    if (!relationId) {
      return;
    }

    service.updateRelation(relationId, { kind: 'one-to-many', toTableId: 'orders', toColumnId: 'id' });
    const updated = service.metaModel().relations.find((relation) => relation.id === relationId);
    expect(updated?.kind).toBe('one-to-many');
    expect(updated?.toTableId).toBe('orders');
    expect(updated?.toColumnId).toBe('id');

    service.removeRelation(relationId);
    expect(service.metaModel().relations.find((relation) => relation.id === relationId)).toBeUndefined();
  });

  it('applies permission/api designer config into schema and state', () => {
    service.updatePermissionApiConfig({
      queryEndpoint: '/query-v2',
      mutationEndpoint: '/mutation-v2',
      roles: ['MANAGER', 'USER'],
      selectedOrgId: 'dept-a-1',
      permissionScope: 'DEPT_AND_CHILDREN',
      customOrgIds: ['dept-a-1', 'dept-a-2'],
      stateKeys: {
        tenantId: 'tenantId',
        userId: 'userId',
        roles: 'roles',
        selectedRecordId: 'selectedOrderId'
      },
      orgIdStateKeys: ['selectedOrgId', 'orgId']
    });

    expect(service.schema().state['roles']).toEqual(['MANAGER', 'USER']);
    expect(service.schema().state['selectedOrgId']).toBe('dept-a-1');
    const queryDatasource = service
      .schema()
      .datasources.find((datasource) => datasource.id.endsWith('-query-datasource'));
    const mutationDatasource = service
      .schema()
      .datasources.find((datasource) => datasource.id.endsWith('-update-datasource'));
    expect(queryDatasource?.request?.url).toBe('/query-v2');
    expect(mutationDatasource?.request?.url).toBe('/mutation-v2');
    expect((mutationDatasource?.request?.params?.['permissionScope'] as string) ?? '').toBe('DEPT_AND_CHILDREN');
  });

  it('exports snapshot json and restores from imported snapshot', async () => {
    service.addTable();
    const originalTableCount = service.metaModel().tables.length;
    const exported = service.exportCurrentSnapshotJson('spec-export');

    service.addTable();
    expect(service.metaModel().tables.length).toBe(originalTableCount + 1);

    await service.importSnapshotJsonAndRestore(exported);
    expect(service.metaModel().tables.length).toBe(originalTableCount);
    const listed = await service.listSnapshotPoints();
    expect(listed.length).toBeGreaterThan(0);
  });

  it('rejects snapshot import when checksum mismatches', async () => {
    const exported = JSON.parse(service.exportCurrentSnapshotJson('checksum-test')) as {
      metadata: { checksum: string };
    };
    exported.metadata.checksum = 'fnv1a-bad';

    await expectAsync(service.importSnapshotJsonAndRestore(JSON.stringify(exported))).toBeRejectedWithError(
      /checksum mismatch/
    );
  });
});
