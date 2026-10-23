import { createGameStore } from '../../src/state/gameStore';
import { SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';
import { cultFixture, foundCult, drainCult } from '../support/cults';
import { encodeWorld, decodeWorld, copyWorld, type World } from '../../src/game/model';
import graduateFixture from '../fixtures/v3-employed-graduate.json';
import { ownHousehold } from '../../src/game/systems/households';
import { resolveCommand, recordDeath, type GameCommand } from '../../src/game/engine';
import { assetCatalog } from '../../src/game/content/assets';
import { purchaseQuote } from '../../src/game/systems/assets';
import { investmentQuote } from '../../src/game/systems/markets';
import { addChild } from '../../src/game/systems/family';
import { createContact } from '../../src/game/systems/npcs';
import { connectPerson, relationFor, weddingBudgets } from '../../src/game/systems/relationships';
import { committedCues } from '../../src/feedback/committedCue';
import { emitGameplayFeedback, subscribeGameplayFeedback } from '../../src/feedback/gameplayFeedback';
import { athleteFixture, startMiniGame } from '../support/miniGames';
import { businessStartupQuote, improvementQuote, expansionQuote } from '../../src/game/systems/businesses';
import { cultUpgradeQuote } from '../../src/game/systems/cultCore';

async function setup(world = cultFixture()) {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver);
  await repository.initialise(); await repository.create(world);
  const onFeedback = jest.fn();
  const store = createGameStore({ repository: async () => repository, id: () => 'life_audio_new', date: () => world.date, onFeedback });
  await store.getState().bootstrap();
  return { store, repository, sqlite, onFeedback };
}
function purchase(world: World, kind: 'property' | 'vehicle' | 'possession' = 'vehicle'): GameCommand {
  const offer = assetCatalog.find(row => row.kind === kind)!;
  return { type: 'buy-asset', catalogId: offer.id, financing: 'cash', depositBps: 10000, termMonths: 360, quotedPrice: purchaseQuote(world, offer, 'cash').price };
}
function transition(before: World, change: (after: World) => void, command: GameCommand = { type: 'resume' }) {
  const after = copyWorld(before); change(after); after.revision++;
  return committedCues(before, after, command);
}

test('Age Up emits only after a real SQLite save; rapid duplicate submissions cannot emit or write twice', async () => {
  const context = await setup();
  try {
    let complete!: () => void;
    const commit = context.repository.commit.bind(context.repository);
    const write = jest.spyOn(context.repository, 'commit').mockImplementation(async (...args) => { await new Promise<void>(resolve => { complete = resolve; }); return commit(...args); });
    const first = context.store.getState().dispatch({ type: 'advance' });
    expect(await context.store.getState().dispatch({ type: 'advance' })).toBe(false);
    await Promise.resolve(); expect(context.onFeedback).not.toHaveBeenCalled();
    complete(); expect(await first).toBe(true);
    expect(write).toHaveBeenCalledTimes(1);
    expect(context.onFeedback.mock.calls.flatMap(([event]) => event.cues).filter(cue => cue === 'age-up')).toHaveLength(1);
    expect(encodeWorld((await context.repository.active())!)).toBe(encodeWorld(context.store.getState().world!));
  } finally { context.sqlite.close(); }
});

test('failed Age Up saves emit error only, preserve RNG/world, and a successful retry emits one year cue', async () => {
  const context = await setup();
  try {
    const before = encodeWorld(context.store.getState().world!);
    jest.spyOn(context.repository, 'commit').mockRejectedValueOnce(Error('disk full'));
    expect(await context.store.getState().dispatch({ type: 'advance' })).toBe(false);
    expect(context.onFeedback.mock.calls.map(([event]) => event.cues)).toEqual([['error']]);
    expect(encodeWorld(context.store.getState().world!)).toBe(before);
    expect(encodeWorld((await context.repository.active())!)).toBe(before);
    expect(await context.store.getState().dispatch({ type: 'advance' })).toBe(true);
    expect(context.onFeedback.mock.calls.flatMap(([event]) => event.cues).filter(cue => cue === 'age-up')).toHaveLength(1);
  } finally { context.sqlite.close(); }
});

