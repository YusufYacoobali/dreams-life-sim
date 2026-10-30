import { createGameStore } from '../../src/state/gameStore';
import { decodeWorld, encodeWorld, type World } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { endEmployment } from '../../src/game/systems/work';
import { accountFor } from '../../src/game/systems/common';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { SaveRepository } from '../../src/persistence/repository';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { database } from '../support/sqlite';
import graduate from '../fixtures/v3-employed-graduate.json';

type Kind = 'actor' | 'model';
const entry = (kind: Kind): GameCommand => ({ type: kind === 'actor' ? 'actor-enter' : 'model-enter' } as GameCommand);
function foundation() {
  const world = decodeWorld(JSON.stringify(graduate)), person = world.people[world.activePersonId];
  endEmployment(world); person.born.year -= 5;
  person.stats.health = person.stats.fitness = person.stats.smarts = person.stats.discipline = person.stats.energy = 100;
  person.skills.acting = person.skills.modeling = 100;
  const cash = accountFor(world); cash.cash += 100000000n; cash.openingCash += 100000000n;
  return world;
}
function drain(input: World) {
  let world = input, guard = 0;
  while (world.pending && guard++ < 100) {
    const event = world.pending;
    world = event.kind === 'result' ? resolveCommand(world, { type: 'acknowledge', resultId: event.id }) : resolveCommand(world, { type: 'choose', eventId: event.id, choiceId: event.choices.find(choice => !choiceUnavailable(world, choice))!.id });
  }
  if (world.pending) throw new Error('An immediate creative result did not resolve');
  return world;
}
function career(world: World, kind: Kind) { return world.careers.find(item => item.personId === world.activePersonId && item.kind === kind)!; }
function industry(world: World, kind: Kind) { const recorded = career(world, kind); return kind === 'actor' ? recorded.actor!.industry : recorded.modelCareer!.industry; }
const rowSnapshot = (sqlite: ReturnType<typeof database>['sqlite']) => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));

for (const kind of ['actor', 'model'] as const) {
  test(kind + ' opt-in is free, atomically upgrades only that life, and survives failed saves plus cold reopening', async () => {
    const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise();
    try {
      const old = foundation(); await repository.create(old);
      const createStore = () => createGameStore({ repository: async () => new SaveRepository(driver), date: () => old.date, id: () => 'unused', premiumAccess: () => false });
      let store = createStore(); await store.getState().bootstrap(); const before = encodeWorld(store.getState().world!), rows = rowSnapshot(sqlite), command = entry(kind);
      expect(store.getState().world!.schemaVersion).toBe(49);
      sqlite.exec("CREATE TRIGGER fail_creative_opt_in BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
      expect(await store.getState().dispatch(command)).toBe(false); expect(encodeWorld(store.getState().world!)).toBe(before); expect(rowSnapshot(sqlite)).toEqual(rows);
      sqlite.exec('DROP TRIGGER fail_creative_opt_in');
      expect(await store.getState().dispatch(command)).toBe(true);
      const entered = store.getState().world!;
      expect(entered).toMatchObject({ schemaVersion: 50, engineVersion: 52, contentVersion: 29 });
      expect(entered.ledger).toEqual(old.ledger); expect(industry(entered, kind).totalGross).toBe(0n); expect(industry(entered, kind).totalCommission).toBe(0n);
      expect(entered.people[entered.activePersonId].employment).toBeNull();
      expect(unpackCheckpoint(packCheckpoint(entered))).toEqual(entered);
      store = createStore(); expect(await store.getState().bootstrap()).toBe(true); expect(store.getState().world).toEqual(entered);
      expect(industry(store.getState().world!, kind).contacts).toEqual(industry(entered, kind).contacts);
      const incompatible = JSON.parse(encodeWorld(entered)); incompatible.schemaVersion = 49;
      expect(() => decodeWorld(JSON.stringify(incompatible))).toThrow();
      const mismatched = JSON.parse(encodeWorld(entered)); mismatched.engineVersion = 51;
      expect(() => decodeWorld(JSON.stringify(mismatched))).toThrow();
    } finally { sqlite.close(); }
  });

  test(kind + ' stored casting replays the same contract after a failed commit, with no upfront or duplicated pay', async () => {
    const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise();
    try {
      const prepared = decodeWorld(encodeWorld(drain(resolveCommand(foundation(), entry(kind)))));
      const offer = industry(prepared, kind).board.find(item => item.status === 'open' && item.minAgency === 0 && item.minReputation <= career(prepared, kind).reputation)!;
      expect(offer).toBeDefined(); offer.auditionRoll = 1; // Explicit saved-success fixture, not a claim of natural casting success.
      await repository.create(prepared);
      const createStore = () => createGameStore({ repository: async () => new SaveRepository(driver), date: () => prepared.date, id: () => 'unused', premiumAccess: () => false });
      let store = createStore(); await store.getState().bootstrap();
      const command: GameCommand = kind === 'actor' ? { type: 'actor-audition', offerId: offer.id, quotedAnnualPay: offer.annualPay, negotiate: false } : { type: 'model-casting', offerId: offer.id, quotedAnnualPay: offer.annualPay };
      const expected = resolveCommand(store.getState().world!, command, true), original = encodeWorld(prepared), rows = rowSnapshot(sqlite);
      expect(career(expected, kind).projects.at(-1)?.creative?.offerId).toBe(offer.id);
      sqlite.exec("CREATE TRIGGER fail_creative_casting BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
      expect(await store.getState().dispatch(command)).toBe(false); expect(encodeWorld(store.getState().world!)).toBe(original); expect(rowSnapshot(sqlite)).toEqual(rows);
      sqlite.exec('DROP TRIGGER fail_creative_casting');
      store = createStore(); await store.getState().bootstrap(); expect(encodeWorld(store.getState().world!)).toBe(original);
      expect(await store.getState().dispatch(command)).toBe(true); expect(store.getState().world).toEqual(expected);
      expect(expected.ledger).toEqual(prepared.ledger); expect(expected.accounts).toEqual(prepared.accounts);
      expect(career(expected, kind).projects.at(-1)?.grossEarned).toBe(0n); expect(expected.people[expected.activePersonId].employment!.paidMonths).toBe(0);
      const written = rowSnapshot(sqlite); expect(await store.getState().dispatch(command)).toBe(false); expect(rowSnapshot(sqlite)).toEqual(written);
      store = createStore(); await store.getState().bootstrap(); expect(store.getState().world).toEqual(expected);
    } finally { sqlite.close(); }
  });
}
