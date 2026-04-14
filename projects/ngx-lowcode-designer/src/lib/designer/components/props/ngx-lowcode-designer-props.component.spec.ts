import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { registerLowcodeMaterials } from 'ngx-lowcode-core';
import { getDesignerI18n } from 'ngx-lowcode-i18n';
import { getBuiltInMaterials } from 'ngx-lowcode-materials';
import { mockPageSchema } from 'ngx-lowcode-testing';
import { NgxLowcodeDesignerPropsComponent } from './ngx-lowcode-designer-props.component';

describe('NgxLowcodeDesignerPropsComponent', () => {
  beforeEach(async () => {
    spyOn(console, 'error').and.callFake((...args: unknown[]) => {
      if (args.some((arg) => String(arg).includes('Error retrieving icon'))) {
        return;
      }
    });

    await TestBed.configureTestingModule({
      imports: [NgxLowcodeDesignerPropsComponent],
      providers: [provideZonelessChangeDetection(), registerLowcodeMaterials(getBuiltInMaterials('en-US'))]
    }).compileComponents();
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

    expect(fixture.componentInstance.supportsSelectedNodeState()).toBeTrue();
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

    expect(fixture.componentInstance.supportsSelectedNodeState()).toBeTrue();
    expect(fixture.componentInstance.stateFormDraft().some((entry) => entry.key === 'keyword')).toBeTrue();
    expect(fixture.componentInstance.stateFormDraft().some((entry) => entry.key === 'owner')).toBeTrue();
    expect(fixture.componentInstance.stateFormDraft().some((entry) => entry.key === 'tableData')).toBeFalse();
  });

  it('shows actions and datasources only for supported selected components', async () => {
    const fixture = TestBed.createComponent(NgxLowcodeDesignerPropsComponent);

    fixture.componentRef.setInput('t', getDesignerI18n('en-US'));
    fixture.componentRef.setInput('editorSchema', structuredClone(mockPageSchema));
    fixture.componentRef.setInput('selectedNodeId', 'button-search');
    fixture.componentRef.setInput('styleUnits', ['px', '%']);
    fixture.componentRef.setInput('styleDimensions', []);
    await fixture.whenStable();

    expect(fixture.componentInstance.supportsSelectedNodeActions()).toBeTrue();
    expect(fixture.componentInstance.supportsSelectedNodeDatasource()).toBeFalse();
    expect(fixture.componentInstance.supportsSelectedNodeState()).toBeFalse();

    fixture.componentInstance.activePanelTab.set('actions');
    fixture.componentRef.setInput('selectedNodeId', 'page-root');
    await fixture.whenStable();

    expect(fixture.componentInstance.activePanelTab()).toBe('properties');
    expect(fixture.componentInstance.supportsSelectedNodeActions()).toBeFalse();

    fixture.componentRef.setInput('selectedNodeId', 'search-form');
    await fixture.whenStable();

    expect(fixture.componentInstance.supportsSelectedNodeDatasource()).toBeTrue();
    expect(fixture.componentInstance.supportsSelectedNodeState()).toBeTrue();

    fixture.componentInstance.activePanelTab.set('datasources');
    fixture.componentRef.setInput('selectedNodeId', 'search-form');
    await fixture.whenStable();

    expect(fixture.componentInstance.supportsSelectedNodeDatasource()).toBeTrue();
    expect(fixture.componentInstance.supportsSelectedNodeState()).toBeTrue();
    fixture.componentRef.setInput('selectedNodeId', 'page-root');
    await fixture.whenStable();

    expect(fixture.componentInstance.activePanelTab()).toBe('properties');
    expect(fixture.componentInstance.supportsSelectedNodeActions()).toBeFalse();
    expect(fixture.componentInstance.supportsSelectedNodeDatasource()).toBeFalse();
    expect(fixture.componentInstance.supportsSelectedNodeState()).toBeFalse();
  });
});
