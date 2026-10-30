import { copyWorld, decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { resolveCommand, recordDeath } from '../../src/game/engine';
import { monthFrom } from '../../src/game/calendar';
import { actorCareer, actorMonth, actorStyleReason, actorExit } from '../../src/game/systems/actor';
import { modelCareer, modelCareerExit, modelSpecialisationReason } from '../../src/game/systems/modelCareer';
import { actorProjectCatalog } from '../../src/game/content/actor';
import { modelBookingContent } from '../../src/game/content/modelCareer';
import { actorReleaseSummary, modelReleaseSummary } from '../../src/game/content/creativeOutcomes';
import { creativeMonthNumber, type CreativeKind } from '../../src/game/systems/creativeSchemas';
import { accountFor } from '../../src/game/systems/common';
import { roundRatio } from '../../src/game/money';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { offerCreativeStory } from '../../src/game/systems/creativeEvents';
import { modelCareerStories } from '../../src/game/content/modelCareerStories';
import { relationFor } from '../../src/game/systems/relationshipQueries';
import { gainPublicFame } from '../../src/game/systems/social';
import { creativeAct, creativeBook, creativeCareer, creativeFixture, creativeFinish, creativeIndustry, creativePeriod, drainCreative, experiencedCreative } from '../support/creativeCareer';
import historical from '../fixtures/v50-creative-polish-compat.json';

const strategy = (kind: CreativeKind, alternate = false) => kind === 'actor' ? { type: 'actor-style' as const, style: alternate ? 'popular' as const : 'craft' as const } : { type: 'model-specialise' as const, specialisations: alternate ? ['luxury' as const] : ['editorial' as const, 'runway' as const] };
const changedAt = (world: World, kind: CreativeKind) => kind === 'actor' ? actorCareer(world)!.actor!.lastStyleMonth : modelCareer(world)!.modelCareer!.lastSpecialisationMonth;

test.each(['actor', 'model'] as const)('%s initial strategy is free, rejects no-ops without spending the cooldown, and unlocks after exactly twelve months', kind => {
  let world = creativeFixture(kind), initial = encodeWorld(world);
  const noOp = kind === 'actor' ? { type: 'actor-style' as const, style: 'versatile' as const } : { type: 'model-specialise' as const, specialisations: ['commercial' as const] };
  expect(() => resolveCommand(world, noOp)).toThrow(/current|already/); expect(encodeWorld(world)).toBe(initial); expect(changedAt(world, kind)).toBeUndefined();
  const bank = accountFor(world).cash, portfolio = modelCareer(world)?.modelCareer?.portfolio;
  world = creativeAct(world, strategy(kind)); const selected = creativeMonthNumber(world);
  expect(changedAt(world, kind)).toBe(selected); expect(accountFor(world).cash).toBe(bank);
  if (kind === 'model') expect(modelCareer(world)!.modelCareer!.portfolio).toEqual(portfolio);
  world = unpackCheckpoint(packCheckpoint(world));
  initial = encodeWorld(world); expect(() => resolveCommand(world, strategy(kind))).toThrow(/current|already/); expect(encodeWorld(world)).toBe(initial);
  world.date = monthFrom(world.date, 11); expect(() => resolveCommand(world, strategy(kind, true))).toThrow(/next.*change/);
  world.date = monthFrom(world.date, 1); world = creativeAct(world, strategy(kind, true)); expect(changedAt(world, kind)).toBe(selected + 12);
});

test.each(['actor', 'model'] as const)('%s signing commits an unchosen default and exit/re-entry does not erase the strategy commitment', kind => {
  let world = creativeBook(creativeFixture(kind), kind);
  const selected = changedAt(world, kind); expect(selected).toBe(creativeMonthNumber(world));
  world = creativeAct(world, { type: 'leave-career', careerId: creativeCareer(world, kind).id });
  world = creativeAct(decodeWorld(encodeWorld(world)), { type: kind === 'actor' ? 'actor-enter' : 'model-enter' });
  expect(changedAt(world, kind)).toBe(selected); expect(() => resolveCommand(world, strategy(kind))).toThrow(/next.*change/);
});

test.each(['actor', 'model'] as const)('%s leaving unfinished work produces one clear result rather than two departure popups', kind => {
  const before = creativeBook(creativeFixture(kind), kind);
  const world = resolveCommand(before, { type: 'leave-career', careerId: creativeCareer(before, kind).id });
  const outcomes = [world.pending, ...world.deferred.map(entry => entry.event)].filter(event => event?.kind === 'result');
  expect(outcomes).toHaveLength(1); expect(outcomes[0]!.title).toMatch(/ends unfinished/);
  expect(drainCreative(world).pending).toBeNull();
});

test('an actor must finish the current production even when twelve months have elapsed', () => {
  let world = creativeAct(creativeFixture('actor'), strategy('actor')); world.date = monthFrom(world.date, 10);
  world = creativeBook(world, 'actor'); world = drainCreative(creativePeriod(drainCreative(creativePeriod(world))));
  const original = encodeWorld(world);
  expect(actorStyleReason(world, 'popular')).toMatch(/Finish.*production/);
  expect(() => resolveCommand(world, strategy('actor', true))).toThrow(/Finish.*production/); expect(encodeWorld(world)).toBe(original);
  expect(() => resolveCommand(world, { type: 'career-focus', careerId: actorCareer(world)!.id, focus: 'craft' })).toThrow(/acting style/);
});

test('a model can change future casting identity without changing the current booking or deleting portfolio skills', () => {
  let world = creativeAct(creativeFixture('model'), { type: 'model-specialise', specialisations: ['commercial', 'lifestyle'] }); world.date = monthFrom(world.date, 10);
  world = creativeBook(world, 'model'); world = drainCreative(creativePeriod(drainCreative(creativePeriod(world))));
  const current = copyWorld(world).careers[0].projects[0], portfolio = { ...modelCareer(world)!.modelCareer!.portfolio };
  world = creativeAct(world, strategy('model'));
  expect(modelCareer(world)!.projects[0]).toEqual(current); expect(modelCareer(world)!.modelCareer!.portfolio).toEqual(portfolio);
  expect(modelCareer(world)!.modelCareer!.specialisations).toEqual(['editorial', 'runway']);
  expect(() => resolveCommand(world, { type: 'model-specialise', specialisations: ['runway', 'editorial'] })).toThrow(/already/);
  expect(modelSpecialisationReason(world, ['runway', 'editorial'])).toMatch(/already/);
});

test.each(['actor', 'model'] as const)('%s pre-cooldown saves have no invented lock or reset when reopened and completed', kind => {
  let world = creativeBook(creativeFixture(kind), kind), career = creativeCareer(world, kind);
  if (career.actor) delete career.actor.lastStyleMonth;
  if (career.modelCareer) delete career.modelCareer.lastSpecialisationMonth;
  delete career.projects[0].creative!.outcomeVersion; delete career.projects[0].creative!.actingStyle;
  const saved = encodeWorld(world); expect(encodeWorld(decodeWorld(saved))).toBe(saved);
  world = creativeFinish(decodeWorld(saved), kind); expect(changedAt(world, kind)).toBeUndefined();
  expect(() => creativeAct(world, strategy(kind))).not.toThrow();
});

test('acting approaches change actual monthly performance, critics and popularity with the same saved rolls', () => {
  const base = creativeFixture('actor'), outcomes = new Map<string, World['careers'][number]['projects'][number]>();
  for (const style of ['versatile', 'craft', 'popular'] as const) {
    let world = copyWorld(base); if (style !== 'versatile') world = creativeAct(world, { type: 'actor-style', style });
    world = creativeBook(world, 'actor', 'theatre');
    const person = world.people[world.activePersonId]; person.skills.acting = 80; person.stats.discipline = 70; person.employment!.performance = 60;
    world = creativeFinish(world, 'actor'); outcomes.set(style, actorCareer(world)!.projects[0]);
  }
  const craft = outcomes.get('craft')!, popular = outcomes.get('popular')!, versatile = outcomes.get('versatile')!;
  expect(craft.creative!.criticRoll).toBe(popular.creative!.criticRoll); expect(craft.responseRoll).toBe(popular.responseRoll);
  expect(craft.quality).toBeGreaterThan(versatile.quality); expect(versatile.quality).toBeGreaterThan(popular.quality);
  expect(craft.creative!.release!.critical).toBeGreaterThan(popular.creative!.release!.critical);
  expect(popular.creative!.release!.audience).toBeGreaterThan(craft.creative!.release!.audience);
});

test.each(['actor', 'model'] as const)('%s unfinished work keeps its wages and fees, has consequences, and never receives reviews or an award', kind => {
  const represented = creativeAct(creativeFixture(kind), { type: kind === 'actor' ? 'actor-agency' : 'model-agency', tier: 'boutique', negotiate: false });
  let world = drainCreative(creativePeriod(creativeBook(represented, kind))), previousReceipts = [...world.ledger];
  world.people[world.activePersonId].stats.health = 14;
  world = creativePeriod(world); const career = creativeCareer(world, kind), project = career.projects[0], metadata = project.creative!;
  expect(project.status).toBe('cancelled'); expect(metadata.release).toBeNull(); expect(project.award).toBeNull(); expect(metadata.cancellation?.reputation).toBeLessThan(0);
  expect(project.grossEarned).toBeGreaterThan(0n); expect(world.workHistory.find(job => job.id === project.employmentId)!.grossEarned).toBe(project.grossEarned);
  expect(metadata.commissionPaid).toBe(roundRatio(project.grossEarned * BigInt(metadata.commissionBps), 10000n));
  expect(metadata.commissionPaid).toBeGreaterThan(0n); expect(world.ledger.slice(0, previousReceipts.length)).toEqual(previousReceipts);
  expect(creativeIndustry(world, kind).completed).toBe(0);
  if (world.pending?.kind !== 'result') throw new Error('Missing unfinished-production result');
  expect(world.pending.effects.some(row => ['critical', 'industry', 'audience', 'award'].includes(row.id))).toBe(false);
  const saved = encodeWorld(world); if (kind === 'actor') actorExit(world, world.activePersonId); else modelCareerExit(world, world.activePersonId);
  expect(encodeWorld(world)).toBe(saved); expect(decodeWorld(saved)).toEqual(world);
});

test('abandoning an exclusive Model campaign creates exactly one real claim and no reviews, extra wages or duplicate consequences', () => {
  let world = creativeBook(experiencedCreative('model'), 'model', 'ambassador');
  world = drainCreative(creativePeriod(world)); const before = copyWorld(world), projectId = modelCareer(world)!.projects.at(-1)!.id;
  world = creativeAct(world, { type: 'leave-career', careerId: modelCareer(world)!.id });
  const state = modelCareer(world)!.modelCareer!, brand = state.brands[0], project = modelCareer(world)!.projects.find(item => item.id === projectId)!;
  expect(project.creative!.release).toBeNull(); expect(project.creative!.cancellation).toBeDefined(); expect(brand.status).toBe('breached');
  expect(world.liabilities.find(item => item.id === brand.penaltyLiabilityId)!.principal).toBe(roundRatio(brand.agreedFee, 5n));
  expect(project.grossEarned).toBe(modelCareer(before)!.projects.at(-1)!.grossEarned); expect(project.creative!.commissionPaid).toBe(modelCareer(before)!.projects.at(-1)!.creative!.commissionPaid);
  const saved = encodeWorld(world); modelCareerExit(world, world.activePersonId); expect(encodeWorld(world)).toBe(saved);
  expect(world.ledger.filter(row => row.liabilityId === brand.penaltyLiabilityId && row.category === 'career-contract-penalty')).toHaveLength(1);
});

test('death during an exclusive campaign cancels unfinished work without reviews or a new settlement', () => {
  const world = creativeBook(experiencedCreative('model'), 'model', 'ambassador'), debts = world.liabilities.length;
  recordDeath(world, world.activePersonId, 'An accident'); validateWorld(world);
  expect(modelCareer(world)!.projects.at(-1)!.creative!.release).toBeNull(); expect(modelCareer(world)!.projects.at(-1)!.creative!.cancellation).toBeDefined();
  expect(modelCareer(world)!.modelCareer!.brands[0].status).toBe('cancelled'); expect(world.liabilities).toHaveLength(debts);
});

test('positive and negative Model publicity change real campaign reception in opposite directions without overpowering performance', () => {
  const base = creativeBook(creativeFixture('model'), 'model'), audience = new Map<number, number>();
  for (const publicity of [-10, 0, 10]) {
    let world = copyWorld(base), project = modelCareer(world)!.projects[0];
    project.creative!.publicity = publicity; project.creative!.popularity = 50;
    world.people[world.activePersonId].skills.modeling = 70; world.people[world.activePersonId].stats.discipline = 70; world.people[world.activePersonId].employment!.performance = 60;
    world = creativeFinish(world, 'model'); project = modelCareer(world)!.projects[0];
    audience.set(publicity, project.creative!.release!.audience);
  }
  expect(audience.get(-10)!).toBeLessThan(audience.get(0)!); expect(audience.get(0)!).toBeLessThan(audience.get(10)!);
  expect(audience.get(10)! - audience.get(-10)!).toBe(10);
});

test('a successful Model release reports the actual clamped fame and reputation changes', () => {
  let world = creativeBook(experiencedCreative('model'), 'model', 'ambassador');
  modelCareer(world)!.reputation = 99;
  gainPublicFame(world, world.people[world.activePersonId], 99 - world.people[world.activePersonId].publicLife.earnedFame);
  const project = modelCareer(world)!.projects.at(-1)!; project.creative!.criticRoll = project.creative!.audienceRoll = 1;
  for (let month = 0; month < project.targetMonths; month++) {
    world = creativePeriod(world); if (month < project.targetMonths - 1) world = drainCreative(world);
  }
  const release = modelCareer(world)!.projects.at(-1)!.creative!.release!;
  expect(modelCareer(world)!.reputation).toBe(100); expect(world.people[world.activePersonId].publicLife.earnedFame).toBe(100);
  expect(release.reputation).toBe(1); expect(release.fame).toBe(1);
  if (world.pending?.kind !== 'result') throw new Error('Missing campaign outcome');
  expect(world.pending.effects.find(row => row.id === 'reputation')?.value).toBe('+1'); expect(world.pending.effects.find(row => row.id === 'fame')?.value).toBe('+1');
});

test.each(['actor', 'model'] as const)('%s a professional rival relationship can change a later casting outcome without changing its saved roll', kind => {
  const base = creativeFixture(kind); let found = false;
  for (let roll = kind === 'actor' ? 70 : 35; roll <= (kind === 'actor' ? 95 : 60) && !found; roll++) {
    const accepted: boolean[] = [];
    for (const trust of [0, 100]) {
      const world = copyWorld(base), career = creativeCareer(world, kind), industry = creativeIndustry(world, kind);
      relationFor(world, world.activePersonId, industry.contacts.rival)!.trust = trust;
      const offer = industry.board.find(item => item.category === (kind === 'actor' ? 'independent-film' : 'editorial'))!; offer.auditionRoll = roll;
      const result = creativeAct(world, kind === 'actor' ? { type: 'actor-audition', offerId: offer.id, quotedAnnualPay: offer.annualPay, negotiate: false } : { type: 'model-casting', offerId: offer.id, quotedAnnualPay: offer.annualPay });
      expect(creativeIndustry(result, kind).board.find(item => item.id === offer.id)!.auditionRoll).toBe(roll);
      accepted.push(creativeCareer(result, kind).status === 'active');
    }
    found = !accepted[0] && accepted[1];
  }
  expect(found).toBe(true);
});

test('a new nonexclusive brief cannot add obligations to an unrelated older brand agreement', () => {
  const base = experiencedCreative('model'); base.date = monthFrom(base.date, 3);
  let world = creativeFinish(creativeBook(base, 'model', 'ambassador'), 'model');
  const brand = modelCareer(world)!.modelCareer!.brands[0]; expect(brand.status).toBe('active');
  world = creativeBook(world, 'model', 'editorial');
  expect(creativeMonthNumber(world) % 6).toBe(2);
  const state = creativeIndustry(world, 'model'); state.seenStories = modelCareerStories.filter(story => story.id !== 'model-clear-the-calendar').map(story => story.id);
  const previous = { ...modelCareer(world)!.modelCareer!.brands[0] };
  offerCreativeStory(world, modelCareer(world)!);
  if (world.pending?.kind !== 'decision') throw new Error('Missing calendar amendment');
  expect(world.pending.templateId).toBe('creative-model-clear-the-calendar');
  world = resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: 'exclusive' });
  expect(modelCareer(world)!.modelCareer!.brands[0]).toEqual(previous);
  expect(creativeIndustry(world, 'model').bookingHoldUntil).toBeGreaterThan(creativeMonthNumber(world));
});

