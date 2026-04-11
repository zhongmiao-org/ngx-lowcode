import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { NgxLowcodeMaterialRegistry } from 'ngx-lowcode-core';
import { NgxLowcodePuzzleAdapter, provideNgxLowcodePuzzleAdapter } from './adapter';

@Component({
  standalone: true,
  template: 'puzzle'
})
class PuzzleWidgetComponent {}

describe('NgxLowcodePuzzleAdapter', () => {
  it('adapts registered puzzle materials', async () => {
    const adapter = new NgxLowcodePuzzleAdapter([
      {
        type: 'puzzle-chart',
        title: 'Puzzle Chart',
        category: 'bi',
        component: PuzzleWidgetComponent,
        setterSchema: [],
        createNode: ({ id }) => ({
          id,
          componentType: 'puzzle-chart',
          props: {}
        })
      }
    ]);

    expect(adapter.adapt()).toHaveSize(1);
  });

  it('registers puzzle materials through the provider', async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideNgxLowcodePuzzleAdapter({
          materials: [
            {
              type: 'puzzle-table',
              title: 'Puzzle Table',
              category: 'bi',
              component: PuzzleWidgetComponent,
              setterSchema: [],
              createNode: ({ id }) => ({
                id,
                componentType: 'puzzle-table',
                props: {}
              })
            }
          ]
        })
      ]
    }).compileComponents();

    expect(TestBed.inject(NgxLowcodeMaterialRegistry).get('puzzle-table')).toBeTruthy();
  });
});
