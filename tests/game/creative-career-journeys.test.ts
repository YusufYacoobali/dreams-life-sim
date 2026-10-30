import { decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { recordDeath, resolveCommand, type GameCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { endEmployment, workMonth } from '../../src/game/systems/work';
import { accountFor } from '../../src/game/systems/common';
import { creativeMonthNumber } from '../../src/game/systems/creativeSchemas';
import { actorMonth, actorOfferReason, actorProductionReason } from '../../src/game/systems/actor';
import { modelCareerMonth, modelOfferReason, modelPortfolioQuote, modelPortfolioReason, modelProductionReason, modelBrandReason, modelBrandQuote } from '../../src/game/systems/modelCareer';
import { monthFrom } from '../../src/game/calendar';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import graduate from '../fixtures/v3-employed-graduate.json';

type Kind = 'actor' | 'model';
type Strategy = 'craft' | 'popular';
function career(world: World, kind: Kind) { return world.careers.find(item => item.personId === world.activePersonId && item.kind === kind)!; }
function industry(world: World, kind: Kind) { const recorded = career(world, kind); return kind === 'actor' ? recorded.actor!.industry : recorded.modelCareer!.industry; }
function foundation() {
  const world = decodeWorld(JSON.stringify(graduate)), person = world.people[world.activePersonId]; endEmployment(world); person.born.year -= 5;
  person.stats.health = person.stats.fitness = person.stats.smarts = person.stats.energy = person.stats.discipline = 100;
  person.skills.acting = person.skills.modeling = 100;
  const account = accountFor(world); account.cash += 100000000n; account.openingCash += 100000000n;
  return world;
}
function respond(input: World, strategy: Strategy) {
  const event = input.pending!;
  if (event.kind === 'result') return resolveCommand(input, { type: 'acknowledge', resultId: event.id });
  const choices = event.choices.filter(choice => !choiceUnavailable(input, choice));
  expect(choices.length).toBeGreaterThan(0);
  return resolveCommand(input, { type: 'choose', eventId: event.id, choiceId: (strategy === 'craft' ? choices[0] : choices.at(-1)!).id });
}
function optionalStep(world: World, kind: Kind, strategy: Strategy): GameCommand | null {
  const recorded = career(world, kind), state = industry(world, kind), quarter = Math.floor(creativeMonthNumber(world) / 3), person = world.people[world.activePersonId];
  const agencyKey = person.id + ':' + kind + ':agency:' + quarter;
  if (state.representation.tier === 'independent' && recorded.reputation >= 30 && !world.actionCounts[agencyKey]) return { type: kind === 'actor' ? 'actor-agency' : 'model-agency', tier: 'boutique', negotiate: strategy === 'craft' };
  if (kind === 'model') {
    const focus = strategy === 'craft' ? 'editorial' : 'commercial';
    if (!modelPortfolioReason(world, focus, 'professional')) return { type: 'model-portfolio', specialisation: focus, style: 'professional', quotedCost: modelPortfolioQuote(world, 'professional') };
    const brand = recorded.modelCareer!.brands.find(item => item.status === 'active' && !modelBrandReason(world, item, 'fulfil'));
    if (brand) return { type: 'model-brand', brandId: brand.id, action: 'fulfil', quotedCost: modelBrandQuote(world, brand, 'fulfil') };
  }
  const project = recorded.projects.find(item => item.status === 'active');
  if (project) {
    if (kind === 'actor' && !actorProductionReason(world, strategy === 'craft' ? 'prepare' : 'publicity')) return { type: 'actor-production', action: strategy === 'craft' ? 'prepare' : 'publicity' };
    if (kind === 'model' && !modelProductionReason(world, project.id, strategy === 'craft' ? 'prepare' : 'publicity')) return { type: 'model-production', projectId: project.id, action: strategy === 'craft' ? 'prepare' : 'publicity' };
    return null;
  }
  if (state.boardSeason < quarter) return { type: kind === 'actor' ? 'actor-refresh-offers' : 'model-refresh-offers' };
  const offers = state.board.filter(offer => !(kind === 'actor' ? actorOfferReason(world, offer) : modelOfferReason(world, offer)));
  offers.sort((a, b) => strategy === 'craft' ? b.prestige - a.prestige : b.annualPay > a.annualPay ? 1 : b.annualPay < a.annualPay ? -1 : 0);
  const offer = offers[0];
  if (!offer) return null;
  return kind === 'actor' ? { type: 'actor-audition', offerId: offer.id, quotedAnnualPay: offer.annualPay, negotiate: strategy === 'craft' } : { type: 'model-casting', offerId: offer.id, quotedAnnualPay: offer.annualPay };
}
function completePlanning(input: World, kind: Kind, strategy: Strategy) {
  let world = input;
  for (let guard = 0; guard < 80; guard++) {
    if (world.pending) { world = respond(world, strategy); continue; }
    const command = optionalStep(world, kind, strategy);
    if (!command) return world;
    world = resolveCommand(world, command);
  }
  throw new Error('Creative planning did not stop after bounded optional choices');
}
function resumeAnnual(input: World, kind: Kind, strategy: Strategy) {
  let world = input;
  for (let guard = 0; guard < 300 && (world.pending || world.annual); guard++) {
    if (world.pending) world = respond(world, strategy);
    else if (world.annual?.pausedForPlanning) { world = completePlanning(world, kind, strategy); if (!world.pending && world.annual) world = resolveCommand(world, { type: 'resume' }); }
    else world = resolveCommand(world, { type: 'resume' });
  }
  expect(world.pending).toBeNull(); expect(world.annual).toBeNull(); return world;
}

function finishYear(input: World, kind: Kind, strategy: Strategy) { return resumeAnnual(resolveCommand(input, { type: 'advance' }), kind, strategy); }

test.each([['actor', 'craft'], ['actor', 'popular'], ['model', 'craft'], ['model', 'popular']] as const)('three actual years of %s with %s decisions retain real contracts, wages and named industry history', (kind, strategy) => {
  let world = foundation(), openingIncome = world.ledger.filter(row => row.personId === world.activePersonId && row.category === 'income').reduce((sum, row) => sum + row.cashDelta, 0n);
  world = resolveCommand(world, { type: 'health-routine', routine: { exercise: 'walking', diet: 'balanced', sleep: 'restful', mindfulness: true, smoking: false, drinking: 'none' } });
  while (world.pending) world = respond(world, strategy);
  world = resolveCommand(world, { type: kind === 'actor' ? 'actor-enter' : 'model-enter' });
  while (world.pending) world = respond(world, strategy);
  if (kind === 'actor') world = resolveCommand(world, { type: 'actor-style', style: strategy });
  else world = resolveCommand(world, { type: 'model-specialise', specialisations: strategy === 'craft' ? ['editorial', 'runway'] : ['commercial', 'lifestyle'] });
  while (world.pending) world = respond(world, strategy);
  const contacts = { ...industry(world, kind).contacts }, startYear = world.date.year;
  for (let year = 0; year < 3; year++) {
    world = completePlanning(world, kind, strategy); world = finishYear(world, kind, strategy);
    expect(world.people[world.activePersonId].died).toBeNull(); expect(validateWorld(world)).toEqual(world);
    const cold = decodeWorld(encodeWorld(world)); expect(cold).toEqual(world); world = cold;
  }
  const recorded = career(world, kind), state = industry(world, kind), projects = recorded.projects.filter(project => project.creative), wages = projects.reduce((sum, project) => sum + project.grossEarned, 0n), fees = projects.reduce((sum, project) => sum + project.creative!.commissionPaid, 0n);
  expect(world.date.year).toBe(startYear + 3); expect(projects.length).toBeGreaterThanOrEqual(2); expect(state.completed).toBeGreaterThanOrEqual(1);
  expect(state.totalGross).toBe(wages); expect(state.totalCommission).toBe(fees); expect(fees).toBeGreaterThan(0n);
  expect(world.ledger.filter(row => row.personId === world.activePersonId && row.category === 'income').reduce((sum, row) => sum + row.cashDelta, 0n) - openingIncome).toBe(wages);
  const transactionMap = new Map(world.ledger.map(row => [row.id, row]));
  for (const project of projects) {
    expect(project.creative!.commissionTransactions.reduce((sum, id) => sum - transactionMap.get(id)!.cashDelta, 0n)).toBe(project.creative!.commissionPaid);
    expect(project.months).toBeLessThanOrEqual(12); expect(project.creative!.choices.length).toBeLessThanOrEqual(12);
    if (project.status === 'completed') expect(project.creative!.release).not.toBeNull();
  }
  for (const [role, id] of Object.entries(contacts)) if (!world.people[id].died) expect(state.contacts[role]).toBe(id);
  expect(new Set(Object.values(state.contacts)).size).toBe(4); expect(state.board.length).toBeLessThanOrEqual(8); expect(state.representation.history.length).toBeLessThanOrEqual(24); expect(state.decision).toBeNull();
  if (kind === 'model') expect(recorded.modelCareer!.brands.every(brand => brand.status !== 'active' || brand.ends > creativeMonthNumber(world))).toBe(true);
}, 90000);

function bookedFixture(kind: Kind) {
  let world = resolveCommand(foundation(), { type: kind === 'actor' ? 'actor-enter' : 'model-enter' });
  while (world.pending) world = respond(world, 'craft');
  world = decodeWorld(encodeWorld(world));
  const offer = industry(world, kind).board.find(row => row.minAgency === 0 && row.minReputation <= 40)!;
  offer.auditionRoll = 1; // Saved-success lifecycle fixture.
  const command: GameCommand = kind === 'actor' ? { type: 'actor-audition', offerId: offer.id, quotedAnnualPay: offer.annualPay, negotiate: false } : { type: 'model-casting', offerId: offer.id, quotedAnnualPay: offer.annualPay };
  world = resolveCommand(world, command);
  while (world.pending) world = respond(world, 'craft');
  return world;
}
function paidPeriod(input: World, kind: Kind) {
  const world = decodeWorld(encodeWorld(input)); world.date = monthFrom(world.date, 1);
  workMonth(world); if (kind === 'actor') actorMonth(world); else modelCareerMonth(world);
  world.people[world.activePersonId].lastEconomicMonth = creativeMonthNumber(world);
  return validateWorld(world);
}
for (const kind of ['actor', 'model'] as const) {
  test(kind + ' death during an actual paid production cancels future work without another wage or invented release', () => {
    const world = paidPeriod(bookedFixture(kind), kind), recorded = career(world, kind), project = recorded.projects.find(item => item.status === 'active')!, gross = project.grossEarned;
    expect(gross).toBeGreaterThan(0n); const job = world.workHistory.find(item => item.id === project.employmentId)!;
    recordDeath(world, world.activePersonId, 'An accident'); validateWorld(world);
    expect(recorded.status).toBe('deceased'); expect(project.status).toBe('cancelled'); expect(project.grossEarned).toBe(gross); expect(job.grossEarned).toBe(gross);
    expect(project.creative!.release).toBeNull(); expect(world.people[world.activePersonId].employment).toBeNull(); expect(industry(world, kind).decision).toBeNull();
    if (kind === 'model') expect(recorded.modelCareer!.brands.every(brand => brand.status !== 'active')).toBe(true);
    expect(decodeWorld(encodeWorld(world))).toEqual(world);
  });
  test(kind + ' health retirement closes an unfinished production while retaining the actual paid month', () => {
    const initial = bookedFixture(kind); initial.people[initial.activePersonId].stats.health = 14;
    const world = paidPeriod(initial, kind), recorded = career(world, kind), project = recorded.projects.at(-1)!;
    expect(recorded.status).toBe('retired'); expect(project.status).toBe('cancelled'); expect(project.months).toBe(1); expect(project.months).toBeLessThan(project.targetMonths);
    expect(project.grossEarned).toBeGreaterThan(0n); expect(project.creative!.release?.nomination).toBe(false); expect(project.award).toBeNull(); expect(world.people[world.activePersonId].employment).toBeNull();
    expect(decodeWorld(encodeWorld(world))).toEqual(world);
  });
  test(kind + ' saved interrupted year resumes the same decision and remaining work without RNG rerolls or repeated pay', () => {
    const interrupted = resolveCommand(bookedFixture(kind), { type: 'advance' }), original = encodeWorld(interrupted);
    expect(interrupted.annual).not.toBeNull(); expect(interrupted.annual!.monthsProcessed).toBeGreaterThan(0); expect(interrupted.annual!.monthsProcessed).toBeLessThan(12);
    expect(interrupted.pending).not.toBeNull(); const cold = unpackCheckpoint(packCheckpoint(interrupted)); expect(cold).toEqual(interrupted);
    const first = resumeAnnual(interrupted, kind, 'craft'), reopened = resumeAnnual(cold, kind, 'craft');
    expect(reopened).toEqual(first); expect(encodeWorld(interrupted)).toBe(original); expect(reopened.people[reopened.activePersonId].died).toBeNull();
  }, 60000);
}

test.each(['actor', 'model'] as const)('returning to %s after an abandoned production keeps new monthly industry decisions and the cancelled credit', kind => {
  let world = bookedFixture(kind);
  const oldCareer = career(world, kind), abandonedId = oldCareer.projects.find(project => project.status === 'active')!.id;
  world = resolveCommand(world, { type: 'leave-career', careerId: oldCareer.id });
  while (world.pending) world = respond(world, 'craft');
  expect(career(world, kind).status).toBe('left');
  const nextOffer = industry(world, kind).board.find(offer => offer.status === 'open' && offer.minAgency === 0 && offer.minReputation <= career(world, kind).reputation)!;
  expect(nextOffer).toBeDefined(); nextOffer.auditionRoll = 1; // Explicit saved-success reentry fixture.
  world = resolveCommand(world, kind === 'actor' ? { type: 'actor-audition', offerId: nextOffer.id, quotedAnnualPay: nextOffer.annualPay, negotiate: false } : { type: 'model-casting', offerId: nextOffer.id, quotedAnnualPay: nextOffer.annualPay });
  while (world.pending) world = respond(world, 'craft');
  expect(career(world, kind).status).toBe('active');
  expect(career(world, kind).projects.find(project => project.id === abandonedId)).toMatchObject({ status: 'cancelled', creative: { release: null } });
  world = resolveCommand(world, { type: 'advance' });
  let found = false;
  for (let guard = 0; guard < 100 && (world.pending || world.annual); guard++) {
    if (world.pending?.kind === 'decision' && world.pending.choices.some(choice => choice.effects.some(effect => effect.kind === 'creative-choice'))) { found = true; break; }
    if (world.pending) { world = respond(world, 'craft'); continue; }
    if (world.annual?.pausedForPlanning && career(world, kind).status !== 'active') {
      if (industry(world, kind).boardSeason < Math.floor(creativeMonthNumber(world) / 3)) { world = resolveCommand(world, { type: kind === 'actor' ? 'actor-refresh-offers' : 'model-refresh-offers' }); continue; }
      const offer = industry(world, kind).board.find(item => !(kind === 'actor' ? actorOfferReason(world, item) : modelOfferReason(world, item)));
      if (offer) { offer.auditionRoll = 1; world = resolveCommand(world, kind === 'actor' ? { type: 'actor-audition', offerId: offer.id, quotedAnnualPay: offer.annualPay, negotiate: false } : { type: 'model-casting', offerId: offer.id, quotedAnnualPay: offer.annualPay }); continue; }
    }
    if (world.annual) world = resolveCommand(world, { type: 'resume' });
  }
  expect(found).toBe(true);
  const event = world.pending;
  if (event?.kind !== 'decision') throw new Error('The new monthly career decision was cancelled');
  expect([3, 9]).toContain(world.date.month);
  const binding = industry(world, kind).decision;
  expect(binding?.id).toBe(event.id); expect(binding?.projectId).not.toBe(abandonedId);
  expect(career(world, kind).projects.find(project => project.id === abandonedId)).toMatchObject({ status: 'cancelled', creative: { release: null } });
  const cold = unpackCheckpoint(packCheckpoint(world)); expect(industry(cold, kind).decision).toEqual(binding); expect(cold.pending).toEqual(event);
  world = respond(cold, 'craft'); expect(industry(world, kind).decision).toBeNull(); expect(world.pending?.kind).toBe('result');
  expect(career(world, kind).projects.find(project => project.id === abandonedId)?.status).toBe('cancelled');
});
