import { gunzipSync, gzipSync, strFromU8, strToU8 } from 'fflate';
import { copyWorld, immutableWorld } from '../../src/game/model';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { createContact } from '../../src/game/systems/npcs';
import { connectPerson } from '../../src/game/systems/relationships';
import { employee } from '../support/employee';
import { decodeSave } from '../../src/persistence/archive';
import { SaveRepository } from '../../src/persistence/repository';
import { resolveCommand } from '../../src/game/engine';
import { database } from '../support/sqlite';
import archive from '../fixtures/v30-native-workplace-story-archive.json';

const compression = require('fflate') as typeof import('fflate');
type Part = { bytes: number; hash: string; data: string };
type Frame = { format: string; bytes: number; main: Part; people: Part[]; ledger: Part[] };
let sequence = 0;
function population() {
  const world = employee(), age = 30 + ++sequence;
  // Codec units use real generated contacts; different ages isolate cache keys.
  while (Object.keys(world.people).length < 70) { const person = createContact(world, { age }); connectPerson(world, person.id); }
  return world;
}
const inflate = (part: Part) => strFromU8(gunzipSync(Buffer.from(part.data, 'base64')));
function part(text: string): Part {
  const bytes = strToU8(text); let hash = 2166136261;
  for (const byte of bytes) hash = Math.imul(hash ^ byte, 16777619) >>> 0;
  return { bytes: bytes.length, hash: hash.toString(16).padStart(8, '0'), data: Buffer.from(gzipSync(bytes)).toString('base64') };
}
function recount(frame: Frame) { frame.bytes = frame.main.bytes + [...frame.people, ...frame.ledger].reduce((sum, value) => sum + value.bytes, 0); }

afterEach(() => jest.restoreAllMocks());

test('large known populations round-trip with an empty ledger and reuse unchanged people blocks', () => {
  const world = immutableWorld(population()), first = JSON.parse(packCheckpoint(world)) as Frame;
  expect(first.format).toBe('dreams-checkpoint-v4'); expect(first.people.length).toBeGreaterThan(1); expect(first.ledger).toEqual([]);
  expect(unpackCheckpoint(JSON.stringify(first), true)).toEqual(world);
  const gzip = jest.spyOn(compression, 'gzipSync'), draft = copyWorld(world); draft.revision++;
  const next = immutableWorld(draft), packed = JSON.parse(packCheckpoint(next)) as Frame;
  expect(gzip).toHaveBeenCalledTimes(1); expect(packed.people).toEqual(first.people); expect(unpackCheckpoint(JSON.stringify(packed))).toEqual(next);
});

test('changing another person invalidates only that block and never preserves the old mutable value', () => {
  const world = immutableWorld(population()), first = JSON.parse(packCheckpoint(world)) as Frame, id = Object.keys(JSON.parse(inflate(first.people[1])))[0];
  const gzip = jest.spyOn(compression, 'gzipSync'), draft = copyWorld(world); draft.people[id].stats.energy--;
  const next = immutableWorld(draft), packed = JSON.parse(packCheckpoint(next)) as Frame;
  expect(gzip).toHaveBeenCalledTimes(2); expect(packed.people[1]).not.toEqual(first.people[1]);
  for (let i = 0; i < first.people.length; i++) if (i !== 1) expect(packed.people[i]).toEqual(first.people[i]);
  expect(unpackCheckpoint(JSON.stringify(packed))).toEqual(next); expect(world.people[id].stats.energy).toBe(100);
});

test('a real cold immutable load primes exact reusable parts only after complete validation', () => {
  const mutable = population(), payload = packCheckpoint(mutable), before = JSON.parse(payload) as Frame;
  const loaded = unpackCheckpoint(payload, true), gzip = jest.spyOn(compression, 'gzipSync'), again = JSON.parse(packCheckpoint(loaded)) as Frame;
  expect(gzip).toHaveBeenCalledTimes(1); expect(again.people).toEqual(before.people); expect(unpackCheckpoint(JSON.stringify(again))).toEqual(loaded);
});

