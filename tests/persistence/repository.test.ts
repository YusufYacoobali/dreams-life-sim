import { createLife, randomCreation } from '../../src/game/createLife';
import { decodeWorld, encodeWorld, validateWorld } from '../../src/game/model';
import { SaveConflict, SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';
import { resolveCommand } from '../../src/game/engine';
import legacyFixture from '../fixtures/v1-newborn.json';
import birthdayFixture from '../fixtures/v2-birthday-result.json';
import { decodeSave } from '../../src/persistence/archive';

const world = () => createLife('life_test', 42, randomCreation(42), { year: 2026, month: 10, day: 18 });

test('a new life has real linked parents and survives exact bigint save restoration', async () => {
  const { sqlite, driver } = database();
  const repository = new SaveRepository(driver, () => '2026-10-18T12:00:00Z');
  await repository.initialise();
  expect(await repository.active()).toBeNull();
  const created = world();
  created.accounts[1].cash = 900719925474099399n;
  created.accounts[1].openingCash = created.accounts[1].cash;
  await repository.create(created);
  expect(await repository.active()).toEqual(created);
  expect(await repository.list()).toHaveLength(1);
  expect(decodeSave(await repository.export(created.id)).world).toEqual(created);
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
  expect(() => decodeWorld(encodeWorld(initial).replace(/"schemaVersion":\d+/, '"schemaVersion":999'))).toThrow();
  expect(() => validateWorld({ ...initial, activePersonId: 'person_missing' })).toThrow('Missing active person');
  expect(() => decodeWorld(encodeWorld(initial).replace(/"\$dreamsBigInt":"\d+"/, '"$dreamsBigInt":"NaN"'))).toThrow();
  expect(await repository.import(encodeWorld(initial), true)).toEqual(initial);
  sqlite.close();
});

test('newer database versions are refused without resetting their version marker', async () => {
  const { sqlite, driver } = database();
  sqlite.exec('PRAGMA user_version=4');
  const repository = new SaveRepository(driver);
  await expect(repository.initialise()).rejects.toThrow('newer version');
  expect(sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(4);
  sqlite.close();
});

test('a version-one database and actual previous-version save migrate without data loss', async () => {
  const { sqlite, driver } = database();
  sqlite.exec(`CREATE TABLE lives(id TEXT PRIMARY KEY,name TEXT NOT NULL,revision INTEGER NOT NULL,updated_at TEXT NOT NULL,payload TEXT NOT NULL);
    CREATE TABLE preferences(key TEXT PRIMARY KEY,value TEXT NOT NULL); PRAGMA user_version=1;`);
  sqlite.prepare('INSERT INTO lives VALUES(?,?,?,?,?)').run(legacyFixture.id, 'Original life', 0, '2026-10-18', JSON.stringify(legacyFixture));
  sqlite.prepare('INSERT INTO preferences VALUES(?,?)').run('active_life', legacyFixture.id);
  const repository = new SaveRepository(driver);
  await repository.initialise();
  const restored = (await repository.active())!;
  expect(restored.schemaVersion).toBe(8);
  expect(restored.random).toEqual(legacyFixture.random);
  for (const person of Object.values(legacyFixture.people)) expect(restored.people[person.id]).toMatchObject(person);
  expect((await repository.recoveryPreview(restored.id)).accounts).toEqual(restored.accounts);
  expect(sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(3);
  sqlite.close();
});

test('corrupt checkpoints require explicit recovery and never overwrite the previous valid copy', async () => {
  const { sqlite, driver } = database();
  const repository = new SaveRepository(driver);
  await repository.initialise();
  const initial = { ...world(), birthAcknowledged: true };
  await repository.create(initial);
  const next = resolveCommand(initial, { type: 'advance' });
  await repository.commit(next, 0, 'advance');
  sqlite.prepare('UPDATE lives SET payload=? WHERE id=?').run('{broken', initial.id);
  await expect(repository.load(initial.id)).rejects.toThrow('previous checkpoint');
  expect(sqlite.prepare('SELECT payload FROM lives WHERE id=?').get(initial.id)?.payload).toBe('{broken');
  expect(await repository.recoveryPreview(initial.id)).toEqual(initial);
  expect(await repository.recover(initial.id)).toEqual(initial);
  expect(await repository.active()).toEqual(initial);
  expect(sqlite.prepare('SELECT COUNT(*) AS count FROM receipts').get()?.count).toBe(0);
  sqlite.close();
});

test('version-two pending results migrate with their committed effects, identities and random streams intact', () => {
  const world = decodeWorld(JSON.stringify(birthdayFixture));
  expect(world.schemaVersion).toBe(8);
  expect(world.pending).toEqual(birthdayFixture.pending);
  expect(world.random).toEqual(birthdayFixture.random);
  expect(world.eventHistory).toEqual(birthdayFixture.eventHistory);
  if (world.pending?.kind !== 'result') throw new Error('Expected a saved result');
  const acknowledged = resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
  expect(acknowledged.people).toEqual(world.people);
  expect(acknowledged.random).toEqual(world.random);
  expect(acknowledged.pending).toBeNull();
});

test('reloading after every annual decision stage produces the same exact world', async () => {
  const { sqlite, driver } = database();
  let repository = new SaveRepository(driver);
  await repository.initialise();
  const initial = { ...world(), birthAcknowledged: true };
  await repository.create(initial);
  let expected = resolveCommand(initial, { type: 'advance' });
  await repository.commit(expected, 0, 'advance');
  repository = new SaveRepository(driver);
  let restored = await repository.load(initial.id);
  expect(restored).toEqual(expected);
  if (restored.pending?.kind !== 'decision') throw new Error('Expected a birthday decision');
  const choose = { type: 'choose' as const, eventId: restored.pending.id, choiceId: restored.pending.choices[0].id };
  expected = resolveCommand(expected, choose);
  await repository.commit(resolveCommand(restored, choose), restored.revision, 'choose');
  repository = new SaveRepository(driver);
  restored = await repository.load(initial.id);
  expect(restored).toEqual(expected);
  if (restored.pending?.kind !== 'result') throw new Error('Expected a durable result');
  const ack = { type: 'acknowledge' as const, resultId: restored.pending.id };
  expected = resolveCommand(expected, ack);
  await repository.commit(resolveCommand(restored, ack), restored.revision, 'acknowledge');
  expect(await new SaveRepository(driver).load(initial.id)).toEqual(expected);
  sqlite.close();
});
