import { bindEvent, eligibleTemplates, eventTemplates } from '../../src/game/content/events';
import { dramaticTemplates } from '../../src/game/content/dramaticEvents';
import { dramaticEventIds, type DramaticEventId } from '../../src/game/systems/dramaticSchemas';
import { dramaticContext, offerDramaticEvent } from '../../src/game/systems/dramaticEvents';
import { ageOn, copyWorld, decodeWorld, encodeWorld, moneyJSON, validateWorld, type World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { accountFor } from '../../src/game/systems/common';
import { activeSentence } from '../../src/game/systems/legalSchemas';
import { currentWorkplace } from '../../src/game/systems/workplaceSchemas';
import { relationFor } from '../../src/game/systems/relationships';
import { endEmployment } from '../../src/game/systems/work';
import { randomInteger } from '../../src/game/random';
import { assetCatalog } from '../../src/game/content/assets';
import { assetPrice } from '../../src/game/systems/assets';
import { drainStorySetup } from '../support/lifeStory';
import { adultSocial } from '../support/adultSocial';
import { employee } from '../support/employee';
import { dramaticWorld } from '../support/dramaticEvents';

const scene = (id: DramaticEventId) => dramaticTemplates.find(row => row.id === id)!;
function offer(id: DramaticEventId) {
  const world = dramaticWorld(id);
  world.pending = bindEvent(world, scene(id));
  return validateWorld(world);
}
function choose(id: DramaticEventId, choiceId: string) {
  const world = offer(id), command = { type: 'choose' as const, eventId: world.pending!.id, choiceId };
  return { before: world, after: resolveCommand(world, command), command };
}
function suppressed(world: World, id: DramaticEventId) {
  const encoded = JSON.stringify(world, moneyJSON);
  expect(dramaticContext(world, id)).toBeUndefined();
  expect(eligibleTemplates(world).some(row => row.id === id)).toBe(false);
  expect(() => bindEvent(world, scene(id))).toThrow();
  expect(JSON.stringify(world, moneyJSON)).toBe(encoded);
}
const consequence = (world: World) => JSON.stringify([
  world.people, world.relationships, world.accounts, world.ledger, world.cases,
  world.sentences, world.incidents, world.gangs, world.businesses,
  world.businessPayables, world.businessLedger, world.assets, world.sponsorships,
  world.socialAccounts, world.creatorStudios, world.elections, world.careers,
  world.bestFriendships,
], moneyJSON);

test('only the fifteen requested situations and their forty-five choices join the catalogue', () => {
  expect(dramaticTemplates.map(row => row.id)).toEqual(dramaticEventIds);
  expect(eventTemplates.filter(row => row.dramatic)).toEqual(dramaticTemplates);
  expect(dramaticTemplates).toHaveLength(15);
  expect(dramaticTemplates.flatMap(row => row.choices)).toHaveLength(45);
  expect(eventTemplates).toHaveLength(319);
  expect(eventTemplates.flatMap(row => row.choices)).toHaveLength(957);
  for (const template of dramaticTemplates) {
    expect(template.choices).toHaveLength(3);
    expect(['rare', 'uncommon']).toContain(template.rarity);
  }
});

test('the content18 migration changes only the version tags and preserves all saved state and draws', () => {
  const world = employee(), old = JSON.parse(encodeWorld(world)); old.schemaVersion = 41; old.engineVersion = 42; old.contentVersion = 18;
  const migrated = decodeWorld(JSON.stringify(old));
  expect(migrated.contentVersion).toBe(22);
  expect(migrated).toEqual(world);
});

test.each(dramaticEventIds)('%s binds saved people and situation identities without mutating a world or drawing', id => {
  const world = dramaticWorld(id), before = encodeWorld(world), context = dramaticContext(world, id);
  expect(context).toBeDefined();
  expect(dramaticContext(world, id, 'missing-dramatic-subject')).toBeUndefined();
  expect(eligibleTemplates(world)).toContainEqual(scene(id));
  const event = bindEvent(world, scene(id));
  expect(event.body).not.toMatch(/\{\w+\}/);
  expect(event.personIds.every(personId => !!world.people[personId])).toBe(true);
  expect(new Set(event.personIds).size).toBe(event.personIds.length);
  for (const choice of event.choices) {
    expect(choice.effects).toHaveLength(1);
    expect(choice.effects[0]).toMatchObject({ kind: 'dramatic-choice', ruleVersion: ['dramatic-double-fiance', 'dramatic-athlete-doping'].includes(id) ? 2 : 1, eventId: id, choiceId: choice.id, subjectId: context!.subjectId });
    expect(choice.effects[0]).not.toHaveProperty('followUp');
  }
  expect(encodeWorld(world)).toBe(before);
  expect(bindEvent(world, scene(id))).toEqual(event);
});

const choices = dramaticTemplates.flatMap(template => template.choices.map(choice => [template.id as DramaticEventId, choice.id] as const));
test.each(choices)('%s / %s resolves through one command identically live, cold and checkpointed', (id, choiceId) => {
  const world = offer(id), encoded = encodeWorld(world), event = world.pending;
  if (event?.kind !== 'decision') throw new Error('Expected an actual bound decision');
  const choice = event.choices.find(row => row.id === choiceId)!;
  expect(choiceUnavailable(world, choice)).toBeUndefined();
  const checkpointed = unpackCheckpoint(packCheckpoint(world));
  expect(checkpointed).toEqual(world);
  expect(decodeWorld(encoded)).toEqual(world);
  const command = { type: 'choose' as const, eventId: event.id, choiceId };
  const next = resolveCommand(world, command), cold = resolveCommand(decodeWorld(encoded), command), resumed = resolveCommand(checkpointed, command);
  expect(cold).toEqual(next); expect(resumed).toEqual(next);
  expect(encodeWorld(world)).toBe(encoded);
  expect(next.revision).toBe(world.revision + 1);
  expect(consequence(next)).not.toBe(consequence(world));
  const result = [next.pending, ...next.deferred.map(row => row.event)].find(row => row?.id === event.id + '_result');
  expect(result?.kind).toBe('result');
  expect(result?.title).not.toBe('Decision made');
  expect(result?.body).not.toContain('Your actual circumstances determine');
  expect(result?.body).not.toMatch(/\{\w+\}/);
  for (const person of Object.values(next.people)) for (const value of Object.values(person.stats)) {
    expect(Number.isInteger(value)).toBe(true); expect(value).toBeGreaterThanOrEqual(0); expect(value).toBeLessThanOrEqual(100);
  }
  expect(next.storyThreads).toEqual(world.storyThreads);
  expect(decodeWorld(encodeWorld(next))).toEqual(next);
  validateWorld(next);
  const after = encodeWorld(next);
  expect(() => resolveCommand(next, command)).toThrow();
  expect(encodeWorld(next)).toBe(after);
});

test('a generic employed adult has no fiancé, best friend, child, trial, cellmate, business, property, sponsorship, campaign or career scene', () => {
  const world = employee();
  for (const id of dramaticEventIds.filter(id => id !== 'dramatic-boss-criminal')) suppressed(world, id);
});

test('a boss must be a real current saved supervisor; unemployment, a colleague label and absent people do not count', () => {
  const id = 'dramatic-boss-criminal', original = dramaticWorld(id), context = dramaticContext(original, id)!;
  const noJob = copyWorld(original); noJob.people[noJob.activePersonId].employment = null; suppressed(noJob, id);
  const noSupervisor = copyWorld(original); currentWorkplace(noSupervisor)!.members.forEach(row => { if (row.role === 'supervisor') row.role = 'coworker'; }); suppressed(noSupervisor, id);
  for (const state of ['dead', 'away', 'hospital', 'contract'] as const) {
    const world = copyWorld(original), boss = world.people[context.subjectId];
    if (state === 'dead') boss.died = { ...world.date };
    if (state === 'away') boss.city = 'Another city';
    if (state === 'hospital') boss.health.hospitalizedUntil = world.date.year * 12 + world.date.month + 1;
    if (state === 'contract') boss.employment = null;
    suppressed(world, id);
  }
});

test('an ordinary dating partner and ordinary friend cannot trigger engagement and best-friend betrayals', () => {
  const setup = adultSocial();
  suppressed(setup.world, 'dramatic-double-fiance'); suppressed(setup.world, 'dramatic-best-friend-secrets');
  const engaged = dramaticWorld('dramatic-double-fiance'), partner = dramaticContext(engaged, 'dramatic-double-fiance')!.contextId!;
  relationFor(engaged, engaged.activePersonId, partner)!.romance = 'dating'; suppressed(engaged, 'dramatic-double-fiance');
  const best = dramaticWorld('dramatic-best-friend-secrets'); best.bestFriendships = []; suppressed(best, 'dramatic-best-friend-secrets');
});

test.each(['dramatic-double-fiance', 'dramatic-best-friend-secrets', 'dramatic-child-exam-scam', 'dramatic-cellmate-escape', 'dramatic-accomplice-wire', 'dramatic-athlete-doping'] as const)('%s needs the bound living, local and available person', id => {
  const original = dramaticWorld(id), binding = dramaticContext(original, id)!, subjectId = binding.subjectId;
  const personId = id === 'dramatic-double-fiance' || id === 'dramatic-cellmate-escape' ? binding.contextId! : id === 'dramatic-child-exam-scam' ? subjectId : binding.relatedId!;
  for (const state of ['dead', 'away', 'hospital'] as const) {
    const world = copyWorld(original), person = world.people[personId];
    if (state === 'dead') person.died = { ...world.date };
    if (state === 'away') person.city = 'Another city';
    if (state === 'hospital') person.health.hospitalizedUntil = world.date.year * 12 + world.date.month + 1;
    if (id === 'dramatic-accomplice-wire' || id === 'dramatic-athlete-doping') {
      // A different real contact may still qualify for a future new scene.
      const replacement = dramaticContext(world, id);
      if (replacement) expect(replacement.relatedId).not.toBe(personId);
    } else { expect(dramaticContext(world, id, subjectId)).toBeUndefined(); suppressed(world, id); }
  }
});

test('the exam-paper premise requires an actual teen child currently enrolled in secondary education', () => {
  const id = 'dramatic-child-exam-scam', original = dramaticWorld(id), childId = dramaticContext(original, id)!.subjectId;
  expect(ageOn(original.people[childId], original.date)).toBe(15);
  expect(original.people[childId].education.stage).toBe('secondary');
  const noSchool = copyWorld(original); noSchool.people[childId].education.stage = 'none'; suppressed(noSchool, id);
  const adult = copyWorld(original); adult.people[childId].born.year -= 3; suppressed(adult, id);
  const unrelated = copyWorld(original); unrelated.relationships = unrelated.relationships.filter(row => row.to !== childId); suppressed(unrelated, id);
});

const missingSituations: readonly [DramaticEventId, (world: World) => void][] = [
  ['dramatic-courtroom-defence', world => { world.cases.find(row => row.personId === world.activePersonId)!.counsel = 'self'; }],
  ['dramatic-courtroom-defence', world => { world.cases.find(row => row.personId === world.activePersonId)!.status = 'acquitted'; }],
  ['dramatic-cellmate-escape', world => { world.sentences.forEach(row => { row.state = 'released'; }); }],
  ['dramatic-cellmate-escape', world => { world.relationships = world.relationships.filter(row => !row.roles.some(role => role === 'acquaintance' || role === 'friend')); }],
  ['dramatic-accomplice-wire', world => { world.gangs.forEach(row => { row.left = { ...world.date }; }); }],
  ['dramatic-accomplice-wire', world => { world.incidents.forEach(row => { row.stage = 'closed'; }); }],
  ['dramatic-accomplice-wire', world => { world.gangs.forEach(row => { row.contactIds = []; }); }],
  ['dramatic-unpaid-employees', world => { world.businessPayables = []; }],
  ['dramatic-unpaid-employees', world => { world.businesses.forEach(row => { row.staff = []; }); }],
  ['dramatic-suspicious-property', world => { world.assets.forEach(row => { row.listing = null; }); }],
  ['dramatic-suspicious-property', world => { world.assets.forEach(row => { row.ownerId = null; }); }],
  ['dramatic-dishonest-sponsor', world => { world.sponsorships.forEach(row => { row.status = 'declined'; }); }],
  ['dramatic-dishonest-sponsor', world => { world.sponsorships.forEach(row => { row.topic = 'photo'; }); }],
  ['dramatic-dishonest-sponsor', world => { world.sponsorships.forEach(row => { row.expiresMonth = 0; }); }],
  ['dramatic-funeral-stream', world => { world.creatorStudios.forEach(row => { row.crew = []; }); }],
  ['dramatic-funeral-stream', world => { world.sponsorships.forEach(row => { row.status = 'declined'; }); }],
  ['dramatic-funeral-stream', world => { for (const person of Object.values(world.people)) if (person.died) person.died.year -= 2; }],
  ['dramatic-dating-profile', world => { world.relationships.forEach(row => { row.romance = 'none'; row.roles = row.roles.filter(role => role !== 'partner' && role !== 'spouse'); }); }],
  ['dramatic-election-scandal', world => { world.elections.forEach(row => { row.status = 'completed'; }); }],
  ['dramatic-election-scandal', world => { world.elections.forEach(row => { row.electionMonth += 12; }); }],
  ['dramatic-athlete-doping', world => { world.careers.forEach(row => { row.contacts = []; }); }],
  ['dramatic-athlete-doping', world => { world.careers.forEach(row => { row.status = 'between'; }); }],
  ['dramatic-scandal-movie', world => { world.controversies = []; }],
  ['dramatic-scandal-movie', world => { world.careers.forEach(row => row.projects.forEach(project => { project.status = 'cancelled'; })); }],
];
test.each(missingSituations)('%s is suppressed when an actual prerequisite is removed (%#)', (id, remove) => {
  // Deliberately contradictory read-only views test selector refusal. They are
  // never claimed to be valid saves or passed through a domain mutation.
  const world = dramaticWorld(id); remove(world); suppressed(world, id);
});

test('stale bound boss, engagement and sponsorship choices clear without rebinding, domain changes or random draws', () => {
  for (const id of ['dramatic-boss-criminal', 'dramatic-double-fiance', 'dramatic-dishonest-sponsor'] as const) {
    const world = offer(id), event = world.pending;
    if (event?.kind !== 'decision') throw new Error('Expected a bound dramatic decision');
    if (id === 'dramatic-boss-criminal') endEmployment(world);
    if (id === 'dramatic-double-fiance') relationFor(world, world.activePersonId, dramaticContext(world, id)!.contextId!)!.romance = 'dating';
    if (id === 'dramatic-dishonest-sponsor') world.sponsorships.forEach(row => { row.status = 'declined'; });
    const saved = encodeWorld(world);
    const next = resolveCommand(world, { type: 'choose', eventId: event.id, choiceId: event.choices[0].id });
    expect(next.pending?.title).toBe('The situation has changed');
    expect(consequence(next)).toBe(consequence(world));
    expect(next.random).toEqual(world.random);
    expect(encodeWorld(world)).toBe(saved);
  }
});

test('taking hush money transfers an exact bound amount between actual accounts once', () => {
  const { before, after } = choose('dramatic-boss-criminal', 'take'), context = dramaticContext(before, 'dramatic-boss-criminal')!, boss = before.people[context.subjectId];
  const paid = accountFor(after).cash - accountFor(before).cash;
  expect(paid).toBe(context.quote); expect(paid).toBeGreaterThan(0n);
  expect(accountFor(after, after.people[boss.id]).cash).toBe(accountFor(before, boss).cash - paid);
});

test('ending the engagement changes the actual romantic edge; ending best friendship closes its actual agreement', () => {
  const engagement = choose('dramatic-double-fiance', 'end'), partnerId = dramaticContext(engagement.before, 'dramatic-double-fiance')!.contextId!;
  expect(relationFor(engagement.after, engagement.after.activePersonId, partnerId)!.romance).toBe('ex');
  const friendship = choose('dramatic-best-friend-secrets', 'cut');
  expect(friendship.after.bestFriendships.find(row => row.id === friendship.before.bestFriendships.find(row => row.status === 'active')!.id)!.status).toBe('ended');
});

test.each(['cut', 'expose'])('best-friend betrayal / %s ends the real agreement and ordinary friendship while preserving consent history', choiceId => {
  const { before, after } = choose('dramatic-best-friend-secrets', choiceId), context = dramaticContext(before, 'dramatic-best-friend-secrets')!, agreement = before.bestFriendships.find(row => row.id === context.subjectId)!;
  expect(after.bestFriendships.find(row => row.id === agreement.id)).toEqual({ ...agreement, status: 'ended', ended: before.date, endReason: 'choice', endedById: before.activePersonId });
  const edge = relationFor(after, after.activePersonId, context.relatedId!)!;
  expect(edge.roles).not.toContain('friend');
  expect(edge.trust).toBe(0);
  expect(edge.strength).toBeLessThan(10);
  expect(edge.id).toBe(context.contextId);
});

test('pleading guilty actually resolves the bound serious case and an escape attempt records an actual incident', () => {
  const court = choose('dramatic-courtroom-defence', 'guilty'), item = court.after.cases.find(row => row.personId === court.after.activePersonId)!;
  expect(item.status).toBe('convicted'); expect(item.plea).toBe('guilty'); expect(item.resolved).toEqual(court.before.date);
  expect(item.sentenceId).not.toBeNull(); expect(item.fine.minor).toBeGreaterThan(0n);
  const escape = choose('dramatic-cellmate-escape', 'join');
  expect(escape.after.incidents.filter(row => row.personId === escape.after.activePersonId && row.offence === 'escape')).toHaveLength(escape.before.incidents.filter(row => row.personId === escape.before.activePersonId && row.offence === 'escape').length + 1);
  expect(escape.after.sentences.find(row => row.id === activeSentence(escape.before)!.id)!.servedMonths).toBe(activeSentence(escape.before)!.servedMonths);
});

test('business funding and the doubled property offer move recorded money; a sponsorship acceptance grants no upfront cash', () => {
  const investment = choose('dramatic-unpaid-employees', 'invest');
  expect(accountFor(investment.after).cash).toBeLessThan(accountFor(investment.before).cash);
  const invested = dramaticContext(investment.before, 'dramatic-unpaid-employees')!.quote!;
  expect(investment.after.businesses[0].cash).toBe(investment.before.businesses[0].cash + invested);
  expect(investment.after.businessPayables).toEqual(investment.before.businessPayables);
  const sale = choose('dramatic-suspicious-property', 'accept'), propertyId = dramaticContext(sale.before, 'dramatic-suspicious-property')!.subjectId;
  expect(sale.after.assets.find(row => row.id === propertyId)!.ownerId).toBeNull();
  expect(accountFor(sale.after).cash).toBeGreaterThan(accountFor(sale.before).cash);
  const sponsor = choose('dramatic-dishonest-sponsor', 'accept');
  expect(accountFor(sponsor.after).cash).toBe(accountFor(sponsor.before).cash);
  expect(sponsor.after.sponsorships.find(row => row.status === 'active')).toMatchObject({ earned: 0n, termMonths: 6, requiredPosts: 2 });
});

const opportunities = [
  ['dramatic-courtroom-defence', 'court-hearing'],
  ['dramatic-accomplice-wire', null],
  ['dramatic-unpaid-employees', null],
  ['dramatic-suspicious-property', 'property-sale-offer'],
  ['dramatic-dishonest-sponsor', 'brand-offer'],
  ['dramatic-funeral-stream', null],
  ['dramatic-election-scandal', null],
] as const;
test.each(opportunities)('%s is reachable through its real opportunity generator with a fixed rare draw and preserves the ordinary fallback', (id, fallback) => {
  // Exact declared RNG boundaries: one actual domain action/period per case,
  // no retrying the generator or claim about a natural encounter frequency.
  expect(randomInteger(7, 1, 100).value).toBe(2);
  const dramatic = dramaticWorld(id, 7), ordinary = dramaticWorld(id, 1);
  expect(dramatic.pending).toMatchObject({ kind: 'decision', templateId: id });
  expect(dramatic.eventHistory.filter(row => row.templateId === id)).toEqual([{ templateId: id, year: dramatic.date.year }]);
  expect(dramatic.random.events).toBe(randomInteger(7, 1, 100).state);
  expect(dramaticWorld(id, 7)).toEqual(dramatic);
  expect([ordinary.pending, ...ordinary.deferred.map(row => row.event)].some(row => row?.kind === 'decision' && row.templateId === id)).toBe(false);
  expect(ordinary.eventHistory.some(row => row.templateId === id)).toBe(false);
  expect(ordinary.random.events).toBe(randomInteger(1, 1, 100).state);
  if (fallback) expect(ordinary.pending).toMatchObject({ kind: 'decision', templateId: fallback });
  if (id === 'dramatic-accomplice-wire') expect(ordinary.pending?.title).toBe('An unresolved risk');
  if (id === 'dramatic-unpaid-employees') expect(ordinary.pending?.title).toBe('Cash flow under pressure');
  if (id === 'dramatic-funeral-stream') expect(ordinary.socialAccounts.flatMap(row => row.posts).some(row => row.sponsored && row.liveMinutes === 60 && /memorial/.test(row.caption))).toBe(true);
  if (id === 'dramatic-election-scandal') expect(ordinary.pending).toBeNull();
  expect(decodeWorld(encodeWorld(dramatic))).toEqual(dramatic);
  expect(decodeWorld(encodeWorld(ordinary))).toEqual(ordinary);
});

test('opportunity generation respects the saved five-year cooldown and duplicate queue before drawing', () => {
  const world = dramaticWorld('dramatic-boss-criminal'); world.random.events = 7;
  expect(offerDramaticEvent(world, 'dramatic-boss-criminal', 60)).toBe(true);
  const after = world.random.events;
  expect(offerDramaticEvent(world, 'dramatic-boss-criminal', 60)).toBe(false);
  expect(world.random.events).toBe(after);
  const history = world.eventHistory; world.eventHistory = [];
  expect(offerDramaticEvent(world, 'dramatic-boss-criminal', 60)).toBe(false);
  expect(world.random.events).toBe(after); world.eventHistory = history;
  world.pending = null; world.pendingPriority = 0; world.date.year += 4;
  expect(offerDramaticEvent(world, 'dramatic-boss-criminal', 60)).toBe(false);
  expect(world.random.events).toBe(after);
  world.date.year++; world.random.events = 7;
  expect(offerDramaticEvent(world, 'dramatic-boss-criminal', 60)).toBe(true);
  expect(world.eventHistory.filter(row => row.templateId === 'dramatic-boss-criminal')).toHaveLength(2);
  const unavailable = employee(), random = { ...unavailable.random };
  expect(offerDramaticEvent(unavailable, 'dramatic-child-exam-scam', 60)).toBe(false);
  expect(unavailable.random).toEqual(random);
});

test('a targeted property opportunity binds its own recorded offer when another property also qualifies', () => {
  let world = dramaticWorld('dramatic-suspicious-property');
  const firstId = dramaticContext(world, 'dramatic-suspicious-property')!.subjectId;
  const home = assetCatalog.find(row => row.kind === 'property')!;
  world = drainStorySetup(resolveCommand(world, { type: 'buy-asset', catalogId: home.id, financing: 'cash', depositBps: 10000, termMonths: 120, quotedPrice: assetPrice(world, home) }));
  const second = world.assets.find(row => row.id !== firstId && row.kind === 'property')!;
  world = drainStorySetup(resolveCommand(world, { type: 'list-property', assetId: second.id, askingPrice: second.value }));
  world.assets.find(row => row.id === second.id)!.listing!.offer = second.value * 2n;
  world.random.events = 7;
  expect(offerDramaticEvent(world, 'dramatic-suspicious-property', 40, 'second-property-offer', 'missing-property')).toBe(false);
  expect(world.random.events).toBe(7);
  expect(offerDramaticEvent(world, 'dramatic-suspicious-property', 40, 'second-property-offer', second.id)).toBe(true);
  expect(world.pending).toMatchObject({ kind: 'decision', id: 'second-property-offer' });
  if (world.pending?.kind !== 'decision') throw new Error('Expected the second property offer');
  for (const choice of world.pending.choices) expect(choice.effects[0]).toMatchObject({ subjectId: second.id, quote: second.value * 2n });
  expect(world.assets.find(row => row.id === firstId)!.listing!.offer).not.toBeNull();
  validateWorld(world);
});
