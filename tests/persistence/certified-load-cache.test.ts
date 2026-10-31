import { copyWorld, decodeWorld, encodeWorld, immutableWorld } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { SaveRepository, SaveCorrupt, SaveConflict } from '../../src/persistence/repository';
import { packCheckpoint } from '../../src/persistence/checkpoints';
import { database } from '../support/sqlite';
import graduate from '../fixtures/v3-employed-graduate.json';

async function saved() {
  const db = database(), repository = new SaveRepository(db.driver);
  await repository.initialise();
  const original = decodeWorld(JSON.stringify(graduate), true);
  await repository.create(original);
  return { ...db, repository, original };
}
test('a warm load reuses the certified identity but reads the actual SQLite bytes', async () => {
  const { sqlite, repository, original } = await saved();
  try {
    const first = await repository.load(original.id);
    expect(await repository.load(original.id)).toBe(first);
    sqlite.prepare('UPDATE lives SET payload=? WHERE id=?').run('{broken', original.id);
    await expect(repository.load(original.id)).rejects.toBeInstanceOf(SaveCorrupt);
    expect(await repository.recoveryPreview(original.id)).toEqual(original);
  } finally { sqlite.close(); }
});
test('different valid bytes at the same revision are decoded rather than hidden by the cache', async () => {
  const { sqlite, repository, original } = await saved();
  try {
    const first = await repository.load(original.id), changed = copyWorld(first);
    changed.journal[0].text = 'An external valid revision-preserving edit.';
    const expected = immutableWorld(changed);
    sqlite.prepare('UPDATE lives SET payload=? WHERE id=?').run(packCheckpoint(expected), original.id);
    const actual = await repository.load(original.id);
    expect(actual).not.toBe(first); expect(encodeWorld(actual)).toBe(encodeWorld(expected));
    expect(await repository.load(original.id)).toBe(actual);
  } finally { sqlite.close(); }
});
test('a same-payload metadata change still fails the revision check', async () => {
  const { sqlite, repository, original } = await saved();
  try {
    await repository.load(original.id);
    sqlite.prepare('UPDATE lives SET revision=revision+1 WHERE id=?').run(original.id);
    await expect(repository.load(original.id)).rejects.toBeInstanceOf(SaveCorrupt);
  } finally { sqlite.close(); }
});
test('external committed revisions are loaded and reject stale writes', async () => {
  const { sqlite, driver, repository, original } = await saved();
  try {
    await repository.load(original.id);
    const other = new SaveRepository(driver), before = await other.load(original.id);
    const next = resolveCommand(before, { type: 'health-routine', routine: { ...before.people[before.activePersonId].health.routine, mindfulness: true } }, true);
    await other.commit(next, before.revision, 'external');
    expect(await repository.load(original.id)).toEqual(next);
    await expect(repository.commit(next, before.revision, 'stale')).rejects.toBeInstanceOf(SaveConflict);
  } finally { sqlite.close(); }
});
test('a failed commit retains the old identity and retries durably once', async () => {
  const { sqlite, repository, original } = await saved();
  try {
    const before = await repository.load(original.id);
    const next = resolveCommand(before, { type: 'health-routine', routine: { ...before.people[before.activePersonId].health.routine, mindfulness: true } }, true);
    sqlite.exec("CREATE TRIGGER fail_cached_load BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'controlled cache failure'); END");
    await expect(repository.commit(next, before.revision, 'retry')).rejects.toThrow('controlled cache failure');
    expect(await repository.load(original.id)).toBe(before);
    sqlite.exec('DROP TRIGGER fail_cached_load');
    await repository.commit(next, before.revision, 'retry');
    const loaded = await repository.load(original.id);
    expect(loaded).toEqual(next);
    expect(await repository.commit(next, before.revision, 'retry')).toBe(loaded);
    expect(sqlite.prepare('SELECT COUNT(*) AS n FROM receipts WHERE command_id=?').get('retry')?.n).toBe(1);
  } finally { sqlite.close(); }
});
