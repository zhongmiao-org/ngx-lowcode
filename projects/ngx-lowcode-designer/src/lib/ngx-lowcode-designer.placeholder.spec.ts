import { TestBed } from '@angular/core/testing';
import { provideNgxLowcode } from 'ngx-lowcode-core';
import { NgxLowcodePageSchema } from 'ngx-lowcode-core-types';
import { provideNgxLowcodeMaterials } from 'ngx-lowcode-materials';
import { NgxLowcodeDesignerComponent } from './ngx-lowcode-designer.component';

describe('NgxLowcodeDesignerComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxLowcodeDesignerComponent],
      providers: [provideNgxLowcode(), provideNgxLowcodeMaterials()]
    }).compileComponents();
  });

  it('routes prop edits through the store and keeps undo/redo working', () => {
    const fixture = TestBed.createComponent(NgxLowcodeDesignerComponent);
    const schemaChange = jasmine.createSpy('schemaChange');

    fixture.componentRef.setInput('schema', createDesignerSchema());
    fixture.componentInstance.schemaChange.subscribe(schemaChange);
    fixture.detectChanges();

    fixture.componentInstance.selectNode('text-1');
    fixture.componentInstance.updateNodeProp('text-1', 'text', 'Changed from designer');

    expect(fixture.componentInstance.editorSchema().layoutTree[0].children?.[0].props['text']).toBe('Changed from designer');
    expect(schemaChange).toHaveBeenCalled();

    fixture.componentInstance.undo();
    expect(fixture.componentInstance.editorSchema().layoutTree[0].children?.[0].props['text']).toBe('Hello');

    fixture.componentInstance.redo();
    expect(fixture.componentInstance.editorSchema().layoutTree[0].children?.[0].props['text']).toBe('Changed from designer');
  });

  it('updates selection through renderer-driven clicks', () => {
    const fixture = TestBed.createComponent(NgxLowcodeDesignerComponent);
    const selectionChange = jasmine.createSpy('selectionChange');

    fixture.componentRef.setInput('schema', createDesignerSchema());
    fixture.componentInstance.selectionChange.subscribe(selectionChange);
    fixture.detectChanges();

    const shells = Array.from(fixture.nativeElement.querySelectorAll('.ngx-lowcode-node-shell')) as HTMLElement[];
    shells[shells.length - 1].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.selectedNodeId()).toBe('text-1');
    expect(selectionChange).toHaveBeenCalledWith(
      jasmine.objectContaining({
        id: 'text-1',
        componentType: 'text'
      })
    );
  });
});

function createDesignerSchema(): NgxLowcodePageSchema {
  return {
    schemaVersion: '1.0.0',
    pageMeta: {
      id: 'page-1',
      title: 'Demo'
    },
    state: {},
    datasources: [],
    actions: [],
    layoutTree: [
      {
        id: 'page-1',
        componentType: 'page',
        props: {
          title: 'Demo Page',
          description: ''
        },
        children: [
          {
            id: 'text-1',
            componentType: 'text',
            props: {
              text: 'Hello'
            }
          }
        ]
      }
    ]
  };
}