test('an interrupted year, cold bootstrap, reopening a saved result and Continue This Year never repeat Age Up', async () => {
  const context = await setup();
  try {
    await context.store.getState().dispatch({ type: 'advance' });
    const yearCues = context.onFeedback.mock.calls.flatMap(([event]) => event.cues).filter(cue => cue === 'age-up').length;
    context.onFeedback.mockClear(); await context.store.getState().bootstrap();
    await context.store.getState().selectLife(context.store.getState().world!.id);
    expect(context.onFeedback).not.toHaveBeenCalled();
    let guard = 0;
    while (context.store.getState().world!.annual && guard++ < 100) {
      const world = context.store.getState().world!, pending = world.pending;
      const command: GameCommand = pending?.kind === 'decision' ? { type: 'choose', eventId: pending.id, choiceId: pending.choices.find(row => row.id === 'withdraw')?.id ?? pending.choices.find(row => !row.disabledReason)!.id } : pending ? { type: 'acknowledge', resultId: pending.id } : { type: 'resume' };
      expect(await context.store.getState().dispatch(command)).toBe(true);
    }
    expect(guard).toBeLessThan(100); expect(yearCues).toBe(1);
    expect(context.onFeedback.mock.calls.flatMap(([event]) => event.cues)).not.toContain('age-up');
  } finally { context.sqlite.close(); }
});

test.each(['property', 'vehicle', 'possession', 'investment'] as const)('%s transactions play purchase only after saving, while insufficient funds and write failures never play success', async kind => {
  const context = await setup();
  try {
    const before = context.store.getState().world!;
    const command: GameCommand = kind !== 'investment' ? purchase(before, kind) : { type: 'buy-investment', instrumentId: 'GROVE', quantity: 1n, quotedMinor: investmentQuote(before, 'GROVE', 1n).value };
    jest.spyOn(context.repository, 'commit').mockRejectedValueOnce(Error('disk full'));
    expect(await context.store.getState().dispatch(command)).toBe(false);
    expect(context.onFeedback.mock.calls.map(([event]) => event.cues)).toEqual([['error']]);
    expect(await context.store.getState().dispatch(command)).toBe(true);
    expect(context.onFeedback.mock.calls.map(([event]) => event.cues)).toEqual([['error'], ['purchase']]);
    const saved = await context.repository.active(); expect(saved!.ledger.length).toBeGreaterThan(before.ledger.length);
    const poor = cultFixture(); const account = poor.accounts.find(row => row.ownerId === poor.activePersonId)!; account.cash = 0n; account.openingCash = 0n;
    // A quote is valid; only actual affordability rejects this transaction.
    context.store.setState({ world: poor }); context.onFeedback.mockClear();
    expect(await context.store.getState().dispatch(purchase(poor))).toBe(false);
    expect(context.onFeedback.mock.calls.map(([event]) => event.cues)).toEqual([['error']]);
  } finally { context.sqlite.close(); }
});

test('marriage and adoption celebrate committed outcomes and acknowledging their saved result stays silent', async () => {
  const before = cultFixture(), person = before.people[before.activePersonId];
  const spouse = createContact(before, { age: 28, gender: 'female', compatibleWith: person.gender });
  connectPerson(before, spouse.id);
  const relation = relationFor(before, person.id, spouse.id)!;
  relation.kind = 'partner'; relation.roles.push('partner'); relation.romance = 'engaged'; relation.strength = 95; relation.trust = 95;
  const command: GameCommand = { type: 'marry', personId: spouse.id, budget: weddingBudgets(before)[0].amount };
  const married = resolveCommand(before, command);
  expect(committedCues(before, married, command)).toEqual(['big-success']);
  expect(committedCues(married, resolveCommand(married, { type: 'acknowledge', resultId: married.pending!.id }), { type: 'acknowledge', resultId: married.pending!.id })).toEqual([]);
  const adoptive = decodeWorld(JSON.stringify(graduateFixture)), parent = adoptive.people[adoptive.activePersonId];
  parent.wantsChildren = true; parent.stats.health = 100; ownHousehold(adoptive, parent);
  const bank = adoptive.accounts.find(row => row.ownerId === parent.id)!; bank.cash += 100000000n; bank.openingCash += 100000000n;
  const context = await setup(adoptive);
  try {
    expect(await context.store.getState().dispatch({ type: 'adopt', age: 2 })).toBe(true);
    expect(context.onFeedback.mock.calls.map(([event]) => event.cues)).toEqual([['big-success']]);
    expect((await context.repository.active())!.relationships.some(row => row.from === context.store.getState().world!.activePersonId && row.roles.includes('parent'))).toBe(true);
  } finally { context.sqlite.close(); }
});

