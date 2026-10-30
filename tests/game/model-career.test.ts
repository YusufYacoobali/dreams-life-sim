import { decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { monthFrom } from '../../src/game/calendar';
import { modelBookingContent } from '../../src/game/content/modelCareer';
import { modelBrandQuote, modelCareer, modelCareerExit, modelCareerMonth, modelOfferReason, modelPortfolioQuote, modelSponsorshipReason, resolveModelCareer } from '../../src/game/systems/modelCareer';
import { type ModelCareerCommand, type ModelCareerState } from '../../src/game/systems/modelCareerSchemas';
import { validateModelCareer } from '../../src/game/systems/modelCareerValidation';
import { careerMonth, careerPayQuote, startCareerContract } from '../../src/game/systems/careers';
import { endEmployment, workMonth } from '../../src/game/systems/work';
import { accountFor } from '../../src/game/systems/common';
import { resolveSocialMedia, brandDecision } from '../../src/game/systems/social';
import { randomInteger } from '../../src/game/random';
import { creativeMonthNumber } from '../../src/game/systems/creativeSchemas';
import { recordDeath, resolveCommand } from '../../src/game/engine';
import graduate from '../fixtures/v3-employed-graduate.json';
function clear(world: World) { world.pending = null; world.deferred = []; world.pendingPriority = 0; }
function fixture() {
  const world = decodeWorld(JSON.stringify(graduate)), person = world.people[world.activePersonId], bank = accountFor(world);
  endEmployment(world); person.born.year -= 5; person.skills.modeling = 100;
  person.stats.health = person.stats.smarts = person.stats.discipline = person.stats.energy = 100;
  person.stats.looks = person.stats.fitness = 0;
  bank.cash += 100000000n; bank.openingCash += 100000000n; clear(world); return world;
}
function action(world: World, command: ModelCareerCommand) { resolveModelCareer(world, command); clear(world); validateModelCareer(world); return validateWorld(world); }
function enter(world = fixture()) { return action(world, { type: 'model-enter' }); }
function period(world: World) {
  world.date = monthFrom(world.date, 1); const person = world.people[world.activePersonId]; person.stats.energy = 100;
  workMonth(world, person); modelCareerMonth(world); person.lastEconomicMonth = creativeMonthNumber(world); clear(world); validateModelCareer(world); return validateWorld(world);
}
function book(world: World, category = 'editorial') {
  const state = modelCareer(world)!.modelCareer!, offer = state.industry.board.find(item => item.category === category)!;
  offer.auditionRoll = 1;
  return action(world, { type: 'model-casting', offerId: offer.id, quotedAnnualPay: offer.annualPay });
}
function finish(world: World) { let guard = 0; while (modelCareer(world)!.status === 'active' && guard++ < 13) world = period(world); expect(guard).toBeLessThan(14); return world; }
function fresh(world: World) {
  const state = modelCareer(world)!.modelCareer!;
  if (state.industry.boardSeason !== Math.floor(creativeMonthNumber(world) / 3)) action(world, { type: 'model-refresh-offers' });
  return world;
}
function experienced() {
  let world = fixture();
  for (let job = 0; job < 2; job++) {
    startCareerContract(world, 'model', careerPayQuote(world, 'model'), undefined, false); clear(world);
    for (let month = 0; month < 3; month++) { world.date = monthFrom(world.date, 1); workMonth(world); careerMonth(world); clear(world); }
  }
  world = enter(world); const career = modelCareer(world)!; career.reputation = 95; for (const key of Object.keys(career.modelCareer!.portfolio) as (keyof ModelCareerState['portfolio'])[]) career.modelCareer!.portfolio[key] = 90;
  action(world, { type: 'model-agency', tier: 'major', negotiate: false });
  return world;
}
test('new modelling is free of appearance-perfection gates, creates one stable industry cast and preserves old money', () => {
  const world = fixture(), before = accountFor(world).cash, random = { ...world.random }; enter(world);
  expect(world.schemaVersion).toBe(50); expect(accountFor(world).cash).toBe(before); expect(modelCareer(world)!.modelCareer!.industry.board).toHaveLength(6);
  const contacts = { ...modelCareer(world)!.modelCareer!.industry.contacts }, people = Object.keys(world.people).length;
  expect(Object.keys(contacts)).toHaveLength(4); expect(() => action(world, { type: 'model-enter' })).toThrow(/already/);
  expect(Object.keys(world.people)).toHaveLength(people); expect(modelCareer(world)!.modelCareer!.industry.contacts).toEqual(contacts);
  expect(world.random.events).toBe(random.events); expect(world.random.outcomes).toBe(random.outcomes);
});
test('quarterly casting outcomes and terms survive cold reopening and cannot be rerolled by reopening', () => {
  const world = enter(), before = encodeWorld(world), offer = modelCareer(world)!.modelCareer!.industry.board[0];
  expect(() => action(world, { type: 'model-refresh-offers' })).toThrow(/quarter/); expect(encodeWorld(world)).toBe(before);
  const cold = decodeWorld(before); expect(modelCareer(cold)!.modelCareer!.industry.board[0]).toEqual(offer);
  offer.auditionRoll = 100; const quotedAnnualPay = offer.annualPay; action(world, { type: 'model-casting', offerId: offer.id, quotedAnnualPay });
  expect(offer.status).toBe('rejected'); expect(() => action(world, { type: 'model-casting', offerId: offer.id, quotedAnnualPay })).toThrow(/answered/);
});
test('portfolio investment costs real available funds, develops an actual specialisation and is bounded per quarter', () => {
  const world = enter(), state = modelCareer(world)!.modelCareer!, cash = accountFor(world).cash, old = state.portfolio.editorial, cost = modelPortfolioQuote(world, 'professional');
  action(world, { type: 'model-portfolio', specialisation: 'editorial', style: 'professional', quotedCost: cost });
  expect(accountFor(world).cash).toBe(cash - cost); expect(state.portfolio.editorial).toBe(old + 15);
  expect(world.ledger.at(-1)!.category).toBe('career-portfolio'); expect(() => action(world, { type: 'model-portfolio', specialisation: 'commercial', style: 'self', quotedCost: modelPortfolioQuote(world, 'self') })).toThrow(/quarter/);
});
test.each(modelBookingContent.map(item => item.id))('%s booking follows its distinct saved duration and produces actual credited work', category => {
  let world = experienced(); const career = modelCareer(world)!, state = career.modelCareer!, legacy = career.projects.filter(project => !project.creative).map(project => ({ ...project })), oldCompleted = state.industry.completed;
  world = book(world, category); const project = modelCareer(world)!.projects.find(item => item.status === 'active')!, oldCash = accountFor(world).cash;
  expect(project.creative!.category).toBe(category); expect(project.grossEarned).toBe(0n); expect(accountFor(world).cash).toBe(oldCash);
  world = action(world, { type: 'model-production', projectId: project.id, action: 'prepare' }); world = finish(world);
  const final = modelCareer(world)!, completed = final.projects.find(item => item.id === project.id)!;
  expect(completed.months).toBe(modelBookingContent.find(item => item.id === category)!.months); expect(completed.grossEarned).toBeGreaterThan(0n); expect(completed.creative!.release).not.toBeNull(); expect(final.modelCareer!.industry.completed).toBe(oldCompleted + 1);
  expect(final.modelCareer!.notableWork.find(item => item.projectId === project.id)?.gross).toBe(completed.grossEarned);
  expect(final.projects.filter(item => !item.creative)).toEqual(legacy); expect(decodeWorld(encodeWorld(world))).toEqual(world);
});
test('agency commission is deducted only from real wages and repeating monthly processing cannot charge twice', () => {
  const world = enter(); action(world, { type: 'model-agency', tier: 'boutique', negotiate: false }); book(world);
  period(world); const career = modelCareer(world)!, project = career.projects.find(item => item.status === 'active')!, meta = project.creative!;
  const paid = world.ledger.filter(item => item.category === 'career-agency-commission'); expect(paid).toHaveLength(1); expect(-paid[0].cashDelta).toBe(meta.commissionPaid);
  expect(meta.commissionPaid).toBeGreaterThan(0n); const before = encodeWorld(world); modelCareerMonth(world); expect(encodeWorld(world)).toBe(before);
});
test('production decisions alter real performance/client relationships and remaining wages, only once per booking', () => {
  const world = enter(); book(world); const project = modelCareer(world)!.projects.find(item => item.status === 'active')!, meta = project.creative!, oldPay = world.people[world.activePersonId].employment!.annualPay;
  const designerId = modelCareer(world)!.modelCareer!.industry.contacts.designer, relationship = world.relationships.find(item => (item.from === world.activePersonId && item.to === designerId) || (item.to === world.activePersonId && item.from === designerId))!, originalTrust = relationship.trust;
  meta.criticRoll = meta.audienceRoll = 1;
  action(world, { type: 'model-production', projectId: project.id, action: 'interpret' }); expect(meta.qualityBonus).toBeGreaterThan(0); expect(relationship.trust).toBeGreaterThan(originalTrust); expect(relationship.lastInteractionYear).toBe(world.date.year); expect(relationship.memories.some(memory => memory.startsWith('model-work:designer:collaboration:'))).toBe(true);
  action(world, { type: 'model-production', projectId: project.id, action: 'negotiate' }); expect(world.people[world.activePersonId].employment!.annualPay).toBeGreaterThan(oldPay);
  expect(project.grossEarned).toBe(0n); expect(() => action(world, { type: 'model-production', projectId: project.id, action: 'negotiate' })).toThrow(/already/);
});
test('exclusive rights outlast production, allow editorial work, restrict competing campaigns and can be settled for real cash', () => {
  let world = experienced(); world = book(world, 'ambassador'); world = finish(world);
  const career = modelCareer(world)!, state = career.modelCareer!, brand = state.brands[0]; expect(brand.status).toBe('active'); expect(brand.ends).toBeGreaterThan(creativeMonthNumber(world)); fresh(world);
  expect(modelOfferReason(world, state.industry.board.find(item => item.category === 'advertising')!)).toMatch(/exclusivity/);
  expect(modelOfferReason(world, state.industry.board.find(item => item.category === 'editorial')!)).toBeUndefined();
  const cash = accountFor(world).cash, cost = modelBrandQuote(world, brand, 'breach'); action(world, { type: 'model-brand', brandId: brand.id, action: 'breach', quotedCost: cost });
  expect(accountFor(world).cash).toBe(cash - cost); expect(brand.penaltyPaid).toBe(cost); expect(brand.status).toBe('breached');
  expect(modelOfferReason(world, state.industry.board.find(item => item.category === 'advertising')!)).toBeUndefined();
});
test('abandoning an exclusive booking assesses one reconcilable settlement debt and stops future wages', () => {
  const world = experienced(); book(world, 'luxury'); period(world); const career = modelCareer(world)!, brand = career.modelCareer!.brands[0], gross = career.projects.at(-1)!.grossEarned;
  endEmployment(world); modelCareerExit(world, world.activePersonId); const liability = world.liabilities.find(item => item.id === brand.penaltyLiabilityId)!;
  expect(brand.status).toBe('breached'); expect(liability.principal).toBeGreaterThan(0n); expect(world.ledger.filter(row => row.liabilityId === liability.id).reduce((sum, row) => sum + row.debtDelta, 0n)).toBe(liability.principal);
  const before = encodeWorld(world); modelCareerExit(world, world.activePersonId); expect(encodeWorld(world)).toBe(before); expect(career.projects.at(-1)!.grossEarned).toBe(gross); validateWorld(world);
});
test('death cancels unperformed endorsement obligations without inventing a new penalty or payment', () => {
  const world = experienced(); book(world, 'luxury'); const before = world.liabilities.length; recordDeath(world, world.activePersonId, 'natural causes'); modelCareerExit(world, world.activePersonId);
  expect(modelCareer(world)!.modelCareer!.brands[0].status).toBe('cancelled'); expect(world.liabilities.length).toBe(before); validateWorld(world);
});

test('brand appearances and shortened terms never generate a second sponsorship payment', () => {
  const world = experienced(); book(world, 'ambassador'); const state = modelCareer(world)!.modelCareer!, brand = state.brands[0], wages = world.ledger.filter(row => row.category === 'income').length;
  action(world, { type: 'model-brand', brandId: brand.id, action: 'fulfil', quotedCost: 0n });
  expect(brand.fulfilled).toBe(1); expect(world.ledger.filter(row => row.category === 'income')).toHaveLength(wages);
  expect(() => action(world, { type: 'model-brand', brandId: brand.id, action: 'fulfil', quotedCost: 0n })).toThrow(/month/);
  period(world); const oldEnd = brand.ends; action(world, { type: 'model-brand', brandId: brand.id, action: 'renegotiate', quotedCost: 0n });
  expect(brand.negotiated).toBe(true); expect(brand.ends).toBeLessThan(oldEnd); expect(() => action(world, { type: 'model-brand', brandId: brand.id, action: 'renegotiate', quotedCost: 0n })).toThrow(/negotiated/);
});
test('consumed casting status survives a round trip through another country in the same quarter', () => {
  const world = enter(), state = modelCareer(world)!.modelCareer!, person = world.people[world.activePersonId], originalCountry = person.country, originalCity = person.city, offer = state.industry.board[0];
  offer.auditionRoll = 100; action(world, { type: 'model-casting', offerId: offer.id, quotedAnnualPay: offer.annualPay });
  person.country = 'GB'; person.city = 'London'; resolveModelCareer(world, { type: 'model-refresh-offers' }); clear(world);
  expect(state.boardCountry).toBe('GB'); person.country = originalCountry; person.city = originalCity; resolveModelCareer(world, { type: 'model-refresh-offers' }); clear(world);
  const returned = state.industry.board.find(item => item.id === offer.id)!; expect(returned.status).toBe('rejected'); expect(returned.auditionRoll).toBe(100);
  expect(modelOfferReason(world, returned)).toMatch(/answered/); validateWorld(world);
});
test('three unsuccessful campaigns can lose representation and a strong later booking records an actual comeback', () => {
  let world = enter(); action(world, { type: 'model-agency', tier: 'boutique', negotiate: false });
  for (let failure = 0; failure < 3; failure++) {
    fresh(world); book(world, 'advertising'); const project = modelCareer(world)!.projects.find(item => item.status === 'active')!;
    project.creative!.qualityBonus = -50; project.creative!.preparation = 0; project.creative!.criticRoll = project.creative!.audienceRoll = 100;
    world = finish(world); expect(modelCareer(world)!.projects.at(-1)!.creative!.release!.reputation).toBeLessThan(0);
  }
  const state = modelCareer(world)!.modelCareer!; expect(state.industry.representation.tier).toBe('independent'); expect(state.lostRepresentation).toBe(true);
  fresh(world); book(world, 'editorial'); const project = modelCareer(world)!.projects.find(item => item.status === 'active')!;
  project.creative!.qualityBonus = 50; project.creative!.preparation = 100; project.creative!.criticRoll = project.creative!.audienceRoll = project.responseRoll = 1;
  world = finish(world); expect(modelCareer(world)!.modelCareer!.industry.milestones).toContain('Successful comeback'); expect(modelCareer(world)!.projects.at(-1)!.award).toBe('Fashion Craft Council recognition');
});


test('exclusive modelling rights also restrict the existing style/fitness sponsorship system without claiming extra pay', () => {
  const world = experienced(); book(world, 'luxury');
  expect(modelSponsorshipReason(world, 'style')).toMatch(/exclusivity/); expect(modelSponsorshipReason(world, 'fitness')).toMatch(/exclusivity/);
  expect(modelSponsorshipReason(world, 'gaming')).toBeUndefined(); expect(modelSponsorshipReason(world, 'home')).toBeUndefined();
  const brand = modelCareer(world)!.modelCareer!.brands[0]; action(world, { type: 'model-brand', brandId: brand.id, action: 'breach', quotedCost: modelBrandQuote(world, brand, 'breach') });
  expect(modelSponsorshipReason(world, 'style')).toBeUndefined();
});


test('leaving and returning preserves portfolio, representation, consumed castings, credits and recurring people', () => {
  let world = enter(); action(world, { type: 'model-agency', tier: 'boutique', negotiate: false }); book(world); world = finish(world); fresh(world);
  const before = modelCareer(world)!.modelCareer!, contacts = Object.keys(world.people).length, careerId = modelCareer(world)!.id;
  world = resolveCommand(world, { type: 'leave-career', careerId }); clear(world);
  expect(modelCareer(world)!.status).toBe('left'); world = action(world, { type: 'model-enter' });
  expect(modelCareer(world)!.status).toBe('between'); expect(modelCareer(world)!.modelCareer).toEqual(before); expect(Object.keys(world.people)).toHaveLength(contacts);
});
function sponsorOffer(world: World) {
  resolveSocialMedia(world, { type: 'create-social', platform: 'photogram', handle: 'model_test_profile', bio: '' }); clear(world);
  const account = world.socialAccounts.find(item => item.ownerId === world.activePersonId)!; account.followers = account.baselineFollowers = account.peakFollowers = 5000; world.people[world.activePersonId].publicLife.image = 100;
  let seed = 0; while (randomInteger(seed, 0, 3).value !== 0) seed++; world.random.outcomes = seed;
  resolveSocialMedia(world, { type: 'seek-sponsor', accountId: account.id });
  expect(world.sponsorships.at(-1)!.category).toBe('style'); return world.sponsorships.at(-1)!;
}
test('an actual existing Social sponsor must end before signing competing exclusive modelling rights', () => {
  const world = experienced(), sponsor = sponsorOffer(world); brandDecision(world, sponsor.id, true); clear(world); validateWorld(world);
  const offer = modelCareer(world)!.modelCareer!.industry.board.find(item => item.category === 'luxury')!; expect(modelOfferReason(world, offer)).toMatch(/sponsorship/);
  const before = accountFor(world).cash; expect(() => action(world, { type: 'model-casting', offerId: offer.id, quotedAnnualPay: offer.annualPay })).toThrow(/sponsorship/); expect(accountFor(world).cash).toBe(before);
  resolveSocialMedia(world, { type: 'cancel-sponsor', sponsorId: sponsor.id }); clear(world); expect(modelOfferReason(world, offer)).toBeUndefined(); validateWorld(world);
});
test('new Social sponsorship acceptance cannot bypass current modelling exclusivity through a saved decision', () => {
  const world = experienced(); book(world, 'luxury'); const sponsor = sponsorOffer(world), event = world.pending!;
  expect(event.kind).toBe('decision'); expect(() => resolveCommand(world, { type: 'choose', eventId: event.id, choiceId: 'accept' })).toThrow(/exclusivity/);
  expect(sponsor.status).toBe('offered'); expect(sponsor.earned).toBe(0n); const declined = resolveCommand(world, { type: 'choose', eventId: event.id, choiceId: 'decline' }); expect(declined.sponsorships.at(-1)!.status).toBe('declined');
});
test('extra story obligations can be fulfilled with bounded optional monthly appearances before finite expiry', () => {
  let world = experienced(); book(world, 'ambassador'); const brandId = modelCareer(world)!.modelCareer!.brands[0].id; modelCareer(world)!.modelCareer!.brands[0].obligations = 6;
  const wagesBefore = world.ledger.filter(item => item.category === 'income').length;
  for (let month = 0; month < 6; month++) {
    const brand = modelCareer(world)!.modelCareer!.brands.find(item => item.id === brandId)!;
    if (brand.fulfilled < brand.obligations) action(world, { type: 'model-brand', brandId, action: 'fulfil', quotedCost: 0n });
    if (month === 0) expect(() => action(world, { type: 'model-brand', brandId, action: 'fulfil', quotedCost: 0n })).toThrow(/month/);
    expect(world.ledger.filter(item => item.category === 'income').length).toBe(wagesBefore + month);
    world = period(world);
  }
  const end = modelCareer(world)!.modelCareer!.brands[0].ends; while (creativeMonthNumber(world) < end) world = period(world);
  const brand = modelCareer(world)!.modelCareer!.brands[0]; expect(brand.fulfilled).toBe(6); expect(brand.status).toBe('completed'); expect(brand.penaltyLiabilityId).toBeNull();
});
