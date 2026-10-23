import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync, strFromU8 } from 'fflate';
import { encodeWorld } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { decodeSave } from '../../src/persistence/archive';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import { SaveRepository } from '../../src/persistence/repository';
import { createGameStore } from '../../src/state/gameStore';
import { database } from '../support/sqlite';
import archive from '../fixtures/v30-native-people-block-archive.json';
import earlier from '../fixtures/v30-native-workplace-story-archive.json';

test('the genuine native v3 result migrates only its content tag and retains all twenty original mixed-format moments', () => {
  const bytes = readFileSync(join(__dirname, '../fixtures/v30-native-people-block-archive.json'));
  expect(bytes.length).toBe(1024189); expect(createHash('sha256').update(bytes).digest('hex')).toBe('1e4475aefee73e062ed4e5cb74bb0cd85ff90c2c6386ff94c50b66b7cc14b0e3');
  const inflate = (part: { data: string }) => JSON.parse(strFromU8(gunzipSync(Buffer.from(part.data, 'base64'))));
  const raw = (payload: string) => { const part = JSON.parse(payload); return part.format === 'dreams-checkpoint-v1' ? inflate(part) : { ...inflate(part.main), ...(part.people ? { people: Object.assign({}, ...part.people.map(inflate)) } : {}), ledger: part.ledger.flatMap(inflate) }; };
  expect(JSON.parse(archive.checkpoint).format).toBe('dreams-checkpoint-v3');
  const contents = decodeSave(JSON.stringify(archive)), originals = [archive.checkpoint, ...archive.snapshots.map(item => item.payload)].map(raw), worlds = [contents.world, ...contents.snapshots.map(item => unpackCheckpoint(item.payload))];
  expect(originals[0]).toMatchObject({ schemaVersion: 30, engineVersion: 29, contentVersion: 6, revision: 82 }); expect(worlds[0].contentVersion).toBe(26);
  worlds.forEach((world, index) => { const value = JSON.parse(encodeWorld(world)); for (const key of Object.keys(originals[index]).filter(key => !['schemaVersion', 'engineVersion', 'contentVersion'].includes(key))) expect(value[key]).toEqual(originals[index][key]); });
  expect(contents.snapshots).toEqual(archive.snapshots); expect(contents.snapshots).toHaveLength(20); for (const point of earlier.snapshots) expect(archive.snapshots.find(item => item.summary.id === point.summary.id)).toEqual(point);
  expect(contents.world.pending).toMatchObject({ kind: 'result', title: 'Routine saved' }); expect(contents.world.people[contents.world.activePersonId].health.routine.exercise).toBe('none');
}, 30000);

test('the genuine v3 result survives SQLite failure, retry and cold acknowledgement without rewriting any original moment', async () => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); await repository.import(JSON.stringify(archive));
  const createStore = () => createGameStore({ repository: async () => new SaveRepository(driver), date: () => ({ year: 2026, month: 10, day: 20 }), id: () => 'unused' });
  let store = createStore(); await store.getState().bootstrap(); const before = store.getState().world!, resultId = before.pending!.id;
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()])), originalRows = rows();
  sqlite.exec("CREATE TRIGGER fail_native_v3 BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  expect(await store.getState().dispatch({ type: 'acknowledge', resultId })).toBe(false); expect(store.getState().world).toEqual(before); expect(rows()).toEqual(originalRows);
  sqlite.exec('DROP TRIGGER fail_native_v3'); store = createStore(); await store.getState().bootstrap(); expect(store.getState().world).toEqual(before);
  expect(await store.getState().dispatch({ type: 'acknowledge', resultId })).toBe(true); const done = store.getState().world!; expect(done).toEqual(resolveCommand(before, { type: 'acknowledge', resultId }, true));
  store = createStore(); await store.getState().bootstrap(); expect(store.getState().world).toEqual(done); const finalRows = rows(); expect(await store.getState().dispatch({ type: 'acknowledge', resultId })).toBe(false); expect(rows()).toEqual(finalRows);
  for (const point of archive.snapshots) { expect(sqlite.prepare('SELECT payload FROM snapshots WHERE life_id=? AND snapshot_id=?').get(done.id, point.summary.id)?.payload).toBe(point.payload); expect(JSON.parse(sqlite.prepare('SELECT metadata FROM snapshot_metadata WHERE life_id=? AND snapshot_id=?').get(done.id, point.summary.id)?.metadata as string)).toEqual(point.summary); }
  sqlite.close();
}, 30000);
