import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { createGameStore } from '../../src/state/gameStore';
import { resolveCommand } from '../../src/game/engine';
import { decodeWorld, encodeWorld, type World } from '../../src/game/model';
import { SaveRepository } from '../../src/persistence/repository';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { accountFor } from '../../src/game/systems/common';
import { database } from '../support/sqlite';
import { medicalEpisodeScenarios } from '../support/medicalEpisodes';
import before from '../fixtures/v48-medical-before-episodes.json';

const raw = gunzipSync(Buffer.from(before.data, 'base64')).toString('utf8');
const records: { world: string; choices: { id: string; after: string }[] }[] = JSON.parse(raw);
function oldEnvelope(world: World) {
  const old = JSON.parse(encodeWorld(world)); old.schemaVersion = 48; old.engineVersion = 50; old.contentVersion = 27;
  for (const person of Object.values(old.people) as { health: { conditions: Record<string, unknown>[] } }[]) for (const condition of person.health.conditions) delete condition.episode;
  return JSON.stringify(old);
}

test('independently captured pre-feature World48 medical decisions preserve literal old terms and complete outcomes for both choices', () => {
  expect(before.sourceCommit).toBe('3c797e2253c98714c79d73191a09889774afccd5');
  expect(createHash('sha256').update(raw).digest('hex')).toBe(before.sha256);
  expect(records).toHaveLength(2);
  for (const recorded of records) {
    const original = JSON.parse(recorded.world), world = decodeWorld(recorded.world), cold = unpackCheckpoint(packCheckpoint(world));
    expect(world).toMatchObject({ schemaVersion: 49, engineVersion: 51, contentVersion: 28 });
    expect(JSON.parse(encodeWorld(world)).pending).toEqual(original.pending);
    expect(oldEnvelope(world)).toBe(recorded.world);
    expect(cold).toEqual(world);
    for (const choice of recorded.choices) {
      const actual = resolveCommand(cold, { type: 'choose', eventId: cold.pending!.id, choiceId: choice.id });
      expect(oldEnvelope(actual)).toBe(choice.after);
      expect(unpackCheckpoint(packCheckpoint(actual))).toEqual(actual);
      const replayed = decodeWorld(choice.after);
      expect(actual.pending).toEqual(replayed.pending);
      expect(actual.random).toEqual(replayed.random);
    }
  }
});

test('the reader28→31 upgrade changes only the marker, preserves old rows and migrates episode metadata on read', async () => {
  const { driver, sqlite } = database();
  try {
    const repository = new SaveRepository(driver); await repository.initialise();
    const source = records[0].world, world = decodeWorld(source); await repository.create(world);
    sqlite.prepare('UPDATE lives SET payload=? WHERE id=?').run(source, world.id);
    sqlite.prepare('UPDATE backups SET payload=? WHERE life_id=?').run(source, world.id);
    sqlite.exec('PRAGMA user_version=28');
    const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [String(row.name), sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
    const old = rows(), migrated = new SaveRepository(driver); await migrated.initialise();
    expect(sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(32);
    expect(rows()).toEqual(old);
    const loaded = await migrated.load(world.id);
    expect(loaded).toEqual(world); expect(rows()).toEqual(old);
    expect(loaded!.people[loaded!.activePersonId].health.conditions[0].episode).toEqual({ notified: true, assessed: false, admissionAt: null, stabilized: false });
    sqlite.exec('PRAGMA user_version=33'); await expect(new SaveRepository(driver).initialise()).rejects.toThrow(/newer version/);
  } finally { sqlite.close(); }
});

test('assessment and treatment survive failed atomic saves, exact retries, cold restarts and duplicate confirmation taps', async () => {
  const { driver, sqlite } = database();
  try {
    const repository = new SaveRepository(driver); await repository.initialise();
    const { symptoms } = medicalEpisodeScenarios(); await repository.create(symptoms);
    const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [String(row.name), sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
    const store = async () => { const result = createGameStore({ repository: async () => new SaveRepository(driver), id: () => 'unused', date: () => symptoms.date }); expect(await result.getState().bootstrap()).toBe(true); return result; };
    let current = await store();
    for (const choiceId of ['doctor', 'treat']) {
      const original = current.getState().world!, command = { type: 'choose' as const, eventId: original.pending!.id, choiceId }, expected = resolveCommand(original, command, true), saved = rows();
      sqlite.exec("CREATE TRIGGER fail_medical_commit BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
      expect(await current.getState().dispatch(command)).toBe(false);
      expect(current.getState().world).toEqual(original); expect(rows()).toEqual(saved);
      current = await store(); expect(current.getState().world).toEqual(original);
      sqlite.exec('DROP TRIGGER fail_medical_commit');
      const [first, second] = await Promise.all([current.getState().dispatch(command), current.getState().dispatch(command)]);
      expect(first).toBe(true); expect(second).toBe(false);
      expect(current.getState().world).toEqual(expected);
      expect(accountFor(current.getState().world!).cash).toBe(accountFor(expected).cash);
      current = await store(); expect(current.getState().world).toEqual(expected);
      expect(await current.getState().dispatch(command)).toBe(false);
    }
    expect(sqlite.prepare('SELECT COUNT(*) AS count FROM receipts WHERE life_id=?').get(symptoms.id)?.count).toBe(2);
    const treated = current.getState().world!;
    expect(treated.pending).toMatchObject({ kind: 'result', title: 'Care has begun' });
    expect(treated.people[treated.activePersonId].health.conditions[0].treatment).not.toBeNull();
  } finally { sqlite.close(); }
});
