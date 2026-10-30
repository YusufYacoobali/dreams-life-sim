import { createGameStore } from '../../src/state/gameStore';
import { requiredFeature } from '../../src/purchases/access';
import type { PremiumFeature } from '../../src/purchases/catalog';
import { createLife, randomCreation } from '../../src/game/createLife';
import { decodeWorld, encodeWorld, type World } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { careerPayQuote } from '../../src/game/systems/careers';
import { servicePayQuote } from '../../src/game/systems/services';
import { endEmployment } from '../../src/game/systems/work';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';
import graduate from '../fixtures/v3-employed-graduate.json';
const date = { year: 2026, month: 10, day: 29 };
const base = () => {
  const world = decodeWorld(JSON.stringify(graduate)), person = world.people[world.activePersonId];
  endEmployment(world); person.born.year -= 5; world.random.outcomes = 1;
  person.stats.health = person.stats.fitness = person.stats.smarts = person.stats.discipline = 100;
  person.skills.sport = person.skills.science = person.skills.service = 100;
  return world;
};
const entry = (world: World, feature: 'athlete' | 'military' | 'astronaut'): GameCommand => feature === 'athlete'
  ? { type: 'select-career', kind: 'athlete', quotedAnnualPay: careerPayQuote(world, 'athlete') }
  : { type: 'apply-service', kind: feature, branch: feature === 'astronaut' ? 'space-program' : 'army', quotedAnnualPay: servicePayQuote(world, feature) };
