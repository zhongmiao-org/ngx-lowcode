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
});
