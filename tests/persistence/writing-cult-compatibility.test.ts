import { createHash } from 'node:crypto';
import { decodeWorld, encodeWorld, validateWorld } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { SaveRepository } from '../../src/persistence/repository';
import { snapshotRecord, decodeSave } from '../../src/persistence/archive';
import { createGameStore } from '../../src/state/gameStore';
import { database } from '../support/sqlite';
import writing from '../fixtures/v46-writing-before-cult-merge.json';
import cult from '../fixtures/v46-cult-before-writing-merge.json';

const sha = (value: string) => createHash('sha256').update(value).digest('hex');
const records = [...writing.records, ...cult.records];
const payloadHashes: Record<string, string> = {
  immediate: '76710bfb4d198200bf56df0257c2ecb3288391c548cd771efc62f506ca278b1b',
  dramatic: '6cf7ec373e45351b55ebff6365a0038063a86d9ce7ff4ca9748a5e2bb23b87a9',
  cult: '3f8287a55caa7f09ac586d06a96334289890600a30555056112fe09129847b98',
};
/** Project only the two real producer variants into the combined schema.
 * Do not rebind a decision, recompute an outcome or strip recorded histories. */
const projected = (payload: string) => {
  const value = JSON.parse(payload);
  return { ...value, schemaVersion: 49, engineVersion: 51, contentVersion: 28, ...(Object.hasOwn(value, 'cults') ? {} : { cults: [] }) };
};

test('both46 fixtures come from their unmodified independent producers and retain literal payload/quote/outcome byte pins', () => {
  expect(writing.producerCommit).toBe('42edd005b4429efa976e22e7b84a9bf4fe785858');
  expect(cult.producerCommit).toBe('4b65c3a7ea4c97af589ca84bfedfc3d3869e19af');
  expect(writing.versions).toEqual({ world: 46, engine: 48, content: 25, reader: 26 }); expect(cult.versions).toEqual(writing.versions);
  expect(records).toHaveLength(3); expect(records.flatMap(row => row.resolutions)).toHaveLength(10);
  for (const record of records) {
    expect(sha(record.payload)).toBe(payloadHashes[record.name]); expect(record.sha256).toBe(payloadHashes[record.name]);
    expect(Buffer.byteLength(record.payload)).toBe(record.bytes); expect(sha(record.checkpoint)).toBe(record.checkpointSha256);
    const raw = JSON.parse(record.payload);
    expect(raw).toMatchObject({ schemaVersion: 46, engineVersion: 48, contentVersion: 25 });
    if (record.name === 'cult') { expect(raw.cults).toHaveLength(1); expect(raw.cults[0].book.length).toBeGreaterThan(0); expect(raw.cults[0].threads.length).toBeGreaterThan(0); }
    else expect(raw).not.toHaveProperty('cults');
    if (record.name === 'immediate') expect(raw.pending.choices.flatMap((row: { effects: { kind: string }[] }) => row.effects).some((effect: { kind: string }) => effect.kind === 'story-immediate')).toBe(true);
    if (record.name === 'dramatic') expect(raw.pending.choices.every((row: { effects: { copyVersion: number }[] }) => row.effects[0].copyVersion === 25)).toBe(true);
    for (const result of record.resolutions) expect(sha(result.payload)).toBe(result.sha256);
  }
});

test.each(records)('$name: genuine46 migration preserves every stored fact and all original full choice outcomes', record => {
  const raw = JSON.parse(record.payload), source = decodeWorld(record.payload, true), packed = unpackCheckpoint(record.checkpoint, true);
  expect(JSON.parse(encodeWorld(source))).toEqual(projected(record.payload)); expect(packed).toEqual(source);
  expect(unpackCheckpoint(packCheckpoint(source), true)).toEqual(source); expect(source.random).toEqual(raw.random);
  if (source.pending?.kind !== 'decision') throw new Error('Lost original pending decision');
  const before = encodeWorld(source);
  for (const outcome of record.resolutions) {
    const command = { type: 'choose' as const, eventId: source.pending.id, choiceId: outcome.choiceId }, selected = resolveCommand(source, command, true);
    expect(JSON.parse(encodeWorld(selected))).toEqual(projected(outcome.payload));
    expect(unpackCheckpoint(packCheckpoint(selected), true)).toEqual(selected); expect(() => resolveCommand(selected, command, true)).toThrow();
  }
  expect(encodeWorld(source)).toBe(before); expect(sha(record.payload)).toBe(payloadHashes[record.name]);
});

