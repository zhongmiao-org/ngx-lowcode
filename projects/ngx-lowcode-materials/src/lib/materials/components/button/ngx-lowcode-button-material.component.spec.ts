import { signal, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgxLowcodeRuntimeContext } from '@zhongmiao/ngx-lowcode-core-types';
import { NgxLowcodeButtonMaterialComponent } from './ngx-lowcode-button-material.component';

describe('NgxLowcodeButtonMaterialComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxLowcodeButtonMaterialComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  it('renders host styles and triggers the configured action on click', async () => {
    const fixture = TestBed.createComponent(NgxLowcodeButtonMaterialComponent);
    const executeActionById = vi.fn().mockResolvedValue(undefined);
    const runtimeState = signal<Record<string, unknown>>({});
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
      id: 'button-1',
      componentType: 'button',
      props: {
        label: 'Save',
        actionId: 'save-action'
      },
      style: {
        color: 'rgb(255, 0, 0)'
      }
    });
    fixture.componentRef.setInput('runtime', runtime);
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.style.color).toBe('rgb(255, 0, 0)');

    button.click();
    await fixture.whenStable();

    expect(executeActionById).toHaveBeenCalledWith('save-action');
  });
});
