import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync, gunzipSync, strToU8, strFromU8 } from 'fflate';
import { copyWorld, decodeWorld, encodeWorld, immutableWorld } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { accountFor, post } from '../../src/game/systems/common';
import { oweFamily } from '../../src/game/systems/family';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { SaveRepository } from '../../src/persistence/repository';
import { employee } from '../support/employee';
import { database } from '../support/sqlite';

type Part = { bytes: number; hash: string; data: string };
type Frame = { format: string; bytes: number; columns: string[]; main: Part; people: Part[]; ledger: Part[] };
const compression = require('fflate') as typeof import('fflate');
const naturalPayload = readFileSync(join(__dirname, '../fixtures/v30-family-year91-checkpoint.json'), 'utf8').trimEnd();
const inflate = (part: Part) => strFromU8(gunzipSync(Buffer.from(part.data, 'base64')));
function part(text: string): Part {
  const bytes = strToU8(text); let hash = 2166136261;
  for (const byte of bytes) hash = Math.imul(hash ^ byte, 16777619) >>> 0;
  return { bytes: bytes.length, hash: hash.toString(16).padStart(8, '0'), data: Buffer.from(gzipSync(bytes)).toString('base64') };
}
function recount(frame: Frame) { frame.bytes = frame.main.bytes + [...frame.people, ...frame.ledger].reduce((sum, value) => sum + value.bytes, 0); }
let sequence = 0;
function transactions() {
  const world = employee();
  world.people[world.activePersonId].stats.energy = ++sequence % 100;
  // Codec setup, not a naturally played or native life. Include exact large
  // signed money, escaped Unicode text and nullable transaction references.
  const huge = 1234567890123456789012345678901234567890n;
  post(world, huge, 0n, 'fixture-income', '漢字 "quoted"\nline ' + sequence);
  const receiver = Object.values(world.people).find(person => person.id !== world.activePersonId)!;
  const balance = accountFor(world).cash;
  post(world, -balance, 0n, 'fixture-spending', 'Spent fixture cash');
  oweFamily(world, world.activePersonId, receiver.id, huge, 'USD', 'settlement');
  post(world, huge, 0n, 'fixture-income', 'Later fixture income');
  const debt = world.liabilities.find(value => value.creditorId === receiver.id)!;
  const paid = resolveCommand(world, { type: 'repay', liabilityId: debt.id, amount: huge / 2n });
  for (let i = 0; i < 520; i++) post(paid, 1n, 0n, 'fixture-income', 'Small transaction ' + i);
  return paid;
}
afterEach(() => jest.restoreAllMocks());

test('tuple money, Unicode, null references and immutable cold block reuse are exact', () => {
  const world = transactions(), payload = packCheckpoint(world), frame = JSON.parse(payload) as Frame;
  expect(frame.format).toBe('dreams-checkpoint-v4'); expect(frame.ledger.length).toBe(2);
  const rows = frame.ledger.flatMap(value => JSON.parse(inflate(value)) as unknown[][]);
  for (const field of ['cashDelta', 'debtDelta']) {
    const index = frame.columns.indexOf(field);
    expect(rows.every(row => typeof row[index] === 'string')).toBe(true);
    expect(rows.some(row => String(row[index]).startsWith('-'))).toBe(true);
  }
  const cold = unpackCheckpoint(payload, true); expect(cold).toEqual(world);
  const gzip = jest.spyOn(compression, 'gzipSync'), again = JSON.parse(packCheckpoint(cold)) as Frame;
  expect(gzip).toHaveBeenCalledTimes(1); expect(again.ledger).toEqual(frame.ledger); expect(again.people).toEqual(frame.people);
});

