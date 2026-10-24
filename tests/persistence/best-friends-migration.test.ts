import { createHash } from 'node:crypto';
import { encodeWorld } from '../../src/game/model';
import { SaveRepository, type SqlDatabase } from '../../src/persistence/repository';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import * as checkpoints from '../../src/persistence/checkpoints';
import { database } from '../support/sqlite';
import terminal from '../fixtures/v34-natural-editorial-us-checkpoint.json';

const sha = (value: string) => createHash('sha256').update(value).digest('hex');

test('the genuine completed C35 US checkpoint keeps its immutable canonical proof with only new empty histories and root tags migrated', () => {
  expect(terminal.producerCommit).toBe('73cedc7643fa3cbcd0ad32dfa27abfb59dac8aaa');
  expect(terminal.versions).toEqual({ world: 34, engine: 35, content: 10 }); expect(Buffer.byteLength(terminal.checkpoint)).toBe(526545); expect(sha(terminal.checkpoint)).toBe('afbd3a1a85bc05cbc046917fd61195545fa9e0704bd2aced19c0be1981809901');
  expect(terminal.provenance.source.game).toBe('84625d5208d1a6815dccc2802ff75c83393eeb143c382e83d60ed0dafaf94f33'); expect(terminal.provenance.commandsAfterAcknowledgedBirth).toBe(225); expect(terminal.observation.naturallyDied).toBe(true);
  const world = unpackCheckpoint(terminal.checkpoint, true); expect(world).toMatchObject({ schemaVersion: 49, engineVersion: 51, contentVersion: 28, cults: [], revision: 226, bestFriendships: [] });
  const old = JSON.parse(encodeWorld(world));
  for (const key of ['cults', 'miniGames', 'personSupportRequests', 'personActionHistory', 'rentalLeases', 'bestFriendships', 'teenRelationships', 'universityApplications', 'studyCourses', 'npcSeparations', 'npcMoves', 'campusCommunities']) { expect(old[key]).toEqual([]); delete old[key]; }
  old.schemaVersion = 34; old.engineVersion = 35; old.contentVersion = 10;
  // Do not remove old school withdrawals or any bound story/result/history data.
  expect(sha(JSON.stringify(old))).toBe('03cced796c1fb4a0b1f24e63ef0b3cd1673b5fec0412b4dcd4ca8b6b667a92fd');
  expect(unpackCheckpoint(packCheckpoint(world), true)).toEqual(world);
});

test.each([13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26])('reader %s →28 changes only its marker; every original row and C35 payload remains exact before any gameplay save', async version => {
  const { sqlite, driver } = database();
  try {
    await new SaveRepository(driver).initialise(); const original = unpackCheckpoint(terminal.checkpoint, true);
    sqlite.prepare('INSERT INTO lives(id,name,revision,updated_at,payload) VALUES(?,?,?,?,?)').run(original.id, 'Original terminal life', original.revision, '2026-10-20', terminal.checkpoint);
    sqlite.prepare('INSERT INTO backups(life_id,revision,payload) VALUES(?,?,?)').run(original.id, original.revision, terminal.checkpoint);
    sqlite.prepare('INSERT INTO preferences(key,value) VALUES(?,?)').run('active_life', original.id); sqlite.exec('PRAGMA user_version=' + version);
    const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()])), before = rows(); expect(Object.keys(before)).toHaveLength(8);
    for (const table of Object.keys(before)) for (const action of ['INSERT', 'UPDATE', 'DELETE']) sqlite.exec('CREATE TRIGGER deny_' + table + '_' + action + ' BEFORE ' + action + ' ON ' + table + " BEGIN SELECT RAISE(ABORT,'unexpected rewrite'); END");
    const failing: SqlDatabase = { ...driver, transaction: action => driver.transaction(tx => action({ ...tx, run: async (sql, values) => { await tx.run(sql, values); if (sql === 'PRAGMA user_version = 28') throw new Error('metadata failure'); } })) };
    await expect(new SaveRepository(failing).initialise()).rejects.toThrow('metadata failure'); expect(sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(version); expect(rows()).toEqual(before);
    const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'), repository = new SaveRepository(driver); await repository.initialise(); expect(unpack).not.toHaveBeenCalled(); expect(sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(28); expect(rows()).toEqual(before);
    expect(await repository.active()).toEqual(original); expect(rows()).toEqual(before); expect(sqlite.prepare('SELECT payload FROM lives').get()?.payload).toBe(terminal.checkpoint);
  } finally { jest.restoreAllMocks(); sqlite.close(); }
}, 30000);
