import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { NgxLowcodeMaterialRegistry } from './material-registry';
import { NgxLowcodeComponentDefinition } from 'ngx-lowcode-core-types';

@Component({
  standalone: true,
  template: 'test'
})
class TestMaterialComponent {}

describe('NgxLowcodeMaterialRegistry', () => {
  let registry: NgxLowcodeMaterialRegistry;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    registry = TestBed.inject(NgxLowcodeMaterialRegistry);
  });

  it('registers and reads materials', () => {
    const definition: NgxLowcodeComponentDefinition = {
      type: 'test',
      title: 'Test',
      category: 'basic',
      component: TestMaterialComponent,
      setterSchema: [],
      createNode: ({ id }) => ({
        id,
        componentType: 'test',
        props: {}
      })
    };

    registry.register(definition);

    expect(registry.get('test')).toEqual(definition);
    expect(registry.list()).toHaveSize(1);
  });
});
