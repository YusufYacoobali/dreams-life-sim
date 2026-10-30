import { decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { recordDeath, resolveCommand } from '../../src/game/engine';
import { monthFrom } from '../../src/game/calendar';
import { prisonStories } from '../../src/game/content/prisonStories';
import { activeSentence, legalMonth, prisonContacts } from '../../src/game/systems/legal';
import { accountFor, availableCash, post } from '../../src/game/systems/common';
import { enableOverhaul } from '../../src/game/systems/overhaul';
import { prisonActionReason, prisonFamilyReason, prisonGroup, prisonLife, prisonMonth, prisonSecurity, refreshPrison } from '../../src/game/systems/prison';
import { relationFor } from '../../src/game/systems/relationshipQueries';
import { addChild } from '../../src/game/systems/family';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { escapePrisoner } from '../support/prisonEscape';

let base: string;
beforeAll(() => { const world = escapePrisoner(); enableOverhaul(world); base = encodeWorld(validateWorld(world)); });
function fixture() { return decodeWorld(base); }
function ack(world: World) {
  if (world.pending?.kind !== 'result') throw new Error('Expected result: ' + world.pending?.kind);
  return resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
}
function choose(world: World, choiceId: string) {
  if (world.pending?.kind !== 'decision') throw new Error('Expected decision');
  return resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId });
}
function nextActionYear(world: World) { world.date.year++; return validateWorld(world); }
function acquainted() {
  let world = fixture(); const target = prisonContacts(world)[0];
  world = ack(resolveCommand(world, { type: 'prison-action', personId: target.id, action: 'talk' }));
  return { world, targetId: target.id };
}
function offerStory(id: string) {
  const { world } = acquainted(), life = prisonLife(world)!;
  life.seenStoryIds = prisonStories.filter(story => story.id !== id).map(story => story.id);
  activeSentence(world)!.routine = { work: true, study: true, exercise: true, conduct: 'quiet' };
  activeSentence(world)!.behavior = 20;
  for (let seed = 1; seed < 100; seed++) {
    const candidate = decodeWorld(encodeWorld(world)); candidate.random.events = seed; prisonMonth(candidate);
    if (candidate.pending?.kind === 'decision' && candidate.pending.templateId === id) return validateWorld(candidate);
  }
  throw new Error('Could not offer story ' + id);
}

test('classification uses actual offences, remaining conduct and term, without changing old sentences', () => {
  const world = fixture(), sentence = activeSentence(world)!, original = encodeWorld(world);
  sentence.behavior = 80; expect(prisonSecurity(world)).toBe('low');
  sentence.behavior = 35; expect(prisonSecurity(world)).toBe('medium');
  sentence.behavior = 10; expect(prisonSecurity(world)).toBe('high');
  sentence.behavior = 80; const court = world.cases.find(item => sentence.caseIds.includes(item.id))!; court.offence = 'assault';
  expect(prisonSecurity(world)).toBe('high');
  expect(decodeWorld(original).sentences[0]).toEqual(fixture().sentences[0]);
});

test('talk establishes a named connection; limits and incompatible direct commands cannot mutate the previous world', () => {
  const world = fixture(), target = prisonContacts(world)[0], encoded = encodeWorld(world);
  const next = resolveCommand(world, { type: 'prison-action', personId: target.id, action: 'talk' });
  expect(encodeWorld(world)).toBe(encoded);
  expect(relationFor(next, next.activePersonId, target.id)).toMatchObject({ strength: 39, trust: 39 });
  expect(prisonLife(next)!.contacts[0].personId).toBe(target.id);
  expect(decodeWorld(encodeWorld(next))).toEqual(next);
  const ready = ack(next), before = encodeWorld(ready);
  expect(() => resolveCommand(ready, { type: 'prison-action', personId: target.id, action: 'talk' })).toThrow(/already/i);
  expect(() => resolveCommand(ready, { type: 'prison-action', personId: 'person_parent1', action: 'talk' })).toThrow(/unit/);
  expect(encodeWorld(ready)).toBe(before);
});

