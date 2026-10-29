import { gunzipSync, strFromU8 } from 'fflate';
import { encodeWorld } from '../../src/game/model';
import { decodeSave } from '../../src/persistence/archive';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import { SaveRepository } from '../../src/persistence/repository';
import { createGameStore } from '../../src/state/gameStore';
import { database } from '../support/sqlite';
import archive from '../fixtures/v29-native-workplace-archive.json';
import earlier from '../fixtures/v28-native-teen-archive.json';
import { withoutMedicalEpisodeMetadata } from '../support/medicalLegacyProof';

test('the genuine native workplace result preserves all eighteen worlds, seventeen original moments and actual paid staff history', () => {
  const inflate = (part: { data: string }) => JSON.parse(strFromU8(gunzipSync(Buffer.from(part.data, 'base64'))));
  const raw = (payload: string) => { const part = JSON.parse(payload); return part.format === 'dreams-checkpoint-v1' ? inflate(part) : { ...inflate(part.main), ledger: part.ledger.flatMap(inflate) }; };
  const save = decodeSave(JSON.stringify(archive)), original = [archive.checkpoint, ...archive.snapshots.map(item => item.payload)].map(raw), worlds = [save.world, ...save.snapshots.map(item => unpackCheckpoint(item.payload))];
  expect(original[0]).toMatchObject({ schemaVersion: 29, engineVersion: 28, contentVersion: 5, revision: 54 });
  worlds.forEach((world, index) => { const current = JSON.parse(withoutMedicalEpisodeMetadata(encodeWorld(world))); expect(current.workRaises).toEqual([]); for (const key of Object.keys(original[index]).filter(key => !['schemaVersion', 'engineVersion', 'contentVersion'].includes(key))) expect(current[key]).toEqual(original[index][key]); });
  expect(save.snapshots).toEqual(archive.snapshots); expect(save.snapshots).toHaveLength(17);
  for (const point of earlier.snapshots) expect(archive.snapshots.find(item => item.summary.id === point.summary.id)).toEqual(point);
  const world = save.world, prior = unpackCheckpoint(save.snapshots.find(item => item.summary.id === 'snapshot_r_51')!.payload);
  expect(world.pending).toMatchObject({ kind: 'result', title: 'Not a good time', effects: [{ label: 'Performance', value: '+0%' }, { label: 'Energy', value: '−4%' }] });
  expect(world.workplaces[0].feedback).toEqual([expect.objectContaining({ paidMonths: 12, trustAtRequest: 35, chance: 67, roll: 87, accepted: false, performanceBefore: 57, performanceGain: 0 })]);
  expect(world.workplaces[0].members.map(item => item.personId)).toEqual(prior.workplaces[0].members.map(item => item.personId));
  for (const personId of [world.activePersonId, ...world.workplaces[0].members.map(item => item.personId)]) {
    expect(world.people[personId].employment!.paidMonths).toBe(prior.people[personId].employment!.paidMonths + 12);
    expect(world.people[personId].finance.serviceMonths).toBe(prior.people[personId].finance.serviceMonths + 12);
    expect(world.ledger.slice(prior.ledger.length).filter(item => item.personId === personId && item.category === 'income' && item.description === 'Employment pay')).toHaveLength(12);
  }
});

test('native workplace acknowledgement fails atomically, retries and cold-resumes without another salary, energy cost, draw or annual discussion', async () => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); await repository.import(JSON.stringify(archive));
  const makeStore = () => createGameStore({ repository: async () => new SaveRepository(driver), date: () => ({ year: 2026, month: 10, day: 20 }), id: () => 'unused' });
  let store = makeStore(); await store.getState().bootstrap(); const before = store.getState().world!; if (before.pending?.kind !== 'result') throw new Error('Missing native feedback result'); const resultId = before.pending.id;
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()])), originalRows = rows();
  sqlite.exec("CREATE TRIGGER fail_workplace_ack BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  expect(await store.getState().dispatch({ type: 'acknowledge', resultId })).toBe(false); expect(store.getState().world).toEqual(before); expect(rows()).toEqual(originalRows);
  sqlite.exec('DROP TRIGGER fail_workplace_ack'); store = makeStore(); await store.getState().bootstrap(); expect(store.getState().world).toEqual(before);
  expect(await store.getState().dispatch({ type: 'acknowledge', resultId })).toBe(true); const final = store.getState().world!;
  expect(final).toEqual({ ...before, revision: 55, pending: null, pendingPriority: 0 });
  store = makeStore(); await store.getState().bootstrap(); expect(store.getState().world).toEqual(final); const finalRows = rows();
  expect(await store.getState().dispatch({ type: 'acknowledge', resultId })).toBe(false); expect(rows()).toEqual(finalRows);
  const place = final.workplaces[0]; expect(await store.getState().dispatch({ type: 'work-feedback', workplaceId: place.id, supervisorId: place.feedback[0].supervisorId })).toBe(false); expect(rows()).toEqual(finalRows); expect(store.getState().world).toEqual(final);
  for (const point of archive.snapshots) { expect(sqlite.prepare('SELECT payload FROM snapshots WHERE life_id=? AND snapshot_id=?').get(final.id, point.summary.id)?.payload).toBe(point.payload); expect(JSON.parse(sqlite.prepare('SELECT metadata FROM snapshot_metadata WHERE life_id=? AND snapshot_id=?').get(final.id, point.summary.id)?.metadata as string)).toEqual(point.summary); }
  sqlite.close();
});
