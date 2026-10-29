import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { encodeWorld, validateWorld, type World } from '../../src/game/model';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import * as checkpoints from '../../src/persistence/checkpoints';
import native from '../fixtures/v35-native-best-friend-checkpoints.json';
import { withoutMedicalEpisodeMetadata } from '../support/medicalLegacyProof';

const sha = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const newHistories = ['teenRelationships', 'universityApplications', 'studyCourses', 'npcSeparations', 'npcMoves'] as const;
const tables = ['backups', 'branches', 'lives', 'preferences', 'receipts', 'restore_receipts', 'snapshot_metadata', 'snapshots'];
const observations = [
  { key: 'current', revision: 140, bytes: 142116, payloadSha: 'a9b79b6317e443512bf7a4988a15cf9d196774fa5175501cae7512b023b8fef8', canonicalSha: 'cfa1a20ca78ebdd61fb6dd01edd09b2dab2ff48a3e3e698f84529a0cb9aca28e' },
  { key: 'backup', revision: 139, bytes: 142288, payloadSha: 'a9b8f03be86f03d7e406cbbfa73d6ddbfb45767e75902917f94157ea43b1263e', canonicalSha: 'e7b41dc5e35af033dae7945d8ce2c09eaa9e585e2bc8b26a3ee978240eaccc22' },
] as const;

/** Normalize new episode metadata, C37/C38 empty histories and current root tags.
 * The actual nonempty best-friend agreement and every older field stay in the hash. */
function originalCanonical(world: World) {
  const original = JSON.parse(withoutMedicalEpisodeMetadata(encodeWorld(world)));
  expect(original).toMatchObject({ schemaVersion: 49, engineVersion: 51, contentVersion: 28, cults: [] });
  expect(original.rentalLeases).toEqual([]); for (const key of ['cults', 'miniGames', 'personSupportRequests', 'personActionHistory']) { expect(original[key]).toEqual([]); delete original[key]; } delete original.rentalLeases;
  expect(original.campusCommunities).toEqual([]); delete original.campusCommunities;
  for (const key of newHistories) { expect(original[key]).toEqual([]); delete original[key]; }
  expect(original.bestFriendships).toEqual([{
    id: 'best_friendship_138', ruleVersion: 1, relationshipId: 'relation_person_player_person_npc_15_5',
    proposerId: 'person_player', friendId: 'person_npc_15_5', proposed: { year: 2050, month: 10, day: 20 },
    country: 'US', city: 'New York', strength: 90, trust: 64, chance: 95, roll: 75,
    status: 'active', ended: null, endReason: null, endedById: null,
  }]);
  original.schemaVersion = 35; original.engineVersion = 36; original.contentVersion = 11;
  return JSON.stringify(original);
}

test('the two immutable actual native friendship checkpoints retain nonempty consent and their complete original canonical hashes', () => {
  const bytes = readFileSync(join(__dirname, '../fixtures/v35-native-best-friend-checkpoints.json'));
  expect(bytes.length).toBe(286999); expect(sha(bytes)).toBe('403a622ac0c5b4d9aa6af05382bbb087e9a8c62c4d133a3052363bfb28b6dfe3');
  expect(native.producerCommit).toBe('6f4b34c40005f5fba8eeee540bada9e0787ccbb0');
  expect(native.acceptedRuntimeCommit).toBe('ed296f91082a96b2fabe8973864bf6dba28344b3');
  expect(native.versions).toEqual({ world: 35, engine: 36, content: 11, database: 15, checkpoint: 'v4' });
  for (const observation of observations) {
    const capture = native[observation.key];
    expect(Buffer.byteLength(capture.checkpoint)).toBe(observation.bytes);
    expect(sha(capture.checkpoint)).toBe(observation.payloadSha); expect(capture.rawCheckpointSha256).toBe(observation.payloadSha);
    expect(capture.canonicalWorldSha256).toBe(observation.canonicalSha);
    const world = unpackCheckpoint(capture.checkpoint, true), encoded = encodeWorld(world);
    expect(world.id).toBe(capture.lifeId); expect(world.revision).toBe(observation.revision);
    expect(sha(originalCanonical(world))).toBe(observation.canonicalSha);
    if (observation.key === 'current') expect(world.pending).toBeNull();
    else expect(world.pending).toEqual({ kind: 'result', id: 'action_138', title: 'Your best friend', body: 'Morgan agreed to be your best friend. Nobody had a certificate ready.', illustration: 'conversation', effects: [{ id: 'best_friendship_138', label: 'Morgan Bennett', value: 'Best friends', tone: 'positive' }] });
    expect(world.annual).toBeNull(); expect(encodeWorld(unpackCheckpoint(packCheckpoint(world), true))).toBe(encoded);
    expect(sha(capture.checkpoint)).toBe(observation.payloadSha);
  }
});

