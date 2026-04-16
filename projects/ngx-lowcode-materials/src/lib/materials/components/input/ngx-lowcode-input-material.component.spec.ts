import { signal, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgxLowcodeRuntimeContext } from '@zhongmiao/ngx-lowcode-core-types';
import { NgxLowcodeInputMaterialComponent } from './ngx-lowcode-input-material.component';

describe('NgxLowcodeInputMaterialComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxLowcodeInputMaterialComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  it('hydrates from runtime state and writes edits back through runtime state', async () => {
    const fixture = TestBed.createComponent(NgxLowcodeInputMaterialComponent);
    const runtimeState = signal<Record<string, unknown>>({
      keyword: 'initial keyword'
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
      id: 'input-keyword',
      componentType: 'input',
      props: {
        label: 'Keyword',
        stateKey: 'keyword',
        changeActionId: 'keyword-change-action'
      }
    });
    fixture.componentRef.setInput('runtime', runtime);
    await fixture.whenStable();

    expect(fixture.componentInstance.value()).toBe('initial keyword');

    fixture.componentInstance.updateValue('updated keyword');
    await fixture.whenStable();

    expect(runtime.state()['keyword']).toBe('updated keyword');
    expect(fixture.componentInstance.value()).toBe('updated keyword');
    expect(executeActionById).toHaveBeenCalledWith('keyword-change-action', {
      eventName: 'change',
      nodeId: 'input-keyword',
      stateKey: 'keyword',
      value: 'updated keyword'
    });
  });
});
