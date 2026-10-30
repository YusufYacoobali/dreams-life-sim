import { gunzipSync, strFromU8 } from 'fflate';
import { resolveCommand } from '../../src/game/engine';
import { decodeWorld, encodeWorld } from '../../src/game/model';
import { accountFor, post } from '../../src/game/systems/common';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { decodeSave } from '../../src/persistence/archive';
import { SaveRepository } from '../../src/persistence/repository';
import { createGameStore } from '../../src/state/gameStore';
import { database } from '../support/sqlite';
import { adultSocial } from '../support/adultSocial';
import { immediateDecision } from '../support/immediateStory';
import prior from '../fixtures/v45-content24-immediate-before.json';

const raw = (checkpoint: string) => { const frame = JSON.parse(checkpoint); return JSON.parse(strFromU8(gunzipSync(Buffer.from(frame.data, 'base64')))); };

test('genuine 45/47/content24 pending decision and every old result gain only empty cult history and markers and keep the literal prior resolver outcome', () => {
  expect(prior.sourceCommit).toBe('da0b0e5'); const original = raw(prior.checkpoint), migrated = unpackCheckpoint(prior.checkpoint, true), restored = unpackCheckpoint(packCheckpoint(migrated), true);
  expect(original).toMatchObject({ schemaVersion: 45, engineVersion: 47, contentVersion: 24 });
  const expected = { ...original, schemaVersion: 49, engineVersion: 51, contentVersion: 28, cults: [] };
  expect(JSON.parse(encodeWorld(restored))).toEqual(expected); expect(JSON.parse(encodeWorld(decodeWorld(JSON.stringify(original))))).toEqual(expected);
  expect(restored.pending).toEqual(migrated.pending); expect(restored.random).toEqual(migrated.random);
  if (restored.pending?.kind !== 'decision') throw new Error('Missing old decision');
  expect(restored.pending.templateId).toBe('adult-queue-merge');
  expect(restored.pending.choices.every(choice => choice.effects.every(effect => effect.kind !== 'story-immediate'))).toBe(true);
  for (const outcome of prior.results) {
    const saved = unpackCheckpoint(outcome.checkpoint, true), selected = resolveCommand(restored, { type: 'choose', eventId: restored.pending.id, choiceId: outcome.choiceId }, true);
    expect(encodeWorld(selected)).toBe(encodeWorld(saved)); expect(saved.pending).toEqual(selected.pending); expect(saved.journal).toEqual(selected.journal); expect(saved.random).toEqual(selected.random);
    expect(JSON.parse(encodeWorld(saved))).toEqual({ ...raw(outcome.checkpoint), schemaVersion: 49, engineVersion: 51, contentVersion: 28, cults: [] });
  }
});

test('reader25 upgrades only its marker and Age Up archives the exact packed47/c24 bytes before prospective logic', async () => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise();
  const world = unpackCheckpoint(prior.finishedCheckpoint); await repository.create(world);
  sqlite.prepare('UPDATE lives SET payload=? WHERE id=?').run(prior.finishedCheckpoint, world.id); sqlite.prepare('UPDATE backups SET payload=? WHERE life_id=?').run(prior.finishedCheckpoint, world.id); sqlite.exec('PRAGMA user_version=25');
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  const beforeRows = rows(); await new SaveRepository(driver).initialise();
  expect(sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(31); expect(rows()).toEqual(beforeRows);
  const store = createGameStore({ repository: async () => new SaveRepository(driver), date: () => world.date, id: () => 'unused' }); await store.getState().bootstrap();
  expect(encodeWorld(store.getState().world!)).toBe(encodeWorld(world)); expect(rows()).toEqual(beforeRows);
  expect(await store.getState().dispatch({ type: 'advance' })).toBe(true);
  const archive = JSON.parse(await repository.export(world.id)), snapshot = archive.snapshots[0];
  expect(snapshot.payload).toBe(prior.finishedCheckpoint); expect(raw(snapshot.payload)).toMatchObject({ schemaVersion: 45, engineVersion: 47, contentVersion: 24 });
  expect(decodeSave(JSON.stringify(archive)).snapshots[0]).toEqual(snapshot);
  expect(store.getState().world).toMatchObject({ schemaVersion: 49, engineVersion: 51, contentVersion: 28 });
  sqlite.close();
});

test('actual consequence effects and receipt roll back together, cold retry pays/ends once, and saved result acknowledgement cannot repeat them', async () => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise();
  const initial = adultSocial().world; post(initial, 100000n, 0n, 'fixture', 'Unit funds');
  const world = immediateDecision(initial, { cash: -120, workPerformance: -25, trust: { friend: -20 }, friendBond: -30, endFriendship: true, loseJob: true, publicImage: -20 }, { friend: true });
  await repository.create(world);
  const createStore = () => createGameStore({ repository: async () => new SaveRepository(driver), date: () => world.date, id: () => 'unused' });
  let store = createStore(); await store.getState().bootstrap(); const before = store.getState().world!;
  if (before.pending?.kind !== 'decision') throw new Error('Missing actual bound consequence');
  const command = { type: 'choose' as const, eventId: before.pending.id, choiceId: before.pending.choices[0].id }, expected = resolveCommand(before, command, true);
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()])), originalRows = rows();
  sqlite.exec("CREATE TRIGGER fail_story_consequence BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  expect(await store.getState().dispatch(command)).toBe(false); expect(store.getState().world).toEqual(before); expect(rows()).toEqual(originalRows);
  sqlite.exec('DROP TRIGGER fail_story_consequence'); store = createStore(); await store.getState().bootstrap(); expect(store.getState().world).toEqual(before);
  expect(await store.getState().dispatch(command)).toBe(true); expect(store.getState().world).toEqual(expected);
  expect(accountFor(expected).cash).toBe(accountFor(before).cash - 12000n); expect(expected.people[expected.activePersonId].employment).toBeNull(); expect(expected.ledger).toHaveLength(before.ledger.length + 1);
  store = createStore(); await store.getState().bootstrap(); expect(store.getState().world).toEqual(expected); const selectedRows = rows();
  expect(await store.getState().dispatch(command)).toBe(false); expect(rows()).toEqual(selectedRows);
  if (expected.pending?.kind !== 'result') throw new Error('Missing saved result');
  const acknowledge = { type: 'acknowledge' as const, resultId: expected.pending.id };
  expect(await store.getState().dispatch(acknowledge)).toBe(true); const done = store.getState().world!;
  expect(done.people).toEqual(expected.people); expect(done.relationships).toEqual(expected.relationships); expect(done.workHistory).toEqual(expected.workHistory); expect(done.ledger).toEqual(expected.ledger); expect(done.random).toEqual(expected.random);
  const finalRows = rows(); expect(await store.getState().dispatch(acknowledge)).toBe(false); expect(rows()).toEqual(finalRows); expect(await new SaveRepository(driver).active()).toEqual(done);
  sqlite.close();
});
