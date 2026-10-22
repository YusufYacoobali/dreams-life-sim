import { createGameStore } from '../../src/state/gameStore';
import { createPreferencesStore } from '../../src/state/preferencesStore';
import { createLife, randomCreation } from '../../src/game/createLife';
import { encodeWorld, type World } from '../../src/game/model';
import { SaveRepository } from '../../src/persistence/repository';
import { decodeSave } from '../../src/persistence/archive';
import { database } from '../support/sqlite';
import { annualFinanceSummary, indexPersonalFinances } from '../../src/ui/annualFinances';

async function fixture() {
  const db = database(), repository = new SaveRepository(db.driver); await repository.initialise();
  const before = { ...createLife('life_testing', 42, randomCreation(42), { year: 2026, month: 10, day: 22 }), birthAcknowledged: true }; await repository.create(before);
  let allowed = true;
  let sequence = 0;
  const deps = { repository: async () => repository, date: () => before.date, id: () => 'life_restored_' + sequence++, godModeAccess: () => allowed };
  const store = createGameStore(deps); await store.getState().bootstrap();
  const request = (world: World = store.getState().world!) => ({ lifeId: world.id, personId: world.activePersonId, expectedRevision: world.revision, commands: [
    { type: 'money' as const, accountId: world.accounts.find(item => item.ownerId === world.activePersonId)!.id, operation: 'set' as const, amount: '1000000' },
    { type: 'stat' as const, stat: 'health' as const, value: 100 }, { type: 'skill' as const, skill: 'science' as const, value: 47 },
    { type: 'relationship' as const, relationshipId: world.relationships[0].id, field: 'trust' as const, value: 100 },
  ] });
  return { ...db, repository, before, store, request, deps, disable: () => { allowed = false; } };
}

test('bulk edits survive cold reload, export/import and pre-edit checkpoint restoration', async () => {
  const { sqlite, driver, repository, before, store, deps, request, disable } = await fixture();
  expect(await store.getState().editGodMode(request())).toBe(true);
  const edited = store.getState().world!; expect(edited.revision).toBe(before.revision + 1);
  expect(store.getState().lives[0].revision).toBe(edited.revision);
  const points = await repository.snapshots(before.id); expect(points).toHaveLength(1); expect(points[0].label).toBe('Before God Mode');
  const coldRepository = new SaveRepository(driver); await coldRepository.initialise(); const cold = createGameStore({ ...deps, repository: async () => coldRepository }); await cold.getState().bootstrap(); expect(cold.getState().world).toEqual(edited);
  const account = edited.accounts.find(item => item.ownerId === edited.activePersonId)!;
  const finances = annualFinanceSummary(indexPersonalFinances(edited, edited.activePersonId), edited.date.year, account.currency);
  expect(finances.income).toBe(0n); expect(finances.taxPaid).toBe(0n); expect(finances.sections.find(section => section.id === 'testing')?.categories[0].category).toBe('god-mode-adjustment');
  const archive = await repository.export(before.id); expect(decodeSave(archive).world).toEqual(edited);
  const destination = database(), imported = new SaveRepository(destination.driver); await imported.initialise(); await imported.import(archive); expect(await imported.load(before.id)).toEqual(edited); expect(await imported.snapshots(before.id)).toEqual(points);
  const restored = await imported.restoreBranch(before.id, points[0].id, edited.revision, 'life_copy', 'restore_god'); expect(restored).toEqual({ ...before, id: 'life_copy' }); expect(await imported.load(before.id)).toEqual(edited);
  disable(); expect(await store.getState().editGodMode(request())).toBe(false); expect(store.getState().world).toBe(edited); expect(await repository.load(before.id)).toEqual(edited);
  sqlite.close(); destination.sqlite.close();
});

