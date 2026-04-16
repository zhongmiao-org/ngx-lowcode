import { signal, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgxLowcodeRuntimeContext } from '@zhongmiao/ngx-lowcode-core-types';
import { NgxLowcodeTethysMaterialComponent } from './ngx-lowcode-tethys-material.component';

describe('NgxLowcodeTethysMaterialComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxLowcodeTethysMaterialComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  it('writes checkbox changes to runtime state and triggers the configured action', async () => {
    const fixture = TestBed.createComponent(NgxLowcodeTethysMaterialComponent);
    const runtimeState = signal<Record<string, unknown>>({
      enabled: false
    });
    const executeActionById = jasmine.createSpy('executeActionById').and.resolveTo(undefined);
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
      id: 'checkbox-enabled',
      componentType: 'checkbox',
      props: {
        label: 'Enabled',
        stateKey: 'enabled',
        changeActionId: 'enabled-change-action'
      }
    });
    fixture.componentRef.setInput('runtime', runtime);
    await fixture.whenStable();

    await fixture.componentInstance.updateState(true);
    await fixture.whenStable();

    expect(runtime.state()['enabled']).toBeTrue();
    expect(executeActionById).toHaveBeenCalledWith('enabled-change-action', {
      eventName: 'change',
      nodeId: 'checkbox-enabled',
      stateKey: 'enabled',
      value: true
    });
  });
});
