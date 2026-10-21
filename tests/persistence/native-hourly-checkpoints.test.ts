import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { gunzipSync, strFromU8 } from 'fflate';
import { encodeWorld } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { SaveRepository } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { createGameStore } from '../../src/state/gameStore';
import { database } from '../support/sqlite';
import pinned from '../fixtures/v32-native-hourly-checkpoints.json';

const sha = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
function originalObject(payload: string) {
  const frame = JSON.parse(payload), inflate = (part: { data: string }) => JSON.parse(strFromU8(gunzipSync(Buffer.from(part.data, 'base64'))));
  expect(frame.format).toBe('dreams-checkpoint-v4');
  const root = inflate(frame.main);
  root.people = Object.assign({}, ...frame.people.map(inflate));
  root.ledger = frame.ledger.flatMap((part: { data: string }) => inflate(part).map((row: unknown[]) => Object.fromEntries(frame.columns.map((key: string, index: number) => [key, ['cashDelta', 'debtDelta'].includes(key) ? { $dreamsBigInt: row[index] } : row[index]]))));
  return root;
}

test('actual native129/130/132/134 remain pinned: migration adds only current tags and proven empty new histories', () => {
  const bytes = readFileSync(join(__dirname, '../fixtures/v32-native-hourly-checkpoints.json'));
  expect(bytes.length).toBe(547397); expect(sha(bytes)).toBe('9b12ebf08e9f316398db3ea2bfd7ccf9424bc6233b102be3223c7cb49a85258c');
  expect(pinned.producerCommit).toBe('944019d8fb07759c4fc2e644ddf8f717edcbd16c');
  for (const item of Object.values(pinned.checkpoints)) {
    expect(sha(item.payload)).toBe(item.payloadSha256);
    const original = originalObject(item.payload), current = checkpoints.unpackCheckpoint(item.payload);
    expect(original).toMatchObject({ schemaVersion: 32, engineVersion: 33, contentVersion: 9, revision: item.revision }); expect(original.npcCourtships).toBeUndefined();
    expect(JSON.parse(encodeWorld(current))).toEqual({ ...original, schemaVersion: 37, engineVersion: 38, contentVersion: 12, bestFriendships: [], teenRelationships: [], universityApplications: [], studyCourses: [], npcSeparations: [], npcMoves: [], npcCourtships: [], schoolWithdrawals: [] });
  }
  const year = checkpoints.unpackCheckpoint(pinned.checkpoints.year.payload), contract = year.hourlyContracts[0];
  expect(contract.terms).toEqual({ hourlyRate: 1603n, weeklyHours: 20, paidWeeks: 52 }); expect(contract.periods).toHaveLength(12);
  expect(contract.periods.reduce((total, row) => total + row.gross, 0n)).toBe(1667120n);
  expect(contract.periods.reduce((total, row) => total + row.paidMinutes, 0)).toBe(62400);
  expect(contract.periods.reduce((total, row) => total + row.workedMinutes, 0)).toBe(62400);
});

test('the original hourly interview still produces its exact original hiring result without upfront wages or paid time', () => {
  const before = checkpoints.unpackCheckpoint(pinned.checkpoints.interview.payload), hired = resolveCommand(before, { type: 'choose', eventId: before.pending!.id, choiceId: 'careful' }, true);
  expect(hired).toEqual(checkpoints.unpackCheckpoint(pinned.checkpoints.hired.payload)); expect(hired.accounts).toEqual(before.accounts); expect(hired.ledger).toEqual(before.ledger); expect(hired.hourlyContracts[0].periods).toEqual([]);
});

test('reader12 upgrades without rewriting raw saves; the actual completed payroll year retries its scene and resumes cold without repeating pay', async () => {
  const { sqlite, driver } = database();
  try {
    const payload = pinned.checkpoints.year.payload, world = checkpoints.unpackCheckpoint(payload), repo = new SaveRepository(driver); await repo.initialise(); await repo.create(world);
    for (const table of ['lives', 'backups']) sqlite.prepare('UPDATE ' + table + ' SET payload=?').run(payload);
    sqlite.exec('PRAGMA user_version=12');
    const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
    const original = rows(), repository = new SaveRepository(driver); await repository.initialise(); expect(sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(17); expect(rows()).toEqual(original);
    const store = createGameStore({ repository: async () => repository, date: () => world.date, id: () => 'unused' }); expect(await store.getState().bootstrap()).toBe(true); expect(store.getState().world).toEqual(world); expect(rows()).toEqual(original);
    const command = { type: 'choose' as const, eventId: world.pending!.id, choiceId: 'brief' }, unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    sqlite.exec("CREATE TRIGGER fail_old_hourly BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    expect(await store.getState().dispatch(command)).toBe(false); expect(rows()).toEqual(original); expect(store.getState().world).toEqual(world);
    sqlite.exec('DROP TRIGGER fail_old_hourly'); expect(await store.getState().dispatch(command)).toBe(true); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    const result = store.getState().world!; expect(result.hourlyContracts).toEqual(world.hourlyContracts); expect(result.ledger).toEqual(world.ledger); expect(sqlite.prepare('SELECT payload FROM backups WHERE life_id=?').get(world.id)?.payload).toBe(payload);
    const saved = rows(), coldRepo = new SaveRepository(driver), cold = createGameStore({ repository: async () => coldRepo, date: () => world.date, id: () => 'unused' }); expect(await cold.getState().bootstrap()).toBe(true); expect(cold.getState().world).toEqual(result); expect(rows()).toEqual(saved);
    expect(await cold.getState().dispatch({ type: 'acknowledge', resultId: result.pending!.id })).toBe(true); expect(cold.getState().world).toEqual(checkpoints.unpackCheckpoint(pinned.checkpoints.final.payload));
    const done = rows(); expect(await cold.getState().dispatch(command)).toBe(false); expect(rows()).toEqual(done);
  } finally { jest.restoreAllMocks(); sqlite.close(); }
});
