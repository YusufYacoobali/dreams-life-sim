import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { encodeWorld } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import { SaveRepository } from '../../src/persistence/repository';
import { createGameStore } from '../../src/state/gameStore';
import { database } from '../support/sqlite';
import pinned from '../fixtures/v30-native-interview-checkpoints.json';
const sha = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');

test('the exact pushed2f8ad13 Android92/93 checkpoints remain pinned and tag-only migration preserves the complete bound interview and actual outcome', () => {
  const bytes = readFileSync(join(__dirname, '../fixtures/v30-native-interview-checkpoints.json')); expect(bytes.length).toBe(190494); expect(sha(bytes)).toBe('2014c9e936f325bce82aef47633f1c7697d22cc421c1a8edebaae09db477a6d3');
  expect(pinned.producerCommit).toBe('2f8ad13c65abd072cb8c614e3aa99714b698adda'); expect(sha(pinned.interview)).toBe('af0c0f684a00a2462e1471b6721c94997cb57738fcbf7138507708022ddc0740'); expect(sha(pinned.result)).toBe('602bdc38a93610a43e163da185b76e1a847e1e0c2c613194757c75e5837a43b6');
  const { gunzipSync, strFromU8 } = require('fflate') as typeof import('fflate');
  for (const payload of [pinned.interview, pinned.result]) {
    const frame = JSON.parse(payload), root = JSON.parse(strFromU8(gunzipSync(Buffer.from(frame.main.data, 'base64')))); expect(root).toMatchObject({ schemaVersion: 30, engineVersion: 30, contentVersion: 7 });
    const current = unpackCheckpoint(payload), encoded = JSON.parse(encodeWorld(current)); expect(current.engineVersion).toBe(36); expect(current.contentVersion).toBe(11);
    for (const key of Object.keys(root).filter(key => !['schemaVersion', 'engineVersion', 'contentVersion', 'people', 'ledger'].includes(key))) expect(encoded[key]).toEqual(root[key]);
  }
  const before = unpackCheckpoint(pinned.interview), after = resolveCommand(before, { type: 'choose', eventId: before.pending!.id, choiceId: 'careful' }, true);
  expect(after).toEqual(unpackCheckpoint(pinned.result)); expect(after.people[after.activePersonId].employment).toMatchObject({ roleId: 'barista', annualPay: 3200000n, paidMonths: 0 });
});

test('reader9→10 retains exact old current/backup bytes; the actual interview retries after SQLite failure and cold-resumes its real result once', async () => {
  const { sqlite, driver } = database(); try {
    const repo = new SaveRepository(driver); await repo.initialise(); const world = unpackCheckpoint(pinned.interview); await repo.create(world);
    for (const table of ['lives', 'backups']) sqlite.prepare('UPDATE '+table+' SET payload=?').run(pinned.interview); sqlite.exec('PRAGMA user_version=9');
    const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(r => [r.name, sqlite.prepare('SELECT * FROM '+r.name+' ORDER BY 1,2').all()])); const original = rows();
    const upgraded = new SaveRepository(driver); await upgraded.initialise(); expect(sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(15); expect(rows()).toEqual(original);
    const makeStore = async () => { const repository = new SaveRepository(driver), store = createGameStore({ repository: async () => repository, date: () => world.date, id: () => 'unused' }); await store.getState().bootstrap(); return store; };
    let store = await makeStore(); expect(store.getState().world).toEqual(world); const command = { type: 'choose' as const, eventId: world.pending!.id, choiceId: 'careful' };
    sqlite.exec("CREATE TRIGGER fail_old_interview BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END"); expect(await store.getState().dispatch(command)).toBe(false); expect(rows()).toEqual(original); expect(store.getState().world).toEqual(world);
    sqlite.exec('DROP TRIGGER fail_old_interview'); expect(await store.getState().dispatch(command)).toBe(true); const result = store.getState().world!; expect(result).toEqual(unpackCheckpoint(pinned.result)); expect(sqlite.prepare('SELECT payload FROM backups WHERE life_id=?').get(world.id)?.payload).toBe(pinned.interview);
    store = await makeStore(); expect(store.getState().world).toEqual(result); expect(await store.getState().dispatch({ type: 'acknowledge', resultId: result.pending!.id })).toBe(true); const done = store.getState().world!; expect(done.people).toEqual(result.people); expect(done.random).toEqual(result.random); expect(await store.getState().dispatch(command)).toBe(false);
  } finally { sqlite.close(); }
});