test.each(['improve-business', 'expand-business'] as const)('%s uses the business cash receipt, including failure/retry, rather than assuming a personal purchase', async type => {
  let world = cultFixture();
  world = drainCult(resolveCommand(world, { type: 'start-business', kind: 'cafe', name: 'Audio Cafe', operation: 'manager', quotedCapital: businessStartupQuote(world, 'cafe').capital }));
  world = drainCult(resolveCommand(world, { type: 'fund-business', businessId: world.businesses[0].id, amount: 100000000n }));
  const context = await setup(world);
  try {
    const company = world.businesses[0], command: GameCommand = { type, businessId: company.id, quotedCost: type === 'improve-business' ? improvementQuote(company) : expansionQuote(company) };
    jest.spyOn(context.repository, 'commit').mockRejectedValueOnce(Error('disk full'));
    expect(await context.store.getState().dispatch(command)).toBe(false);
    expect(context.onFeedback.mock.calls.map(([event]) => event.cues)).toEqual([['error']]);
    expect(await context.store.getState().dispatch(command)).toBe(true);
    expect(context.onFeedback.mock.calls.map(([event]) => event.cues)).toEqual([['error'], ['purchase']]);
    const saved = (await context.repository.active())!;
    expect(saved.ledger).toEqual(world.ledger); expect(saved.businessLedger.length).toBe(world.businessLedger.length + 1);
  } finally { context.sqlite.close(); }
});

test('a Cult Leader headquarters upgrade plays purchase only for the saved treasury expense', async () => {
  let world = foundCult();
  world = drainCult(resolveCommand(world, { type: 'cult-contribute', cultId: world.cults[0].id, amount: 10000000n }));
  const context = await setup(world);
  try {
    const cult = world.cults[0];
    expect(await context.store.getState().dispatch({ type: 'cult-upgrade', cultId: cult.id, upgrade: 'hall', quotedCost: cultUpgradeQuote(cult, 'hall') })).toBe(true);
    expect(context.onFeedback.mock.calls.map(([event]) => event.cues)).toEqual([['purchase']]);
    expect(context.store.getState().world!.ledger).toEqual(world.ledger);
  } finally { context.sqlite.close(); }
});

test('automatic graduation, childbirth and important Cult Leader milestones celebrate once from changed records', () => {
  const before = cultFixture();
  expect(transition(before, world => { world.people[world.activePersonId].education.qualifications.push({ level: 'degree', field: 'business', year: 2026 }); })).toEqual(['big-success']);
  expect(transition(before, world => { addChild(world, [world.people[world.activePersonId]], 'biological'); })).toEqual(['big-success']);
  const cultWorld = foundCult(before, { headquarters: 'woodland' }), cult = cultWorld.cults[0];
  expect(committedCues(before, { ...cultWorld, revision: before.revision + 1 }, { type: 'resume' })).toEqual(['big-success']);
  const grow = (target: typeof cult, followers: number) => { target.report.gained += followers - target.followers; target.report.followers = followers; target.followers = followers; };
  grow(cult, 99);
  expect(transition(cultWorld, world => grow(world.cults[0], 100))).toEqual(['big-success']);
  grow(cult, 100);
  expect(transition(cultWorld, world => grow(world.cults[0], 101))).toEqual([]);
});

test('ordinary gains, negative stats, automatic payments and restored worlds do not invent result sounds', () => {
  const before = cultFixture();
  expect(transition(before, world => { world.people[world.activePersonId].stats.happiness -= 10; })).toEqual([]);
  expect(transition(before, world => { world.people[world.activePersonId].stats.respect += 1; })).toEqual([]);
  expect(committedCues(before, before, { type: 'advance' })).toEqual([]);
  const after = copyWorld(before); after.revision++; after.ledger.push({ ...before.ledger[0], personId: before.activePersonId, cashDelta: -100n, category: 'living' });
  expect(committedCues(before, after, { type: 'resume' })).toEqual([]);
});

