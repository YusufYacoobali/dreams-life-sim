import { gunzipSync, strFromU8 } from 'fflate';
import { encodeWorld } from '../../src/game/model';
import { decodeSave } from '../../src/persistence/archive';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import { SaveRepository } from '../../src/persistence/repository';
import { createGameStore } from '../../src/state/gameStore';
import { database } from '../support/sqlite';
import archive from '../fixtures/v30-native-raise-archive.json';
import earlier from '../fixtures/v29-native-workplace-archive.json';

test('the genuine accepted raise preserves all nineteen worlds, eighteen original moments and the actual negotiated contract', () => {
  const inflate = (part: { data: string }) => JSON.parse(strFromU8(gunzipSync(Buffer.from(part.data, 'base64'))));
  const raw = (payload: string) => { const part = JSON.parse(payload); return part.format === 'dreams-checkpoint-v1' ? inflate(part) : { ...inflate(part.main), ledger: part.ledger.flatMap(inflate) }; };
  const save = decodeSave(JSON.stringify(archive)), original = [archive.checkpoint, ...archive.snapshots.map(item => item.payload)].map(raw), worlds = [save.world, ...save.snapshots.map(item => unpackCheckpoint(item.payload))];
  expect(original[0]).toMatchObject({ schemaVersion: 30, engineVersion: 29, contentVersion: 5, revision: 62 });
  worlds.forEach((world, index) => { const current = JSON.parse(encodeWorld(world)); expect(current.contentVersion).toBe(17); for (const key of Object.keys(original[index]).filter(key => !['schemaVersion', 'engineVersion', 'contentVersion'].includes(key))) expect(current[key]).toEqual(original[index][key]); });
  expect(save.snapshots).toEqual(archive.snapshots); expect(save.snapshots).toHaveLength(18);
  for (const point of earlier.snapshots) expect(archive.snapshots.find(item => item.summary.id === point.summary.id)).toEqual(point);
  const world = save.world, person = world.people[world.activePersonId];
  expect(world.pending).toMatchObject({ kind: 'result', title: 'Worth the awkward conversation', effects: [{ label: 'Annual gross pay', value: 'ZAR39,375.00' }, { label: 'Energy', value: '−6%' }] });
  expect(world.workRaises).toEqual([expect.objectContaining({ chance: 65, roll: 3, accepted: true, paidMonths: 24, performance: 75, annualPayBefore: 3750000n, annualPayAfter: 3937500n, currency: 'ZAR' })]);
  expect(person.employment).toMatchObject({ annualPay: 3937500n, paidMonths: 24, rank: 0 }); expect(world.workplaces[0].feedback[0]).toMatchObject({ chance: 67, roll: 87, accepted: false });
});

test('actual raise acknowledgement rolls back, retries and cold-resumes without a repeated award; later ordinary payroll retains the increase through promotion', async () => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); await repository.import(JSON.stringify(archive));
  const makeStore = () => createGameStore({ repository: async () => new SaveRepository(driver), date: () => ({ year: 2026, month: 10, day: 20 }), id: () => 'unused' });
  let store = makeStore(); await store.getState().bootstrap(); const before = store.getState().world!; if (before.pending?.kind !== 'result') throw new Error('Missing native raise result'); const resultId = before.pending.id;
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()])), originalRows = rows();
  sqlite.exec("CREATE TRIGGER fail_raise_ack BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  expect(await store.getState().dispatch({ type: 'acknowledge', resultId })).toBe(false); expect(store.getState().world).toEqual(before); expect(rows()).toEqual(originalRows);
  sqlite.exec('DROP TRIGGER fail_raise_ack'); store = makeStore(); await store.getState().bootstrap(); expect(store.getState().world).toEqual(before);
  expect(await store.getState().dispatch({ type: 'acknowledge', resultId })).toBe(true); const ready = store.getState().world!; expect(ready).toEqual({ ...before, revision: 63, pending: null, pendingPriority: 0 });
  store = makeStore(); await store.getState().bootstrap(); expect(store.getState().world).toEqual(ready); const finalRows = rows();
  expect(await store.getState().dispatch({ type: 'acknowledge', resultId })).toBe(false); expect(rows()).toEqual(finalRows);
  const request = ready.workRaises[0]; expect(await store.getState().dispatch({ type: 'request-raise', workplaceId: request.workplaceId, supervisorId: request.supervisorId })).toBe(false); expect(rows()).toEqual(finalRows);
  expect(await store.getState().dispatch({ type: 'advance' })).toBe(true); const progressed = store.getState().world!, person = progressed.people[progressed.activePersonId];
  const pay = progressed.ledger.slice(ready.ledger.length).filter(item => item.personId === person.id && item.category === 'income' && item.description === 'Employment pay');
  expect(pay).toHaveLength(12); expect(pay.every(item => item.cashDelta === 328125n && item.currency === 'ZAR')).toBe(true);
  expect(person.employment).toMatchObject({ paidMonths: 36, rank: 1, annualPay: 4921875n, currency: 'ZAR' }); expect(progressed.workRaises).toEqual(ready.workRaises);
  store = makeStore(); await store.getState().bootstrap(); expect(store.getState().world).toEqual(progressed);
  for (const point of archive.snapshots) { expect(sqlite.prepare('SELECT payload FROM snapshots WHERE life_id=? AND snapshot_id=?').get(ready.id, point.summary.id)?.payload).toBe(point.payload); expect(JSON.parse(sqlite.prepare('SELECT metadata FROM snapshot_metadata WHERE life_id=? AND snapshot_id=?').get(ready.id, point.summary.id)?.metadata as string)).toEqual(point.summary); }
  sqlite.close();
});