test('receipt failure rolls back money, attributes and automatic snapshot; retry saves once', async () => {
  const { sqlite, repository, before, store, request } = await fixture(), original = store.getState().world;
  sqlite.exec("CREATE TRIGGER fail_god BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  expect(await store.getState().editGodMode(request())).toBe(false); expect(store.getState().error).toMatch(/could not be saved/); expect(store.getState().world).toBe(original);
  expect(await repository.load(before.id)).toEqual(before); expect(await repository.snapshots(before.id)).toEqual([]);
  sqlite.exec('DROP TRIGGER fail_god'); expect(await store.getState().editGodMode(request())).toBe(true); expect(await repository.snapshots(before.id)).toHaveLength(1);
  expect(store.getState().world!.ledger.filter(row => row.category === 'god-mode-adjustment')).toHaveLength(1); sqlite.close();
});

test('stale repository revisions and stale editor requests cannot overwrite another save', async () => {
  const { sqlite, repository, before, store, request, deps } = await fixture(), stale = request();
  const other = createGameStore(deps); await other.getState().bootstrap(); expect(await other.getState().editGodMode(stale)).toBe(true);
  const saved = await repository.load(before.id); expect(await store.getState().editGodMode(stale)).toBe(false); expect(store.getState().error).toMatch(/changed|another/i); expect(await repository.load(before.id)).toEqual(saved);
  await store.getState().bootstrap(); expect(await store.getState().editGodMode(stale)).toBe(false); expect(store.getState().error).toMatch(/changed/); sqlite.close();
});

test('double submission, missing authorization, and disabled access after yielding are rejected', async () => {
  const { sqlite, repository, before, store, request, deps, disable } = await fixture();
  const first = store.getState().editGodMode(request()); expect(await store.getState().editGodMode(request())).toBe(false); expect(await first).toBe(true);
  const noAccess = createGameStore({ ...deps, godModeAccess: undefined }); await noAccess.getState().bootstrap(); const encoded = encodeWorld(noAccess.getState().world!);
  expect(await noAccess.getState().editGodMode(request(noAccess.getState().world!))).toBe(false); expect(encodeWorld((await repository.load(before.id)))).toBe(encoded);
  const yielding = createGameStore({ ...deps, yieldToUI: async () => { disable(); } }); await yielding.getState().bootstrap();
  expect(await yielding.getState().editGodMode(request(yielding.getState().world!))).toBe(false); expect(encodeWorld(await repository.load(before.id))).toBe(encoded); sqlite.close();
});

test('testing toggle persists independently, retries failed preference writes and never reverses edits', async () => {
  const { sqlite, repository, store, request } = await fixture(), preferences = createPreferencesStore({ repository: async () => repository });
  await preferences.getState().bootstrap(); expect(preferences.getState().settings.godModeEnabled).toBe(false);
  sqlite.exec("CREATE TRIGGER fail_god_preference BEFORE INSERT ON preferences BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  expect(await preferences.getState().setGodModeEnabled(true)).toBe(false); expect(preferences.getState().settings.godModeEnabled).toBe(false);
  sqlite.exec('DROP TRIGGER fail_god_preference'); expect(await preferences.getState().retry()).toBe(true);
  expect(await store.getState().editGodMode(request())).toBe(true); const edited = store.getState().world;
  const cold = createPreferencesStore({ repository: async () => repository }); await cold.getState().bootstrap(); expect(cold.getState().settings.godModeEnabled).toBe(true);
  expect(await cold.getState().setGodModeEnabled(false)).toBe(true); expect(await repository.active()).toEqual(edited); sqlite.close();
});

test('a lost commit acknowledgement retries the same receipt without applying money twice', async () => {
  const { sqlite, repository, before, request, deps } = await fixture();
  let lost = true;
  const store = createGameStore({ ...deps, repository: async () => ({
    active: () => repository.active(), list: () => repository.list(), create: world => repository.create(world), select: id => repository.select(id),
    importWithSummary: (text, replace) => repository.importWithSummary(text, replace), recoverWithSummary: id => repository.recoverWithSummary(id),
    snapshots: id => repository.snapshots(id), snapshot: (id, revision) => repository.snapshot(id, revision),
    restoreBranch: (...args) => repository.restoreBranch(...args),
    commit: async (...args) => { const result = await repository.commit(...args); if (lost) { lost = false; throw new Error('lost acknowledgement'); } return result; },
  }) });
  await store.getState().bootstrap();
  const edit = request(); edit.commands = [edit.commands[0]]; edit.commands[0] = { ...edit.commands[0], operation: 'add' } as typeof edit.commands[0];
  expect(await store.getState().editGodMode(edit)).toBe(false); expect(store.getState().world).toEqual(before);
  const committed = await repository.load(before.id);
  expect(await store.getState().editGodMode({ ...edit, commands: [...edit.commands] })).toBe(true); expect(store.getState().world).toEqual(committed);
  expect(committed.ledger.filter(row => row.category === 'god-mode-adjustment')).toHaveLength(1); expect(await repository.snapshots(before.id)).toHaveLength(1); sqlite.close();
});