test('a read-only frozen load can avoid priming people blocks used by the active life', () => {
  const world = population(), payload = packCheckpoint(world), frame = JSON.parse(payload) as Frame;
  const preview = unpackCheckpoint(payload, true, false), gzip = jest.spyOn(compression, 'gzipSync');
  expect(Object.isFrozen(preview.people)).toBe(true); expect(preview).toEqual(world);
  packCheckpoint(preview); expect(gzip).toHaveBeenCalledTimes(frame.people.length + 1);
});

test('mutable worlds cannot seed a trusted cache and changed cash still receives full validation', () => {
  const world = population(), gzip = jest.spyOn(compression, 'gzipSync'), first = JSON.parse(packCheckpoint(world)) as Frame;
  expect(gzip).toHaveBeenCalledTimes(first.people.length + 1); gzip.mockClear(); packCheckpoint(world); expect(gzip).toHaveBeenCalledTimes(first.people.length + 1);
  gzip.mockClear(); world.accounts[0].cash += 1n; expect(() => packCheckpoint(Object.freeze(world))).toThrow(/reconcile/); expect(gzip).not.toHaveBeenCalled();
});

test('a well-checksummed world with contradictory finances cannot prime people blocks', () => {
  const world = population(), frame = JSON.parse(packCheckpoint(world)) as Frame, body = JSON.parse(inflate(frame.main));
  body.accounts[0].cash.$dreamsBigInt = (BigInt(body.accounts[0].cash.$dreamsBigInt) + 1n).toString(); frame.main = part(JSON.stringify(body)); recount(frame);
  expect(() => unpackCheckpoint(JSON.stringify(frame), true)).toThrow(/reconcile/);
  const valid = immutableWorld(world), gzip = jest.spyOn(compression, 'gzipSync'); packCheckpoint(valid); expect(gzip).toHaveBeenCalledTimes(frame.people.length + 1);
});

test('the bounded cache evicts old changed blocks while retaining recently used unchanged people', () => {
  const world = immutableWorld(population()); let first = world;
  for (let value = 0; value < 70; value++) {
    const draft = copyWorld(world); draft.people[draft.activePersonId].stats.happiness = value;
    const variant = immutableWorld(draft); if (!value) first = variant; packCheckpoint(variant);
  }
  const gzip = jest.spyOn(compression, 'gzipSync'), payload = packCheckpoint(first);
  expect(gzip).toHaveBeenCalledTimes(2); expect(unpackCheckpoint(payload)).toEqual(first);
}, 60000);

test('a genuine mixed-format native archive keeps its entire world and every original historical byte', () => {
  const contents = decodeSave(JSON.stringify(archive)), world = immutableWorld(contents.world), frame = JSON.parse(packCheckpoint(world)) as Frame;
  expect(frame.format).toBe('dreams-checkpoint-v4'); expect(frame.ledger.length).toBeGreaterThan(0); expect(unpackCheckpoint(JSON.stringify(frame), true)).toEqual(world);
  expect(contents.snapshots).toEqual(archive.snapshots); expect(contents.snapshots).toHaveLength(20);
});

