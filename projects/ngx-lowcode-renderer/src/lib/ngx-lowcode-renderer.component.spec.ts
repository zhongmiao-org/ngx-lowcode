import { Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNgxLowcode, registerLowcodeMaterials } from 'ngx-lowcode-core';
import { NgxLowcodeRendererComponent } from './ngx-lowcode-renderer.component';

@Component({
  standalone: true,
  template: `<div class="hello">{{ node().props['text'] }}</div>`
})
class TextMaterialComponent {
  readonly node = input.required<any>();
  readonly runtime = input.required<any>();
}

describe('NgxLowcodeRendererComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxLowcodeRendererComponent],
      providers: [
        provideNgxLowcode(),
        registerLowcodeMaterials([
          {
            type: 'text',
            title: 'Text',
            category: 'basic',
            component: TextMaterialComponent,
            setterSchema: [],
            createNode: ({ id }) => ({
              id,
              componentType: 'text',
              props: { text: 'Hello Renderer' }
            })
          }
        ])
      ]
    }).compileComponents();
  });

  it('renders page schema with registered material', () => {
    const fixture = TestBed.createComponent(NgxLowcodeRendererComponent);
    fixture.componentRef.setInput('schema', {
      schemaVersion: '1.0.0',
      pageMeta: { id: 'page-1', title: 'Demo' },
      state: {},
      datasources: [],
      actions: [],
      layoutTree: [
        {
          id: 'node-1',
          componentType: 'text',
          props: { text: 'Hello Renderer' }
        }
      ]
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Hello Renderer');
  });

  it('emits selection changes in design mode', () => {
    const fixture = TestBed.createComponent(NgxLowcodeRendererComponent);
    const selectionChange = jasmine.createSpy('selectionChange');

    fixture.componentRef.setInput('mode', 'design');
    fixture.componentRef.setInput('schema', {
      schemaVersion: '1.0.0',
      pageMeta: { id: 'page-1', title: 'Demo' },
      state: {},
      datasources: [],
      actions: [],
      layoutTree: [
        {
          id: 'node-1',
          componentType: 'text',
          props: { text: 'Hello Renderer' }
        }
      ]
    });
    fixture.componentInstance.selectionChange.subscribe(selectionChange);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.ngx-lowcode-node-shell').click();

    expect(selectionChange).toHaveBeenCalledWith('node-1');
  });
});
