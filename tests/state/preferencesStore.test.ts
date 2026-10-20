import { createPreferencesStore } from '../../src/state/preferencesStore';
import { createGameStore } from '../../src/state/gameStore';
import { createLife, randomCreation } from '../../src/game/createLife';
import { SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';

async function fixture() {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise();
  const world = createLife('life_preferences', 42, randomCreation(42), { year: 2026, month: 10, day: 19 });
  await repository.create(world); const archive = await repository.export(world.id);
  const store = createPreferencesStore({ repository: async () => repository });
  return { sqlite, repository, world, archive, store };
}
test('old databases default to Light without a preference write; saved appearance survives a new store and leaves the complete life archive unchanged', async () => {
  const { sqlite, repository, world, archive, store } = await fixture();
  expect(await store.getState().setAppearance('dark')).toBe(false); expect(await store.getState().bootstrap()).toBe(true);
  expect(store.getState().settings.appearance).toBe('light'); expect(await repository.loadAppSettings()).toBeNull();
  expect(await store.getState().setAppearance('dark')).toBe(true);
  const cold = createPreferencesStore({ repository: async () => repository }); expect(await cold.getState().bootstrap()).toBe(true); expect(cold.getState().settings.appearance).toBe('dark');
  expect(await repository.export(world.id)).toBe(archive); expect(await repository.active()).toEqual(world);
  expect(sqlite.prepare('PRAGMA user_version').get()).toEqual({ user_version: 12 }); sqlite.close();
});
test('a real SQLite write failure preserves the prior appearance, life, active preference and history; retry saves exactly the pending choice', async () => {
  const { sqlite, repository, world, archive, store } = await fixture(); await store.getState().bootstrap(); await store.getState().setAppearance('dark');
  const previous = await repository.loadAppSettings();
  sqlite.exec("CREATE TRIGGER fail_display BEFORE INSERT ON preferences WHEN NEW.key='app_settings' BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  expect(await store.getState().setAppearance('system')).toBe(false); expect(store.getState().settings.appearance).toBe('dark'); expect(await repository.loadAppSettings()).toBe(previous); expect(store.getState().loadFailed).toBe(false);
  expect(await repository.export(world.id)).toBe(archive); expect(await repository.active()).toEqual(world);
  sqlite.exec('DROP TRIGGER fail_display'); expect(await store.getState().retry()).toBe(true); expect(store.getState().settings.appearance).toBe('system'); expect(JSON.parse((await repository.loadAppSettings())!).appearance).toBe('system'); sqlite.close();
});
test.each([['malformed JSON', 'broken JSON'], ['unsupported version', '{"version":2,"appearance":"dark"}'], ['unknown appearance', '{"version":1,"appearance":"unknown"}'], ['oversized', 'x'.repeat(1025)]])('unreadable %s is retained until explicit reset while the actual game can still open', async (_label, raw) => {
  const { sqlite, repository, world, archive, store } = await fixture(); sqlite.prepare("INSERT INTO preferences(key,value) VALUES('app_settings',?)").run(raw);
  expect(await store.getState().bootstrap()).toBe(false); expect(store.getState().loadFailed).toBe(true); expect(store.getState().settings.appearance).toBe('light');
  expect(await store.getState().setAppearance('dark')).toBe(false); expect(await repository.loadAppSettings()).toBe(raw);
  const game = createGameStore({ repository: async () => repository, date: () => world.date, id: () => 'unused' }); expect(await game.getState().bootstrap()).toBe(true); expect(game.getState().world).toEqual(world);
  expect(await store.getState().reset()).toBe(true); expect(store.getState().loadFailed).toBe(false); expect(JSON.parse((await repository.loadAppSettings())!)).toEqual({ version: 1, appearance: 'light' }); expect(await repository.export(world.id)).toBe(archive); sqlite.close();
});
test('a corrected raw preference can be read on retry without rewriting it', async () => {
  const { sqlite, repository, store } = await fixture(); await repository.saveAppSettings('invalid'); await store.getState().bootstrap();
  const corrected = '{"version":1,"appearance":"system"}'; await repository.saveAppSettings(corrected);
  expect(await store.getState().retry()).toBe(true); expect(store.getState().settings.appearance).toBe('system'); expect(await repository.loadAppSettings()).toBe(corrected); sqlite.close();
});
test('a second in-flight change cannot publish out of order or overwrite the first uncommitted choice', async () => {
  const { sqlite, repository } = await fixture(); let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const store = createPreferencesStore({ repository: async () => ({ loadAppSettings: () => repository.loadAppSettings(), saveAppSettings: async value => { await gate; await repository.saveAppSettings(value); } }) });
  await store.getState().bootstrap(); const saving = store.getState().setAppearance('dark');
  expect(store.getState().busy).toBe(true); expect(store.getState().settings.appearance).toBe('light'); expect(await store.getState().setAppearance('system')).toBe(false);
  release(); expect(await saving).toBe(true); expect(store.getState().settings.appearance).toBe('dark'); expect(JSON.parse((await repository.loadAppSettings())!).appearance).toBe('dark'); sqlite.close();
});
test('importing or selecting a life preserves independent global display settings and an oversized write cannot replace them', async () => {
  const { sqlite, repository, world, archive, store } = await fixture(); await store.getState().bootstrap(); await store.getState().setAppearance('dark');
  const settings = await repository.loadAppSettings(); await repository.import(archive, true); await repository.select(world.id);
  expect(await repository.loadAppSettings()).toBe(settings); await expect(repository.saveAppSettings('x'.repeat(1025))).rejects.toThrow(/too large/); expect(await repository.loadAppSettings()).toBe(settings); sqlite.close();
});
