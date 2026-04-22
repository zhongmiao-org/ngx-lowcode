import { signal, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgxLowcodeRuntimeContext } from '@zhongmiao/ngx-lowcode-core-types';
import { NgxLowcodeSelectMaterialComponent } from './ngx-lowcode-select-material.component';

describe('NgxLowcodeSelectMaterialComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxLowcodeSelectMaterialComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  it('hydrates from runtime state and writes option changes back through runtime state', async () => {
    const fixture = TestBed.createComponent(NgxLowcodeSelectMaterialComponent);
    const runtimeState = signal<Record<string, unknown>>({
      status: 'all'
    });
    const executeActionById = vi.fn().mockResolvedValue(undefined);
    const runtime: NgxLowcodeRuntimeContext = {
      mode: 'runtime',
      state: runtimeState.asReadonly(),
      selection: signal<string | null>(null).asReadonly(),
      setSelection: () => undefined,
      setState: (patch) => runtimeState.update((current) => ({ ...current, ...patch })),
      executeActionById,
      executeDatasourceById: async () => undefined
    };

    fixture.componentRef.setInput('node', {
      id: 'select-status',
      componentType: 'select',
      props: {
        label: 'Status',
        stateKey: 'status',
        changeActionId: 'status-change-action',
        options: [
          { label: 'All', value: 'all' },
          { label: 'Active', value: 'active' }
        ]
      }
    });
    fixture.componentRef.setInput('runtime', runtime);
    await fixture.whenStable();

    expect(fixture.componentInstance.value()).toBe('all');
    expect(fixture.componentInstance.options()).toEqual([
      { label: 'All', value: 'all' },
      { label: 'Active', value: 'active' }
    ]);

    fixture.componentInstance.updateValue('active');
    await fixture.whenStable();

    expect(runtime.state()['status']).toBe('active');
    expect(fixture.componentInstance.value()).toBe('active');
    expect(executeActionById).toHaveBeenCalledWith('status-change-action', {
      eventName: 'change',
      nodeId: 'select-status',
      stateKey: 'status',
      value: 'active'
    });
  });
});
