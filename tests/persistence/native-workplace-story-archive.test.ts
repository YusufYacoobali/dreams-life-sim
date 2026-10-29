import { gunzipSync, strFromU8 } from 'fflate';
import { encodeWorld } from '../../src/game/model';
import { decodeSave } from '../../src/persistence/archive';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import { SaveRepository } from '../../src/persistence/repository';
import { createGameStore } from '../../src/state/gameStore';
import { database } from '../support/sqlite';
import archive from '../fixtures/v30-native-workplace-story-archive.json';
import earlier from '../fixtures/v30-native-raise-archive.json';
import { withoutMedicalEpisodeMetadata } from '../support/medicalLegacyProof';

test('the genuine named native result retains all twenty original moments, twenty-one worlds and earlier raise history', () => {
  const inflate = (part: { data: string }) => JSON.parse(strFromU8(gunzipSync(Buffer.from(part.data, 'base64'))));
  const raw = (payload: string) => { const part = JSON.parse(payload); return part.format === 'dreams-checkpoint-v1' ? inflate(part) : { ...inflate(part.main), ledger: part.ledger.flatMap(inflate) }; };
  const contents = decodeSave(JSON.stringify(archive)), originals = [archive.checkpoint, ...archive.snapshots.map(item => item.payload)].map(raw), worlds = [contents.world, ...contents.snapshots.map(item => unpackCheckpoint(item.payload))];
  expect(originals[0]).toMatchObject({ schemaVersion: 30, engineVersion: 29, contentVersion: 6, revision: 76 });
  worlds.forEach((world, i) => { const value = JSON.parse(withoutMedicalEpisodeMetadata(encodeWorld(world))); for (const key of Object.keys(originals[i]).filter(key => !['schemaVersion', 'engineVersion', 'contentVersion'].includes(key))) expect(value[key]).toEqual(originals[i][key]); });
  expect(contents.snapshots).toEqual(archive.snapshots); expect(contents.snapshots).toHaveLength(20);
  for (const point of earlier.snapshots) expect(archive.snapshots.find(item => item.summary.id === point.summary.id)).toEqual(point);
  expect(contents.world.pending).toMatchObject({ kind: 'result', title: 'The complete version', body: 'Thando Naidoo thanks you both. Sipho Naidoo does not have to interrupt to become visible.' });
  expect(contents.world.people[contents.world.activePersonId].employment).toMatchObject({ paidMonths: 48, annualPay: 4921875n, currency: 'ZAR', rank: 1 });
  expect(contents.world.workRaises[0]).toMatchObject({ accepted: true, roll: 3, annualPayAfter: 3937500n });
  expect(contents.world.relationships.find(item => item.id === 'relation_person_player_person_npc_49_17')!.strength).toBe(46);
  expect(contents.world.relationships.find(item => item.id === 'relation_person_player_person_npc_49_16')!.strength).toBe(43);
});

test('the actual saved workplace result acknowledges once through SQLite failure, retry and cold resume without further bond or pay awards', async () => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); await repository.import(JSON.stringify(archive));
  const createStore = () => createGameStore({ repository: async () => new SaveRepository(driver), date: () => ({ year: 2026, month: 10, day: 20 }), id: () => 'unused' });
  let store = createStore(); await store.getState().bootstrap(); const before = store.getState().world!;
  if (before.pending?.kind !== 'result') throw new Error('Missing genuine workplace result'); const resultId = before.pending.id;
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()])), originalRows = rows();
  sqlite.exec("CREATE TRIGGER fail_native_work_story BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  expect(await store.getState().dispatch({ type: 'acknowledge', resultId })).toBe(false); expect(store.getState().world).toEqual(before); expect(rows()).toEqual(originalRows);
  sqlite.exec('DROP TRIGGER fail_native_work_story'); store = createStore(); await store.getState().bootstrap(); expect(store.getState().world).toEqual(before);
  expect(await store.getState().dispatch({ type: 'acknowledge', resultId })).toBe(true); const done = store.getState().world!;
  expect(done).toEqual({ ...before, revision: 77, pending: null, pendingPriority: 0, annual: null });
  store = createStore(); await store.getState().bootstrap(); expect(store.getState().world).toEqual(done); const finalRows = rows();
  expect(await store.getState().dispatch({ type: 'acknowledge', resultId })).toBe(false); expect(rows()).toEqual(finalRows);
  for (const point of archive.snapshots) { expect(sqlite.prepare('SELECT payload FROM snapshots WHERE life_id=? AND snapshot_id=?').get(done.id, point.summary.id)?.payload).toBe(point.payload); expect(JSON.parse(sqlite.prepare('SELECT metadata FROM snapshot_metadata WHERE life_id=? AND snapshot_id=?').get(done.id, point.summary.id)?.metadata as string)).toEqual(point.summary); }
  sqlite.close();
});
