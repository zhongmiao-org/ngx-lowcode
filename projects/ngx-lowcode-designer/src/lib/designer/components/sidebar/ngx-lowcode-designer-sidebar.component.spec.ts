import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgxLowcodeComponentDefinition, NgxLowcodeNodeSchema } from '@zhongmiao/ngx-lowcode-core-types';
import { getDesignerI18n, getMaterialsI18n } from '@zhongmiao/ngx-lowcode-i18n';
import { mockPageSchema } from '@zhongmiao/ngx-lowcode-testing';
import { NgxLowcodeDesignerSidebarComponent } from './ngx-lowcode-designer-sidebar.component';

class DummyMaterialComponent {}

function createMaterialDefinition(type: string, title: string, category: string): NgxLowcodeComponentDefinition {
  return {
    type,
    title,
    category,
    component: DummyMaterialComponent,
    setterSchema: [],
    createNode: ({ id }) => ({
      id,
      componentType: type,
      props: {}
    })
  };
}

function appendChild(nodes: NgxLowcodeNodeSchema[]): NgxLowcodeNodeSchema[] {
  return nodes.map((node) =>
    node.id === 'page-root'
      ? {
          ...node,
          children: [
            ...(node.children ?? []),
            {
              id: 'new-child',
              componentType: 'text',
              props: { text: 'New child' }
            }
          ]
        }
      : node
  );
}

describe('NgxLowcodeDesignerSidebarComponent', () => {
  beforeEach(async () => {
    spyOn(console, 'error').and.callFake((...args: unknown[]) => {
      if (args.some((arg) => String(arg).includes('Error retrieving icon'))) {
        return;
      }
    });

    await TestBed.configureTestingModule({
      imports: [NgxLowcodeDesignerSidebarComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  it('groups materials by category order and preserves collapsed outline nodes when schema updates', async () => {
    const fixture = TestBed.createComponent(NgxLowcodeDesignerSidebarComponent);
    const materialsI18n = getMaterialsI18n('en-US');
    const schema = structuredClone(mockPageSchema);
    const nextSchema = structuredClone(mockPageSchema);
    nextSchema.layoutTree = appendChild(nextSchema.layoutTree);

    fixture.componentRef.setInput('collapsed', false);
    fixture.componentRef.setInput('locale', 'en-US');
    fixture.componentRef.setInput('t', getDesignerI18n('en-US'));
    fixture.componentRef.setInput('availableMaterials', [
      createMaterialDefinition('input', 'Input', materialsI18n.categories.dataEntry),
      createMaterialDefinition('page', 'Page', materialsI18n.categories.layout),
      createMaterialDefinition('alert', 'Alert', materialsI18n.categories.feedback)
    ]);
    fixture.componentRef.setInput('editorSchema', schema);
    fixture.componentRef.setInput('selectedNodeId', 'page-root');
    fixture.componentRef.setInput('paletteDropListId', 'palette');
    fixture.componentRef.setInput('stageDropListId', 'stage');
    await fixture.whenStable();

    expect(fixture.componentInstance.groupedMaterials().map((group) => group.category)).toEqual([
      materialsI18n.categories.layout,
      materialsI18n.categories.dataEntry,
      materialsI18n.categories.feedback
    ]);
    expect(fixture.componentInstance.expandedOutlineNodeIds()).toContain('search-form');

    fixture.componentInstance.expandedOutlineNodeIds.set(['page-root']);
    fixture.componentRef.setInput('editorSchema', nextSchema);
    await fixture.whenStable();

    expect(fixture.componentInstance.expandedOutlineNodeIds()).toEqual(['page-root', 'new-child']);
  });
});
