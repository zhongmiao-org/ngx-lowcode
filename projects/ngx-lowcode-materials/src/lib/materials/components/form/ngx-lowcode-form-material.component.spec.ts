import { signal, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgxLowcodeRuntimeContext } from '@zhongmiao/ngx-lowcode-core-types';
import { NgxLowcodeFormMaterialComponent } from './ngx-lowcode-form-material.component';

describe('NgxLowcodeFormMaterialComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxLowcodeFormMaterialComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  it('triggers the configured submit action when the form is submitted', async () => {
    const fixture = TestBed.createComponent(NgxLowcodeFormMaterialComponent);
    const runtimeState = signal<Record<string, unknown>>({});
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
      id: 'search-form',
      componentType: 'form',
      props: {
        title: 'Search Filters',
        datasourceId: 'orders-datasource',
        submitActionId: 'submit-search-action'
      },
      children: []
    });
    fixture.componentRef.setInput('runtime', runtime);
    await fixture.whenStable();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(executeActionById).toHaveBeenCalledWith('submit-search-action', {
      eventName: 'submit',
      nodeId: 'search-form',
      datasourceId: 'orders-datasource'
    });
  });
});
