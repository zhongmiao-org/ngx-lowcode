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
});
