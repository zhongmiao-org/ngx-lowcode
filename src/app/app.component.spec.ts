import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { NgxLowcodeRendererComponent } from 'ngx-lowcode-renderer';
import { DemoBffDatasourceExecutorService } from './demo-bff-datasource-executor.service';
import { createOrdersDemoSchema } from './app.component';

describe('src demo mainline regression', () => {
  let httpController: HttpTestingController;
  let demoExecutor: DemoBffDatasourceExecutorService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxLowcodeRendererComponent],
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting(), DemoBffDatasourceExecutorService]
    }).compileComponents();

    httpController = TestBed.inject(HttpTestingController);
    demoExecutor = TestBed.inject(DemoBffDatasourceExecutorService);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('queries tenant-scoped rows and records successful BFF execution', async () => {
    const fixture = TestBed.createComponent(NgxLowcodeRendererComponent);
    fixture.componentRef.setInput('schema', createOrdersDemoSchema('tenant-a'));
    fixture.componentRef.setInput('datasourceExecutor', demoExecutor.execute);
    await fixture.whenStable();

    const runtime = fixture.componentInstance.runtime();
    runtime.setState({
      owner: 'Alice',
      status: 'active'
    });

    const actionPromise = runtime.executeActionById('search-action');
    const request = httpController.expectOne('http://localhost:3000/query');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(
      jasmine.objectContaining({
        tenantId: 'tenant-a',
        userId: 'demo-tenant-a-user',
        roles: ['USER'],
        filters: {
          owner: 'Alice',
          status: 'active'
        }
      })
    );

    request.flush({
      rows: [{ id: 'SO-A1001', owner: 'Alice', channel: 'web', priority: 'high', status: 'active', tenant_id: 'tenant-a' }]
    });
    await actionPromise;

    expect(runtime.state()['tableData']).toEqual([
      { id: 'SO-A1001', owner: 'Alice', channel: 'web', priority: 'high', status: 'active', tenant_id: 'tenant-a' }
    ]);
    expect(demoExecutor.lastExecution()).toEqual(
      jasmine.objectContaining({
        source: 'bff',
        status: 'success',
        tenantId: 'tenant-a',
        rowCount: 1,
        message: 'query succeeded'
      })
    );
  });

  it('falls back only when BFF is unavailable and preserves hard errors in runtime state', async () => {
    const fixture = TestBed.createComponent(NgxLowcodeRendererComponent);
    const schema = createOrdersDemoSchema('tenant-a');
    fixture.componentRef.setInput('schema', structuredClone(schema));
    fixture.componentRef.setInput('datasourceExecutor', demoExecutor.execute);
    await fixture.whenStable();

    const runtime = fixture.componentInstance.runtime();

    const fallbackPromise = runtime.executeActionById('search-action');
    const unavailableRequest = httpController.expectOne('http://localhost:3000/query');
    unavailableRequest.flush('gateway down', { status: 503, statusText: 'Service Unavailable' });
    await fallbackPromise;

    expect(runtime.state()['tableData']).toEqual(schema.state['tableData']);
    expect(demoExecutor.lastExecution()).toEqual(
      jasmine.objectContaining({
        source: 'fallback',
        status: 'fallback',
        rowCount: 2
      })
    );

    const errorPromise = runtime.executeActionById('search-action');
    const errorRequest = httpController.expectOne('http://localhost:3000/query');
    errorRequest.flush('server exploded', { status: 500, statusText: 'Server Error' });
    await expectAsync(errorPromise).toBeResolved();

    expect(runtime.state()['tableData']).toEqual(schema.state['tableData']);
    expect(runtime.state()['__runtimeDatasourceErrors']).toEqual(
      jasmine.objectContaining({
        'orders-query-datasource': jasmine.anything()
      })
    );
    expect(demoExecutor.lastExecution()).toEqual(
      jasmine.objectContaining({
        source: 'bff',
        status: 'error',
        rowCount: 0,
        message: 'server exploded'
      })
    );
  });

  it('runs CRUD actions and row-click linkage against the real demo schema', async () => {
    const fixture = TestBed.createComponent(NgxLowcodeRendererComponent);
    fixture.componentRef.setInput('schema', createOrdersDemoSchema('tenant-a'));
    fixture.componentRef.setInput('datasourceExecutor', demoExecutor.execute);
    await fixture.whenStable();

    const runtime = fixture.componentInstance.runtime();
    const selectedRow = {
      id: 'SO-A1001',
      owner: 'Alice',
      channel: 'web',
      priority: 'high',
      status: 'active',
      tenant_id: 'tenant-a'
    };

    await runtime.executeActionById('select-row-action', { row: selectedRow });
    expect(runtime.state()).toEqual(
      jasmine.objectContaining({
        selectedOrderId: 'SO-A1001',
        formOrderId: 'SO-A1001',
        formOwner: 'Alice',
        formChannel: 'web',
        formPriority: 'high',
        formStatus: 'active',
        formMode: 'editing'
      })
    );

    runtime.setState({ formOwner: 'Alicia' });
    await runtime.executeActionById('update-order-action');
    expect(runtime.state()['formMode']).toBe('updated');
    expect(runtime.state()['tableData']).toEqual(
      jasmine.arrayContaining([jasmine.objectContaining({ id: 'SO-A1001', owner: 'Alicia' })])
    );

    runtime.setState({
      formOrderId: 'SO-A2001',
      formOwner: 'Aaron',
      formChannel: 'partner',
      formPriority: 'low',
      formStatus: 'active'
    });
    await runtime.executeActionById('create-order-action');
    expect(runtime.state()['formMode']).toBe('created');
    expect((runtime.state()['tableData'] as Array<Record<string, unknown>>)[0]).toEqual(
      jasmine.objectContaining({
        id: 'SO-A2001',
        owner: 'Aaron',
        tenant_id: 'tenant-a'
      })
    );

    await runtime.executeActionById('delete-order-action');
    expect(runtime.state()['formMode']).toBe('deleted');
    expect(runtime.state()['tableData']).not.toEqual(
      jasmine.arrayContaining([jasmine.objectContaining({ id: 'SO-A2001' })])
    );

    await runtime.executeActionById('clear-editor-action');
    expect(runtime.state()).toEqual(
      jasmine.objectContaining({
        selectedOrderId: '',
        formOrderId: '',
        formOwner: '',
        formChannel: 'web',
        formPriority: 'medium',
        formStatus: 'active',
        formMode: 'idle'
      })
    );
  });

  it('keeps tenant-a local CRUD state isolated from tenant-b schema state', async () => {
    const fixture = TestBed.createComponent(NgxLowcodeRendererComponent);
    fixture.componentRef.setInput('schema', createOrdersDemoSchema('tenant-a'));
    fixture.componentRef.setInput('datasourceExecutor', demoExecutor.execute);
    await fixture.whenStable();

    const runtime = fixture.componentInstance.runtime();
    runtime.setState({
      formOrderId: 'SO-A3001',
      formOwner: 'Avery',
      formChannel: 'store',
      formPriority: 'medium',
      formStatus: 'active'
    });
    await runtime.executeActionById('create-order-action');
    expect(runtime.state()['tableData']).toEqual(
      jasmine.arrayContaining([jasmine.objectContaining({ id: 'SO-A3001', tenant_id: 'tenant-a' })])
    );

    fixture.componentRef.setInput('schema', createOrdersDemoSchema('tenant-b'));
    await fixture.whenStable();

    expect(runtime.state()).toEqual(
      jasmine.objectContaining({
        tenantId: 'tenant-b',
        userId: 'demo-tenant-b-user'
      })
    );
    expect(runtime.state()['tableData']).toEqual([
      { id: 'SO-B1001', owner: 'Brenda', channel: 'partner', priority: 'high', status: 'active', tenant_id: 'tenant-b' },
      { id: 'SO-B1002', owner: 'Bryan', channel: 'web', priority: 'low', status: 'paused', tenant_id: 'tenant-b' }
    ]);
    expect(runtime.state()['tableData']).not.toEqual(
      jasmine.arrayContaining([jasmine.objectContaining({ id: 'SO-A3001' })])
    );
  });
});
