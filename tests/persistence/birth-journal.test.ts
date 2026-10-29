import { createLife, randomCreation } from '../../src/game/createLife';
import { decodeWorld, encodeWorld } from '../../src/game/model';
import { SaveRepository } from '../../src/persistence/repository';
import { decodeSave } from '../../src/persistence/archive';
import { createGameStore } from '../../src/state/gameStore';
import { database } from '../support/sqlite';
import legacy from '../fixtures/v1-newborn.json';
import royal from '../fixtures/v17-royal-archive.json';

test.each(['single', 'two', 'royal'] as const)('%s opening is materialized once and survives acknowledgement, cold reload and archive import', async kind => {
  const db = database(), repository = new SaveRepository(db.driver); await repository.initialise();
  const seed = kind === 'single' ? 2 : 0, input = randomCreation(seed);
  if (kind === 'royal') Object.assign(input, { country: 'GB', city: 'London', background: 'royal' });
  const initial = createLife('life_birth_save', seed, input, { year: 2026, month: 10, day: 22 }); await repository.create(initial);
  const deps = { repository: async () => repository, date: () => initial.date, id: () => 'unused' }, store = createGameStore(deps); await store.getState().bootstrap();
  const text = JSON.stringify(initial.journal);
  expect(await store.getState().acknowledgeBirth()).toBe(true); expect(JSON.stringify(store.getState().world!.journal)).toBe(text);
  const coldRepository = new SaveRepository(db.driver); await coldRepository.initialise(); const cold = createGameStore({ ...deps, repository: async () => coldRepository }); await cold.getState().bootstrap();
  expect(cold.getState().world).toEqual(store.getState().world); expect(JSON.stringify(cold.getState().world!.journal)).toBe(text);
  const archive = await coldRepository.export(initial.id); expect(JSON.stringify(decodeSave(archive).world.journal)).toBe(text);
  const destination = database(), imported = new SaveRepository(destination.driver); await imported.initialise(); await imported.import(archive);
  expect(await imported.load(initial.id)).toEqual(cold.getState().world); expect(JSON.stringify((await imported.load(initial.id)).journal)).toBe(text);
  db.sqlite.close(); destination.sqlite.close();
});

test('existing newborn and royal saves retain their original writing without a backfill or rewrite', async () => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise();
  const newborn = decodeWorld(JSON.stringify(legacy)), oldRoyal = decodeSave(JSON.stringify(royal)).world;
  expect(newborn.journal).toEqual(legacy.journal); expect(newborn.journal.some(entry => entry.id === 'journal_birth_identity')).toBe(false);
  for (const world of [newborn, oldRoyal]) {
    await repository.create(world); const encoded = encodeWorld(world), journal = JSON.stringify(world.journal);
    const before = sqlite.prepare('SELECT payload FROM lives WHERE id=?').get(world.id)!.payload;
    expect(encodeWorld(await repository.load(world.id))).toBe(encoded);
    expect(JSON.stringify(decodeSave(await repository.export(world.id)).world.journal)).toBe(journal);
    const cold = new SaveRepository(driver); await cold.initialise(); await cold.select(world.id); expect(JSON.stringify((await cold.active())!.journal)).toBe(journal);
    expect(sqlite.prepare('SELECT payload FROM lives WHERE id=?').get(world.id)!.payload).toBe(before);
  }
  sqlite.close();
});
