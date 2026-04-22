import { Component, input, output, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { registerLowcodeMaterials } from '@zhongmiao/ngx-lowcode-core';
import { getDesignerI18n } from '@zhongmiao/ngx-lowcode-i18n';
import { getBuiltInMaterials } from '@zhongmiao/ngx-lowcode-materials';
import { mockPageSchema } from '@zhongmiao/ngx-lowcode-testing';
import { ThyTabsModule } from 'ngx-tethys/tabs';
import { NgxLowcodeDesignerPropsComponent } from './ngx-lowcode-designer-props.component';

@Component({
  selector: 'thy-tabs',
  template: '<ng-content />'
})
class ThyTabsStubComponent {
  readonly thySize = input<string>();
  readonly thyResponsive = input<boolean>();
  readonly thyActiveTab = input<string>();
  readonly thyActiveTabChange = output<string>();
}

@Component({
  selector: 'thy-tab',
  template: '<ng-content />'
})
class ThyTabStubComponent {
  readonly thyTitle = input<string>();
}

describe('NgxLowcodeDesignerPropsComponent', () => {
  beforeEach(async () => {
    vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      if (args.some((arg) => String(arg).includes('Error retrieving icon'))) {
        return;
      }
    });

    await TestBed.configureTestingModule({
      imports: [NgxLowcodeDesignerPropsComponent],
      providers: [provideZonelessChangeDetection(), registerLowcodeMaterials(getBuiltInMaterials('en-US'))]
    })
      .overrideComponent(NgxLowcodeDesignerPropsComponent, {
        remove: { imports: [ThyTabsModule] },
        add: { imports: [ThyTabsStubComponent, ThyTabStubComponent] }
      })
      .compileComponents();
  });

  it('rehydrates state entries for the selected input component only', async () => {
    const fixture = TestBed.createComponent(NgxLowcodeDesignerPropsComponent);
    const initialSchema = structuredClone(mockPageSchema);
    const nextSchema = structuredClone(mockPageSchema);
    nextSchema.state = {
      ...nextSchema.state,
      keyword: 'reloaded',
      owner: 'Alice',
      tableData: [{ id: 'SO-2001' }]
    };

    fixture.componentRef.setInput('t', getDesignerI18n('en-US'));
    fixture.componentRef.setInput('editorSchema', initialSchema);
    fixture.componentRef.setInput('selectedNodeId', 'input-keyword');
    fixture.componentRef.setInput('styleUnits', ['px', '%']);
    fixture.componentRef.setInput('styleDimensions', []);
    await fixture.whenStable();

    expect(fixture.componentInstance.supportsSelectedNodeState()).toBe(true);
    expect(fixture.componentInstance.stateFormDraft().length).toBe(1);
    expect(fixture.componentInstance.stateFormDraft().find((entry) => entry.key === 'keyword')?.textValue).toBe('');

    fixture.componentRef.setInput('editorSchema', nextSchema);
    await fixture.whenStable();

    expect(fixture.componentInstance.stateFormDraft().length).toBe(1);
    expect(fixture.componentInstance.stateFormDraft().find((entry) => entry.key === 'keyword')?.textValue).toBe(
      'reloaded'
    );
  });

  it('aggregates descendant state entries when selecting a form component', async () => {
    const fixture = TestBed.createComponent(NgxLowcodeDesignerPropsComponent);

    fixture.componentRef.setInput('t', getDesignerI18n('en-US'));
    fixture.componentRef.setInput('editorSchema', structuredClone(mockPageSchema));
    fixture.componentRef.setInput('selectedNodeId', 'search-form');
    fixture.componentRef.setInput('styleUnits', ['px', '%']);
    fixture.componentRef.setInput('styleDimensions', []);
    await fixture.whenStable();

    expect(fixture.componentInstance.supportsSelectedNodeState()).toBe(true);
    expect(fixture.componentInstance.stateFormDraft().some((entry) => entry.key === 'keyword')).toBe(true);
    expect(fixture.componentInstance.stateFormDraft().some((entry) => entry.key === 'owner')).toBe(true);
    expect(fixture.componentInstance.stateFormDraft().some((entry) => entry.key === 'tableData')).toBe(false);
  });

  it('shows actions and datasources only for supported selected components', async () => {
    const fixture = TestBed.createComponent(NgxLowcodeDesignerPropsComponent);

    fixture.componentRef.setInput('t', getDesignerI18n('en-US'));
    fixture.componentRef.setInput('editorSchema', structuredClone(mockPageSchema));
    fixture.componentRef.setInput('selectedNodeId', 'button-search');
    fixture.componentRef.setInput('styleUnits', ['px', '%']);
    fixture.componentRef.setInput('styleDimensions', []);
    await fixture.whenStable();

    expect(fixture.componentInstance.supportsSelectedNodeActions()).toBe(true);
    expect(fixture.componentInstance.supportsSelectedNodeDatasource()).toBe(false);
    expect(fixture.componentInstance.supportsSelectedNodeState()).toBe(false);

    fixture.componentInstance.activePanelTab.set('actions');
    fixture.componentRef.setInput('selectedNodeId', 'page-root');
    await fixture.whenStable();

    expect(fixture.componentInstance.activePanelTab()).toBe('properties');
    expect(fixture.componentInstance.supportsSelectedNodeActions()).toBe(false);

    fixture.componentRef.setInput('selectedNodeId', 'search-form');
    await fixture.whenStable();

    expect(fixture.componentInstance.supportsSelectedNodeDatasource()).toBe(true);
    expect(fixture.componentInstance.supportsSelectedNodeState()).toBe(true);

    fixture.componentInstance.activePanelTab.set('datasources');
    fixture.componentRef.setInput('selectedNodeId', 'search-form');
    await fixture.whenStable();

    expect(fixture.componentInstance.supportsSelectedNodeDatasource()).toBe(true);
    expect(fixture.componentInstance.supportsSelectedNodeState()).toBe(true);
    fixture.componentRef.setInput('selectedNodeId', 'page-root');
    await fixture.whenStable();

    expect(fixture.componentInstance.activePanelTab()).toBe('properties');
    expect(fixture.componentInstance.supportsSelectedNodeActions()).toBe(false);
    expect(fixture.componentInstance.supportsSelectedNodeDatasource()).toBe(false);
    expect(fixture.componentInstance.supportsSelectedNodeState()).toBe(false);
  });
});
