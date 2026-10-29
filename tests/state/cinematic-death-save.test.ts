import { createGameStore } from '../../src/state/gameStore';
import { SaveRepository } from '../../src/persistence/repository';
import { decodeSave } from '../../src/persistence/archive';
import { encodeWorld, validateWorld } from '../../src/game/model';
import { isNewDeath } from '../../src/ui/cinematic/committedDeath';
import { database } from '../support/sqlite';
import courtArchive from '../fixtures/v9-court-archive.json';

test('death presentation observes the committed terminal revision, never a failed save or a cold reopen', async () => {
  // Explicit critical-health boundary on a genuine retained pending choice.
  // Mortality is resolved by the normal engine command and saved by real SQLite.
  const world = decodeSave(JSON.stringify(courtArchive)).world;
  world.people[world.activePersonId].stats.health = 0; validateWorld(world);
  const command = { type: 'choose' as const, eventId: world.pending!.id, choiceId: 'decline' };
  const { sqlite, driver } = database(), repository = new SaveRepository(driver);
  await repository.initialise(); await repository.create(world);
  const deps = { repository: async () => repository, date: () => world.date, id: () => 'unused' };
  const store = createGameStore(deps); await store.getState().bootstrap();
  const onDeath = jest.fn(); store.subscribe((next, previous) => { if (isNewDeath(next, previous)) onDeath(); });
  const original = encodeWorld(store.getState().world!);
  try {
    sqlite.exec("CREATE TRIGGER fail_terminal BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    expect(await store.getState().dispatch(command)).toBe(false);
    expect(onDeath).not.toHaveBeenCalled(); expect(encodeWorld(store.getState().world!)).toBe(original);
    expect(encodeWorld(await repository.load(world.id))).toBe(original);
    sqlite.exec('DROP TRIGGER fail_terminal');
    expect(await store.getState().dispatch(command)).toBe(true); expect(onDeath).toHaveBeenCalledTimes(1);
    const terminal = store.getState().world!; expect(terminal.people[terminal.activePersonId].died).toEqual(terminal.date);
    expect(await repository.load(world.id)).toEqual(terminal);
    const cold = createGameStore(deps); cold.subscribe((next, previous) => { if (isNewDeath(next, previous)) onDeath(); });
    expect(await cold.getState().bootstrap()).toBe(true); expect(cold.getState().world).toEqual(terminal);
    expect(onDeath).toHaveBeenCalledTimes(1);
  } finally { sqlite.close(); }
});
