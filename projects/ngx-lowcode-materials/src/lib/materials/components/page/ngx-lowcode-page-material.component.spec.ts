import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgxLowcodeRuntimeContext } from '@zhongmiao/ngx-lowcode-core-types';
import { NgxLowcodePageMaterialComponent } from './ngx-lowcode-page-material.component';

describe('NgxLowcodePageMaterialComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxLowcodePageMaterialComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  it('switches between design surface and runtime flex from runtime mode', async () => {
    const fixture = TestBed.createComponent(NgxLowcodePageMaterialComponent);
    const runtime = createRuntime('design');

    fixture.componentRef.setInput('node', {
      id: 'page-root',
      componentType: 'page',
      props: {
        title: 'Demo page'
      },
      children: []
    });
    fixture.componentRef.setInput('runtime', runtime);
    await fixture.whenStable();

    expect(fixture.componentInstance.isDesignMode()).toBe(true);
    expect(fixture.nativeElement.querySelector('.ngx-lowcode-page__design-surface')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.ngx-lowcode-page__flex')).toBeNull();

    fixture.componentRef.setInput('runtime', createRuntime('runtime'));
    await fixture.whenStable();

    expect(fixture.componentInstance.isDesignMode()).toBe(false);
    expect(fixture.nativeElement.querySelector('.ngx-lowcode-page__design-surface')).toBeNull();
    expect(fixture.nativeElement.querySelector('.ngx-lowcode-page__flex')).not.toBeNull();
  });
});

function createRuntime(mode: NgxLowcodeRuntimeContext['mode']): NgxLowcodeRuntimeContext {
  const runtimeState = signal<Record<string, unknown>>({});
  return {
    mode,
    state: runtimeState.asReadonly(),
    selection: signal<string | null>(null).asReadonly(),
    setSelection: () => undefined,
    setState: (patch) => runtimeState.update((current) => ({ ...current, ...patch })),
    executeActionById: async () => undefined,
    executeDatasourceById: async () => undefined
  };
}
