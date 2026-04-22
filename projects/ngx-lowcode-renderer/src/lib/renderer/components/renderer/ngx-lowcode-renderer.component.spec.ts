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
import type { Mock } from 'vitest';
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
      expect.objectContaining({
        keyword: 'from-context',
        owner: ''
      })
    );

    runtime.setState({ owner: 'runtime-owner', runtimeOnly: true });
    expect(runtime.state()).toEqual(
      expect.objectContaining({
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
      expect.objectContaining({
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
      expect.objectContaining({
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
    await expect(runtime.executeActionById('search-action')).resolves.toBeUndefined();

    expect(dataSourceManager.execute).toHaveBeenCalled();
    expect(runtime.state()['tableData']).toEqual([]);
    expect(runtime.state()['__runtimeExecution']).toEqual(
      expect.objectContaining({
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
    await expect(runtime.executeActionById('search-action')).resolves.toBeUndefined();

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
    await expect(runtime.executeActionById('search-action')).resolves.toBeUndefined();
    expect(runtime.state()['tableData']).toEqual(schema.state['tableData']);
    expect(runtime.state()['__runtimeDatasourceErrors']).toEqual({
      'orders-datasource': 'datasource unavailable'
    });
    expect(runtime.state()['__runtimeExecution']).toEqual(
      expect.objectContaining({
        datasourceId: 'orders-datasource',
        status: 'failure',
        message: 'datasource unavailable',
        source: 'websocket'
      })
    );

    runtime.setState({ keyword: '' });
    await expect(runtime.executeActionById('search-action')).resolves.toBeUndefined();
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
    expect(webSocketManager.subscribe).toHaveBeenCalledWith('orders-updates', expect.any(Function));
    expect(lastCall(webSocketManager.subscribe).length).toBe(2);

    fixture.destroy();
    await Promise.resolve();
    expect(webSocketManager.unsubscribe).toHaveBeenCalledWith('orders-updates', expect.any(Function));
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
    expect(state['runtimeOnly']).toBe(true);
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

  it('stores runtime manager replay cursors and passes them on later subscriptions', async () => {
    const webSocketManager = createWebSocketManagerSpy();
    const schema = structuredClone(mockPageSchema);
    const topic = 'tenant.tenant-a.page.demo-page.instance.instance-1';
    schema.datasources[0] = {
      ...schema.datasources[0],
      command: {
        ...schema.datasources[0].command,
        target: topic
      }
    };
    TestBed.overrideProvider(NGX_LOWCODE_WEBSOCKET_MANAGER, { useValue: webSocketManager });

    const fixture = TestBed.createComponent(NgxLowcodeRendererComponent);
    fixture.componentRef.setInput('schema', schema);
    await fixture.whenStable();
    await Promise.resolve();
    expect(lastCall(webSocketManager.subscribe).length).toBe(2);

    resolveLastWebSocketHandler(webSocketManager)(
      createRuntimeManagerExecutedEvent({
        replayId: '42-0',
        patchState: { status: 'active' }
      })
    );
    await flushWebSocketEvent();

    fixture.componentInstance.ngOnDestroy();
    await Promise.resolve();
    webSocketManager.subscribe.mockClear();
    fixture.componentInstance.ngOnInit();
    await Promise.resolve();

    expect(webSocketManager.subscribe).toHaveBeenCalledWith(topic, expect.any(Function), {
      afterReplayId: '42-0'
    });
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

    expect(actionManager.execute).toHaveBeenCalledTimes(1);
    expect(actionManager.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        action: expect.objectContaining({ id: 'notify-action' }),
        step: expect.objectContaining({ type: 'message', message: 'runtime updated' })
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
      connect: () => Promise.reject(new Error('connect failed')),
      subscribe: () => Promise.reject(new Error('subscribe failed')),
      unsubscribe: () => Promise.reject(new Error('unsubscribe failed')),
      disconnect: () => Promise.reject(new Error('disconnect failed'))
    });
    const warnSpy = vi.spyOn(console, 'warn');
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
  webSocketManager: NgxLowcodeWebSocketManager & { subscribe: Mock }
): (event: unknown) => void {
  const handler = lastCall(webSocketManager.subscribe)[1];
  expect(typeof handler).toBe('function');
  return handler as (event: unknown) => void;
}

function lastCall(spy: Mock): unknown[] {
  const call = spy.mock.calls.at(-1);
  expect(call).toBeDefined();
  return call ?? [];
}

async function flushWebSocketEvent(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

function createDataSourceManagerSpy(
  executeImpl: NgxLowcodeDataSourceManager['execute']
): NgxLowcodeDataSourceManager & { execute: Mock } {
  const execute = vi.fn(executeImpl);
  return {
    execute
  };
}

function createActionManagerSpy(): NgxLowcodeActionManager & { execute: Mock } {
  const execute = vi.fn().mockResolvedValue(undefined);
  return {
    execute
  };
}

function createWebSocketManagerSpy(overrides?: {
  connect?: () => void | Promise<void>;
  subscribe?: () => void | Promise<void>;
  unsubscribe?: () => void | Promise<void>;
  disconnect?: () => void | Promise<void>;
}): NgxLowcodeWebSocketManager & {
  connect: Mock;
  subscribe: Mock;
  unsubscribe: Mock;
  disconnect: Mock;
} {
  return {
    connect: vi.fn(() => overrides?.connect?.() ?? Promise.resolve(undefined)),
    subscribe: vi.fn(() => overrides?.subscribe?.() ?? Promise.resolve(undefined)),
    unsubscribe: vi.fn(() => overrides?.unsubscribe?.() ?? Promise.resolve(undefined)),
    disconnect: vi.fn(() => overrides?.disconnect?.() ?? Promise.resolve(undefined))
  };
}
