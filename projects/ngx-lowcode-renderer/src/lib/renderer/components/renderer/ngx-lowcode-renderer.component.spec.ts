import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  NGX_LOWCODE_ACTION_MANAGER,
  NGX_LOWCODE_DATASOURCE_MANAGER,
  NGX_LOWCODE_WEBSOCKET_MANAGER
} from '@zhongmiao/ngx-lowcode-core';
import type {
  NgxLowcodeActionManager,
  NgxLowcodeDataSourceManager,
  NgxLowcodeWebSocketManager
} from '@zhongmiao/ngx-lowcode-core-types';
import { mockPageSchema } from '@zhongmiao/ngx-lowcode-testing';
import { NgxLowcodeRendererComponent } from './ngx-lowcode-renderer.component';

describe('NgxLowcodeRendererComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxLowcodeRendererComponent],
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: NGX_LOWCODE_ACTION_MANAGER,
          useValue: createActionManagerSpy()
        },
        {
          provide: NGX_LOWCODE_DATASOURCE_MANAGER,
          useValue: createDataSourceManagerSpy(async ({ datasource }) => datasource.mockData ?? [])
        },
        {
          provide: NGX_LOWCODE_WEBSOCKET_MANAGER,
          useValue: createWebSocketManagerSpy()
        }
      ]
    }).compileComponents();
  });

  it('merges schema state with context and resets linked state when inputs change', async () => {
    const fixture = TestBed.createComponent(NgxLowcodeRendererComponent);
    const schema = structuredClone(mockPageSchema);

    fixture.componentRef.setInput('schema', schema);
    fixture.componentRef.setInput('context', { keyword: 'from-context' });
    await fixture.whenStable();

    const runtime = fixture.componentInstance.runtime();
    expect(runtime.state()).toEqual(
      jasmine.objectContaining({
        keyword: 'from-context',
        owner: ''
      })
    );

    runtime.setState({ owner: 'runtime-owner', runtimeOnly: true });
    expect(runtime.state()).toEqual(
      jasmine.objectContaining({
        keyword: 'from-context',
        owner: 'runtime-owner',
        runtimeOnly: true
      })
    );

    const nextSchema = structuredClone(schema);
    nextSchema.state['owner'] = 'schema-owner';
    fixture.componentRef.setInput('schema', nextSchema);
    await fixture.whenStable();

    expect(runtime.state()).toEqual(
      jasmine.objectContaining({
        keyword: 'from-context',
        owner: 'schema-owner'
      })
    );
    expect(runtime.state()['runtimeOnly']).toBeUndefined();
  });

  it('keeps local selection until the host provides a new input value', async () => {
    const fixture = TestBed.createComponent(NgxLowcodeRendererComponent);
    const emittedSelections: Array<string | null> = [];

    fixture.componentInstance.selectionChange.subscribe((value) => emittedSelections.push(value));
    fixture.componentRef.setInput('schema', structuredClone(mockPageSchema));
    fixture.componentRef.setInput('selectedNodeId', 'page-root');
    await fixture.whenStable();

    const runtime = fixture.componentInstance.runtime();
    expect(runtime.selection()).toBe('page-root');

    runtime.setSelection('search-form');
    expect(runtime.selection()).toBe('search-form');
    expect(emittedSelections).toEqual(['search-form']);

    fixture.componentRef.setInput('selectedNodeId', 'input-keyword');
    await fixture.whenStable();

    expect(runtime.selection()).toBe('input-keyword');
  });

  it('executes datasource-backed actions and writes datasource results into runtime state', async () => {
    const dataSourceManager = createDataSourceManagerSpy(async ({ state }) => [
      {
        id: 'SO-3001',
        owner: state['owner'],
        channel: state['channel'],
        status: state['status']
      }
    ]);
    TestBed.overrideProvider(NGX_LOWCODE_DATASOURCE_MANAGER, { useValue: dataSourceManager });

    const fixture = TestBed.createComponent(NgxLowcodeRendererComponent);
    const schema = structuredClone(mockPageSchema);
    fixture.componentRef.setInput('schema', schema);
    fixture.componentRef.setInput('context', {
      owner: 'Carol',
      channel: 'partner',
      status: 'active'
    });
    await fixture.whenStable();

    const runtime = fixture.componentInstance.runtime();
    await runtime.executeActionById('search-action');

    expect(dataSourceManager.execute).toHaveBeenCalled();
    expect(runtime.state()['tableData']).toEqual([
      {
        id: 'SO-3001',
        owner: 'Carol',
        channel: 'partner',
        status: 'active'
      }
    ]);
  });

  it('writes empty datasource result into runtime state without throwing', async () => {
    const dataSourceManager = createDataSourceManagerSpy(async () => []);
    TestBed.overrideProvider(NGX_LOWCODE_DATASOURCE_MANAGER, { useValue: dataSourceManager });

    const fixture = TestBed.createComponent(NgxLowcodeRendererComponent);
    const schema = structuredClone(mockPageSchema);

    fixture.componentRef.setInput('schema', schema);
    await fixture.whenStable();

    const runtime = fixture.componentInstance.runtime();
    await expectAsync(runtime.executeActionById('search-action')).toBeResolved();

    expect(dataSourceManager.execute).toHaveBeenCalled();
    expect(runtime.state()['tableData']).toEqual([]);
  });

  it('overwrites datasource state on consecutive queries instead of accumulating stale rows', async () => {
    const dataSourceManager = createDataSourceManagerSpy(async ({ state }) => {
      const status = String(state['status'] ?? 'all');
      if (status === 'paused') {
        return [{ id: 'SO-4002', owner: 'Bob', status: 'paused' }];
      }
      return [{ id: 'SO-4001', owner: 'Alice', status: 'active' }];
    });
    TestBed.overrideProvider(NGX_LOWCODE_DATASOURCE_MANAGER, { useValue: dataSourceManager });

    const fixture = TestBed.createComponent(NgxLowcodeRendererComponent);
    const schema = structuredClone(mockPageSchema);
    fixture.componentRef.setInput('schema', schema);
    await fixture.whenStable();

    const runtime = fixture.componentInstance.runtime();
    runtime.setState({ status: 'active' });
    await runtime.executeActionById('search-action');
    expect(runtime.state()['tableData']).toEqual([{ id: 'SO-4001', owner: 'Alice', status: 'active' }]);

    runtime.setState({ status: 'paused' });
    await runtime.executeActionById('search-action');
    expect(runtime.state()['tableData']).toEqual([{ id: 'SO-4002', owner: 'Bob', status: 'paused' }]);
    expect(dataSourceManager.execute).toHaveBeenCalledTimes(2);
  });

  it('captures datasource errors into runtime state and allows next query to recover', async () => {
    const dataSourceManager = createDataSourceManagerSpy(async ({ state }) => {
      if (String(state['keyword'] ?? '') === 'fail') {
        throw new Error('datasource unavailable');
      }
      return [{ id: 'SO-5001', owner: 'Recovery', status: 'active' }];
    });
    TestBed.overrideProvider(NGX_LOWCODE_DATASOURCE_MANAGER, { useValue: dataSourceManager });

    const fixture = TestBed.createComponent(NgxLowcodeRendererComponent);
    const schema = structuredClone(mockPageSchema);
    fixture.componentRef.setInput('schema', schema);
    fixture.componentRef.setInput('context', { keyword: 'fail' });
    await fixture.whenStable();

    const runtime = fixture.componentInstance.runtime();
    await expectAsync(runtime.executeActionById('search-action')).toBeResolved();
    expect(runtime.state()['tableData']).toEqual(schema.state['tableData']);
    expect(runtime.state()['__runtimeDatasourceErrors']).toEqual({
      'orders-datasource': 'datasource unavailable'
    });

    runtime.setState({ keyword: '' });
    await expectAsync(runtime.executeActionById('search-action')).toBeResolved();
    expect(runtime.state()['tableData']).toEqual([{ id: 'SO-5001', owner: 'Recovery', status: 'active' }]);
    expect(runtime.state()['__runtimeDatasourceErrors']).toEqual({});
  });

  it('falls back to datasource mockData when datasource manager returns mock values', async () => {
    const fixture = TestBed.createComponent(NgxLowcodeRendererComponent);
    const schema = structuredClone(mockPageSchema);

    fixture.componentRef.setInput('schema', schema);
    await fixture.whenStable();

    const runtime = fixture.componentInstance.runtime();
    const datasourceResult = await runtime.executeDatasourceById('orders-datasource');

    expect(datasourceResult).toEqual(schema.datasources[0]?.mockData);
  });

  it('connects and disconnects websocket manager with subscription lifecycle', async () => {
    const webSocketManager = createWebSocketManagerSpy();
    const schema = structuredClone(mockPageSchema);
    schema.datasources = [
      ...schema.datasources,
      {
        id: 'realtime-orders',
        type: 'middleware-command',
        command: {
          transport: 'websocket',
          target: 'orders-updates'
        }
      }
    ];
    TestBed.overrideProvider(NGX_LOWCODE_WEBSOCKET_MANAGER, { useValue: webSocketManager });

    const fixture = TestBed.createComponent(NgxLowcodeRendererComponent);
    fixture.componentRef.setInput('schema', schema);
    await fixture.whenStable();

    expect(webSocketManager.connect).toHaveBeenCalled();
    expect(webSocketManager.subscribe).toHaveBeenCalledWith('orders-updates', jasmine.any(Function));

    fixture.destroy();
    expect(webSocketManager.unsubscribe).toHaveBeenCalledWith('orders-updates', jasmine.any(Function));
    expect(webSocketManager.disconnect).toHaveBeenCalled();
  });
});

function createDataSourceManagerSpy(
  executeImpl: NgxLowcodeDataSourceManager['execute']
): NgxLowcodeDataSourceManager & { execute: jasmine.Spy } {
  const execute = jasmine.createSpy('dataSourceManager.execute').and.callFake(executeImpl);
  return {
    execute
  };
}

function createActionManagerSpy(): NgxLowcodeActionManager & { execute: jasmine.Spy } {
  const execute = jasmine.createSpy('actionManager.execute').and.resolveTo(undefined);
  return {
    execute
  };
}

function createWebSocketManagerSpy(): NgxLowcodeWebSocketManager & {
  connect: jasmine.Spy;
  subscribe: jasmine.Spy;
  unsubscribe: jasmine.Spy;
  disconnect: jasmine.Spy;
} {
  return {
    connect: jasmine.createSpy('webSocketManager.connect').and.resolveTo(undefined),
    subscribe: jasmine.createSpy('webSocketManager.subscribe').and.resolveTo(undefined),
    unsubscribe: jasmine.createSpy('webSocketManager.unsubscribe').and.resolveTo(undefined),
    disconnect: jasmine.createSpy('webSocketManager.disconnect').and.resolveTo(undefined)
  };
}
