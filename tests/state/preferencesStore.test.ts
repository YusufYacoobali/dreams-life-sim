import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createPreferencesStore } from '../../src/state/preferencesStore';
import { createGameStore } from '../../src/state/gameStore';
import { createLife, randomCreation } from '../../src/game/createLife';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import { database } from '../support/sqlite';

function fileDatabase(path: string) {
  const sqlite = new DatabaseSync(path); sqlite.exec('PRAGMA foreign_keys=ON');
  const session: SqlSession = {
    run: async (sql, values = []) => { sqlite.prepare(sql).run(...values); },
    get: async <T,>(sql: string, values: (string | number | null)[] = []) => sqlite.prepare(sql).get(...values) as T ?? null,
    all: async <T,>(sql: string, values: (string | number | null)[] = []) => sqlite.prepare(sql).all(...values) as T[],
  };
  const driver: SqlDatabase = { ...session, exec: async sql => { sqlite.exec(sql); }, transaction: async action => {
    sqlite.exec('BEGIN IMMEDIATE');
    try { const value = await action(session); sqlite.exec('COMMIT'); return value; }
    catch (error) { sqlite.exec('ROLLBACK'); throw error; }
  } };
  return { sqlite, driver };
}
async function fixture(connection = database()) {
  const { sqlite, driver } = connection, repository = new SaveRepository(driver); await repository.initialise();
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
  expect(sqlite.prepare('PRAGMA user_version').get()).toEqual({ user_version: 28 }); sqlite.close();
});
test('a real SQLite write failure preserves the prior appearance, life, active preference and history; retry saves exactly the pending choice', async () => {
  const { sqlite, repository, world, archive, store } = await fixture(); await store.getState().bootstrap(); await store.getState().setAppearance('dark');
  const previous = await repository.loadAppSettings();
  sqlite.exec("CREATE TRIGGER fail_display BEFORE INSERT ON preferences WHEN NEW.key='app_settings' BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  expect(await store.getState().setAppearance('system')).toBe(false); expect(store.getState().settings.appearance).toBe('dark'); expect(await repository.loadAppSettings()).toBe(previous); expect(store.getState().loadFailed).toBe(false);
  expect(await repository.export(world.id)).toBe(archive); expect(await repository.active()).toEqual(world);
  sqlite.exec('DROP TRIGGER fail_display'); expect(await store.getState().retry()).toBe(true); expect(store.getState().settings.appearance).toBe('system'); expect(JSON.parse((await repository.loadAppSettings())!).appearance).toBe('system'); sqlite.close();
});
test.each([['malformed JSON', 'broken JSON'], ['unsupported version', '{"version":2,"appearance":"dark"}'], ['unknown appearance', '{"version":1,"appearance":"unknown"}'], ['invalid reminder', '{"version":1,"appearance":"dark","dailyReminder":"enabled"}'], ['invalid reminder time', '{"version":1,"appearance":"dark","reminderHour":24}'], ['oversized', 'x'.repeat(1025)]])('unreadable %s is retained until explicit reset while the actual game can still open', async (_label, raw) => {
  const { sqlite, repository, world, archive, store } = await fixture(); sqlite.prepare("INSERT INTO preferences(key,value) VALUES('app_settings',?)").run(raw);
  expect(await store.getState().bootstrap()).toBe(false); expect(store.getState().loadFailed).toBe(true); expect(store.getState().settings.appearance).toBe('light');
  expect(await store.getState().setAppearance('dark')).toBe(false); expect(await store.getState().setDailyReminder(true)).toBe(false); expect(await store.getState().setReminderTime(8, 30)).toBe(false); expect(await repository.loadAppSettings()).toBe(raw);
  const game = createGameStore({ repository: async () => repository, date: () => world.date, id: () => 'unused' }); expect(await game.getState().bootstrap()).toBe(true); expect(game.getState().world).toEqual(world);
  expect(await store.getState().reset()).toBe(true); expect(store.getState().loadFailed).toBe(false); expect(store.getState().settings).toMatchObject({ dailyReminder: false, reminderHour: 19, reminderMinute: 0 }); expect(JSON.parse((await repository.loadAppSettings())!)).toEqual({ version: 1, appearance: 'light' }); expect(await repository.export(world.id)).toBe(archive); sqlite.close();
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
  expect(await store.getState().setDailyReminder(true)).toBe(false); expect(await store.getState().setReminderTime(7, 30)).toBe(false);
  release(); expect(await saving).toBe(true); expect(store.getState().settings.appearance).toBe('dark'); expect(JSON.parse((await repository.loadAppSettings())!).appearance).toBe('dark'); sqlite.close();
});
test('importing or selecting a life preserves independent global display settings and an oversized write cannot replace them', async () => {
  const { sqlite, repository, world, archive, store } = await fixture(); await store.getState().bootstrap(); await store.getState().setAppearance('dark');
  const settings = await repository.loadAppSettings(); await repository.import(archive, true); await repository.select(world.id);
  expect(await repository.loadAppSettings()).toBe(settings); await expect(repository.saveAppSettings('x'.repeat(1025))).rejects.toThrow(/too large/); expect(await repository.loadAppSettings()).toBe(settings); sqlite.close();
});

test.each(['{"version":1,"appearance":"dark"}', '{"version":1,"appearance":"system","reducedMotion":true,"haptics":true,"soundEffects":true}'])('legacy settings gain disabled reminder defaults without rewriting their original bytes', async raw => {
  const { sqlite, repository, world, archive, store } = await fixture();
  try {
    await repository.saveAppSettings(raw);
    expect(await store.getState().setDailyReminder(true)).toBe(false); expect(await store.getState().setReminderTime(8, 30)).toBe(false);
    expect(await store.getState().bootstrap()).toBe(true);
    expect(store.getState().settings).toEqual({ reducedMotion: false, haptics: false, soundEffects: false, ...JSON.parse(raw), dailyReminder: false, reminderHour: 19, reminderMinute: 0, godModeEnabled: false });
    const write = jest.spyOn(repository, 'saveAppSettings');
    expect(await store.getState().setDailyReminder(false)).toBe(true); expect(await store.getState().setReminderTime(19, 0)).toBe(true);
    expect(write).not.toHaveBeenCalled(); expect(await repository.loadAppSettings()).toBe(raw);
    expect(await repository.export(world.id)).toBe(archive); expect(await repository.active()).toEqual(world);
  } finally { sqlite.close(); }
});

test('reminder enable and time writes retain exact prior settings on SQLite failure, retry atomically and survive a closed-connection cold load without changing a life', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'dreams-reminder-preferences-')), path = join(directory, 'dreams.db'); let sqlite: DatabaseSync | undefined;
  try {
    const context = await fixture(fileDatabase(path)); sqlite = context.sqlite;
    const { repository, world, archive, store } = context;
    const rows = (): Record<string, Record<string, unknown>[]> => Object.fromEntries(['lives', 'backups', 'snapshots', 'snapshot_metadata', 'receipts', 'branches', 'restore_receipts', 'preferences'].map(table => [table, sqlite!.prepare('SELECT * FROM ' + table + ' ORDER BY 1,2').all()]));
    const lifeRows = () => { const all = rows(); return { ...all, preferences: all.preferences.filter(row => row.key !== 'app_settings') }; };
    await repository.saveAppSettings('{"version":1,"appearance":"dark","reducedMotion":true,"haptics":true,"soundEffects":true}');
    expect(await store.getState().bootstrap()).toBe(true); const originalLifeRows = lifeRows();
    expect(await store.getState().setReminderTime(21, 45)).toBe(true); expect(store.getState().settings.dailyReminder).toBe(false);
    const beforeEnable = rows(), priorSettings = store.getState().settings;
    sqlite.exec("CREATE TRIGGER fail_reminder BEFORE INSERT ON preferences WHEN NEW.key='app_settings' BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    expect(await store.getState().setDailyReminder(true)).toBe(false); expect(store.getState().settings).toEqual(priorSettings); expect(rows()).toEqual(beforeEnable); expect(store.getState().error).toMatch(/could not be saved/);
    sqlite.exec('DROP TRIGGER fail_reminder'); expect(await store.getState().retry()).toBe(true); expect(store.getState().settings.dailyReminder).toBe(true);
    const beforeTime = rows();
    sqlite.exec("CREATE TRIGGER fail_reminder BEFORE INSERT ON preferences WHEN NEW.key='app_settings' BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    expect(await store.getState().setReminderTime(7, 30)).toBe(false); expect(store.getState().settings).toMatchObject({ dailyReminder: true, reminderHour: 21, reminderMinute: 45 }); expect(rows()).toEqual(beforeTime);
    sqlite.exec('DROP TRIGGER fail_reminder'); expect(await store.getState().retry()).toBe(true);
    const savedSettings = store.getState().settings, savedRows = rows(); expect(lifeRows()).toEqual(originalLifeRows);
    sqlite.close(); sqlite = undefined;
    const coldConnection = fileDatabase(path); sqlite = coldConnection.sqlite;
    const coldRepository = new SaveRepository(coldConnection.driver); await coldRepository.initialise();
    const cold = createPreferencesStore({ repository: async () => coldRepository }); expect(await cold.getState().bootstrap()).toBe(true);
    expect(cold.getState().settings).toEqual(savedSettings); expect(cold.getState().settings).toMatchObject({ dailyReminder: true, reminderHour: 7, reminderMinute: 30 }); expect(rows()).toEqual(savedRows);
    expect(await coldRepository.active()).toEqual(world); expect(await coldRepository.export(world.id)).toBe(archive);
    expect(await cold.getState().reset()).toBe(true); expect(cold.getState().settings).toEqual({ ...savedSettings, appearance: 'light' });
    expect(await cold.getState().setDailyReminder(false)).toBe(true); expect(cold.getState().settings).toMatchObject({ reminderHour: 7, reminderMinute: 30 });
    expect(JSON.parse((await coldRepository.loadAppSettings())!)).not.toHaveProperty('dailyReminder');
    expect(await cold.getState().setReminderTime(19, 0)).toBe(true);
    expect(JSON.parse((await coldRepository.loadAppSettings())!)).toEqual({ version: 1, appearance: 'light', reducedMotion: true, haptics: true, soundEffects: true }); expect(lifeRows()).toEqual(originalLifeRows);
    expect(await cold.getState().setDailyReminder(true)).toBe(true); await coldRepository.saveAppSettings('unreadable settings');
    expect(await cold.getState().bootstrap()).toBe(false); expect(cold.getState().settings.dailyReminder).toBe(true);
    expect(await cold.getState().reset()).toBe(true); expect(cold.getState().settings).toEqual({ version: 1, appearance: 'light', reducedMotion: false, haptics: false, soundEffects: false, dailyReminder: false, reminderHour: 19, reminderMinute: 0, godModeEnabled: false });
    expect(JSON.parse((await coldRepository.loadAppSettings())!)).toEqual({ version: 1, appearance: 'light' }); expect(lifeRows()).toEqual(originalLifeRows);
  } finally { sqlite?.close(); rmSync(directory, { recursive: true, force: true }); }
});

test('reminder time rejects non-integer and out-of-range values without writing either field, and accepts both valid boundaries', async () => {
  const { sqlite, repository, world, archive, store } = await fixture();
  try {
    await store.getState().bootstrap(); expect(await store.getState().setReminderTime(23, 59)).toBe(true);
    const saved = await repository.loadAppSettings(), settings = store.getState().settings, write = jest.spyOn(repository, 'saveAppSettings');
    for (const [hour, minute] of [[-1, 0], [24, 0], [19, -1], [19, 60], [19.5, 0], [19, 0.5], [NaN, 0], [19, Infinity]]) {
      expect(await store.getState().setReminderTime(hour, minute)).toBe(false); expect(store.getState().settings).toEqual(settings); expect(await repository.loadAppSettings()).toBe(saved);
    }
    expect(write).not.toHaveBeenCalled(); expect(await store.getState().setReminderTime(0, 0)).toBe(true); expect(store.getState().settings).toMatchObject({ dailyReminder: false, reminderHour: 0, reminderMinute: 0 });
    expect(await repository.export(world.id)).toBe(archive); expect(await repository.active()).toEqual(world);
  } finally { sqlite.close(); }
});
