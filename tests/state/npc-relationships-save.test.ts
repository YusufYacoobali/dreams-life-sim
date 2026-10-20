import { createGameStore } from '../../src/state/gameStore';
import { encodeWorld, fullName } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { SaveRepository } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { database } from '../support/sqlite';
import { annualCommand } from '../support/npcRelationships';
import archive from '../fixtures/v30-native-workplace-story-archive.json';

test('a normal annual NPC relationship rolls back every SQLite table, retries without reroll/unpack and resumes the exact saved news cold', async () => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); await repository.import(JSON.stringify(archive));
  const store = createGameStore({ repository: async () => repository, date: () => ({ year: 2026, month: 10, day: 20 }), id: () => 'unused' }); await store.getState().bootstrap();
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  try {
    let steps = 0;
    while (steps++ < 100) {
      const world = store.getState().world!, command = annualCommand(world), predicted = resolveCommand(world, command, true);
      const formed = predicted.relationships.filter(row => row.memories.some(memory => memory === 'npc-dating:' + predicted.date.year));
      if (!formed.length) { expect(await store.getState().dispatch(command)).toBe(true); continue; }
      const before = rows(), encoded = encodeWorld(world), people = new Set(Object.keys(world.people)), receipts = sqlite.prepare('SELECT * FROM receipts ORDER BY 1,2').all();
      const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
      sqlite.exec("CREATE TRIGGER fail_npc_dating BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
      expect(await store.getState().dispatch(command)).toBe(false); expect(store.getState().error).toMatch(/couldn't be saved/); expect(rows()).toEqual(before); expect(encodeWorld(store.getState().world!)).toBe(encoded);
      sqlite.exec('DROP TRIGGER fail_npc_dating'); expect(await store.getState().dispatch(command)).toBe(true); expect(store.getState().world).toEqual(predicted); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
      for (const bond of formed) { expect(people.has(bond.from) && people.has(bond.to)).toBe(true); expect(predicted.journal.filter(row => row.text === fullName(predicted.people[bond.from]) + ' and ' + fullName(predicted.people[bond.to]) + ' started dating.')).toHaveLength(1); }
      expect(sqlite.prepare('SELECT * FROM receipts WHERE revision<=? ORDER BY 1,2').all(world.revision)).toEqual(receipts);
      for (const snapshot of archive.snapshots) expect(sqlite.prepare('SELECT payload FROM snapshots WHERE snapshot_id=?').get(snapshot.summary.id)?.payload).toBe(snapshot.payload);
      const saved = rows(), cold = createGameStore({ repository: async () => new SaveRepository(driver), date: () => predicted.date, id: () => 'unused' }); expect(await cold.getState().bootstrap()).toBe(true);
      expect(cold.getState().world).toEqual(predicted); expect(rows()).toEqual(saved);
      // Acknowledgement/resume may finish the pending annual scene, but cannot
      // repeat this year's relationship, news or NPC choices.
      let guard = 0;
      while ((cold.getState().world!.pending || cold.getState().world!.annual) && guard++ < 100) expect(await cold.getState().dispatch(annualCommand(cold.getState().world!))).toBe(true);
      expect(guard).toBeLessThan(100);
      for (const bond of formed) expect(cold.getState().world!.relationships.find(row => row.id === bond.id)?.memories.filter(memory => memory === 'npc-dating:' + predicted.date.year)).toHaveLength(1);
      break;
    }
    expect(steps).toBeLessThan(100);
  } finally { jest.restoreAllMocks(); sqlite.close(); }
}, 60000);
