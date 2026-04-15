import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { mockPageSchema } from 'ngx-lowcode-testing';
import { NgxLowcodeRendererComponent } from './ngx-lowcode-renderer.component';

describe('NgxLowcodeRendererComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxLowcodeRendererComponent],
      providers: [provideZonelessChangeDetection()]
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
    const fixture = TestBed.createComponent(NgxLowcodeRendererComponent);
    const schema = structuredClone(mockPageSchema);
    const datasourceExecutor = jasmine.createSpy('datasourceExecutor').and.callFake(async ({ state }) => [
      {
        id: 'SO-3001',
        owner: state['owner'],
        channel: state['channel'],
        status: state['status']
      }
    ]);

    fixture.componentRef.setInput('schema', schema);
    fixture.componentRef.setInput('datasourceExecutor', datasourceExecutor);
    fixture.componentRef.setInput('context', {
      owner: 'Carol',
      channel: 'partner',
      status: 'active'
    });
    await fixture.whenStable();

    const runtime = fixture.componentInstance.runtime();
    await runtime.executeActionById('search-action');

    expect(datasourceExecutor).toHaveBeenCalled();
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
    const fixture = TestBed.createComponent(NgxLowcodeRendererComponent);
    const schema = structuredClone(mockPageSchema);
    const datasourceExecutor = jasmine.createSpy('datasourceExecutor').and.resolveTo([]);

    fixture.componentRef.setInput('schema', schema);
    fixture.componentRef.setInput('datasourceExecutor', datasourceExecutor);
    await fixture.whenStable();

    const runtime = fixture.componentInstance.runtime();
    await expectAsync(runtime.executeActionById('search-action')).toBeResolved();

    expect(datasourceExecutor).toHaveBeenCalled();
    expect(runtime.state()['tableData']).toEqual([]);
  });

  it('overwrites datasource state on consecutive queries instead of accumulating stale rows', async () => {
    const fixture = TestBed.createComponent(NgxLowcodeRendererComponent);
    const schema = structuredClone(mockPageSchema);
    const datasourceExecutor = jasmine.createSpy('datasourceExecutor').and.callFake(async ({ state }) => {
      const status = String(state['status'] ?? 'all');
      if (status === 'paused') {
        return [{ id: 'SO-4002', owner: 'Bob', status: 'paused' }];
      }
      return [{ id: 'SO-4001', owner: 'Alice', status: 'active' }];
    });

    fixture.componentRef.setInput('schema', schema);
    fixture.componentRef.setInput('datasourceExecutor', datasourceExecutor);
    await fixture.whenStable();

    const runtime = fixture.componentInstance.runtime();
    runtime.setState({ status: 'active' });
    await runtime.executeActionById('search-action');
    expect(runtime.state()['tableData']).toEqual([{ id: 'SO-4001', owner: 'Alice', status: 'active' }]);

    runtime.setState({ status: 'paused' });
    await runtime.executeActionById('search-action');
    expect(runtime.state()['tableData']).toEqual([{ id: 'SO-4002', owner: 'Bob', status: 'paused' }]);
    expect(datasourceExecutor).toHaveBeenCalledTimes(2);
  });

  it('captures datasource errors into runtime state and allows next query to recover', async () => {
    const fixture = TestBed.createComponent(NgxLowcodeRendererComponent);
    const schema = structuredClone(mockPageSchema);
    const datasourceExecutor = jasmine.createSpy('datasourceExecutor').and.callFake(async ({ state }) => {
      if (String(state['keyword'] ?? '') === 'fail') {
        throw new Error('datasource unavailable');
      }
      return [{ id: 'SO-5001', owner: 'Recovery', status: 'active' }];
    });

    fixture.componentRef.setInput('schema', schema);
    fixture.componentRef.setInput('datasourceExecutor', datasourceExecutor);
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

  it('falls back to datasource mockData when no datasource executor is provided', async () => {
    const fixture = TestBed.createComponent(NgxLowcodeRendererComponent);
    const schema = structuredClone(mockPageSchema);

    fixture.componentRef.setInput('schema', schema);
    await fixture.whenStable();

    const runtime = fixture.componentInstance.runtime();
    const datasourceResult = await runtime.executeDatasourceById('orders-datasource');

    expect(datasourceResult).toEqual(schema.datasources[0]?.mockData);
  });
});