test('trust, history and standing gate distinct inmate actions at the engine boundary', () => {
  const world = fixture(), target = prisonContacts(world)[0];
  expect(prisonActionReason(world, target.id, 'offer-protection')).toMatch(/50%/);
  expect(prisonActionReason(world, target.id, 'ask-protection')).toMatch(/trusts/);
  expect(prisonActionReason(world, target.id, 'exchange-favours')).toMatch(/45%/);
  expect(prisonActionReason(world, target.id, 'report')).toMatch(/no recorded/);
  expect(prisonActionReason(world, target.id, 'challenge')).toMatch(/rival/);
  expect(prisonActionReason(world, target.id, 'repair')).toMatch(/no recorded/);
  for (const action of ['offer-protection', 'ask-protection', 'exchange-favours', 'report', 'challenge', 'repair'] as const) expect(() => resolveCommand(world, { type: 'prison-action', personId: target.id, action })).toThrow();
  const free = fixture(); activeSentence(free)!.state = 'released'; free.sentences[0].ended = { ...free.date }; free.sentences[0].releaseReason = 'parole';
  expect(() => resolveCommand(free, { type: 'prison-action', personId: target.id, action: 'talk' })).toThrow(/sentence/);
});

test('insults form a persistent rivalry; repairing it can be accepted or refused according to the saved roll', () => {
  const targetId = prisonContacts(fixture())[0].id;
  let world = ack(resolveCommand(fixture(), { type: 'prison-action', personId: targetId, action: 'insult' }));
  expect(prisonLife(world)!.contacts[0].rivalry).toBe(true);
  world = nextActionYear(world);
  relationFor(world, world.activePersonId, targetId)!.trust = 85; relationFor(world, world.activePersonId, targetId)!.strength = 85;
  const outcomes = new Set<boolean>();
  for (let seed = 1; seed < 100 && outcomes.size < 2; seed++) { const candidate = decodeWorld(encodeWorld(world)); candidate.random.outcomes = seed; const next = resolveCommand(candidate, { type: 'prison-action', personId: targetId, action: 'repair' }); outcomes.add(prisonLife(next)!.interactions.at(-1)!.accepted); expect(decodeWorld(encodeWorld(next))).toEqual(next); }
  expect(outcomes).toEqual(new Set([true, false]));
});

test('challenging a rival injures both real people, reduces conduct and creates a second case without replacing the sentence', () => {
  const targetId = prisonContacts(fixture())[0].id;
  let world = ack(resolveCommand(fixture(), { type: 'prison-action', personId: targetId, action: 'insult' })); world = nextActionYear(world);
  const before = activeSentence(world)!, sentenceId = before.id, actorHealth = world.people[world.activePersonId].stats.health, victimHealth = world.people[targetId].stats.health, count = world.cases.length;
  world = resolveCommand(world, { type: 'prison-action', personId: targetId, action: 'challenge' });
  expect(activeSentence(world)!.id).toBe(sentenceId); expect(activeSentence(world)!.behavior).toBeLessThan(before.behavior);
  expect(world.people[world.activePersonId].stats.health).toBeLessThan(actorHealth); expect(world.people[targetId].stats.health).toBeLessThan(victimHealth);
  expect(world.cases).toHaveLength(count + 1); expect(world.cases.at(-1)).toMatchObject({ offence: 'assault', personId: world.activePersonId });
  expect(decodeWorld(encodeWorld(world))).toEqual(world);
});

test('protection and favours require consent and retain the actual helper identity', () => {
  let { world, targetId } = acquainted(); world = nextActionYear(world);
  const relation = relationFor(world, world.activePersonId, targetId)!; relation.trust = 95; relation.strength = 95; world.people[targetId].stats.fitness = 90; world.random.outcomes = 1;
  world = ack(resolveCommand(world, { type: 'prison-action', personId: targetId, action: 'ask-protection' }));
  expect(prisonLife(world)!.contacts[0]).toMatchObject({ personId: targetId, protection: 'received' });
  world = nextActionYear(world); world.random.outcomes = 1;
  world = ack(resolveCommand(world, { type: 'prison-action', personId: targetId, action: 'exchange-favours' }));
  expect(prisonLife(world)!.contacts[0].favours).toBe(1); expect(prisonLife(world)!.influence).toBe(24);
  expect(decodeWorld(encodeWorld(world))).toEqual(world);
  world = nextActionYear(world);
  world = ack(resolveCommand(world, { type: 'prison-action', personId: targetId, action: 'insult' }));
  expect(prisonLife(world)!.contacts[0]).toMatchObject({ protection: 'none', favours: 0, rivalry: true });
});