test('a real rejected interview produces error while voluntarily withdrawing the application stays silent', () => {
  let decision: World | undefined, rejected: World | undefined;
  const before = cultFixture(); before.people[before.activePersonId].stats.smarts = 50;
  for (let seed = 1; seed < 100 && !rejected; seed++) {
    const candidate = copyWorld(before); candidate.random.outcomes = seed;
    const interview = resolveCommand(candidate, { type: 'apply-job', roleId: 'retail' });
    const outcome = resolveCommand(interview, { type: 'choose', eventId: interview.pending!.id, choiceId: 'rush' });
    if (!outcome.people[outcome.activePersonId].employment) { decision = interview; rejected = outcome; }
  }
  expect(rejected).toBeDefined();
  const beforeBytes = encodeWorld(decision!), afterBytes = encodeWorld(rejected!);
  expect(committedCues(decision!, rejected!, { type: 'choose', eventId: decision!.pending!.id, choiceId: 'rush' })).toEqual(['error']);
  expect(encodeWorld(decision!)).toBe(beforeBytes); expect(encodeWorld(rejected!)).toBe(afterBytes);
  const withdraw: GameCommand = { type: 'choose', eventId: decision!.pending!.id, choiceId: 'withdraw' };
  expect(committedCues(decision!, resolveCommand(decision!, withdraw), withdraw)).toEqual([]);
});

test('a failed sports challenge uses its settled rating, never its input or restored result', () => {
  const started = startMiniGame(athleteFixture(), 'sports'), session = started.miniGames.at(-1)!;
  const shot: GameCommand = { type: 'mini-game-input', sessionId: session.id, index: 0, input: { at: 1000, action: { type: 'shot', x: 0.5, y: 1, power: 0 } } };
  const missed = resolveCommand(started, shot);
  expect(committedCues(started, missed, shot)).toEqual([]);
  const complete: GameCommand = { type: 'mini-game-complete', sessionId: session.id }, settled = resolveCommand(missed, complete);
  expect(settled.miniGames.at(-1)!.rating).toBe('failed');
  expect(committedCues(missed, settled, complete)).toEqual(['error']);
  expect(committedCues(settled, settled, complete)).toEqual([]);
});

test('major sports awards celebrate changed records; routine project scores do not', () => {
  const before = athleteFixture(), project = before.careers[0].projects[0];
  expect(transition(before, world => { const next = world.careers[0].projects[0]; next.status = 'completed'; next.ended = { ...world.date }; next.award = 'League season trophy'; })).toEqual(['big-success']);
  expect(project.award).toBeNull();
  expect(transition(before, world => { world.careers[0].projects[0].quality = 80; })).toEqual([]);
});

test('death, family loss and hospitalisation stay silent even when a milestone also occurs', () => {
  const before = cultFixture();
  expect(transition(before, world => recordDeath(world, world.activePersonId, 'Controlled test'), { type: 'advance' })).toEqual([]);
  const parentId = before.relationships.find(row => row.from === before.activePersonId && row.roles.includes('parent'))?.to ?? before.relationships.find(row => row.to === before.activePersonId && row.roles.includes('parent'))!.from;
  expect(transition(before, world => { recordDeath(world, parentId, 'Controlled test'); world.people[world.activePersonId].education.qualifications.push({ level: 'degree', field: 'business', year: 2026 }); })).toEqual([]);
  expect(transition(before, world => { world.people[world.activePersonId].health.hospitalizedUntil = 25000; }, { type: 'advance' })).toEqual([]);
});

test('live notifications neither buffer nor replay, and faulty listeners cannot turn successful saving into failure', async () => {
  const listener = jest.fn(); emitGameplayFeedback({ id: 'old', cues: ['big-success'] });
  const unsubscribe = subscribeGameplayFeedback(listener); expect(listener).not.toHaveBeenCalled();
  emitGameplayFeedback({ id: 'fresh', cues: ['purchase'] }); expect(listener).toHaveBeenCalledTimes(1); unsubscribe();
  const context = await setup();
  try {
    const store = createGameStore({ repository: async () => context.repository, id: () => 'unused', date: () => context.store.getState().world!.date, onFeedback: () => { throw Error('audio failure'); } });
    await store.getState().bootstrap(); expect(await store.getState().dispatch(purchase(store.getState().world!))).toBe(true);
    expect(store.getState().error).toBeNull();
  } finally { context.sqlite.close(); }
});