async function fixtureDatabase() {
  const directory = mkdtempSync(join(tmpdir(), 'dreams-production-gaps-migration-')), path = join(directory, 'dreams.db');
  let sqlite!: DatabaseSync;
  function connect(): SqlDatabase {
    const connection = sqlite = new DatabaseSync(path); connection.exec('PRAGMA foreign_keys=ON');
    const session: SqlSession = {
      run: async (sql, values = []) => { connection.prepare(sql).run(...values); },
      get: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).get(...values) as T ?? null,
      all: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).all(...values) as T[],
    };
    return { ...session, exec: async sql => { connection.exec(sql); }, transaction: async action => {
      connection.exec('BEGIN IMMEDIATE');
      try { const result = await action(session); connection.exec('COMMIT'); return result; }
      catch (error) { connection.exec('ROLLBACK'); throw error; }
    } };
  }
  let driver = connect(); await new SaveRepository(driver).initialise();
  // Install only the two unmodified native payload strings. This is a file-backed
  // reader harness, not a claimed import of all seven lives/66 moments/147 receipts.
  sqlite.prepare('INSERT INTO lives(id,name,revision,updated_at,payload) VALUES(?,?,?,?,?)').run(native.current.lifeId, native.current.name, native.current.revision, native.observedAt, native.current.checkpoint);
  sqlite.prepare('INSERT INTO backups(life_id,revision,payload) VALUES(?,?,?)').run(native.backup.lifeId, native.backup.revision, native.backup.checkpoint);
  sqlite.prepare('INSERT INTO preferences(key,value) VALUES(?,?)').run('active_life', native.current.lifeId);
  sqlite.exec('PRAGMA user_version=15'); sqlite.close(); driver = connect();
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  const forbidRowWrites = () => { for (const table of tables) for (const action of ['INSERT', 'UPDATE', 'DELETE']) sqlite.exec('CREATE TRIGGER deny_' + table + '_' + action + ' BEFORE ' + action + ' ON ' + table + " BEGIN SELECT RAISE(ABORT,'unexpected payload or row rewrite'); END"); };
  return { get sqlite() { return sqlite; }, get driver() { return driver; }, rows, forbidRowWrites,
    reopen: () => { sqlite.close(); driver = connect(); return new SaveRepository(driver); },
    close: () => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); },
  };
}

test('reader15→29 changes only the marker and cold-loads both actual nonempty-friendship checkpoints without eager row rewrites', async () => {
  const context = await fixtureDatabase();
  try {
    const before = context.rows(); expect(Object.keys(before)).toEqual(tables);
    for (const table of ['branches', 'receipts', 'restore_receipts', 'snapshot_metadata', 'snapshots']) expect(before[table]).toEqual([]);
    expect(context.sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(15); context.forbidRowWrites();
    const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'), repository = new SaveRepository(context.driver);
    await repository.initialise(); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    expect(context.sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(29); expect(context.rows()).toEqual(before);
    const current = await repository.active(), backup = await repository.recoveryPreview(native.current.lifeId);
    expect(current).not.toBeNull(); expect(sha(originalCanonical(current!))).toBe(observations[0].canonicalSha); expect(sha(originalCanonical(backup))).toBe(observations[1].canonicalSha);
    expect(current!.pending).toBeNull(); expect(backup.pending).toMatchObject({ kind: 'result', id: 'action_138', title: 'Your best friend' });
    expect(context.rows()).toEqual(before);
    // Close the actual disk connection; both reads use a new repository/cache.
    const cold = context.reopen(); await cold.initialise();
    const coldCurrent = await cold.active(), coldBackup = await cold.recoveryPreview(native.current.lifeId);
    expect(encodeWorld(coldCurrent!)).toBe(encodeWorld(current!)); expect(encodeWorld(coldBackup)).toBe(encodeWorld(backup));
    expect(context.rows()).toEqual(before);
    expect(context.sqlite.prepare('SELECT payload FROM lives').get()?.payload).toBe(native.current.checkpoint);
    expect(context.sqlite.prepare('SELECT payload FROM backups').get()?.payload).toBe(native.backup.checkpoint);
    expect(context.sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(29);
  } finally { jest.restoreAllMocks(); context.close(); }
});

test('failure after writing the reader29 marker rolls back to supported15 with every original row intact before a cold retry', async () => {
  const context = await fixtureDatabase();
  try {
    const before = context.rows(); context.forbidRowWrites(); const driver = context.driver;
    const failing: SqlDatabase = { ...driver, transaction: action => driver.transaction(tx => action({ ...tx, run: async (sql, values) => {
      await tx.run(sql, values); if (sql === 'PRAGMA user_version = 29') throw new Error('controlled marker failure');
    } })) };
    await expect(new SaveRepository(failing).initialise()).rejects.toThrow('controlled marker failure');
    expect(context.sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(15); expect(context.rows()).toEqual(before);
    const retry = context.reopen(); await retry.initialise(); expect(context.sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(29); expect(context.rows()).toEqual(before);
    expect(sha(originalCanonical((await retry.active())!))).toBe(observations[0].canonicalSha);
    expect(sha(originalCanonical(await retry.recoveryPreview(native.current.lifeId)))).toBe(observations[1].canonicalSha); expect(context.rows()).toEqual(before);
  } finally { context.close(); }
});

test('unsupported reader29 is refused before any mutation of the retained native current/backup database', async () => {
  const context = await fixtureDatabase();
  try {
    context.sqlite.exec('PRAGMA user_version=30'); const before = context.rows(); context.forbidRowWrites();
    await expect(new SaveRepository(context.driver).initialise()).rejects.toThrow('newer version');
    expect(context.sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(30); expect(context.rows()).toEqual(before);
  } finally { context.close(); }
});

test.each(newHistories)('a current-format save cannot omit required %s history', key => {
  const current: Partial<World> = structuredClone(unpackCheckpoint(native.current.checkpoint));
  expect(validateWorld(current).schemaVersion).toBe(49);
  delete current[key];
  expect(() => validateWorld(current)).toThrow();
});
