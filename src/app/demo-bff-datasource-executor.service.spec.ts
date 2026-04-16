import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DemoBffDatasourceExecutorService } from './demo-bff-datasource-executor.service';

describe('DemoBffDatasourceExecutorService', () => {
  let service: DemoBffDatasourceExecutorService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(DemoBffDatasourceExecutorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('denies mutation when org scope does not allow target org', async () => {
    const promise = service.execute({
      datasource: {
        id: 'orders-update-datasource',
        type: 'middleware-command',
        request: {
          url: '/mutation',
          params: {
            operation: 'update',
            table: 'orders',
            fields: ['id', 'owner', 'org_id'],
            permissionScope: 'DEPT',
            stateKeys: {
              tenantId: 'tenantId',
              userId: 'userId',
              roles: 'roles',
              selectedRecordId: 'selectedOrderId'
            },
            orgIdStateKeys: ['form_org_id', 'selectedOrgId', 'orgId']
          }
        }
      },
      state: {
        tenantId: 'tenant-a',
        userId: 'demo-tenant-a-user',
        roles: ['USER'],
        selectedOrgId: 'dept-a',
        selectedOrderId: 'SO-A1001',
        form_org_id: 'dept-b',
        form_id: 'SO-A1001',
        form_owner: 'Alice',
        form_org_id_override: 'dept-b'
      }
    });

    await expectAsync(promise).toBeRejected();
    httpMock.expectNone('http://localhost:6000/mutation');
    expect(service.lastExecution().status).toBe('denied');
  });

  it('allows mutation when org scope includes target org', async () => {
    const promise = service.execute({
      datasource: {
        id: 'orders-update-datasource',
        type: 'middleware-command',
        request: {
          url: '/mutation',
          params: {
            operation: 'update',
            table: 'orders',
            fields: ['id', 'owner', 'org_id'],
            permissionScope: 'DEPT_AND_CHILDREN',
            stateKeys: {
              tenantId: 'tenantId',
              userId: 'userId',
              roles: 'roles',
              selectedRecordId: 'selectedOrderId'
            },
            orgIdStateKeys: ['selectedOrgId', 'orgId'],
            fieldStateMap: {
              id: 'form_id',
              owner: 'form_owner',
              org_id: 'form_org_id'
            }
          }
        }
      },
      state: {
        tenantId: 'tenant-a',
        userId: 'demo-tenant-a-user',
        roles: ['USER'],
        selectedOrgId: 'dept-a',
        selectedOrderId: 'SO-A1001',
        form_id: 'SO-A1001',
        form_owner: 'Updated Owner',
        form_org_id: 'dept-a-1'
      }
    });

    const request = httpMock.expectOne('http://localhost:6000/mutation');
    request.flush({
      rowCount: 1,
      row: {
        id: 'SO-A1001',
        owner: 'Updated Owner',
        org_id: 'dept-a-1',
        tenant_id: 'tenant-a'
      }
    });

    await expectAsync(promise).toBeResolved();
    expect(service.lastExecution().status).toBe('success');
  });
});