test('a reduction in exclusive obligations is offered only while a relevant appearance can actually be removed', () => {
  const world = creativeBook(experiencedCreative('model'), 'model', 'ambassador'), state = modelCareer(world)!.modelCareer!;
  state.brands[0].fulfilled = state.brands[0].obligations;
  state.industry.seenStories = modelCareerStories.filter(story => story.id !== 'model-competing-colours').map(story => story.id);
  offerCreativeStory(world, modelCareer(world)!);
  expect(world.pending?.kind === 'decision' && world.pending.templateId).not.toBe('creative-model-competing-colours');
});

test.each([
  ['pending', 'expected', 'private'],
  ['pendingModelPublicity', 'expectedModelPublicity', 'improvise'],
  ['pendingModelAmendment', 'expectedModelAmendment', 'amend'],
] as const)('%s genuine pre-polish text, effect semantics, results and RNG survive cold reopening byte for byte', (pendingKey, expectedKey, choiceId) => {
  const world = unpackCheckpoint(historical[pendingKey]), saved = encodeWorld(world);
  if (world.pending?.kind !== 'decision') throw new Error('Historical decision missing');
  expect(world.pending.choices[0].effects[0].kind).toBe('creative-choice');
  expect(encodeWorld(decodeWorld(saved))).toBe(saved);
  const actual = resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId });
  expect(encodeWorld(actual)).toBe(encodeWorld(unpackCheckpoint(historical[expectedKey])));
});

