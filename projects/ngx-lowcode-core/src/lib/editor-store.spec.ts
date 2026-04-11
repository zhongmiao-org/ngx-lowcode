import { Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgxLowcodeEditorStore } from './editor-store';
import { registerLowcodeMaterials } from './providers';

@Component({
  standalone: true,
  template: ``
})
class TestTextMaterialComponent {
  readonly node = input.required<any>();
  readonly runtime = input.required<any>();
}

describe('NgxLowcodeEditorStore', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        NgxLowcodeEditorStore,
        registerLowcodeMaterials([
          {
            type: 'text',
            title: 'Text',
            category: 'basic',
            component: TestTextMaterialComponent,
            setterSchema: [],
            createNode: ({ id }) => ({
              id,
              componentType: 'text',
              props: {
                text: 'Hello'
              }
            })
          }
        ])
      ]
    }).compileComponents();
  });

  it('adds node through commands and selects the new node', () => {
    const store = TestBed.inject(NgxLowcodeEditorStore);

    store.dispatch({ type: 'add-node', componentType: 'text' });

    expect(store.schema().layoutTree.length).toBe(1);
    expect(store.selectedNodeId()).toBe(store.schema().layoutTree[0].id);
    expect(store.canUndo()).toBeTrue();
  });

  it('tracks undo and redo for structural changes', () => {
    const store = TestBed.inject(NgxLowcodeEditorStore);

    store.dispatch({ type: 'add-node', componentType: 'text' });
    store.dispatch({ type: 'undo' });

    expect(store.schema().layoutTree.length).toBe(0);
    expect(store.canRedo()).toBeTrue();

    store.dispatch({ type: 'redo' });

    expect(store.schema().layoutTree.length).toBe(1);
  });

  it('tracks undo and redo for prop updates by default', () => {
    const store = TestBed.inject(NgxLowcodeEditorStore);

    store.dispatch({
      type: 'replace-schema',
      schema: {
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
            id: 'node-1',
            componentType: 'text',
            props: {
              text: 'Hello'
            }
          }
        ]
      }
    });

    store.dispatch({
      type: 'update-node-props',
      nodeId: 'node-1',
      patch: {
        text: 'Updated'
      }
    });

    expect(store.history().length).toBe(1);
    expect(store.schema().layoutTree[0].props['text']).toBe('Updated');

    store.dispatch({ type: 'undo' });
    expect(store.schema().layoutTree[0].props['text']).toBe('Hello');

    store.dispatch({ type: 'redo' });
    expect(store.schema().layoutTree[0].props['text']).toBe('Updated');
  });

  it('replaces schema and preserves matching selection by default', () => {
    const store = TestBed.inject(NgxLowcodeEditorStore);

    store.dispatch({
      type: 'replace-schema',
      schema: {
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
            id: 'node-1',
            componentType: 'text',
            props: {
              text: 'Hello'
            }
          }
        ]
      }
    });
    store.dispatch({ type: 'select-node', nodeId: 'node-1' });

    store.dispatch({
      type: 'replace-schema',
      schema: {
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
            id: 'node-1',
            componentType: 'text',
            props: {
              text: 'Still here'
            }
          }
        ]
      }
    });

    expect(store.selectedNodeId()).toBe('node-1');
    expect(store.history().length).toBe(0);
  });

  it('updates page meta and supports undo/redo', () => {
    const store = TestBed.inject(NgxLowcodeEditorStore);

    store.dispatch({
      type: 'update-page-meta',
      patch: {
        title: 'Updated Title',
        description: 'Updated Description'
      }
    });

    expect(store.schema().pageMeta.title).toBe('Updated Title');
    expect(store.schema().pageMeta.description).toBe('Updated Description');

    store.dispatch({ type: 'undo' });
    expect(store.schema().pageMeta.title).toBe('Lowcode Demo');

    store.dispatch({ type: 'redo' });
    expect(store.schema().pageMeta.title).toBe('Updated Title');
  });

  it('replaces runtime model slices through typed commands', () => {
    const store = TestBed.inject(NgxLowcodeEditorStore);

    store.dispatch({
      type: 'replace-state',
      state: {
        keyword: 'alice'
      }
    });
    store.dispatch({
      type: 'replace-datasources',
      datasources: [
        {
          id: 'orders',
          type: 'mock',
          mockData: [{ id: 'SO-1' }]
        }
      ]
    });
    store.dispatch({
      type: 'replace-actions',
      actions: [
        {
          id: 'search-action',
          steps: [{ type: 'callDatasource', datasourceId: 'orders', stateKey: 'rows' }]
        }
      ]
    });

    expect(store.schema().state['keyword']).toBe('alice');
    expect(store.schema().datasources.length).toBe(1);
    expect(store.schema().actions.length).toBe(1);
    expect(store.canUndo()).toBeTrue();
  });

  it('updates node style and removes empty style keys', () => {
    const store = TestBed.inject(NgxLowcodeEditorStore);

    store.dispatch({
      type: 'replace-schema',
      schema: {
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
            id: 'node-1',
            componentType: 'text',
            props: {
              text: 'Hello'
            },
            style: {
              color: '#111111'
            }
          }
        ]
      }
    });

    store.dispatch({
      type: 'update-node-style',
      nodeId: 'node-1',
      patch: {
        color: '#222222',
        marginBottom: 16
      }
    });

    expect(store.schema().layoutTree[0].style).toEqual({
      color: '#222222',
      marginBottom: 16
    });

    store.dispatch({
      type: 'update-node-style',
      nodeId: 'node-1',
      patch: {
        color: '',
        marginBottom: undefined
      }
    });

    expect(store.schema().layoutTree[0].style).toBeUndefined();
  });
});
