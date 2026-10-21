import { gunzipSync, strFromU8 } from 'fflate';
import { encodeWorld } from '../../src/game/model';
import { decodeSave } from '../../src/persistence/archive';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import { SaveRepository } from '../../src/persistence/repository';
import { createGameStore } from '../../src/state/gameStore';
import { database } from '../support/sqlite';
import archive from '../fixtures/v28-native-teen-archive.json';

test('the genuine native teen result preserves every current/prior field and all sixteen original mixed-format moments', () => {
  const inflate = (part: { data: string }) => JSON.parse(strFromU8(gunzipSync(Buffer.from(part.data, 'base64'))));
  const raw = (payload: string) => { const part = JSON.parse(payload); return part.format === 'dreams-checkpoint-v1' ? inflate(part) : { ...inflate(part.main), ledger: part.ledger.flatMap(inflate) }; };
  const save = decodeSave(JSON.stringify(archive)), original = [archive.checkpoint, ...archive.snapshots.map(item => item.payload)].map(raw), worlds = [save.world, ...save.snapshots.map(item => unpackCheckpoint(item.payload))];
  expect(original[0]).toMatchObject({ schemaVersion: 28, engineVersion: 27, contentVersion: 5, revision: 46 });
  worlds.forEach((world, index) => { const current = JSON.parse(encodeWorld(world)); expect(current).toMatchObject({ schemaVersion: 38, engineVersion: 39, contentVersion: 13, hourlyContracts: [], hobbyEvents: [], workplaces: [], workRaises: [] }); for (const key of Object.keys(original[index]).filter(key => !['schemaVersion', 'engineVersion', 'contentVersion'].includes(key))) expect(current[key]).toEqual(original[index][key]); });
  expect(save.snapshots).toEqual(archive.snapshots); expect(save.snapshots).toHaveLength(16);
  expect(save.world.pending).toMatchObject({ kind: 'result', title: 'A mutual arrangement', effects: [{ label: 'Respect', value: '+3%' }, { label: 'Happiness', value: '+0%' }, { label: 'Relationship', value: '+0%' }] });
  expect(save.world.people[save.world.activePersonId].stats.respect).toBe(59); expect(save.world.ledger.filter(item => item.category === 'story-outing')).toHaveLength(1);
});

test('cold native teen-result acknowledgement rolls back, retries once and preserves every original moment without repeating rewards', async () => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); await repository.import(JSON.stringify(archive));
  const makeStore = () => createGameStore({ repository: async () => new SaveRepository(driver), date: () => ({ year: 2026, month: 10, day: 20 }), id: () => 'unused' });
  let store = makeStore(); await store.getState().bootstrap(); const before = store.getState().world!; if (before.pending?.kind !== 'result') throw new Error('Missing native teen result'); const resultId = before.pending.id;
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()])), originalRows = rows();
  sqlite.exec("CREATE TRIGGER fail_teen_ack BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  expect(await store.getState().dispatch({ type: 'acknowledge', resultId })).toBe(false); expect(store.getState().world).toEqual(before); expect(rows()).toEqual(originalRows);
  sqlite.exec('DROP TRIGGER fail_teen_ack'); store = makeStore(); await store.getState().bootstrap(); expect(store.getState().world).toEqual(before);
  expect(await store.getState().dispatch({ type: 'acknowledge', resultId })).toBe(true); const final = store.getState().world!;
  expect(final).toMatchObject({ revision: 47, pending: null, annual: null }); expect(final.people).toEqual(before.people); expect(final.relationships).toEqual(before.relationships); expect(final.accounts).toEqual(before.accounts); expect(final.ledger).toEqual(before.ledger); expect(final.journal).toEqual(before.journal); expect(final.random).toEqual(before.random);
  store = makeStore(); await store.getState().bootstrap(); expect(store.getState().world).toEqual(final); const finalRows = rows(); expect(await store.getState().dispatch({ type: 'acknowledge', resultId })).toBe(false); expect(rows()).toEqual(finalRows);
  for (const point of archive.snapshots) { expect(sqlite.prepare('SELECT payload FROM snapshots WHERE life_id=? AND snapshot_id=?').get(final.id, point.summary.id)?.payload).toBe(point.payload); expect(JSON.parse(sqlite.prepare('SELECT metadata FROM snapshot_metadata WHERE life_id=? AND snapshot_id=?').get(final.id, point.summary.id)?.metadata as string)).toEqual(point.summary); }
  sqlite.close();
});
