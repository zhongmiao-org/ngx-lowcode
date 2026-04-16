import { Injectable } from '@angular/core';

export interface DemoDslSnapshotRecord {
  id: string;
  version: 'demo-dsl-snapshot-v1';
  timestamp: string;
  checksum: string;
  label: string;
  payload: unknown;
}

const DEFAULT_DB_NAME = 'ngx-lowcode-demo';
const STORE_NAME = 'dsl_snapshots';

@Injectable({ providedIn: 'root' })
export class DemoSnapshotStoreService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private readonly memoryStore = new Map<string, DemoDslSnapshotRecord>();
  private readonly indexedDb: IDBFactory | null = resolveIndexedDbFactory();
  private readonly dbName = DEFAULT_DB_NAME;

  async saveSnapshot(record: DemoDslSnapshotRecord): Promise<void> {
    if (!this.indexedDb) {
      this.memoryStore.set(record.id, structuredClone(record));
      return;
    }
    const db = await this.openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('snapshot save failed'));
    });
  }

  async listSnapshots(): Promise<DemoDslSnapshotRecord[]> {
    if (!this.indexedDb) {
      return [...this.memoryStore.values()].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    }
    const db = await this.openDb();
    const items = await new Promise<DemoDslSnapshotRecord[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve((request.result ?? []) as DemoDslSnapshotRecord[]);
      request.onerror = () => reject(request.error ?? new Error('snapshot list failed'));
    });
    return items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  async getSnapshot(id: string): Promise<DemoDslSnapshotRecord | null> {
    if (!this.indexedDb) {
      return structuredClone(this.memoryStore.get(id) ?? null);
    }
    const db = await this.openDb();
    return await new Promise<DemoDslSnapshotRecord | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(id);
      request.onsuccess = () => resolve((request.result as DemoDslSnapshotRecord | undefined) ?? null);
      request.onerror = () => reject(request.error ?? new Error('snapshot read failed'));
    });
  }

  async deleteSnapshot(id: string): Promise<void> {
    if (!this.indexedDb) {
      this.memoryStore.delete(id);
      return;
    }
    const db = await this.openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('snapshot delete failed'));
    });
  }

  private async openDb(): Promise<IDBDatabase> {
    const indexedDb = this.indexedDb;
    if (!indexedDb) {
      throw new Error('indexeddb unavailable');
    }
    if (this.dbPromise) {
      return this.dbPromise;
    }
    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDb.open(this.dbName, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('indexeddb open failed'));
    });
    return this.dbPromise;
  }
}

function resolveIndexedDbFactory(): IDBFactory | null {
  if (typeof globalThis === 'undefined') {
    return null;
  }
  const candidate = (globalThis as { indexedDB?: IDBFactory }).indexedDB;
  return candidate ?? null;
}
