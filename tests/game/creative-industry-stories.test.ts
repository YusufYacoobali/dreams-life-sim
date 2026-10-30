import { copyWorld, decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { actorStories, actorActionStories } from '../../src/game/content/actorStories';
import { modelCareerStories, modelActionStories } from '../../src/game/content/modelCareerStories';
import { offerCreativeStory } from '../../src/game/systems/creativeEvents';
import { creativeMonthNumber, type CreativeKind } from '../../src/game/systems/creativeSchemas';
import { getIndustry, creativeOfferReason } from '../../src/game/systems/creativeCore';
import { actorMonth } from '../../src/game/systems/actor';
import { modelCareerMonth, modelPortfolioQuote } from '../../src/game/systems/modelCareer';
import { endEmployment, workMonth } from '../../src/game/systems/work';
import { financialActors } from '../../src/game/systems/households';
import { relationFor } from '../../src/game/systems/relationshipQueries';
import { active, accountFor, availableCash, charge } from '../../src/game/systems/common';
import { monthFrom } from '../../src/game/calendar';
import { monthlyAmount, rules } from '../../src/game/rules';
import { roundRatio } from '../../src/game/money';
import { createGameStore } from '../../src/state/gameStore';
import { SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';
import graduate from '../fixtures/v3-employed-graduate.json';

const career = (world: World, kind: CreativeKind) => world.careers.find(item => item.personId === world.activePersonId && item.kind === kind)!;
const industry = (world: World, kind: CreativeKind) => getIndustry(career(world, kind))!;
function foundation(offset = 2) {
  const world = decodeWorld(JSON.stringify(graduate)), person = active(world), bank = accountFor(world);
  endEmployment(world); world.date = monthFrom(world.date, offset); person.born.year -= 5;
  person.skills.acting = person.skills.modeling = 100;
  person.stats.health = person.stats.energy = person.stats.fitness = person.stats.smarts = person.stats.discipline = 100;
  bank.cash += 100000000n; bank.openingCash += 100000000n;
  return world;
}
function drain(input: World) {
  let world = input;
  while (world.pending) {
    if (world.pending.kind !== 'result') throw new Error('Resolve the authored decision explicitly');
    world = resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
  }
  return world;
}
const act = (input: World, command: GameCommand) => drain(resolveCommand(drain(input), command));
function entered(kind: CreativeKind, offset = 2) { return act(foundation(offset), { type: kind === 'actor' ? 'actor-enter' : 'model-enter' }); }
function represented(input: World, kind: CreativeKind) { return act(input, { type: kind === 'actor' ? 'actor-agency' : 'model-agency', tier: 'boutique', negotiate: false }); }
function booked(input: World, kind: CreativeKind, category = kind === 'actor' ? 'independent-film' : 'editorial') {
  const world = copyWorld(input), offer = industry(world, kind).board.find(item => item.category === category)!;
  // Selection itself has separate deterministic tests; isolate the story in an actually signed contract.
  offer.auditionRoll = 1;
  return act(world, kind === 'actor' ? { type: 'actor-audition', offerId: offer.id, quotedAnnualPay: offer.annualPay, negotiate: false } : { type: 'model-casting', offerId: offer.id, quotedAnnualPay: offer.annualPay });
}
function period(input: World) {
  const world = copyWorld(drain(input)); world.date = monthFrom(world.date, 1);
  for (const person of financialActors(world)) { person.stats.energy = 100; workMonth(world, person); person.lastEconomicMonth = creativeMonthNumber(world); }
  actorMonth(world); modelCareerMonth(world);
  return drain(validateWorld(world));
}
function targetStory(input: World, kind: CreativeKind, id: string, action = false) {
  const world = copyWorld(input), state = industry(world, kind);
  const pool = kind === 'actor' ? action ? actorActionStories : actorStories : action ? modelActionStories : modelCareerStories;
  expect(pool.some(story => story.id === id)).toBe(true);
  // Control the prior-seen catalogue only; offering, bound choices and effects remain real gameplay.
  state.seenStories = pool.filter(story => story.id !== id).map(story => story.id);
  offerCreativeStory(world, career(world, kind), action);
  return validateWorld(world);
}
function answer(input: World, id: string) {
  const pending = input.pending!; expect(pending.kind).toBe('decision');
  return resolveCommand(input, { type: 'choose', eventId: pending.id, choiceId: id });
}

test('agent-only and completed-credit stories cannot invent representation or a comeback history', () => {
  const independent = targetStory(entered('actor'), 'actor', 'actor-agency-warning');
  expect(independent.pending?.kind === 'decision' && independent.pending.templateId).not.toBe('creative-actor-agency-warning');
  const withAgent = targetStory(represented(entered('actor'), 'actor'), 'actor', 'actor-agency-warning');
  expect(withAgent.pending?.kind).toBe('decision'); expect(withAgent.pending!.id).toBe(industry(withAgent, 'actor').decision!.id);
  const noCredits = targetStory(entered('actor'), 'actor', 'actor-comeback-label');
  expect(noCredits.pending?.kind === 'decision' && noCredits.pending.templateId).not.toBe('creative-actor-comeback-label');
  const representedNoCredits = targetStory(represented(entered('actor'), 'actor'), 'actor', 'actor-comeback-label');
  expect(representedNoCredits.pending?.kind === 'decision' && representedNoCredits.pending.templateId).not.toBe('creative-actor-comeback-label');
});

test('a genuine pair of completed theatre contracts makes the credit-gated comeback proposal eligible', () => {
  let world = represented(entered('actor'), 'actor');
  for (let job = 0; job < 2; job++) {
    if (industry(world, 'actor').boardSeason !== Math.floor(creativeMonthNumber(world) / 3)) world = act(world, { type: 'actor-refresh-offers' });
    world = booked(world, 'actor', 'theatre');
    for (let month = 0; month < 3; month++) world = period(world);
  }
  expect(industry(world, 'actor').completed).toBe(2);
  expect(creativeMonthNumber(world) % 6).toBe(2);
  world = targetStory(world, 'actor', 'actor-comeback-label');
  expect(world.pending?.kind === 'decision' && world.pending.templateId).toBe('creative-actor-comeback-label');
});

test('working incidents need an actual new production and bind persistent named contacts and its real title', () => {
  const between = targetStory(entered('actor'), 'actor', 'actor-stolen-close-up');
  expect(between.pending?.kind === 'decision' && between.pending.templateId).not.toBe('creative-actor-stolen-close-up');
  const world = targetStory(booked(entered('actor'), 'actor'), 'actor', 'actor-stolen-close-up'), state = industry(world, 'actor');
  const event = world.pending!; expect(event.kind).toBe('decision');
  expect(event.body).not.toMatch(/\{(?:contact|project)\}/); expect(event.body).toContain(world.people[state.contacts.costar].firstName);
  expect(event.kind === 'decision' && event.personIds).toEqual([world.activePersonId, state.contacts.costar]);
  expect(state.decision!.projectId).toBe(career(world, 'actor').projects.find(project => project.status === 'active')!.id);
});

test.each(['actor', 'model'] as const)('%s emits at most two significant situations per year and resolves each at the offered moment', kind => {
  let world = entered(kind, 0); const startYear = world.date.year, counts = new Map<number, number>();
  for (let month = 0; month < 24; month++) {
    world = copyWorld(world); world.date = monthFrom({ year: startYear, month: 1, day: 1 }, month);
    offerCreativeStory(world, career(world, kind));
    if (world.pending?.kind === 'decision') {
      const offeredAt = { ...world.date }, before = industry(world, kind).decisionCount;
      counts.set(world.date.year, (counts.get(world.date.year) ?? 0) + 1);
      expect(() => resolveCommand(world, { type: 'advance' })).toThrow(/current event/);
      // Repeated monthly registration cannot duplicate the still-pending offer.
      offerCreativeStory(world, career(world, kind)); expect(industry(world, kind).decisionCount).toBe(before);
      const choice = world.pending.choices.find(item => !choiceUnavailable(world, item))!;
      world = answer(world, choice.id); expect(world.date).toEqual(offeredAt); expect(industry(world, kind).decision).toBeNull();
      expect(world.pending?.kind).toBe('result'); expect(world.deferred.filter(item => item.event.kind === 'decision' && item.event.templateId.startsWith('creative-'))).toHaveLength(0);
      world = drain(world); offerCreativeStory(world, career(world, kind)); expect(world.pending).toBeNull();
    }
  }
  expect([...counts.values()]).toEqual([2, 2]);
  expect(industry(world, kind).decisionCount).toBe(4);
});

test.each(['actor', 'model'] as const)('%s narrative fee amendments affect future wages without rewriting paid receipts', kind => {
  let world = period(booked(entered(kind, 1), kind));
  const id = kind === 'actor' ? 'actor-awful-screenplay' : 'model-more-than-one-season', option = kind === 'actor' ? 'sell' : 'paid-scope', bps = kind === 'actor' ? 500 : 850;
  world = targetStory(world, kind, id);
  const beforeLedger = world.ledger.map(row => ({ ...row })), projectId = career(world, kind).projects.at(-1)!.id, paid = career(world, kind).projects.at(-1)!.grossEarned;
  const annual = active(world).employment!.annualPay, lifetime = active(world).finance.lifetimeGross;
  world = answer(world, option);
  const agreed = roundRatio(annual * BigInt(10000 + bps), 10000n);
  expect(active(world).employment!.annualPay).toBe(agreed); expect(world.ledger).toEqual(beforeLedger);
  expect(career(world, kind).projects.find(project => project.id === projectId)!.grossEarned).toBe(paid); expect(active(world).finance.lifetimeGross).toBe(lifetime);
  const expectedNextPay = monthlyAmount(agreed, active(world).employment!.paidMonths);
  world = period(world); expect(career(world, kind).projects.find(project => project.id === projectId)!.grossEarned - paid).toBe(expectedNextPay);
  expect(world.ledger.slice(0, beforeLedger.length)).toEqual(beforeLedger);
});

test('a commission audit costs real money and amends future contracts, while signed commission and prior deductions stay fixed', () => {
  let world = period(booked(represented(entered('actor', 1), 'actor'), 'actor'));
  const oldProjectId = career(world, 'actor').projects.at(-1)!.id, cash = accountFor(world).cash, repRate = industry(world, 'actor').representation.commissionBps;
  world = targetStory(world, 'actor', 'actor-commission-envelope');
  const paid = career(world, 'actor').projects.at(-1)!.creative!.commissionPaid, beforeLedger = world.ledger.map(row => ({ ...row }));
  world = answer(world, 'audit');
  expect(industry(world, 'actor').representation.commissionBps).toBe(repRate - 200);
  const signed = career(world, 'actor').projects.find(project => project.id === oldProjectId)!;
  expect(signed.creative!.commissionBps).toBe(repRate); expect(signed.creative!.commissionPaid).toBe(paid);
  expect(accountFor(world).cash).toBe(cash - roundRatio(rules[active(world).country].baseWage * 160n, 10000n));
  expect(world.ledger.slice(0, beforeLedger.length)).toEqual(beforeLedger);
  world = period(world);
  const continuing = career(world, 'actor').projects.find(project => project.id === oldProjectId)!;
  expect(continuing.creative!.commissionPaid).toBe(roundRatio(continuing.grossEarned * BigInt(repRate), 10000n));
  world = act(world, { type: 'leave-career', careerId: career(world, 'actor').id });
  world = act(world, { type: 'actor-refresh-offers' }); world = booked(world, 'actor');
  expect(career(world, 'actor').projects.at(-1)!.creative!.commissionBps).toBe(repRate - 200);
});

test('actor choices change real co-star trust, quality and reputation without generating replacement NPCs', () => {
  const before = targetStory(booked(entered('actor'), 'actor'), 'actor', 'actor-stolen-close-up');
  const contact = industry(before, 'actor').contacts.costar, relation = relationFor(before, before.activePersonId, contact)!, trust = relation.trust, strength = relation.strength;
  const people = Object.keys(before.people), bonus = career(before, 'actor').projects.at(-1)!.creative!.qualityBonus, reputation = career(before, 'actor').reputation;
  const resolved = answer(before, 'document');
  expect(relationFor(resolved, resolved.activePersonId, contact)!.trust).toBe(trust - 12); expect(relationFor(resolved, resolved.activePersonId, contact)!.strength).toBe(strength - 12);
  expect(relationFor(resolved, resolved.activePersonId, contact)!.memories).toContain('industry:actor-stolen-close-up:' + before.date.year);
  expect(career(resolved, 'actor').projects.at(-1)!.creative!.qualityBonus).toBe(bonus + 9); expect(career(resolved, 'actor').reputation).toBe(reputation + 3);
  expect(Object.keys(resolved.people)).toEqual(people);
});

test('a model preparation incident changes the matching portfolio, actual designer relationship, quality and available cash', () => {
  const before = targetStory(booked(entered('model'), 'model'), 'model', 'model-action-double-brief', true), state = career(before, 'model').modelCareer!;
  const portfolio = state.portfolio.editorial, contact = state.industry.contacts.designer, trust = relationFor(before, before.activePersonId, contact)!.trust, cash = accountFor(before).cash;
  const resolved = answer(before, 'prototype');
  expect(career(resolved, 'model').modelCareer!.portfolio.editorial).toBe(portfolio + 6); expect(relationFor(resolved, resolved.activePersonId, contact)!.trust).toBe(trust + 6);
  expect(career(resolved, 'model').projects.at(-1)!.creative!.qualityBonus).toBe(5); expect(accountFor(resolved).cash).toBe(cash - roundRatio(rules[active(before).country].baseWage * 40n, 10000n));
});

test('leaving an agency through a story closes its history while preserving the current signed commission and earned payments', () => {
  const before = targetStory(booked(represented(entered('actor'), 'actor'), 'actor'), 'actor', 'actor-commission-envelope');
  const signed = career(before, 'actor').projects.at(-1)!.creative!.commissionBps, oldLedger = [...before.ledger];
  const resolved = answer(before, 'fire'), representation = industry(resolved, 'actor').representation;
  expect(representation.tier).toBe('independent'); expect(representation.agentId).toBeNull(); expect(representation.commissionBps).toBe(0);
  expect(representation.history.at(-1)!.ended).toEqual(before.date); expect(representation.history.at(-1)!.reason).toBe('Administration, apparently');
  expect(career(resolved, 'actor').projects.at(-1)!.creative!.commissionBps).toBe(signed); expect(resolved.ledger).toEqual(oldLedger);
});

test('an unaffordable response is refused before mutation while a free authored alternative still resolves', () => {
  let world = booked(entered('actor'), 'actor'); world = copyWorld(world);
  charge(world, availableCash(accountFor(world)), 'career-industry-cost', 'Earlier preparation expense');
  world = targetStory(world, 'actor', 'actor-private-coaching'); const event = world.pending!;
  if (event.kind !== 'decision') throw new Error('Expected authored decision');
  const before = encodeWorld(world), paidChoice = event.choices.find(choice => choice.id === 'coach')!, free = event.choices.find(choice => choice.id === 'simplify')!;
  expect(choiceUnavailable(world, paidChoice)).toMatch(/balance/); expect(choiceUnavailable(world, free)).toBeUndefined();
  expect(() => answer(world, 'coach')).toThrow(/balance/); expect(encodeWorld(world)).toBe(before);
  const resolved = answer(world, 'simplify'); expect(industry(resolved, 'actor').decision).toBeNull(); expect(accountFor(resolved).cash).toBe(accountFor(world).cash);
});

test('a first-refusal story imposes a bounded, actual restriction on new casting', () => {
  const before = targetStory(booked(represented(entered('actor'), 'actor'), 'actor'), 'actor', 'actor-restrictive-deal');
  let resolved = answer(before, 'accept'); const state = industry(resolved, 'actor');
  expect(state.bookingHoldUntil).toBeGreaterThan(creativeMonthNumber(resolved)); expect(state.bookingHoldUntil).toBeLessThanOrEqual(creativeMonthNumber(resolved) + 12);
  const unattempted = state.board.find(offer => offer.status === 'open')!;
  expect(creativeOfferReason(resolved, career(resolved, 'actor'), unattempted)).toMatch(/first-refusal/);
  // Work completes normally, and a dated hold must eventually permit real new casting.
  const hold = state.bookingHoldUntil;
  while (creativeMonthNumber(resolved) <= hold) resolved = period(resolved);
  resolved = act(resolved, { type: 'actor-refresh-offers' });
  const next = industry(resolved, 'actor').board.find(offer => offer.category === 'independent-film')!;
  expect(career(resolved, 'actor').status).toBe('between');
  expect(creativeOfferReason(resolved, career(resolved, 'actor'), next)).toBeUndefined();
});

test('brand story amendments change agreed obligations rather than pretending to fulfil appearances', () => {
  let world = copyWorld(entered('model')); career(world, 'model').reputation = 60;
  world = act(world, { type: 'model-portfolio', specialisation: 'commercial', style: 'professional', quotedCost: modelPortfolioQuote(world, 'professional') });
  world = represented(world, 'model'); world = booked(world, 'model', 'ambassador');
  world = targetStory(world, 'model', 'model-clear-the-calendar');
  const before = career(world, 'model').modelCareer!.brands[0], agreed = before.obligations, fulfilled = before.fulfilled;
  const resolved = answer(world, 'exclusive'), brand = career(resolved, 'model').modelCareer!.brands[0];
  expect(brand.obligations).toBe(agreed + 2); expect(brand.fulfilled).toBe(fulfilled); expect(brand.obligations).toBeLessThanOrEqual(12);
});

test('a saved story retry and cold reopening retain the bound choice, exact result, RNG and one real payment', async () => {
  const world = targetStory(booked(entered('actor'), 'actor'), 'actor', 'actor-private-coaching'), pending = world.pending!;
  const selected = { type: 'choose', eventId: pending.id, choiceId: 'coach' } as const, expected = resolveCommand(world, selected), random = { ...world.random };
  const db = database(), repository = new SaveRepository(db.driver); await repository.initialise(); await repository.create(world);
  try {
    const store = createGameStore({ repository: async () => repository, date: () => world.date, id: () => 'unused-story-id' }); await store.getState().bootstrap();
    const original = await repository.export(world.id);
    db.sqlite.exec("CREATE TRIGGER fail_industry_story BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    expect(await store.getState().dispatch(selected)).toBe(false); expect(await repository.export(world.id)).toBe(original); expect(store.getState().world!.pending).toEqual(pending);
    db.sqlite.exec('DROP TRIGGER fail_industry_story'); expect(await store.getState().dispatch(selected)).toBe(true);
    expect(encodeWorld(store.getState().world!)).toBe(encodeWorld(expected)); expect(store.getState().world!.random).toEqual(random);
    const cold = createGameStore({ repository: async () => repository, date: () => world.date, id: () => 'unused-cold-story-id' }); await cold.getState().bootstrap();
    expect(encodeWorld(cold.getState().world!)).toBe(encodeWorld(expected)); expect(cold.getState().world!.pending?.kind).toBe('result'); expect(industry(cold.getState().world!, 'actor').decision).toBeNull();
    const after = await repository.export(world.id); expect(await cold.getState().dispatch(selected)).toBe(false); expect(await repository.export(world.id)).toBe(after);
    expect(cold.getState().world!.ledger.filter(row => row.category === 'career-industry-cost')).toHaveLength(1);
  } finally { db.sqlite.close(); }
});


test('an exhausted eligible story pool rotates a bounded recent window instead of stopping long careers', () => {
  for (const kind of ['actor', 'model'] as const) {
    let world = copyWorld(entered(kind)); const state = industry(world, kind);
    const catalogue = kind === 'actor' ? actorStories : modelCareerStories;
    // Isolate catalogue exhaustion; the existing multi-year journeys exercise natural play.
    state.seenStories = catalogue.map(story => story.id); state.decisionCount = catalogue.length;
    const random = { ...world.random };
    offerCreativeStory(world, career(world, kind));
    expect(world.pending?.kind).toBe('decision');
    const firstId = industry(world, kind).decision!.storyId;
    expect(catalogue.some(story => story.id === firstId)).toBe(true);
    expect(industry(world, kind).seenStories.length).toBeLessThanOrEqual(5);
    expect(industry(world, kind).seenStories).toContain(firstId);
    expect(world.random).toEqual(random);
    if (world.pending?.kind !== 'decision') throw new Error('Expected a rotated industry decision');
    const choice = world.pending.choices.find(item => !choiceUnavailable(world, item))!;
    world = drain(answer(world, choice.id)); world = copyWorld(world); world.date = monthFrom(world.date, 6);
    offerCreativeStory(world, career(world, kind));
    expect(world.pending?.kind).toBe('decision'); expect(industry(world, kind).decision!.storyId).not.toBe(firstId);
    expect(industry(world, kind).seenStories.length).toBeLessThanOrEqual(26);
    expect(new Set(industry(world, kind).seenStories).size).toBe(industry(world, kind).seenStories.length);
    expect(() => validateWorld(world)).not.toThrow();
  }
});

test('cold reopening a pending choice preserves quoted cost, impact, contact and prose after live authoring changes', () => {
  let base = copyWorld(booked(entered('actor'), 'actor'));
  const story = actorStories.find(item => item.id === 'actor-private-coaching')!, choice = story.choices.find(item => item.id === 'coach')!;
  const impact = { ...choice.impact }, result = choice.result, journal = choice.journal, title = story.title, contact = story.contact;
  const quoted = roundRatio(rules[active(base).country].baseWage * BigInt(impact.costBps!), 10000n);
  charge(base, availableCash(accountFor(base)) - quoted, 'career-industry-cost', 'Earlier preparation budget');
  base = targetStory(base, 'actor', story.id);
  const serialized = encodeWorld(base), pending = base.pending!;
  if (pending.kind !== 'decision') throw new Error('Expected the bound coaching decision');
  const savedChoice = pending.choices.find(item => item.id === 'coach')!, expected = answer(decodeWorld(serialized), 'coach');
  const effect = savedChoice.effects[0]; if (effect.kind !== 'creative-choice') throw new Error('Expected a sealed industry effect');
  expect(effect.snapshot.version).toBe(2); expect(effect.snapshot.cost.minor).toBe(quoted); expect(effect.snapshot.impact).toEqual(impact);
  try {
    // This represents a later content/balance release. Nothing already offered may be rebound.
    choice.impact.costBps = 9900; choice.impact.quality = -40; choice.impact.reputation = -50; choice.impact.relationship = -90;
    choice.result = 'A replacement result for future offers only.'; choice.journal = 'I read a later catalogue journal that must not replace my saved words.';
    story.title = 'Replacement authoring title'; story.contact = 'rival';
    const cold = decodeWorld(serialized), offered = cold.pending!;
    if (offered.kind !== 'decision') throw new Error('Expected the saved decision after cold reopening');
    const original = offered.choices.find(item => item.id === 'coach')!;
    expect(choiceUnavailable(cold, original)).toBeUndefined();
    expect(cold.pending).toEqual(pending);
    const resolved = answer(cold, 'coach');
    expect(encodeWorld(resolved)).toBe(encodeWorld(expected));
    expect(accountFor(resolved).cash).toBe(0n);
    expect(resolved.pending?.kind === 'result' && resolved.pending.body).toBe(savedChoice.resultBody);
    expect(resolved.journal.at(-1)!.text).toBe(savedChoice.journal);
    expect(career(resolved, 'actor').projects.at(-1)!.creative!.qualityBonus).toBe(impact.quality);
    expect(resolved.ledger.at(-1)!.description).toBe(title);
    expect(industry(resolved, 'actor').decision).toBeNull();
  } finally {
    for (const key of Object.keys(choice.impact)) delete choice.impact[key as keyof typeof choice.impact];
    Object.assign(choice.impact, impact); choice.result = result; choice.journal = journal; story.title = title; story.contact = contact;
  }
});
