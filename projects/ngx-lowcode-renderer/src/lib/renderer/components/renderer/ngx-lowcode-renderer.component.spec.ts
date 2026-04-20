import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  NGX_LOWCODE_ACTION_MANAGER,
  NGX_LOWCODE_DATASOURCE_MANAGER,
  NGX_LOWCODE_RUNTIME_MANAGER_EXECUTED_EVENT,
  NGX_LOWCODE_WEBSOCKET_MANAGER
} from '@zhongmiao/ngx-lowcode-core';
import type {
  NgxLowcodeActionManager,
  NgxLowcodeDataSourceManager,
  NgxLowcodeDatasourceExecutionResult,
  NgxLowcodeRuntimeManagerExecutedEvent,
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
    expect(runtime.state()['__runtimeExecution']).toEqual(
      jasmine.objectContaining({
        datasourceId: 'orders-datasource',
        status: 'success',
        rowCount: 1,
        source: 'websocket'
      })
    );
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
    expect(runtime.state()['__runtimeExecution']).toEqual(
      jasmine.objectContaining({
        datasourceId: 'orders-datasource',
        status: 'success',
        rowCount: 0
      })
    );
  });

  it('consumes structured datasource execution results and exposes execution metadata', async () => {
    const dataSourceManager = createDataSourceManagerSpy(
      async (): Promise<NgxLowcodeDatasourceExecutionResult<Array<{ id: string }>>> => ({
        data: [{ id: 'SO-6001' }],
        meta: {
          requestId: 'req-6001',
          status: 'success',
          rowCount: 1,
          message: 'loaded',
          source: 'rest'
        }
      })
    );
    TestBed.overrideProvider(NGX_LOWCODE_DATASOURCE_MANAGER, { useValue: dataSourceManager });

    const fixture = TestBed.createComponent(NgxLowcodeRendererComponent);
    fixture.componentRef.setInput('schema', structuredClone(mockPageSchema));
    await fixture.whenStable();

    const runtime = fixture.componentInstance.runtime();
    await expectAsync(runtime.executeActionById('search-action')).toBeResolved();

    expect(runtime.state()['tableData']).toEqual([{ id: 'SO-6001' }]);
    expect(runtime.state()['__runtimeExecution']).toEqual({
      datasourceId: 'orders-datasource',
      requestId: 'req-6001',
      status: 'success',
      rowCount: 1,
      message: 'loaded',
      source: 'rest'
    });
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
    expect(runtime.state()['__runtimeExecution']).toEqual(
      jasmine.objectContaining({
        datasourceId: 'orders-datasource',
        status: 'failure',
        message: 'datasource unavailable',
        source: 'websocket'
      })
    );

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
    await Promise.resolve();

    expect(webSocketManager.connect).toHaveBeenCalled();
    expect(webSocketManager.subscribe).toHaveBeenCalledWith('orders-updates', jasmine.any(Function));

    fixture.destroy();
    await Promise.resolve();
    expect(webSocketManager.unsubscribe).toHaveBeenCalledWith('orders-updates', jasmine.any(Function));
    expect(webSocketManager.disconnect).toHaveBeenCalled();
  });

  it('consumes runtime manager websocket events and applies patch plus datasource refresh', async () => {
    const dataSourceManager = createDataSourceManagerSpy(
      async (): Promise<NgxLowcodeDatasourceExecutionResult<Array<{ id: string }>>> => ({
        data: [{ id: 'SO-7001' }],
        meta: {
          requestId: 'req-datasource-1',
          status: 'success',
          rowCount: 1,
          source: 'websocket'
        }
      })
    );
    const webSocketManager = createWebSocketManagerSpy();
    TestBed.overrideProvider(NGX_LOWCODE_DATASOURCE_MANAGER, { useValue: dataSourceManager });
    TestBed.overrideProvider(NGX_LOWCODE_WEBSOCKET_MANAGER, { useValue: webSocketManager });

    const fixture = TestBed.createComponent(NgxLowcodeRendererComponent);
    fixture.componentRef.setInput('schema', structuredClone(mockPageSchema));
    await fixture.whenStable();
    await Promise.resolve();

    const handler = resolveLastWebSocketHandler(webSocketManager);
    expect(NGX_LOWCODE_RUNTIME_MANAGER_EXECUTED_EVENT).toBe('runtimeManagerExecuted');
    handler({
      type: 'runtime.manager.executed',
      topic: 'tenant.tenant-a.page.demo-page.instance.instance-1',
      page: {
        tenantId: 'tenant-a',
        pageId: 'demo-page',
        pageInstanceId: 'instance-1'
      },
      requestId: 'req-runtime-1',
      patchState: { status: 'active', runtimeOnly: true },
      refreshedDatasourceIds: ['orders-datasource'],
      runActionIds: []
    });
    await flushWebSocketEvent();

    const state = fixture.componentInstance.runtime().state();
    expect(state['status']).toBe('active');
    expect(state['runtimeOnly']).toBeTrue();
    expect(state['tableData']).toEqual([{ id: 'SO-7001' }]);
    expect(state['__runtimeExecution']).toEqual({
      datasourceId: 'orders-datasource',
      requestId: 'req-datasource-1',
      status: 'success',
      rowCount: 1,
      message: undefined,
      source: 'websocket'
    });
    expect(dataSourceManager.execute).toHaveBeenCalledTimes(1);
  });

  it('consumes runtime manager websocket events and runs listed actions', async () => {
    const actionManager = createActionManagerSpy();
    const webSocketManager = createWebSocketManagerSpy();
    const schema = structuredClone(mockPageSchema);
    schema.actions = [
      ...schema.actions,
      {
        id: 'notify-action',
        steps: [{ type: 'message', message: 'runtime updated' }]
      }
    ];
    TestBed.overrideProvider(NGX_LOWCODE_ACTION_MANAGER, { useValue: actionManager });
    TestBed.overrideProvider(NGX_LOWCODE_WEBSOCKET_MANAGER, { useValue: webSocketManager });

    const fixture = TestBed.createComponent(NgxLowcodeRendererComponent);
    fixture.componentRef.setInput('schema', schema);
    await fixture.whenStable();
    await Promise.resolve();

    resolveLastWebSocketHandler(webSocketManager)(
      createRuntimeManagerExecutedEvent({
        patchState: {},
        refreshedDatasourceIds: [],
        runActionIds: ['notify-action']
      })
    );
    await flushWebSocketEvent();

    expect(actionManager.execute).toHaveBeenCalledOnceWith(
      jasmine.objectContaining({
        action: jasmine.objectContaining({ id: 'notify-action' }),
        step: jasmine.objectContaining({ type: 'message', message: 'runtime updated' })
      })
    );
  });

  it('ignores non runtime manager websocket events', async () => {
    const dataSourceManager = createDataSourceManagerSpy(async () => []);
    const actionManager = createActionManagerSpy();
    const webSocketManager = createWebSocketManagerSpy();
    TestBed.overrideProvider(NGX_LOWCODE_ACTION_MANAGER, { useValue: actionManager });
    TestBed.overrideProvider(NGX_LOWCODE_DATASOURCE_MANAGER, { useValue: dataSourceManager });
    TestBed.overrideProvider(NGX_LOWCODE_WEBSOCKET_MANAGER, { useValue: webSocketManager });

    const fixture = TestBed.createComponent(NgxLowcodeRendererComponent);
    fixture.componentRef.setInput('schema', structuredClone(mockPageSchema));
    await fixture.whenStable();
    await Promise.resolve();

    const beforeState = fixture.componentInstance.runtime().state();
    resolveLastWebSocketHandler(webSocketManager)({
      type: 'pageSubscribed',
      status: 'subscribed'
    });
    await flushWebSocketEvent();

    expect(fixture.componentInstance.runtime().state()).toEqual(beforeState);
    expect(dataSourceManager.execute).not.toHaveBeenCalled();
    expect(actionManager.execute).not.toHaveBeenCalled();
  });

  it('absorbs websocket lifecycle errors without breaking renderer lifecycle', async () => {
    const webSocketManager = createWebSocketManagerSpy({
      connect: Promise.reject(new Error('connect failed')),
      subscribe: Promise.reject(new Error('subscribe failed')),
      unsubscribe: Promise.reject(new Error('unsubscribe failed')),
      disconnect: Promise.reject(new Error('disconnect failed'))
    });
    const warnSpy = spyOn(console, 'warn');
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
    await expectAsync(fixture.whenStable()).toBeResolved();
    await Promise.resolve();

    fixture.destroy();
    await Promise.resolve();

    expect(webSocketManager.connect).toHaveBeenCalledTimes(1);
    expect(webSocketManager.subscribe).toHaveBeenCalledTimes(2);
    expect(webSocketManager.unsubscribe).toHaveBeenCalledTimes(2);
    expect(webSocketManager.disconnect).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalled();
  });
});

