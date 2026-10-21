import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createLife } from '../../src/game/createLife';
import { decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { createGameStore } from '../../src/state/gameStore';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import * as checkpoints from '../../src/persistence/checkpoints';
import native from '../fixtures/v35-native-best-friend-checkpoints.json';
import archive from '../fixtures/v30-native-workplace-story-archive.json';

// C39 current-version assertions wait for the coordinated future runtime union.
const sha = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const histories = ['teenRelationships', 'universityApplications', 'studyCourses', 'npcSeparations'] as const;
const tables = ['backups', 'branches', 'lives', 'preferences', 'receipts', 'restore_receipts', 'snapshot_metadata', 'snapshots'];
const observations = [
  { key: 'current', revision: 140, payloadSha: 'a9b79b6317e443512bf7a4988a15cf9d196774fa5175501cae7512b023b8fef8', canonicalSha: 'cfa1a20ca78ebdd61fb6dd01edd09b2dab2ff48a3e3e698f84529a0cb9aca28e' },
  { key: 'backup', revision: 139, payloadSha: 'a9b8f03be86f03d7e406cbbfa73d6ddbfb45767e75902917f94157ea43b1263e', canonicalSha: 'e7b41dc5e35af033dae7945d8ce2c09eaa9e585e2bc8b26a3ee978240eaccc22' },
] as const;
function freshLife() {
  return createLife('life_c38_migration_newborn', 637, { firstName: 'Migration', lastName: 'Only', gender: 'female', country: 'US', city: 'New York', appearance: { face: 0, skin: 2, hair: 3, hairColor: 1 } }, { year: 2026, month: 10, day: 21 });
}
/** Explicitly arranged legacy envelope. This is NOT a genuine C37 producer:
 * every person/earned fact comes from the unchanged older native BF fixture.
 * Only root tags and absence of future npcMoves are arranged for World36 compatibility. */
function arrangedWorld36() {
  const original = JSON.parse(encodeWorld(unpackCheckpoint(native.current.checkpoint, true)));
  expect(original).toMatchObject({ schemaVersion: 41, engineVersion: 42, contentVersion: 17, npcMoves: [] });
  for (const key of histories) expect(original[key]).toEqual([]);
  delete original.npcMoves; original.schemaVersion = 36; original.engineVersion = 37; original.contentVersion = 12;
  return original;
}
/** Remove only fields demonstrably absent from this immutable World35 input.
 * All nonempty friendship facts and all older source fields stay in the hash. */
function originalNativeCanonical(world: World) {
  const original = JSON.parse(encodeWorld(world));
  expect(original).toMatchObject({ schemaVersion: 41, engineVersion: 42, contentVersion: 17, npcMoves: [] });
  delete original.npcMoves;
  expect(original.campusCommunities).toEqual([]); delete original.campusCommunities;
  for (const key of histories) { expect(original[key]).toEqual([]); delete original[key]; }
  expect(original.bestFriendships).toEqual([{
    id: 'best_friendship_138', ruleVersion: 1, relationshipId: 'relation_person_player_person_npc_15_5', proposerId: 'person_player', friendId: 'person_npc_15_5',
    proposed: { year: 2050, month: 10, day: 20 }, country: 'US', city: 'New York', strength: 90, trust: 64, chance: 95, roll: 75,
    status: 'active', ended: null, endReason: null, endedById: null,
  }]);
  original.schemaVersion = 35; original.engineVersion = 36; original.contentVersion = 11;
  return JSON.stringify(original);
}

test('arranged legacy World36 adds only empty npcMoves and the three current root tags; every prior field remains exact', () => {
  const legacy = arrangedWorld36(), before = JSON.stringify(legacy), migrated = decodeWorld(before, true);
  expect(JSON.parse(encodeWorld(migrated))).toEqual({ ...legacy, schemaVersion: 41, engineVersion: 42, contentVersion: 17, campusCommunities: [], npcMoves: [] });
  expect(JSON.stringify(legacy)).toBe(before); expect(migrated.bestFriendships).toHaveLength(1);
  for (const key of histories) expect(migrated[key]).toEqual(legacy[key]);
  expect(unpackCheckpoint(packCheckpoint(migrated), true)).toEqual(migrated);
});

test.each(histories)('legacy World36 cannot erase or repair omitted or corrupt nonempty %s history', key => {
  const omitted = arrangedWorld36(); delete omitted[key]; expect(() => decodeWorld(JSON.stringify(omitted))).toThrow();
  const corrupt = arrangedWorld36();
  // Deliberately invalid negative input, not an invented earned/consented record.
  corrupt[key] = [{ id: 'invalid-migration-corruption', personId: corrupt.activePersonId }];
  expect(() => decodeWorld(JSON.stringify(corrupt))).toThrow();
});

test('actual new-life construction requires npcMoves in current World41; decoding cannot silently default a missing current array', () => {
  const newborn = freshLife(), current = JSON.parse(encodeWorld(newborn));
  expect(current).toMatchObject({ schemaVersion: 41, engineVersion: 42, contentVersion: 17, npcMoves: [], revision: 0, birthAcknowledged: false });
  const missingRuntime: Record<string, unknown> = { ...newborn }; delete missingRuntime.npcMoves;
  const missing = { ...current }; delete missing.npcMoves;
  expect(() => validateWorld(missingRuntime)).toThrow(); expect(() => decodeWorld(JSON.stringify(missing))).toThrow();
  expect(() => decodeWorld(JSON.stringify({ ...current, npcMoves: [{ id: 'invalid-new-move' }] }))).toThrow();
});

test.each(observations)('unchanged genuine native $key keeps its complete original world, bound result and nonempty friendship proof', observation => {
  const fixtureBytes = readFileSync(join(__dirname, '../fixtures/v35-native-best-friend-checkpoints.json'));
  expect(fixtureBytes.length).toBe(286999); expect(sha(fixtureBytes)).toBe('403a622ac0c5b4d9aa6af05382bbb087e9a8c62c4d133a3052363bfb28b6dfe3');
  expect(native.versions).toEqual({ world: 35, engine: 36, content: 11, database: 15, checkpoint: 'v4' });
  const input = native[observation.key]; expect(sha(input.checkpoint)).toBe(observation.payloadSha);
  const world = unpackCheckpoint(input.checkpoint, true), canonical = encodeWorld(world);
  expect(world.id).toBe(input.lifeId); expect(world.revision).toBe(observation.revision); expect(sha(originalNativeCanonical(world))).toBe(observation.canonicalSha);
  expect(world.annual).toBeNull();
  if (observation.key === 'current') expect(world.pending).toBeNull();
  else expect(world.pending).toEqual({ kind: 'result', id: 'action_138', title: 'Your best friend', body: 'Morgan agreed to be your best friend. Nobody had a certificate ready.', illustration: 'conversation', effects: [{ id: 'best_friendship_138', label: 'Morgan Bennett', value: 'Best friends', tone: 'positive' }] });
  expect(encodeWorld(unpackCheckpoint(packCheckpoint(world), true))).toBe(canonical); expect(sha(input.checkpoint)).toBe(observation.payloadSha);
});

async function fixtureDatabase(reader: number) {
  const directory = mkdtempSync(join(tmpdir(), 'dreams-c38-migration-')), file = join(directory, 'dreams.db'); let sqlite!: DatabaseSync;
  const connect = (): SqlDatabase => {
    const connection = sqlite = new DatabaseSync(file); connection.exec('PRAGMA foreign_keys=ON');
    const session: SqlSession = { run: async (sql, values = []) => { connection.prepare(sql).run(...values); }, get: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).get(...values) as T ?? null, all: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).all(...values) as T[] };
    return { ...session, exec: async sql => { connection.exec(sql); }, transaction: async action => { connection.exec('BEGIN IMMEDIATE'); try { const result = await action(session); connection.exec('COMMIT'); return result; } catch (error) { connection.exec('ROLLBACK'); throw error; } } };
  };
  let driver = connect(); const repository = new SaveRepository(driver); await repository.initialise();
  expect(sha(readFileSync(join(__dirname, '../fixtures/v30-native-workplace-story-archive.json')))).toBe('3774db894776ba92c4c6ef6b4c10678a4125c53a0ea5ec4044189701fe75e1f1');
  const archived = await repository.import(JSON.stringify(archive));
  // Genuine source snapshot + actual existing branch operation populate both
  // branch tables. This is arranged test setup, not a full original native DB.
  await repository.restoreBranch(archived.id, archive.snapshots[0].summary.id, archived.revision, 'life_c38_migration_branch', 'c38_migration_restore');
  // A genuine fresh birth + actual store acknowledgement supplies a real receipt
  // without inventing a career, consent, qualification or historical award.
  await repository.create(freshLife());
  const store = createGameStore({ repository: async () => repository, date: () => ({ year: 2026, month: 10, day: 21 }), id: () => 'unused' });
  expect(await store.getState().bootstrap()).toBe(true); expect(await store.getState().acknowledgeBirth()).toBe(true);
  expect(sqlite.prepare('SELECT command_id,revision FROM receipts WHERE life_id=?').get('life_c38_migration_newborn')).toEqual({ command_id: 'birth:life_c38_migration_newborn', revision: 1 });
  // Preserve exact old strings in the storage harness rather than claiming that
  // importing into the current runtime left its current payload unmigrated.
  sqlite.prepare('UPDATE lives SET payload=? WHERE id=?').run(archive.checkpoint, archived.id);
  sqlite.prepare('UPDATE backups SET payload=? WHERE life_id=?').run(archive.checkpoint, archived.id);
  sqlite.prepare('INSERT INTO lives(id,name,revision,updated_at,payload) VALUES(?,?,?,?,?)').run(native.current.lifeId, native.current.name, native.current.revision, native.observedAt, native.current.checkpoint);
  sqlite.prepare('INSERT INTO backups(life_id,revision,payload) VALUES(?,?,?)').run(native.backup.lifeId, native.backup.revision, native.backup.checkpoint);
  sqlite.prepare("UPDATE preferences SET value=? WHERE key='active_life'").run(native.current.lifeId);
  // Only the reader marker is explicitly arranged; this is not an original
  // pre-upgrade native capture or proof of four nonempty C37 histories.
  sqlite.exec('PRAGMA user_version=' + reader); sqlite.close(); driver = connect();
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  return { get sqlite() { return sqlite; }, get driver() { return driver; }, rows, archivedId: archived.id,
    forbidWrites: () => { for (const table of tables) for (const action of ['INSERT', 'UPDATE', 'DELETE']) sqlite.exec('CREATE TRIGGER deny_' + table + '_' + action + ' BEFORE ' + action + ' ON ' + table + " BEGIN SELECT RAISE(ABORT,'unexpected row rewrite'); END"); },
    reopen: () => { sqlite.close(); driver = connect(); return new SaveRepository(driver); },
    originalPayloads: () => {
      expect(sqlite.prepare('SELECT payload FROM lives WHERE id=?').get(native.current.lifeId)?.payload).toBe(native.current.checkpoint);
      expect(sqlite.prepare('SELECT payload FROM backups WHERE life_id=?').get(native.backup.lifeId)?.payload).toBe(native.backup.checkpoint);
      expect(sqlite.prepare('SELECT payload FROM lives WHERE id=?').get(archived.id)?.payload).toBe(archive.checkpoint);
      expect(sqlite.prepare('SELECT payload FROM backups WHERE life_id=?').get(archived.id)?.payload).toBe(archive.checkpoint);
      for (const point of archive.snapshots) expect(sqlite.prepare('SELECT payload FROM snapshots WHERE life_id=? AND snapshot_id=?').get(archived.id, point.summary.id)?.payload).toBe(point.payload);
    }, close: () => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); },
  };
}

