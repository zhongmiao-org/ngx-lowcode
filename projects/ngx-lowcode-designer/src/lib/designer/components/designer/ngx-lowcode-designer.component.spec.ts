import { Component, input, output, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
  NgxLowcodeComponentDefinition,
  NgxLowcodeDropTarget,
  NgxLowcodeNodeSchema,
  NgxLowcodePageSchema
} from '@zhongmiao/ngx-lowcode-core-types';
import { NgxLowcodeDesignerI18n, NgxLowcodeDesignerLocale } from '@zhongmiao/ngx-lowcode-i18n';
import { NgxLowcodeRendererComponent } from '@zhongmiao/ngx-lowcode-renderer';
import { mockPageSchema } from '@zhongmiao/ngx-lowcode-testing';
import { NgxLowcodeDesignerPropsComponent } from '../props/ngx-lowcode-designer-props.component';
import { NgxLowcodeDesignerSidebarComponent } from '../sidebar/ngx-lowcode-designer-sidebar.component';
import { NgxLowcodeDesignerComponent } from './ngx-lowcode-designer.component';

@Component({
  selector: 'ngx-lowcode-renderer',
  template: ''
})
class RendererStubComponent {
  readonly schema = input.required<NgxLowcodePageSchema>();
  readonly mode = input<'design' | 'runtime'>('runtime');
  readonly selectedNodeId = input<string | null>(null);
  readonly paletteDragging = input(false);
  readonly draggingNodeId = input<string | null>(null);
  readonly hoveredDropTarget = input<NgxLowcodeDropTarget | null>(null);
  readonly context = input<Record<string, unknown>>({});

  readonly selectionChange = output<string | null>();
  readonly dropTargetChange = output<NgxLowcodeDropTarget | null>();
  readonly nodeAddRequest = output<{ componentType: string; target: NgxLowcodeDropTarget }>();
  readonly nodeMoveRequest = output<{ nodeId: string; target: NgxLowcodeDropTarget }>();
  readonly nodeDeleteRequest = output<string>();
}

@Component({
  selector: 'ngx-lowcode-designer-sidebar',
  template: ''
})
class SidebarStubComponent {
  readonly collapsed = input(false);
  readonly locale = input<NgxLowcodeDesignerLocale>('zh-CN');
  readonly t = input.required<NgxLowcodeDesignerI18n>();
  readonly availableMaterials = input<NgxLowcodeComponentDefinition[]>([]);
  readonly editorSchema = input.required<NgxLowcodePageSchema>();
  readonly selectedNodeId = input<string | null>(null);
  readonly paletteDropListId = input.required<string>();
  readonly stageDropListId = input.required<string>();

  readonly toggleCollapse = output<void>();
  readonly materialAdd = output<string>();
  readonly paletteDragStateChange = output<boolean>();
  readonly nodeSelect = output<string>();
  readonly nodeRename = output<{ nodeId: string; name: string }>();
}

@Component({
  selector: 'ngx-lowcode-designer-props',
  template: ''
})
class PropsStubComponent {
  readonly collapsed = input(false);
  readonly locale = input<NgxLowcodeDesignerLocale>('zh-CN');
  readonly t = input.required<NgxLowcodeDesignerI18n>();
  readonly editorSchema = input.required<NgxLowcodePageSchema>();
  readonly selectedNodeId = input<string | null>(null);
  readonly styleUnits = input<readonly string[]>([]);
  readonly styleDimensions = input<Array<{ key: string; label: string }>>([]);

  readonly toggleCollapse = output<void>();
  readonly pageMetaChange = output<{ key: 'title' | 'description'; value: string }>();
  readonly nodeNameChange = output<{ nodeId: string; value: string }>();
  readonly nodePropChange = output<{ nodeId: string; key: string; value: unknown }>();
  readonly nodeStyleChange = output<{ nodeId: string; key: string; value: string }>();
  readonly duplicate = output<void>();
  readonly delete = output<void>();
  readonly stateReplace = output<Record<string, unknown>>();
  readonly datasourcesReplace = output<unknown[]>();
  readonly actionsReplace = output<unknown[]>();
}

describe('NgxLowcodeDesignerComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxLowcodeDesignerComponent],
      providers: [provideZonelessChangeDetection()]
    })
      .overrideComponent(NgxLowcodeDesignerComponent, {
        remove: {
          imports: [NgxLowcodeRendererComponent, NgxLowcodeDesignerSidebarComponent, NgxLowcodeDesignerPropsComponent]
        },
        add: {
          imports: [RendererStubComponent, SidebarStubComponent, PropsStubComponent]
        }
      })
      .compileComponents();
  });

  it('passes design mode runtime context to the renderer stage', async () => {
    const fixture = TestBed.createComponent(NgxLowcodeDesignerComponent);
    fixture.componentRef.setInput('schema', structuredClone(mockPageSchema));
    await fixture.whenStable();

    const renderer = fixture.debugElement.query(By.directive(RendererStubComponent))
      .componentInstance as RendererStubComponent;

    expect(renderer.mode()).toBe('design');
    expect(renderer.schema().pageMeta.id).toBe(mockPageSchema.pageMeta.id);
  });
});