function createRuntimeManagerExecutedEvent(
  patch: Partial<NgxLowcodeRuntimeManagerExecutedEvent>
): NgxLowcodeRuntimeManagerExecutedEvent {
  return {
    type: 'runtime.manager.executed',
    topic: 'tenant.tenant-a.page.demo-page.instance.instance-1',
    page: {
      tenantId: 'tenant-a',
      pageId: 'demo-page',
      pageInstanceId: 'instance-1'
    },
    patchState: {},
    refreshedDatasourceIds: [],
    runActionIds: [],
    ...patch
  };
}

function resolveLastWebSocketHandler(
  webSocketManager: NgxLowcodeWebSocketManager & { subscribe: jasmine.Spy }
): (event: unknown) => void {
  const handler = webSocketManager.subscribe.calls.mostRecent().args[1];
  expect(typeof handler).toBe('function');
  return handler;
}

async function flushWebSocketEvent(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

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

function createWebSocketManagerSpy(overrides?: {
  connect?: void | Promise<void>;
  subscribe?: void | Promise<void>;
  unsubscribe?: void | Promise<void>;
  disconnect?: void | Promise<void>;
}): NgxLowcodeWebSocketManager & {
  connect: jasmine.Spy;
  subscribe: jasmine.Spy;
  unsubscribe: jasmine.Spy;
  disconnect: jasmine.Spy;
} {
  return {
    connect: jasmine
      .createSpy('webSocketManager.connect')
      .and.callFake(() => overrides?.connect ?? Promise.resolve(undefined)),
    subscribe: jasmine
      .createSpy('webSocketManager.subscribe')
      .and.callFake(() => overrides?.subscribe ?? Promise.resolve(undefined)),
    unsubscribe: jasmine
      .createSpy('webSocketManager.unsubscribe')
      .and.callFake(() => overrides?.unsubscribe ?? Promise.resolve(undefined)),
    disconnect: jasmine
      .createSpy('webSocketManager.disconnect')
      .and.callFake(() => overrides?.disconnect ?? Promise.resolve(undefined))
  };
}