test('outside and prison affiliations coexist, group progression needs earned influence and release only ends the prison membership', () => {
  let world = fixture();
  // A genuine historical outside gang record survives imprisonment without being a second prison group.
  const actor = world.people[world.activePersonId], outsideId = 'gang_outside_fixture';
  world.gangs.push({ id: outsideId, personId: actor.id, kind: 'street', name: 'The Night Exchange', sentenceId: null, joined: { ...world.date }, left: null, rank: 1, standing: 50, contactIds: [], lastIncomeMonth: world.date.year * 12 + world.date.month - 1 }); actor.legal.gangId = outsideId;
  world = ack(resolveCommand(world, { type: 'prison-group', action: 'join' }));
  expect(world.people[world.activePersonId].legal.gangId).toBe(outsideId); expect(prisonGroup(world)).toBeDefined();
  expect(() => resolveCommand(world, { type: 'prison-group', action: 'promote' })).toThrow(/loyalty|influence/);
  world = ack(resolveCommand(world, { type: 'prison-routine', routine: { work: false, study: false, exercise: true, conduct: 'gang' } }));
  for (let year = 0; year < 3; year++) { world = nextActionYear(world); world = ack(resolveCommand(world, { type: 'prison-group', action: 'contribute' })); }
  world = nextActionYear(world); world = ack(resolveCommand(world, { type: 'prison-group', action: 'promote' }));
  expect(prisonGroup(world)!.rank).toBe(1);
  const groupId = prisonGroup(world)!.id;
  const sentence = activeSentence(world)!; sentence.behavior = 100; sentence.servedMonths = Math.ceil(sentence.totalMonths / 2); sentence.appealRoll = 1;
  // An appeal releases via canonical legal machinery and preserves the separate outside affiliation.
  world = ack(resolveCommand(world, { type: 'appeal' }));
  expect(world.gangs.find(item => item.id === groupId)!.left).not.toBeNull(); expect(world.gangs.find(item => item.id === outsideId)!.left).toBeNull(); expect(world.people[world.activePersonId].legal.gangId).toBe(outsideId);
  expect(decodeWorld(encodeWorld(world))).toEqual(world);
});

test('betrayal leaves an actual rival and persistent loss of trust without replacing outside contacts', () => {
  let world = ack(resolveCommand(fixture(), { type: 'prison-group', action: 'join' })); const ids = [...prisonGroup(world)!.contactIds];
  world = ack(resolveCommand(world, { type: 'prison-group', action: 'betray' }));
  expect(prisonGroup(world)).toBeUndefined(); expect(prisonLife(world)!.contacts.filter(item => ids.includes(item.personId)).every(item => item.rivalry)).toBe(true);
  expect(ids.every(id => relationFor(world, world.activePersonId, id)!.trust < 35)).toBe(true);
  expect(decodeWorld(encodeWorld(world))).toEqual(world);
});

test('letters are available to genuine children; visits and support enforce adult, location and availability rules', () => {
  let world = fixture(); const actor = world.people[world.activePersonId], child = addChild(world, [actor], 'adoptive', 4);
  expect(prisonFamilyReason(world, child.id, 'visit')).toMatch(/adult/); expect(prisonFamilyReason(world, child.id, 'support')).toMatch(/adult/);
  world = ack(resolveCommand(world, { type: 'prison-family-contact', personId: child.id, action: 'letter' }));
  expect(prisonLife(world)!.familyContacts[0]).toMatchObject({ personId: child.id, action: 'letter', accepted: true, amount: 0n });
  const parent = world.people.person_parent1; parent.city = 'A distant city';
  expect(prisonFamilyReason(world, parent.id, 'visit')).toMatch(/city/);
  expect(() => resolveCommand(world, { type: 'prison-family-contact', personId: parent.id, action: 'visit' })).toThrow(/city/);
});

test('support transfers only affordable donor funds and retry produces the same consent and exact two ledger entries', () => {
  const initial = fixture(), parent = initial.people.person_parent1, relation = relationFor(initial, initial.activePersonId, parent.id)!;
  relation.strength = 100; relation.trust = 100; parent.traits = ['kind']; initial.random.outcomes = 1;
  const donor = accountFor(initial, parent), recipient = accountFor(initial), before = donor.cash + recipient.cash, original = encodeWorld(initial);
  const command = { type: 'prison-family-contact' as const, personId: parent.id, action: 'support' as const }, next = resolveCommand(initial, command);
  expect(resolveCommand(initial, command)).toEqual(next); expect(encodeWorld(initial)).toBe(original);
  const transfer = prisonLife(next)!.familyContacts[0]; expect(transfer.amount).toBeGreaterThan(0n); expect(transfer.transactionIds).toHaveLength(2);
  expect(accountFor(next, next.people[parent.id]).cash + accountFor(next).cash).toBe(before);
  expect(decodeWorld(encodeWorld(next))).toEqual(next);
  post(initial, -availableCash(donor), 0n, 'fixture', 'Remove available donor funding', null, parent, donor.currency);
  const unfunded = resolveCommand(initial, command); expect(prisonLife(unfunded)!.familyContacts[0].amount).toBe(0n); expect(prisonLife(unfunded)!.familyContacts[0].transactionIds).toEqual([]);
});

