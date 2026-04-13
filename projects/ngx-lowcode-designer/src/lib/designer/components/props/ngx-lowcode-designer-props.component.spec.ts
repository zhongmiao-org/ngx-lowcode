import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { getDesignerI18n } from 'ngx-lowcode-i18n';
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
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  it('preserves local draft edits until schema input changes, then rehydrates from the next schema', async () => {
    const fixture = TestBed.createComponent(NgxLowcodeDesignerPropsComponent);
    const initialSchema = structuredClone(mockPageSchema);
    const nextSchema = structuredClone(mockPageSchema);
    nextSchema.state = {
      ...nextSchema.state,
      keyword: 'reloaded'
    };

    fixture.componentRef.setInput('t', getDesignerI18n('en-US'));
    fixture.componentRef.setInput('editorSchema', initialSchema);
    fixture.componentRef.setInput('selectedNodeId', 'page-root');
    fixture.componentRef.setInput('styleUnits', ['px', '%']);
    fixture.componentRef.setInput('styleDimensions', []);
    await fixture.whenStable();

    fixture.componentInstance.stateDraft.set('{ invalid json');
    fixture.componentRef.setInput('selectedNodeId', 'search-form');
    await fixture.whenStable();

    expect(fixture.componentInstance.stateDraft()).toBe('{ invalid json');

    fixture.componentRef.setInput('editorSchema', nextSchema);
    await fixture.whenStable();

    expect(fixture.componentInstance.stateDraft()).toBe(JSON.stringify(nextSchema.state, null, 2));
  });
});
