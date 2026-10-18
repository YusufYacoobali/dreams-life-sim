import { DatabaseSync } from 'node:sqlite';
import { createLife, randomCreation } from '../../src/game/createLife';
import { decodeWorld, encodeWorld, validateWorld } from '../../src/game/model';
import { SaveConflict, SaveRepository, SqlDatabase, SqlSession } from '../../src/persistence/repository';

function database() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys=ON');
  const session: SqlSession = {
    run: async (sql, values = []) => { sqlite.prepare(sql).run(...values); },
    get: async <T,>(sql: string, values: (string | number | null)[] = []) => sqlite.prepare(sql).get(...values) as T ?? null,
    all: async <T,>(sql: string, values: (string | number | null)[] = []) => sqlite.prepare(sql).all(...values) as T[],
  };
  const driver: SqlDatabase = {
    ...session, exec: async sql => { sqlite.exec(sql); },
    transaction: async action => {
      sqlite.exec('BEGIN IMMEDIATE');
      try { const result = await action(session); sqlite.exec('COMMIT'); return result; }
      catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    },
  };
  return { sqlite, driver };
}
const world = () => createLife('life_test', 42, randomCreation(42), { year: 2026, month: 10, day: 18 });

test('a new life has real linked parents and survives exact bigint save restoration', async () => {
  const { sqlite, driver } = database();
  const repository = new SaveRepository(driver, () => '2026-10-18T12:00:00Z');
  await repository.initialise();
  expect(await repository.active()).toBeNull();
  const created = world();
  created.accounts[1].cash = 900719925474099399n;
  await repository.create(created);
  expect(await repository.active()).toEqual(created);
  expect(await repository.list()).toHaveLength(1);
  expect(decodeWorld(await repository.export(created.id))).toEqual(created);
  sqlite.close();
});

test('duplicate command receipt cannot pay or advance the same revision twice', async () => {
  const { sqlite, driver } = database();
  const repository = new SaveRepository(driver);
  await repository.initialise();
  const initial = world();
  await repository.create(initial);
  const next = { ...initial, revision: 1, birthAcknowledged: true };
  await repository.commit(next, 0, 'command_birth');
  await repository.commit(next, 0, 'command_birth');
  expect((await repository.load(initial.id)).revision).toBe(1);
  await expect(repository.commit(next, 0, 'another_command')).rejects.toBeInstanceOf(SaveConflict);
  sqlite.close();
});

test('a failed receipt insert rolls back the checkpoint', async () => {
  const { sqlite, driver } = database();
  const repository = new SaveRepository(driver);
  await repository.initialise();
  const initial = world();
  await repository.create(initial);
  sqlite.exec("CREATE TRIGGER fail_receipt BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT, 'storage failure'); END");
  await expect(repository.commit({ ...initial, revision: 1, birthAcknowledged: true }, 0, 'failed')).rejects.toThrow('storage failure');
  expect(await repository.load(initial.id)).toEqual(initial);
  sqlite.close();
});

test('import refuses invalid versions, dangling people, corrupt money and silent replacement', async () => {
  const { sqlite, driver } = database();
  const repository = new SaveRepository(driver);
  await repository.initialise();
  const initial = world();
  await repository.create(initial);
  await expect(repository.import(encodeWorld(initial))).rejects.toThrow('already exists');
  expect(() => decodeWorld(encodeWorld(initial).replace('"schemaVersion":1', '"schemaVersion":2'))).toThrow();
  expect(() => validateWorld({ ...initial, activePersonId: 'person_missing' })).toThrow('Missing active person');
  expect(() => decodeWorld(encodeWorld(initial).replace(/"\$dreamsBigInt":"\d+"/, '"$dreamsBigInt":"NaN"'))).toThrow();
  expect(await repository.import(encodeWorld(initial), true)).toEqual(initial);
  sqlite.close();
});

test('newer database versions are refused without resetting their version marker', async () => {
  const { sqlite, driver } = database();
  sqlite.exec('PRAGMA user_version=2');
  const repository = new SaveRepository(driver);
  await expect(repository.initialise()).rejects.toThrow('newer version');
  expect(sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(2);
  sqlite.close();
});