test('reader eight upgrades an actual v2 current save atomically, keeps all old bytes and only writes v4 after a durable command', async () => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); const imported = await repository.import(JSON.stringify(archive));
  for (const table of ['lives', 'backups']) sqlite.prepare('UPDATE ' + table + ' SET payload=?').run(archive.checkpoint);
  sqlite.exec('PRAGMA user_version=6');
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()])), before = rows();
  sqlite.exec("CREATE TRIGGER fail_reader_seven BEFORE INSERT ON backups BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  const upgraded = new SaveRepository(driver); await expect(upgraded.initialise()).rejects.toThrow('storage failure');
  expect(sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(6); expect(rows()).toEqual(before);
  sqlite.exec('DROP TRIGGER fail_reader_seven'); await upgraded.initialise();
  expect(sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(12); expect(rows()).toEqual(before);
  const world = await upgraded.load(imported.id);
  const next = resolveCommand(world, { type: 'acknowledge', resultId: world.pending!.id }, true); await upgraded.commit(next, world.revision, 'reader7-native-ack');
  expect(JSON.parse(sqlite.prepare('SELECT payload FROM lives').get()?.payload as string).format).toBe('dreams-checkpoint-v4');
  expect(sqlite.prepare('SELECT payload FROM backups').get()?.payload).toBe(archive.checkpoint);
  expect(await new SaveRepository(driver).load(world.id)).toEqual(next); expect(await new SaveRepository(driver).recoveryPreview(world.id)).toEqual(world);
  for (const point of archive.snapshots) { expect(sqlite.prepare('SELECT payload FROM snapshots WHERE life_id=? AND snapshot_id=?').get(world.id, point.summary.id)?.payload).toBe(point.payload); expect(JSON.parse(sqlite.prepare('SELECT metadata FROM snapshot_metadata WHERE life_id=? AND snapshot_id=?').get(world.id, point.summary.id)?.metadata as string)).toEqual(point.summary); }
  sqlite.close();
});

test('recovering missing historical metadata preserves the original old compressed payload instead of re-packing it', async () => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); const world = await repository.import(JSON.stringify(archive));
  const point = archive.snapshots.find(item => JSON.parse(item.payload).format === 'dreams-checkpoint-v1')!;
  sqlite.prepare('DELETE FROM snapshot_metadata WHERE life_id=? AND snapshot_id=?').run(world.id, point.summary.id); sqlite.exec('PRAGMA user_version=3');
  await new SaveRepository(driver).initialise();
  expect(sqlite.prepare('SELECT payload FROM snapshots WHERE life_id=? AND snapshot_id=?').get(world.id, point.summary.id)?.payload).toBe(point.payload);
  const metadata = JSON.parse(sqlite.prepare('SELECT metadata FROM snapshot_metadata WHERE life_id=? AND snapshot_id=?').get(world.id, point.summary.id)?.metadata as string);
  expect(metadata).toMatchObject({ id: point.summary.id, revision: point.summary.revision, date: point.summary.date, name: point.summary.name, age: point.summary.age, size: point.payload.length, label: 'Earlier checkpoint' });
  expect(sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(12); expect(await new SaveRepository(driver).load(world.id)).toEqual(world);
  sqlite.close();
});

test.each([
  ['damaged people checksum', (frame: Frame) => { frame.people[0].hash = frame.people[0].hash === '00000000' ? 'ffffffff' : '00000000'; }],
  ['inconsistent byte total', (frame: Frame) => { frame.bytes++; }],
  ['oversized world', (frame: Frame) => { frame.bytes = 32_000_001; }],
  ['duplicate person across blocks', (frame: Frame) => { frame.people[1] = frame.people[0]; recount(frame); }],
  ['empty people block', (frame: Frame) => { frame.people[0] = part('{}'); recount(frame); }],
  ['array-shaped people block', (frame: Frame) => { frame.people[0] = part('[]'); recount(frame); }],
  ['short non-final people block', (frame: Frame) => { const group = JSON.parse(inflate(frame.people[0])), id = Object.keys(group)[0]; frame.people[0] = part(JSON.stringify({ [id]: group[id] })); recount(frame); }],
  ['oversized people block', (frame: Frame) => { const a = JSON.parse(inflate(frame.people[0])), b = JSON.parse(inflate(frame.people[1])), id = Object.keys(b)[0]; a[id] = b[id]; frame.people[0] = part(JSON.stringify(a)); recount(frame); }],
  ['people hidden in main body', (frame: Frame) => { const body = JSON.parse(inflate(frame.main)); body.people = {}; frame.main = part(JSON.stringify(body)); recount(frame); }],
  ['ledger hidden in main body', (frame: Frame) => { const body = JSON.parse(inflate(frame.main)); body.ledger = []; frame.main = part(JSON.stringify(body)); recount(frame); }],
  ['empty ledger block', (frame: Frame) => { frame.ledger = [part('[]')]; recount(frame); }],
  ['too many people blocks', (frame: Frame) => { frame.people = Array(513).fill(frame.people[0]); recount(frame); }],
] as const)('v4 rejects %s before accepting or caching a world', (_label, change) => {
  const frame = JSON.parse(packCheckpoint(population())) as Frame; change(frame); expect(() => unpackCheckpoint(JSON.stringify(frame), true)).toThrow();
});
