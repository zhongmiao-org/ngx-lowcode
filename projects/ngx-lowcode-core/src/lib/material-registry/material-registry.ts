import { Injectable, signal } from '@angular/core';
import { NgxLowcodeComponentDefinition } from 'ngx-lowcode-core-types';

@Injectable({
  providedIn: 'root'
})
export class NgxLowcodeMaterialRegistry {
  private readonly definitions = signal<Record<string, NgxLowcodeComponentDefinition>>({});

  register(definition: NgxLowcodeComponentDefinition): void {
    this.definitions.update((current) => ({
      ...current,
      [definition.type]: definition
    }));
  }

  registerMany(definitions: NgxLowcodeComponentDefinition[]): void {
    for (const definition of definitions) {
      this.register(definition);
    }
  }

  get(type: string): NgxLowcodeComponentDefinition | undefined {
    return this.definitions()[type];
  }

  list(): NgxLowcodeComponentDefinition[] {
    return Object.values(this.definitions());
  }
}