function drain(world: World) {
  while (world.pending) world = world.pending.kind === 'result'
    ? resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id })
    : resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: world.pending.choices.find(item => !choiceUnavailable(world, item))!.id });
  return world;
}
async function setup(world = base(), access = (_: PremiumFeature) => false) {
  const db = database(), repository = new SaveRepository(db.driver); await repository.initialise(); await repository.create(world);
  let sequence = 0;
  const store = createGameStore({ repository: async () => repository, date: () => date, id: () => 'life_paid_' + sequence++, premiumAccess: access });
  await store.getState().bootstrap(); return { ...db, repository, store, world };
}
test.each(['athlete', 'military', 'astronaut'] as const)('direct %s entry is blocked before persistence and works with the purchased feature', async feature => {
  let owned = false;
  const { store, repository, sqlite, world } = await setup(base(), key => owned && key === feature), before = await repository.export(world.id), command = entry(world, feature);
  expect(await store.getState().dispatch(command)).toBe(false); expect(store.getState().error).toMatch(/ownership/); expect(await repository.export(world.id)).toBe(before);
  owned = true; expect(await store.getState().dispatch(command)).toBe(true); expect(store.getState().world!.revision).toBe(world.revision + 1);
  sqlite.close();
});
test('cult founding has a command-level restriction, not just a hidden button', async () => {
  const { store, sqlite, repository, world } = await setup(), before = await repository.export(world.id);
  // The access guard must run even for a stale/incomplete command from a shortcut.
  expect(await store.getState().dispatch({ type: 'found-cult' } as GameCommand)).toBe(false);
  expect(store.getState().error).toMatch(/ownership/); expect(await repository.export(world.id)).toBe(before); sqlite.close();
});
test.each(['athlete', 'military', 'astronaut'] as const)('existing %s saves load and career assignments remain usable without a new purchase', async feature => {
  let world = base();
  for (let attempt = 0; attempt < 2; attempt++) {
    world = drain(resolveCommand(world, entry(world, feature)));
    if (feature === 'athlete' ? world.careers.some(item => item.status === 'active') : world.serviceCareers.some(item => item.status === 'active')) break;
  }
  const career = feature === 'athlete' ? world.careers[0] : world.serviceCareers[0]; expect(career?.status).toBe('active');
  const { store, sqlite, repository } = await setup(world);
  expect(encodeWorld(store.getState().world!)).toBe(encodeWorld(world));
  const command = feature === 'athlete' ? { type: 'career-focus', careerId: career.id, focus: 'balanced' } as const : { type: 'service-focus', serviceId: career.id, focus: 'balanced' } as const;
  expect(requiredFeature(world, command)).toBeNull(); expect(await store.getState().dispatch(command)).toBe(true);
  const continuation = entry(world, feature); expect(requiredFeature(world, continuation)).toBeNull();
  career.status = 'left'; expect(requiredFeature(world, continuation)).toBe(feature);
  expect((await repository.load(world.id)).id).toBe(world.id); sqlite.close();
});
test('all ordinary careers, training, random events, relationships and royalty commands remain free', () => {
  const world = base();
  for (const kind of ['actor', 'model', 'musician', 'politician'] as const) expect(requiredFeature(world, { type: 'select-career', kind, quotedAnnualPay: 0n })).toBeNull();
  for (const type of ['advance', 'start-training', 'start-business', 'start-creator', 'royal-duties', 'interact', 'apply-job', 'enrol'] as const) expect(requiredFeature(world, { type } as GameCommand)).toBeNull();
});
test('God Mode and checkpoint restore cannot bypass ownership; checkpoint browsing, saving, recovery and existing edits remain intact', async () => {
  let paid = false;
  const world = { ...createLife('life_premium_history', 42, randomCreation(42), date), birthAcknowledged: true }, { store, sqlite, repository } = await setup(world, () => paid);
  expect(await store.getState().saveSnapshot()).toBe(true); const points = await repository.snapshots(world.id), before = await repository.export(world.id);
  expect(await store.getState().loadSnapshots()).toBe(true);
  expect(await store.getState().restoreSnapshot(points[0].id)).toBe(false);
  const edit = { lifeId: world.id, personId: world.activePersonId, expectedRevision: world.revision, commands: [{ type: 'stat', stat: 'smarts', value: 99 }] } as const;
  expect(await store.getState().editGodMode({ ...edit, commands: [...edit.commands] })).toBe(false);
  expect(await repository.export(world.id)).toBe(before); expect(await repository.snapshots(world.id)).toEqual(points);
  paid = true; expect(await store.getState().editGodMode({ ...edit, commands: [...edit.commands] })).toBe(true);
  paid = false; await store.getState().bootstrap(); expect(store.getState().world!.people[world.activePersonId].stats.smarts).toBe(99);
  paid = true; expect(await store.getState().restoreSnapshot(points[0].id)).toBe(true); expect((await repository.list()).length).toBe(2);
  expect(await repository.snapshots(world.id)).toEqual(expect.arrayContaining(points.map(({ createdAt, label, ...point }) => expect.objectContaining(point)))); sqlite.close();
});
test('deliberate royal births require God Mode while seeded natural royal births remain free', async () => {
  const { store, sqlite } = await setup();
  const input = { ...randomCreation(42), country: 'GB' as const, city: 'London', background: 'royal' as const };
  expect(await store.getState().startLife(input, 42)).toBe(false); expect(store.getState().error).toMatch(/God Mode ownership/);
  let seed = 0; while (randomCreation(seed).background !== 'royal') seed++;
  expect(await store.getState().startLife(randomCreation(seed), seed)).toBe(true); sqlite.close();
});

test.each(['career', 'restore', 'royal'] as const)('revocation while waiting for storage blocks the pending %s operation before any write', async operation => {
  const world = base(); let owned = true, release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const repository = {
    active: async () => world, list: async () => [], commit: jest.fn(async (next: World) => next),
    create: jest.fn(), restoreBranch: jest.fn(),
  };
  let held = false;
  const store = createGameStore({ repository: async () => { if (held) await gate; return repository as never; }, date: () => date, id: () => 'life_race', premiumAccess: () => owned });
  await store.getState().bootstrap(); held = true;
  const pending = operation === 'career' ? store.getState().dispatch(entry(world, 'athlete')) : operation === 'restore' ? store.getState().restoreSnapshot('snapshot') : store.getState().startLife({ ...randomCreation(42), country: 'GB', city: 'London', background: 'royal' }, 42);
  owned = false; release(); expect(await pending).toBe(false);
  expect(repository.commit).not.toHaveBeenCalled(); expect(repository.create).not.toHaveBeenCalled(); expect(repository.restoreBranch).not.toHaveBeenCalled();
});