test.each(['null', 'object', 'string', 'corrupt'] as const)('present %s cult history in a genuine46 payload is rejected rather than erased', kind => {
  const raw = JSON.parse(cult.records[0].payload);
  raw.cults = kind === 'null' ? null : kind === 'object' ? {} : kind === 'string' ? 'missing' : [{ id: 'unearned-cult' }];
  const before = JSON.stringify(raw); expect(() => decodeWorld(before)).toThrow(); expect(JSON.stringify(raw)).toBe(before);
});

test('only the exact registered46 tuple may gain absent cults; current48 still requires an explicit valid history', () => {
  const raw = JSON.parse(writing.records[0].payload), incomplete = { ...raw, schemaVersion: 49, engineVersion: 51, contentVersion: 28 };
  expect(() => decodeWorld(JSON.stringify(incomplete))).toThrow(); expect(() => validateWorld(incomplete)).toThrow();
  expect(() => decodeWorld(JSON.stringify({ ...raw, engineVersion: 47 }))).toThrow();
  expect(() => decodeWorld(JSON.stringify({ ...raw, contentVersion: 24 }))).toThrow();
  expect(decodeWorld(writing.records[0].payload).cults).toEqual([]);
});

test.each(records)('$name: reader26 upgrades rows literally; failed choice rolls back and repository reload settles the genuine saved action once', async record => {
  const { sqlite, driver } = database(), initial = decodeWorld(record.payload, true), oldPoint = snapshotRecord(initial, '2026-10-23', 'Genuine46 boundary', record.checkpoint);
  const repository = new SaveRepository(driver); await repository.initialise();
  sqlite.prepare('INSERT INTO lives(id,name,revision,updated_at,payload) VALUES(?,?,?,?,?)').run(initial.id, 'Original46 life', initial.revision, '2026-10-23', record.payload);
  sqlite.prepare('INSERT INTO backups(life_id,revision,payload) VALUES(?,?,?)').run(initial.id, initial.revision, record.checkpoint);
  sqlite.prepare('INSERT INTO preferences(key,value) VALUES(?,?)').run('active_life', initial.id);
  sqlite.prepare('INSERT INTO snapshots(life_id,snapshot_id,payload) VALUES(?,?,?)').run(initial.id, oldPoint.summary.id, oldPoint.payload);
  sqlite.prepare('INSERT INTO snapshot_metadata(life_id,snapshot_id,revision,metadata) VALUES(?,?,?,?)').run(initial.id, oldPoint.summary.id, initial.revision, JSON.stringify(oldPoint.summary));
  sqlite.exec('PRAGMA user_version=26');
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()])), originalRows = rows();
  await new SaveRepository(driver).initialise(); expect(sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(29); expect(rows()).toEqual(originalRows);
  const createStore = () => createGameStore({ repository: async () => new SaveRepository(driver), date: () => initial.date, id: () => 'unused' });
  let store = createStore(); await store.getState().bootstrap(); expect(store.getState().world).toEqual(initial); expect(rows()).toEqual(originalRows);
  if (initial.pending?.kind !== 'decision') throw new Error('Lost genuine decision');
  const choiceId = record.name === 'immediate' ? 'help' : record.name === 'dramatic' ? 'report' : 'reward', sourceOutcome = record.resolutions.find(row => row.choiceId === choiceId)!;
  const command = { type: 'choose' as const, eventId: initial.pending.id, choiceId };
  sqlite.exec("CREATE TRIGGER fail_combined46_choice BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  expect(await store.getState().dispatch(command)).toBe(false); expect(rows()).toEqual(originalRows); expect(store.getState().world).toEqual(initial);
  sqlite.exec('DROP TRIGGER fail_combined46_choice'); store = createStore(); await store.getState().bootstrap(); expect(store.getState().world).toEqual(initial);
  expect(await store.getState().dispatch(command)).toBe(true); const selected = store.getState().world!;
  expect(JSON.parse(encodeWorld(selected))).toEqual(projected(sourceOutcome.payload));
  store = createStore(); await store.getState().bootstrap(); expect(store.getState().world).toEqual(selected); const afterRows = rows();
  expect(await store.getState().dispatch(command)).toBe(false); expect(rows()).toEqual(afterRows);
  const archive = decodeSave(await new SaveRepository(driver).export(initial.id)); expect(archive.world).toEqual(selected); expect(archive.snapshots).toEqual([oldPoint]);
  expect(sqlite.prepare('SELECT payload FROM snapshots WHERE life_id=? AND snapshot_id=?').get(initial.id, oldPoint.summary.id)?.payload).toBe(record.checkpoint);
  sqlite.close();
});

test('future reader29 is refused without changing its marker or data', async () => {
  const { sqlite, driver } = database(); sqlite.exec('PRAGMA user_version=30');
  await expect(new SaveRepository(driver).initialise()).rejects.toThrow('newer version'); expect(sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(30); sqlite.close();
});