test.each([13, 14, 15, 16, 17, 18])('complete reader%s→21 rolls back a failed marker, cold-retries without any row rewrite and cold-loads genuine prior friendship/current/backup/history', async reader => {
  const context = await fixtureDatabase(reader);
  try {
    const before = context.rows(); expect(Object.keys(before)).toEqual(tables);
    for (const table of tables) expect(before[table].length).toBeGreaterThan(0);
    context.originalPayloads(); context.forbidWrites();
    const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'), driver = context.driver;
    const failing: SqlDatabase = { ...driver, transaction: action => driver.transaction(tx => action({ ...tx, run: async (sql, values) => { await tx.run(sql, values); if (sql === 'PRAGMA user_version = 21') throw new Error('controlled C39 marker failure'); } })) };
    await expect(new SaveRepository(failing).initialise()).rejects.toThrow('controlled C39 marker failure');
    expect(context.sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(reader); expect(context.rows()).toEqual(before); expect(unpack).not.toHaveBeenCalled();
    // Both retry and final reopen close the real file connection and cache.
    const retry = context.reopen(); await retry.initialise(); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    expect(context.sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(21); expect(context.rows()).toEqual(before);
    const current = (await retry.active())!, backup = await retry.recoveryPreview(native.current.lifeId), prior = await retry.previewLife(context.archivedId);
    expect(sha(originalNativeCanonical(current))).toBe(observations[0].canonicalSha); expect(sha(originalNativeCanonical(backup))).toBe(observations[1].canonicalSha);
    expect(encodeWorld(prior)).toBe(encodeWorld(unpackCheckpoint(archive.checkpoint, true))); expect(context.rows()).toEqual(before); context.originalPayloads();
    const cold = context.reopen(), noTransaction: SqlDatabase = { ...context.driver, transaction: async () => { throw new Error('current reader21 must not open a migration transaction'); } };
    await new SaveRepository(noTransaction).initialise(); await cold.initialise();
    expect(encodeWorld((await cold.active())!)).toBe(encodeWorld(current)); expect(encodeWorld(await cold.recoveryPreview(native.current.lifeId))).toBe(encodeWorld(backup)); expect(encodeWorld(await cold.previewLife(context.archivedId))).toBe(encodeWorld(prior));
    expect(context.sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(21); expect(context.rows()).toEqual(before); context.originalPayloads();
  } finally { jest.restoreAllMocks(); context.close(); }
}, 60000);

test('future reader22 is refused without decode, transaction or changes to any of the eight populated tables', async () => {
  const context = await fixtureDatabase(22);
  try {
    const before = context.rows(); context.forbidWrites(); const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    const forbidden: SqlDatabase = { ...context.driver, transaction: async () => { throw new Error('future reader must refuse before a transaction'); } };
    await expect(new SaveRepository(forbidden).initialise()).rejects.toThrow('newer version');
    expect(unpack).not.toHaveBeenCalled(); expect(context.sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(22); expect(context.rows()).toEqual(before); context.originalPayloads();
  } finally { jest.restoreAllMocks(); context.close(); }
}, 60000);
