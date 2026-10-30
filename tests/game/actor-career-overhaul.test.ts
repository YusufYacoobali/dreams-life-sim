import { copyWorld, decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { resolveActor, actorCareer, actorEntryReason, actorOffers, actorOfferReason, actorMonth, actorProductionCost } from '../../src/game/systems/actor';
import type { ActorCommand } from '../../src/game/systems/actorSchemas';
import { endEmployment, workMonth } from '../../src/game/systems/work';
import { startCareerContract, careerPayQuote } from '../../src/game/systems/careers';
import { financialActors } from '../../src/game/systems/households';
import { accountFor } from '../../src/game/systems/common';
import { monthFrom } from '../../src/game/calendar';
import { actorProjectCatalog } from '../../src/game/content/actor';
import { relationFor } from '../../src/game/systems/relationshipQueries';
import { roundRatio } from '../../src/game/money';
import graduate from '../fixtures/v3-employed-graduate.json';
function fixture() {
  const world = decodeWorld(JSON.stringify(graduate)), person = world.people[world.activePersonId], account = accountFor(world);
  endEmployment(world); person.skills.acting = 100; person.stats.health = person.stats.fitness = person.stats.smarts = person.stats.energy = person.stats.discipline = 100;
  account.cash += 100000000n; account.openingCash += 100000000n;
  return world;
}
function drain(input: World) {
  let world = input;
  while (world.pending) {
    if (world.pending.kind !== 'result') throw new Error('Unexpected unit-fixture decision');
    world = resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
  }
  return world;
}
function act(input: World, command: ActorCommand) {
  const world = copyWorld(drain(input)); resolveActor(world, command); return drain(validateWorld(world));
}
function entered(input = fixture()) { return act(input, { type: 'actor-enter' }); }
function booked(input = entered(), category = 'independent-film') {
  let world = copyWorld(input), career = actorCareer(world)!;
  const offer = career.actor!.industry.board.find(item => item.category === category)!; offer.auditionRoll = 1;
  world = act(world, { type: 'actor-audition', offerId: offer.id, quotedAnnualPay: offer.annualPay, negotiate: false });
  return world;
}
function period(input: World) {
  const world = copyWorld(drain(input)); world.date = monthFrom(world.date, 1);
  for (const person of financialActors(world)) { person.stats.energy = 100; workMonth(world, person); person.lastEconomicMonth = world.date.year * 12 + world.date.month - 1; }
  actorMonth(world); return drain(validateWorld(world));
}
test('opting in retains old careers and counters without an invented wage, while an existing active contract cannot be replaced', () => {
  const old = fixture(); startCareerContract(old, 'actor', careerPayQuote(old, 'actor'), old.people[old.activePersonId], false);
  const before = encodeWorld(old); expect(actorEntryReason(old)).toMatch(/existing acting project/); expect(() => resolveActor(old, { type: 'actor-enter' })).toThrow(/existing acting project/); expect(encodeWorld(old)).toBe(before);
  const world = entered(); expect(world.schemaVersion).toBe(50); expect(actorCareer(world)?.status).toBe('between'); expect(world.people[world.activePersonId].employment).toBeNull(); expect(actorOffers(world)).toHaveLength(5);
});
test('five distinct casting types expose different terms and a saved board cannot reroll within the quarter', () => {
  const world = entered(), before = encodeWorld(world), board = actorOffers(world);
  expect(new Set(board.map(item => item.category))).toEqual(new Set(actorProjectCatalog.map(item => item.id)));
  expect(new Set(board.map(item => item.months))).toEqual(new Set([3, 6, 9, 12])); expect(new Set(board.map(item => item.annualPay)).size).toBeGreaterThan(3);
  expect(() => resolveActor(world, { type: 'actor-refresh-offers' })).toThrow(/saved until/); expect(encodeWorld(world)).toBe(before);
});
test('failed casting is saved once, pays nothing, survives JSON cold reopening and refuses a second attempt on that offer', () => {
  const initial = entered(), world = copyWorld(initial), offer = actorOffers(world)[0]; offer.auditionRoll = 100;
  const ledger = world.ledger.length, rng = { ...world.random }, failed = act(world, { type: 'actor-audition', offerId: offer.id, quotedAnnualPay: offer.annualPay, negotiate: false });
  expect(actorCareer(failed)!.actor!.industry.board[0].status).toBe('rejected'); expect(failed.ledger).toHaveLength(ledger); expect(failed.random).toEqual(rng);
  const cold = decodeWorld(encodeWorld(failed)); expect(() => resolveActor(cold, { type: 'actor-audition', offerId: offer.id, quotedAnnualPay: offer.annualPay, negotiate: false })).toThrow(/unattempted/);
});
test('agency commission comes from actual wages once and fixed signed terms survive changing representation', () => {
  let world = act(entered(), { type: 'actor-agency', tier: 'boutique', negotiate: false }); world = booked(world);
  const initialContacts = [...actorCareer(world)!.contacts], projectId = actorCareer(world)!.projects.at(-1)!.id;
  for (let month = 0; month < 3; month++) world = period(world);
  world = act(world, { type: 'actor-agency', tier: 'independent', negotiate: false });
  for (let month = 0; month < 3; month++) world = period(world);
  const career = actorCareer(world)!, project = career.projects.find(item => item.id === projectId)!, meta = project.creative!;
  expect(project.status).toBe('completed'); expect(meta.commissionBps).toBe(1200); expect(meta.commissionPaid).toBe(roundRatio(project.grossEarned * 1200n, 10000n));
  expect(meta.commissionTransactions).toHaveLength(6); expect(career.contacts).toEqual(initialContacts); expect(career.actor!.industry.representation.tier).toBe('independent');
  const rows = world.ledger.filter(row => meta.commissionTransactions.includes(row.id)); expect(rows.reduce((sum, row) => sum - row.cashDelta, 0n)).toBe(meta.commissionPaid);
  const before = encodeWorld(world); actorMonth(world); expect(encodeWorld(world)).toBe(before);
});
test('production choices change preparation, actual quality inputs, relationships and paid costs, and each intervention is bounded', () => {
  let world = booked(), career = actorCareer(world)!, meta = career.projects.at(-1)!.creative!, person = world.people[world.activePersonId];
  const before = accountFor(world).cash, cost = actorProductionCost(world, 'prepare');
  world = act(world, { type: 'actor-production', action: 'prepare' }); expect(accountFor(world).cash).toBe(before - cost);
  career = actorCareer(world)!; meta = career.projects.at(-1)!.creative!; expect(meta.preparation).toBe(75); expect(meta.qualityBonus).toBe(4);
  expect(() => resolveActor(world, { type: 'actor-production', action: 'prepare' })).toThrow(/already made/);
  const coStar = career.actor!.industry.contacts.costar, trust = relationFor(world, person.id, coStar)!.trust;
  world = act(world, { type: 'actor-production', action: 'cooperate' }); expect(relationFor(world, person.id, coStar)!.trust).toBeGreaterThan(trust);
  world = act(world, { type: 'actor-production', action: 'publicity' }); expect(() => resolveActor(world, { type: 'actor-production', action: 'reshoot' })).toThrow(/three optional/);
});
test('critics, audience, awards and actual contractual earnings are separate release facts', () => {
  let world = booked(), career = actorCareer(world)!; career.projects.at(-1)!.responseRoll = 1; career.projects.at(-1)!.creative!.criticRoll = 1;
  world = act(world, { type: 'actor-production', action: 'prepare' }); world = act(world, { type: 'actor-production', action: 'cooperate' });
  for (let month = 0; month < 6; month++) world = period(world);
  career = actorCareer(world)!; const project = career.projects.at(-1)!, release = project.creative!.release!;
  expect(release.critical).toBeGreaterThan(release.audience); expect(release.nomination).toBe(true); expect(project.award).toBe('Lantern Acting Award'); expect(career.actor!.credits).toBe(1); expect(career.actor!.awards).toBe(1);
  const history = world.workHistory.find(item => item.id === project.employmentId)!; expect(project.grossEarned).toBe(history.grossEarned); expect(world.ledger.filter(row => row.category === 'career-royalties')).toHaveLength(0);
});
test('signed active work and all paid history survive resignation; new employment cannot masquerade as a completed release', () => {
  let world = period(booked()); const career = actorCareer(world)!, amount = career.projects.at(-1)!.grossEarned;
  endEmployment(world); expect(career.projects.at(-1)!.status).toBe('cancelled'); expect(career.projects.at(-1)!.grossEarned).toBe(amount); expect(career.projects.at(-1)!.creative!.release).toBeNull();
  expect(career.actor!.credits).toBe(0); expect(() => validateWorld(world)).not.toThrow();
});
test('moving country requires a new-currency board and returning restores the same failed offer instead of rerolling', () => {
  let world = entered(); const offer = actorOffers(world)[0]; offer.auditionRoll = 100;
  world = act(world, { type: 'actor-audition', offerId: offer.id, quotedAnnualPay: offer.annualPay, negotiate: false });
  const saved = actorOffers(world).map(item => ({ ...item })), person = world.people[world.activePersonId];
  // Unit crossing of the board boundary: the actual relocation flow has separate integration coverage.
  person.country = 'GB'; person.city = 'London'; expect(actorOfferReason(world, actorOffers(world)[1])).toMatch(/moving country/);
  resolveActor(world, { type: 'actor-refresh-offers' }); expect(actorCareer(world)!.currency).toBe('GBP');
  person.country = 'US'; person.city = 'New York'; resolveActor(world, { type: 'actor-refresh-offers' }); expect(actorOffers(world)).toEqual(saved);
});

test('a two-year career can lose representation through actual failed releases and earn a craft-led comeback', () => {
  let world = act(entered(), { type: 'actor-agency', tier: 'boutique', negotiate: false });
  const contacts = [...actorCareer(world)!.contacts];
  for (let production = 0; production < 3; production++) {
    const career = actorCareer(world)!;
    if (career.actor!.industry.boardSeason !== Math.floor((world.date.year * 12 + world.date.month - 1) / 3)) world = act(world, { type: 'actor-refresh-offers' });
    world.people[world.activePersonId].skills.acting = 40; world.people[world.activePersonId].stats.discipline = 0;
    world = booked(world); const current = actorCareer(world)!.projects.at(-1)!;
    world.people[world.activePersonId].employment!.performance = 0; current.creative!.criticRoll = 100; current.creative!.audienceRoll = 100;
    for (let month = 0; month < 6; month++) world = period(world);
    expect(actorCareer(world)!.projects.at(-1)!.creative!.release!.commercial).toBe('flop');
  }
  let career = actorCareer(world)!;
  expect(career.actor!.industry.representation.tier).toBe('independent'); expect(career.actor!.collapseCount).toBe(1); expect(career.actor!.industry.milestones).toContain('career-collapse');
  world = act(world, { type: 'actor-refresh-offers' }); world.people[world.activePersonId].skills.acting = 100; world.people[world.activePersonId].stats.discipline = 100;
  world = act(world, { type: 'actor-style', style: 'craft' }); world = booked(world, 'theatre');
  career = actorCareer(world)!; career.projects.at(-1)!.creative!.criticRoll = 1; world.people[world.activePersonId].employment!.performance = 100;
  world = act(world, { type: 'actor-production', action: 'prepare' }); world = act(world, { type: 'actor-production', action: 'cooperate' });
  for (let month = 0; month < 3; month++) world = period(world);
  career = actorCareer(world)!;
  expect(world.date.year).toBeGreaterThan(2023); expect(career.actor!.credits).toBe(4); expect(career.actor!.comeback).toBe(true); expect(career.actor!.industry.milestones).toContain('comeback');
  expect(career.contacts).toEqual(contacts); expect(career.actor!.industry.representation.history.some(row => row.reason === 'Representation ended after repeated failed contracts')).toBe(true);
});

test('higher representation and actual reputation unlock studio and series roles, while director relationships can close them again', () => {
  let world = entered(), career = actorCareer(world)!, studio = actorOffers(world).find(offer => offer.category === 'studio-film')!;
  expect(actorOfferReason(world, studio)).toMatch(/reputation/);
  career.reputation = 70; world = act(world, { type: 'actor-agency', tier: 'boutique', negotiate: false });
  career = actorCareer(world)!; studio = actorOffers(world).find(offer => offer.category === 'studio-film')!; expect(actorOfferReason(world, studio)).toBeUndefined();
  relationFor(world, world.activePersonId, career.actor!.industry.contacts.director)!.trust = 0;
  expect(actorOfferReason(world, studio)).toMatch(/director/);
});

test('a stunt failure creates a real injury and consumes the saved intervention instead of rerolling', () => {
  let world = booked(), career = actorCareer(world)!; career.projects.at(-1)!.creative!.audienceRoll = 100;
  const prior = world.people[world.activePersonId].stats.health;
  world = act(world, { type: 'actor-production', action: 'stunt' });
  expect(world.people[world.activePersonId].stats.health).toBeLessThan(prior); expect(world.people[world.activePersonId].health.conditions.some(condition => condition.type === 'sprain' && condition.status === 'active')).toBe(true);
  expect(() => resolveActor(world, { type: 'actor-production', action: 'stunt' })).toThrow(/already made/);
});

test('returning after leaving retains existing credits, agency, failed board and saved RNG instead of resetting the career', () => {
  let world = entered(), career = actorCareer(world)!;
  career.actor!.industry.board[0].status = 'rejected'; career.actor!.industry.milestones.push('first-role');
  career.status = 'left'; career.ended = { ...world.date };
  const saved = JSON.stringify(career.actor, (_, value) => typeof value === 'bigint' ? value.toString() : value), random = { ...world.random };
  world = act(world, { type: 'actor-enter' }); career = actorCareer(world)!;
  expect(career.status).toBe('between'); expect(JSON.stringify(career.actor, (_, value) => typeof value === 'bigint' ? value.toString() : value)).toBe(saved); expect(world.random).toEqual(random);
});

test('production costs retain the signed contract country and currency after the player moves', () => {
  const world = booked(), before = actorProductionCost(world, 'reshoot');
  world.people[world.activePersonId].country = 'JP'; world.people[world.activePersonId].city = 'Tokyo';
  expect(actorProductionCost(world, 'reshoot')).toBe(before); expect(actorCareer(world)!.currency).toBe('USD');
});

test('import validation rejects invented acting awards/credits and malformed cached country boards', () => {
  const world = entered(), forged = copyWorld(world); actorCareer(forged)!.actor!.credits = 99;
  expect(() => validateWorld(forged)).toThrow(/acting career progression/);
  const cached = copyWorld(world), state = actorCareer(cached)!.actor!;
  state.savedBoards.push({ country: 'GB', season: state.industry.boardSeason, offers: [{ ...state.industry.board[0], category: 'invented-genre' }] });
  expect(() => validateWorld(cached)).toThrow(/cached acting/);
});
