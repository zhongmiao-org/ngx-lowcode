import { Injectable, signal } from '@angular/core';

@Injectable()
export class NgxLowcodeDropListRegistryService {
  private readonly idsSignal = signal<string[]>([]);

  readonly ids = this.idsSignal.asReadonly();

  register(id: string): void {
    this.idsSignal.update((current) => (current.includes(id) ? current : [...current, id]));
  }

  unregister(id: string): void {
    this.idsSignal.update((current) => current.filter((item) => item !== id));
  }

  connectedTo(id: string): string[] {
    return this.idsSignal().filter((item) => item !== id);
  }
}
