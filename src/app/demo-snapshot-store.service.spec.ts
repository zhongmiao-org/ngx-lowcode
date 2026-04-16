import { DemoDslSnapshotRecord, DemoSnapshotStoreService } from './demo-snapshot-store.service';

describe('DemoSnapshotStoreService', () => {
  function createRecord(id: string, timestamp: string): DemoDslSnapshotRecord {
    return {
      id,
      version: 'demo-dsl-snapshot-v1',
      timestamp,
      checksum: `fnv1a-${id}`,
      label: id,
      payload: { id }
    };
  }

  it('supports save/list/get/delete in memory fallback mode', async () => {
    const store = new DemoSnapshotStoreService();
    (store as unknown as { indexedDb: IDBFactory | null }).indexedDb = null;
    const first = createRecord('s1', '2026-04-16T12:00:00.000Z');
    const second = createRecord('s2', '2026-04-16T12:01:00.000Z');

    await store.saveSnapshot(first);
    await store.saveSnapshot(second);

    const list = await store.listSnapshots();
    expect(list.map((item) => item.id)).toEqual(['s2', 's1']);

    const loaded = await store.getSnapshot('s1');
    expect(loaded?.checksum).toBe('fnv1a-s1');

    await store.deleteSnapshot('s1');
    const afterDelete = await store.getSnapshot('s1');
    expect(afterDelete).toBeNull();
  });
});