test.each(['cancelledActor', 'cancelledModel'] as const)('%s genuine old review text and numbers remain untouched, including Time Machine checkpoints', key => {
  const world = unpackCheckpoint(historical[key]), saved = encodeWorld(world), career = world.careers[0], project = career.projects[0];
  expect(project.status).toBe('cancelled'); expect(project.creative!.release).not.toBeNull(); expect(project.creative!.cancellation).toBeUndefined();
  expect(encodeWorld(unpackCheckpoint(packCheckpoint(world)))).toBe(saved);
  actorExit(world, world.activePersonId); modelCareerExit(world, world.activePersonId); expect(encodeWorld(world)).toBe(saved);
  expect(decodeWorld(saved).careers[0].projects[0]).toEqual(project);
});

test.each([...actorProjectCatalog.map(item => ['actor', item.id] as const), ...modelBookingContent.map(item => ['model', item.id] as const)])('%s %s saves category-specific release copy through the actual paid contract', (kind, category) => {
  const world = creativeFinish(creativeBook(experiencedCreative(kind), kind, category), kind), project = creativeCareer(world, kind).projects.at(-1)!, release = project.creative!.release!;
  expect(project.status).toBe('completed'); expect(release.summary).toBe((kind === 'actor' ? actorReleaseSummary : modelReleaseSummary)(category, release.critical, release.audience));
  expect(release.summary).not.toMatch(/saved|recorded|fictional|imaginary|free personal money/i);
  expect(decodeWorld(encodeWorld(world)).careers[0].projects.at(-1)!.creative!.release).toEqual(release);
});

test('every category has distinct, deterministic writing for acclaim, cult appeal, crowd hits, popularity, flops and mixed results', () => {
  for (const summary of [actorReleaseSummary, modelReleaseSummary]) {
    const categories = summary === actorReleaseSummary ? actorProjectCatalog.map(item => item.id) : modelBookingContent.map(item => item.id);
    const all = categories.flatMap(category => [[90, 30], [30, 90], [90, 65], [60, 75], [40, 20], [60, 50]].map(([critical, audience]) => summary(category, critical, audience)));
    expect(new Set(all).size).toBe(all.length); expect(all.every(text => text.length > 65)).toBe(true);
  }
});