test.each(prisonStories.map(story => [story.id]))('%s offers only real context and every authored choice applies its saved effects after reload', id => {
  const world = offerStory(id), scene = prisonLife(world)!.scenes[0], original = encodeWorld(world), checkpoint = packCheckpoint(world);
  expect(scene.templateId).toBe(id); expect(scene.title).toBe(world.pending?.title); expect(scene.body).not.toContain('{name}');
  for (const choice of scene.choices) {
    const beforeConduct = activeSentence(world)!.behavior, beforeStanding = prisonLife(world)!.standing, beforeStress = world.people[world.activePersonId].stats.stress;
    const next = choose(decodeWorld(original), choice.id), bound = prisonLife(next)!.scenes[0];
    expect(bound).toMatchObject({ status: 'resolved', choiceId: choice.id });
    expect(activeSentence(next)!.behavior).toBe(Math.max(0, Math.min(100, beforeConduct + choice.changes.conduct)));
    expect(prisonLife(next)!.standing).toBe(Math.max(0, Math.min(100, beforeStanding + choice.changes.standing)));
    expect(next.people[next.activePersonId].stats.stress).toBe(Math.max(0, Math.min(100, beforeStress + choice.changes.stress)));
    const result = [next.pending, ...next.deferred.map(item => item.event)].find(event => event?.id === scene.id + '_result');
    expect(result?.body).toBe(choice.body); expect(next.journal.at(-1)!.text).toBe(choice.journal); expect(decodeWorld(encodeWorld(next))).toEqual(next);
    if (choice.consequence === 'assault') { expect(next.pending).toMatchObject({ kind: 'decision', templateId: 'arrest' }); expect(next.cases.at(-1)?.offence).toBe('assault'); }
  }
  expect(encodeWorld(world)).toBe(original); expect(unpackCheckpoint(checkpoint)).toEqual(world);
});

test('a dead bound inmate cancels the original story factually without using another inmate or the original success prose', () => {
  const world = offerStory('prison-quiet-friend'), scene = prisonLife(world)!.scenes[0], id = scene.participantId!;
  recordDeath(world, id, 'test natural death'); refreshPrison(world); validateWorld(world);
  expect(world.pending?.kind === 'decision' && world.pending.personIds).not.toContain(id);
  const next = choose(decodeWorld(encodeWorld(world)), 'sit');
  expect(prisonLife(next)!.scenes[0].status).toBe('cancelled'); expect(next.pending?.title).toBe('Circumstances changed'); expect(next.pending?.body).not.toBe(scene.choices[0].body);
  expect(next.journal.at(-1)!.text).toMatch(/could not continue/); expect(decodeWorld(encodeWorld(next))).toEqual(next);
});

test('stories respect quiet years, family/work eligibility and once-per-person annual cooldowns', () => {
  const original = fixture(), random = { ...original.random }; delete original.overhaulVersion; delete original.prisonLives; prisonMonth(original); expect(original.random).toEqual(random);
  const empty = fixture(); empty.sentences[0].state = 'released'; empty.sentences[0].ended = { ...empty.date }; empty.sentences[0].releaseReason = 'parole'; const freeRandom = { ...empty.random }; prisonMonth(empty); expect(empty.random).toEqual(freeRandom);
  const offered = offerStory('prison-invisible-border'), scene = prisonLife(offered)!.scenes[0];
  let world = ack(choose(offered, scene.choices[0].id)); const beforeCount = prisonLife(world)!.scenes.length, beforeRandom = { ...world.random };
  prisonMonth(world); expect(prisonLife(world)!.scenes).toHaveLength(beforeCount); expect(world.random).toEqual(beforeRandom);
  // Eligibility can be inspected through actual offers without silently changing routine.
  let withOffer: World | undefined;
  for (let seed = 1; seed < 100; seed++) { const candidate = fixture(); candidate.random.events = seed; prisonMonth(candidate); if (candidate.pending?.kind === 'decision') { withOffer = candidate; break; } }
  expect(withOffer).toBeDefined();
  const pending = withOffer!.pending;
  if (pending?.kind !== 'decision') throw new Error('Expected eligible prison decision');
  const definition = prisonStories.find(story => story.id === pending.templateId)!;
  expect(['work', 'study', 'high']).not.toContain(definition.context);
});
