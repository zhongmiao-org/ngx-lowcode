import { TestBed } from '@angular/core/testing';
import { NgxLowcodeMaterialRegistry } from 'ngx-lowcode-core';
import { provideNgxLowcodeMaterials } from './built-in-materials';

describe('provideNgxLowcodeMaterials', () => {
  it('registers built-in materials', async () => {
    await TestBed.configureTestingModule({
      providers: [provideNgxLowcodeMaterials()]
    }).compileComponents();

    const registry = TestBed.inject(NgxLowcodeMaterialRegistry);
    expect(registry.get('page')).toBeTruthy();
    expect(registry.get('table')).toBeTruthy();
  });
});