test('the real year-91 save crosses the old limit with exact rollback, retry, backup and original moment bytes', async () => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver);
  try {
    await repository.initialise(); const original = unpackCheckpoint(naturalPayload, true);
    await repository.create(original);
    for (const table of ['lives', 'backups']) sqlite.prepare('UPDATE ' + table + ' SET payload=?').run(naturalPayload);
    sqlite.exec('PRAGMA user_version=7');
    const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
    const before = rows(), upgraded = new SaveRepository(driver);
    sqlite.exec("CREATE TRIGGER fail_upgrade BEFORE INSERT ON backups BEGIN SELECT RAISE(ABORT,'upgrade failure'); END");
    await expect(upgraded.initialise()).rejects.toThrow('upgrade failure'); expect(rows()).toEqual(before);
    expect(sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(7);
    sqlite.exec('DROP TRIGGER fail_upgrade'); await upgraded.initialise();
    expect(rows()).toEqual(before); expect(sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(11);
    const loaded = await upgraded.load(original.id), next = resolveCommand(loaded, { type: 'advance' }, true);
    const canonical = encodeWorld(next);
    expect(Buffer.byteLength(canonical)).toBeGreaterThan(20_000_000);
    expect(() => decodeWorld(canonical)).toThrow('Save is too large');
    sqlite.exec("CREATE TRIGGER fail_tuple_commit BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'commit failure'); END");
    await expect(upgraded.commit(next, loaded.revision, 'year92', true)).rejects.toThrow('commit failure'); expect(rows()).toEqual(before);
    sqlite.exec('DROP TRIGGER fail_tuple_commit'); await upgraded.commit(next, loaded.revision, 'year92', true);
    const currentPayload = sqlite.prepare('SELECT payload FROM lives').get()?.payload as string;
    expect(JSON.parse(currentPayload).format).toBe('dreams-checkpoint-v4');
    expect(sqlite.prepare('SELECT payload FROM backups').get()?.payload).toBe(naturalPayload);
    expect(sqlite.prepare('SELECT payload FROM snapshots').get()?.payload).toBe(naturalPayload);
    const cold = new SaveRepository(driver); expect(await cold.load(original.id)).toEqual(next); expect(await cold.recoveryPreview(original.id)).toEqual(original);
    if (next.pending?.kind === 'result') {
      const ack = resolveCommand(next, { type: 'acknowledge', resultId: next.pending.id }, true);
      await cold.commit(ack, next.revision, 'year92-ack');
      expect(await new SaveRepository(driver).load(original.id)).toEqual(ack);
      expect(sqlite.prepare('SELECT payload FROM backups').get()?.payload).toBe(currentPayload);
      expect(sqlite.prepare('SELECT payload FROM snapshots').get()?.payload).toBe(naturalPayload);
    }
  } finally { sqlite.close(); }
}, 120000);

test('a genuine v3 cold ledger is re-encoded once and never reused as tuple rows', () => {
  const old = JSON.parse(naturalPayload) as Frame, world = unpackCheckpoint(naturalPayload, true), frame = JSON.parse(packCheckpoint(world)) as Frame;
  expect(old.format).toBe('dreams-checkpoint-v3'); expect(frame.format).toBe('dreams-checkpoint-v4');
  expect(frame.ledger.every((value, index) => value.data !== old.ledger[index]?.data)).toBe(true);
  expect(unpackCheckpoint(JSON.stringify(frame), true)).toEqual(world);
}, 120000);

test.each([
  ['duplicate columns', (frame: Frame) => { frame.columns[1] = frame.columns[0]; }],
  ['missing columns', (frame: Frame) => { frame.columns = []; }],
  ['reserved column', (frame: Frame) => { frame.columns[0] = '__proto__'; }],
  ['oversized column', (frame: Frame) => { frame.columns[0] = 'a'.repeat(65); }],
  ['object-shaped row', (frame: Frame) => { const rows = JSON.parse(inflate(frame.ledger[0])); rows[0] = {}; frame.ledger[0] = part(JSON.stringify(rows)); recount(frame); }],
  ['missing cell', (frame: Frame) => { const rows = JSON.parse(inflate(frame.ledger[0])); rows[0].pop(); frame.ledger[0] = part(JSON.stringify(rows)); recount(frame); }],
  ['extra cell', (frame: Frame) => { const rows = JSON.parse(inflate(frame.ledger[0])); rows[0].push(null); frame.ledger[0] = part(JSON.stringify(rows)); recount(frame); }],
  ['short non-final block', (frame: Frame) => { const rows = JSON.parse(inflate(frame.ledger[0])); rows.pop(); frame.ledger[0] = part(JSON.stringify(rows)); recount(frame); }],
  ...[1, {}, '1.2', '1e3', '01', '+1', '', null].map(value => ['invalid money ' + JSON.stringify(value), (frame: Frame) => {
    const rows = JSON.parse(inflate(frame.ledger[0])); rows[0][frame.columns.indexOf('cashDelta')] = value;
    frame.ledger[0] = part(JSON.stringify(rows)); recount(frame);
  }] as const),
] as const)('rejects %s with otherwise valid checksums', (_label, mutate) => {
  const frame = JSON.parse(packCheckpoint(transactions())) as Frame; mutate(frame);
  expect(() => unpackCheckpoint(JSON.stringify(frame), true)).toThrow();
});

test('contradictory tuple money cannot seed immutable caches or bypass reconciliation', () => {
  const world = transactions(), frame = JSON.parse(packCheckpoint(world)) as Frame, rows = JSON.parse(inflate(frame.ledger[0]));
  const index = frame.columns.indexOf('cashDelta'); rows[0][index] = (BigInt(rows[0][index]) + 1n).toString();
  frame.ledger[0] = part(JSON.stringify(rows)); recount(frame);
  expect(() => unpackCheckpoint(JSON.stringify(frame), true)).toThrow(/reconcile/);
  const valid = immutableWorld(world), gzip = jest.spyOn(compression, 'gzipSync'); packCheckpoint(valid);
  expect(gzip).toHaveBeenCalledTimes(frame.ledger.length + frame.people.length + 1);
  const draft = copyWorld(valid); draft.accounts[0].cash++;
  expect(() => packCheckpoint(Object.freeze(draft))).toThrow(/reconcile/);
});
