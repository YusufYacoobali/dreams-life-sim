import Constants from 'expo-constants';
import { createLife, randomCreation } from '../../src/game/createLife';
import { SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';

let mockRepository: SaveRepository;
jest.mock('../../src/persistence/native', () => ({ openRepository: async () => mockRepository }));
// Keep the real runtime game singleton and real preferences store, sharing SQLite.
// Inject storage here because the production wrapper's lazy native import is a
// Metro boundary that this CommonJS Jest environment cannot execute.
jest.mock('../../src/state/usePreferences', () => ({
  preferencesStore: jest.requireActual('../../src/state/preferencesStore').createPreferencesStore({ repository: async () => mockRepository }),
}));
import { gameStore } from '../../src/state/useGame';
import { preferencesStore } from '../../src/state/usePreferences';
import { godModeSessionStore } from '../../src/state/godModeSession';

test('the real runtime refuses saved-enabled hidden edits, permits revealed edits and locks again without losing data', async () => {
  const { sqlite, driver } = database(); mockRepository = new SaveRepository(driver);
  await mockRepository.initialise();
  const world = createLife('life_hidden_runtime', 42, randomCreation(42), { year: 2026, month: 10, day: 25 });
  world.birthAcknowledged = true; await mockRepository.create(world);
  await mockRepository.saveAppSettings('{"version":1,"appearance":"light","godModeEnabled":true}');
  const globals = globalThis as unknown as { __DEV__: boolean }, previousDev = __DEV__, previousExtra = Constants.expoConfig!.extra;
  try {
    globals.__DEV__ = false; Constants.expoConfig!.extra = { godModeTesting: true };
    expect(godModeSessionStore.getState().revealed).toBe(false);
    godModeSessionStore.getState().reset();
    expect(await preferencesStore.getState().bootstrap()).toBe(true);
    await gameStore.getState().bootstrap();
    expect(preferencesStore.getState().settings.godModeEnabled).toBe(true);
    expect(godModeSessionStore.getState().revealed).toBe(false);
    const request = (value: number) => {
      const current = gameStore.getState().world!;
      return { lifeId: current.id, personId: current.activePersonId, expectedRevision: current.revision,
        commands: [{ type: 'stat' as const, stat: 'smarts' as const, value }] };
    };
    const before = await mockRepository.export(world.id);
    expect(await gameStore.getState().editGodMode(request(47))).toBe(false);
    expect(await mockRepository.export(world.id)).toBe(before);

    godModeSessionStore.getState().reveal();
    expect(await gameStore.getState().editGodMode(request(47))).toBe(true);
    expect((await mockRepository.load(world.id)).people[world.activePersonId].stats.smarts).toBe(47);
    const edited = await mockRepository.export(world.id);

    godModeSessionStore.getState().reset();
    expect(preferencesStore.getState().settings.godModeEnabled).toBe(true);
    expect(await gameStore.getState().editGodMode(request(100))).toBe(false);
    expect(await mockRepository.export(world.id)).toBe(edited);
    godModeSessionStore.getState().reveal();
    await preferencesStore.getState().setGodModeEnabled(false);
    expect(await gameStore.getState().editGodMode(request(100))).toBe(false);
    expect(await mockRepository.export(world.id)).toBe(edited);
  } finally {
    godModeSessionStore.getState().reset(); globals.__DEV__ = previousDev;
    Constants.expoConfig!.extra = previousExtra; sqlite.close();
  }
});
