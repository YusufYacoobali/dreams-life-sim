import { gunzipSync, strFromU8 } from 'fflate';
import { encodeWorld } from '../../src/game/model';
import { decodeSave } from '../../src/persistence/archive';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import { SaveRepository } from '../../src/persistence/repository';
import { createGameStore } from '../../src/state/gameStore';
import { database } from '../support/sqlite';
import archive from '../fixtures/v28-native-arcade-archive.json';

test('workplace migration preserves the genuine native paid outing and all twelve original worlds', () => {
  const inflate = (part: { data: string }) => JSON.parse(strFromU8(gunzipSync(Buffer.from(part.data, 'base64'))));
  const raw = (payload: string) => { const part = JSON.parse(payload); return part.format === 'dreams-checkpoint-v1' ? inflate(part) : { ...inflate(part.main), ledger: part.ledger.flatMap(inflate) }; };
  const save = decodeSave(JSON.stringify(archive)), originals = [archive.checkpoint, ...archive.snapshots.map(point => point.payload)].map(raw), worlds = [save.world, ...save.snapshots.map(point => unpackCheckpoint(point.payload))];
  worlds.forEach((world, index) => { const current = JSON.parse(encodeWorld(world)); expect(originals[index]).toMatchObject({ schemaVersion: 28, engineVersion: 27, contentVersion: 4 }); expect(current).toMatchObject({ schemaVersion: 33, engineVersion: 34, contentVersion: 9, hourlyContracts: [], hobbyEvents: [], workplaces: [], workRaises: [] }); for (const key of Object.keys(originals[index]).filter(key => !['schemaVersion', 'engineVersion', 'contentVersion'].includes(key))) expect(current[key]).toEqual(originals[index][key]); });
  expect(save.snapshots).toEqual(archive.snapshots); expect(save.snapshots).toHaveLength(12);
  expect(save.world).toMatchObject({ revision: 34, pending: { title: 'High score, low dignity' }, annual: { monthsProcessed: 1 } });
  expect(save.world.storyThreads[0]).toMatchObject({ resolution: 'attend', permission: { accepted: true, chance: 89, roll: 70 }, quote: { amount: 7500n, currency: 'ZAR', payerId: 'person_parent1' }, paidTransactionId: 'txn_33_2182' });
  expect(save.world.pending?.kind === 'result' && save.world.pending.effects[0].value).toBe('R75,00');
});

test('the old native paid result survives SQLite acknowledgement failure/retry/cold load and finishes the real remaining months without another charge', async () => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); await repository.import(JSON.stringify(archive));
  const makeStore = () => createGameStore({ repository: async () => new SaveRepository(driver), date: () => ({ year: 2026, month: 10, day: 20 }), id: () => 'unused' });
  let store = makeStore(); await store.getState().bootstrap(); const paid = store.getState().world!, before = encodeWorld(paid), thread = paid.storyThreads[0];
  if (paid.pending?.kind !== 'result') throw new Error('Missing native paid result'); const resultId = paid.pending.id;
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()])), unchanged = rows();
  sqlite.exec("CREATE TRIGGER fail_native_arcade_ack BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  expect(await store.getState().dispatch({ type: 'acknowledge', resultId })).toBe(false); expect(encodeWorld(store.getState().world!)).toBe(before); expect(rows()).toEqual(unchanged);
  sqlite.exec('DROP TRIGGER fail_native_arcade_ack'); store = makeStore(); await store.getState().bootstrap(); expect(encodeWorld(store.getState().world!)).toBe(before);
  expect(await store.getState().dispatch({ type: 'acknowledge', resultId })).toBe(true); const progressed = store.getState().world!;
  expect(progressed.date).toEqual({ year: 2038, month: 10, day: 20 }); expect(progressed.annual?.monthsProcessed).toBe(12); expect(progressed.storyThreads[0]).toEqual(thread);
  expect(progressed.ledger.filter(item => item.category === 'story-outing')).toEqual(paid.ledger.filter(item => item.category === 'story-outing'));
  store = makeStore(); await store.getState().bootstrap(); expect(store.getState().world).toEqual(progressed);
  expect(await store.getState().dispatch({ type: 'acknowledge', resultId })).toBe(false); expect(store.getState().world).toEqual(progressed);
  for (const point of archive.snapshots) { expect(sqlite.prepare('SELECT payload FROM snapshots WHERE life_id=? AND snapshot_id=?').get(paid.id, point.summary.id)?.payload).toBe(point.payload); expect(JSON.parse(sqlite.prepare('SELECT metadata FROM snapshot_metadata WHERE life_id=? AND snapshot_id=?').get(paid.id, point.summary.id)?.metadata as string)).toEqual(point.summary); }
  sqlite.close();
});
