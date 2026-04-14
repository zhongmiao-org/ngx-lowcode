import { signal, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgxLowcodeRuntimeContext } from 'ngx-lowcode-core-types';
import { NgxLowcodeTableMaterialComponent } from './ngx-lowcode-table-material.component';

describe('NgxLowcodeTableMaterialComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxLowcodeTableMaterialComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  it('renders rows from runtime state, triggers row actions, and falls back to an empty state when data is missing', async () => {
    const fixture = TestBed.createComponent(NgxLowcodeTableMaterialComponent);
    const runtimeState = signal<Record<string, unknown>>({
      tableData: [
        { id: 'SO-1001', owner: 'Alice', status: 'active' },
        { id: 'SO-1002', owner: 'Bob', status: 'paused' }
      ]
    });
    const executeActionById = jasmine.createSpy('executeActionById').and.resolveTo(undefined);
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
      id: 'results-table',
      componentType: 'table',
      props: {
        title: 'Order Results',
        dataKey: 'tableData',
        rowClickActionId: 'table-row-click'
      }
    });
    fixture.componentRef.setInput('runtime', runtime);
    await fixture.whenStable();

    expect(fixture.componentInstance.rows().length).toBe(2);
    expect(fixture.componentInstance.columns()).toEqual(['id', 'owner', 'status']);

    const firstRow = fixture.nativeElement.querySelector('tbody tr') as HTMLTableRowElement;
    firstRow.click();
    await fixture.whenStable();

    expect(executeActionById).toHaveBeenCalledWith('table-row-click', {
      eventName: 'rowClick',
      nodeId: 'results-table',
      row: { id: 'SO-1001', owner: 'Alice', status: 'active' },
      rowIndex: 0
    });

    runtime.setState({ tableData: [] });
    await fixture.whenStable();

    expect(fixture.componentInstance.rows()).toEqual([]);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No data');
  });
});
