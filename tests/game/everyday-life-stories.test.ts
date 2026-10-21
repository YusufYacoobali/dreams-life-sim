import { everydayLifeTemplates } from '../../src/game/content/everydayLifeStories';
import { bindEvent, eligibleTemplates, eventTemplates } from '../../src/game/content/events';
import { countryCodes } from '../../src/game/countries';
import { ageOn, decodeWorld, encodeWorld, fullName, validateWorld, type World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { offerPending } from '../../src/game/pendingQueue';
import { relationFor } from '../../src/game/systems/relationships';
import { lifeStoryAvailable, lifeStoryContexts } from '../../src/game/systems/lifeStoryContext';
import { lifeStoryWorld } from '../support/lifeStory';
import { specialStoryWorld } from '../support/specialStory';
import type { EventTemplate } from '../../src/game/content/eventTypes';
import { activeHobbyPlan } from '../../src/game/systems/leisureSchemas';
import { monthFrom } from '../../src/game/calendar';

const setup = (template: EventTemplate) => template.specialCareer ? specialStoryWorld(template) : lifeStoryWorld('US', template.hobby && template.hobby !== 'any' ? template.hobby : 'guitar');
const offered = (world: World, template: EventTemplate) => { const event = bindEvent(world, template); offerPending(world, event); return { world, event }; };

test('265 unique source situations retain125 everyday scenes/375 choices with explicit context and no interview/report inflation', () => {
  expect(eventTemplates).toHaveLength(265); expect(everydayLifeTemplates).toHaveLength(125); expect(everydayLifeTemplates.flatMap(t => t.choices)).toHaveLength(375);
  for (const key of ['id', 'title', 'body'] as const) expect(new Set(eventTemplates.map(t => t[key])).size).toBe(265);
  for (const template of everydayLifeTemplates) {
    expect(template.local).toBe(true); expect(template.min).toBeLessThanOrEqual(template.max); expect(template.choices).toHaveLength(3); expect(new Set(template.choices.map(c => c.id)).size).toBe(3);
    const text = JSON.stringify(template);
    for (const [token, flag] of [['child', 'child'], ['pet', 'pet'], ['hobby', 'hobby'], ['destination', 'visited'], ['condition', 'chronicCondition'], ['coworker', 'coworker'], ['supervisor', 'supervisor'], ['friend', 'friend']] as const) if (text.includes('{' + token + '}')) expect(template[flag]).toBeTruthy();
    if (template.choices.some(c => c.childBond)) expect(template.child).toBeTruthy(); if (template.choices.some(c => c.petBond)) expect(template.pet).toBeTruthy();
  }
});

test.each(everydayLifeTemplates.map(template => [template.id, template] as const))('%s binds its existing context without draws and all three branches apply exact bounded effects once', (_id, template) => {
  const initial = setup(template), before = encodeWorld(initial); expect(eligibleTemplates(initial)).toContainEqual(template);
  const event = bindEvent(initial, template); expect(encodeWorld(initial)).toBe(before); expect(JSON.stringify(event)).not.toMatch(/\{(?:child|pet|hobby|destination|condition|coworker|supervisor|friend|salary)\}/);
  if (template.child) { const id = event.personIds.find(id => id !== initial.activePersonId)!; const ages = { baby: [0, 2], young: [3, 11], teen: [12, 17], adult: [18, 200] }; expect(ageOn(initial.people[id], initial.date)).toBeGreaterThanOrEqual(ages[template.child][0]); expect(ageOn(initial.people[id], initial.date)).toBeLessThanOrEqual(ages[template.child][1]); expect(event.body).toContain(fullName(initial.people[id])); expect(relationFor(initial, initial.activePersonId, id)?.roles).toContain('parent'); }
  for (const choice of event.choices) {
    const input = decodeWorld(before); offerPending(input, event); const result = resolveCommand(input, { type: 'choose', eventId: event.id, choiceId: choice.id }, true);
    expect(result.random).toEqual(initial.random); expect(result.date).toEqual(initial.date); expect(result.accounts).toEqual(initial.accounts); expect(result.ledger).toEqual(initial.ledger); expect(result.assets).toEqual(initial.assets); expect(result.hobbies).toEqual(initial.hobbies); expect(result.trips).toEqual(initial.trips); expect(result.workHistory).toEqual(initial.workHistory); expect(result.careers).toEqual(initial.careers); expect(result.serviceCareers).toEqual(initial.serviceCareers); expect(result.creatorStudios).toEqual(initial.creatorStudios); expect(result.royalHouses).toEqual(initial.royalHouses);
    expect(Object.keys(result.people)).toEqual(Object.keys(initial.people));
    for (const person of Object.values(initial.people)) {
      if (person.id !== initial.activePersonId) expect(result.people[person.id]).toEqual(person);
      else { const { stats, ...rest } = person, { stats: nextStats, ...nextRest } = result.people[person.id]; expect(nextRest).toEqual(rest); for (const key of Object.keys(stats) as (keyof typeof stats)[]) { const effect = choice.effects.find(e => e.kind === 'stat' && e.personId === person.id && e.stat === key); expect(nextStats[key]).toBe(effect?.kind === 'stat' ? Math.max(0, Math.min(100, stats[key] + effect.delta)) : stats[key]); } }
    }
    for (const edge of initial.relationships) { const effect = choice.effects.find(e => e.kind === 'relationship' && e.relationshipId === edge.id); const expected = effect?.kind === 'relationship' ? { ...edge, strength: Math.max(0, Math.min(100, edge.strength + effect.delta)) } : edge; expect(result.relationships.find(e => e.id === edge.id)).toEqual(expected); }
    for (const pet of initial.pets) { const effect = choice.effects.find(e => e.kind === 'pet-bond' && e.petId === pet.id); const expected = effect?.kind === 'pet-bond' ? { ...pet, bonds: { ...pet.bonds, [effect.personId]: Math.max(0, Math.min(100, (pet.bonds[effect.personId] ?? 0) + effect.delta)) } } : pet; expect(result.pets.find(p => p.id === pet.id)).toEqual(expected); }
    expect(choice.effects.every(e => ['stat', 'relationship', 'pet-bond'].includes(e.kind))).toBe(true); expect(result.pending).toMatchObject({ kind: 'result', title: choice.resultTitle, body: choice.resultBody }); expect(result.journal.at(-1)?.text).toBe(choice.journal); expect(decodeWorld(encodeWorld(result))).toEqual(result);
    expect(() => resolveCommand(result, { type: 'choose', eventId: event.id, choiceId: choice.id })).toThrow();
    const done = resolveCommand(result, { type: 'acknowledge', resultId: result.pending!.id }, true); expect(done.people).toEqual(result.people); expect(done.pets).toEqual(result.pets); expect(done.random).toEqual(result.random); expect(done.relationships).toEqual(result.relationships);
  }
}, 30000);

test.each(countryCodes)('%s reads actual family/pet/hobby/home/trip/condition context without generating people, charges or RNG', country => {
  const world = lifeStoryWorld(country), before = encodeWorld(world), available = eligibleTemplates(world).filter(t => everydayLifeTemplates.includes(t)); expect(available).toHaveLength(109);
  for (const template of available) { const event = bindEvent(world, template); expect(event.personIds.every(id => !!world.people[id])).toBe(true); expect(JSON.stringify(event)).not.toMatch(/\{(?:child|pet|hobby|destination|condition|coworker|supervisor|friend|salary)\}/); }
  expect(encodeWorld(world)).toBe(before);
});

test.each(['hospital', 'wanted', 'dead'] as const)('an unavailable %s player gets none of the new local scenes', absence => {
  const world = lifeStoryWorld(), player = world.people[world.activePersonId]; if (absence === 'hospital') player.health.hospitalizedUntil = world.date.year * 12 + world.date.month + 2; if (absence === 'wanted') player.legal.wanted = true; if (absence === 'dead') player.died = { ...world.date };
  const context = lifeStoryContexts(world); for (const template of everydayLifeTemplates) { expect(lifeStoryAvailable(context, template)).toBe(false); expect(() => bindEvent(world, template)).toThrow(/context|workplace|adult/); }
});

test('minor children require the actual household; adult children remain eligible locally and guardianship counts as care', () => {
  const world = lifeStoryWorld(), player = world.people[world.activePersonId], young = world.relationships.find(e => e.from === player.id && e.roles.includes('parent') && ageOn(world.people[e.to], world.date) >= 3 && ageOn(world.people[e.to], world.date) <= 11)!, adult = world.relationships.find(e => e.from === player.id && e.roles.includes('parent') && ageOn(world.people[e.to], world.date) >= 18)!;
  world.people[young.to].householdId = null; world.people[adult.to].householdId = null; expect(eligibleTemplates(world).some(t => t.child === 'young')).toBe(false); expect(eligibleTemplates(world).some(t => t.child === 'adult')).toBe(true);
  world.people[young.to].householdId = player.householdId; young.kind = 'guardian'; young.roles = ['guardian']; young.parentType = 'guardian'; expect(eligibleTemplates(world).some(t => t.child === 'young')).toBe(true);
  world.people[young.to].city = 'Elsewhere'; expect(eligibleTemplates(world).some(t => t.child === 'young')).toBe(false);
});

test('a household child can bind the real family pet; owner absence, inactive pets and missing records cannot supply substitutes', () => {
  const world = lifeStoryWorld(), ownerId = world.activePersonId, child = Object.values(world.people).find(p => ageOn(p, world.date) === 7)!; world.activePersonId = child.id;
  const template = everydayLifeTemplates.find(t => t.id === 'pet-familiar-presence')!, event = bindEvent(world, template); expect(event.choices[0].effects).toContainEqual(expect.objectContaining({ kind: 'pet-bond', petId: world.pets[0].id, personId: child.id }));
  world.people[ownerId].health.hospitalizedUntil = world.date.year * 12 + world.date.month + 2; expect(eligibleTemplates(world).some(t => t.pet)).toBe(false); world.people[ownerId].health.hospitalizedUntil = null;
  for (const pet of world.pets) pet.status = 'rehomed'; expect(eligibleTemplates(world).some(t => t.pet)).toBe(false); expect(() => bindEvent(world, template)).toThrow(/context/);
});

test('a hobby needs its current plan and recent attended practice; a mere enrolment or old/declined practice is insufficient', () => {
  const fresh = lifeStoryWorld('US', 'guitar', false); expect(eligibleTemplates(fresh).some(t => t.hobby)).toBe(false);
  const world = lifeStoryWorld(); expect(eligibleTemplates(world).filter(t => t.hobby)).toHaveLength(3); activeHobbyPlan(world.hobbies[0])!.status = 'stopped'; expect(eligibleTemplates(world).some(t => t.hobby)).toBe(false);
  const old = lifeStoryWorld(); old.date = monthFrom(old.date, 13); expect(eligibleTemplates(old).some(t => t.hobby)).toBe(false);
});

test('only completed participant travel and diagnosed long-term active conditions supply their memory scenes', () => {
  const world = lifeStoryWorld(), trip = world.trips[0], condition = world.people[world.activePersonId].health.conditions.find(c => c.type === 'asthma')!;
  trip.status = 'returned'; expect(eligibleTemplates(world).some(t => t.visited)).toBe(false); trip.status = 'completed'; trip.participantIds = []; expect(eligibleTemplates(world).some(t => t.visited)).toBe(false);
  condition.diagnosed = null; expect(eligibleTemplates(world).some(t => t.chronicCondition)).toBe(false); condition.diagnosed = { ...condition.onset }; condition.months = 11; expect(eligibleTemplates(world).some(t => t.chronicCondition)).toBe(false); condition.months = 12; expect(eligibleTemplates(world).filter(t => t.chronicCondition)).toHaveLength(5); condition.status = 'recovered'; expect(eligibleTemplates(world).some(t => t.chronicCondition)).toBe(false);
});

test.each([0, 100])('pet story bonds clamp at%i and a forged target cannot change someone else or a missing pet', boundary => {
  const world = lifeStoryWorld(), template = everydayLifeTemplates.find(t => t.id === 'pet-familiar-presence')!, pet = world.pets[0]; pet.bonds[world.activePersonId] = boundary; const { event } = offered(world, template); const result = resolveCommand(world, { type: 'choose', eventId: event.id, choiceId: boundary ? 'distracted' : 'company' }); expect(result.pets[0].bonds[world.activePersonId]).toBe(boundary ? 99 : 4);
  for (const field of ['petId', 'personId'] as const) { const bad = decodeWorld(encodeWorld(world)); if (bad.pending?.kind !== 'decision') throw new Error('Missing bound pet story'); const effect = bad.pending.choices[0].effects.find(e => e.kind === 'pet-bond')!; if (effect.kind !== 'pet-bond') throw new Error('Missing pet effect'); effect[field] = field === 'petId' ? 'pet_missing' : 'person_parent1'; expect(() => validateWorld(bad)).toThrow(/pet bond/); }
});

test('literal names containing dollar replacements and placeholder text bind exactly once without being interpreted as scene syntax', () => {
  const world = lifeStoryWorld(), pet = world.pets[0]; pet.name = 'Pip $& {child}';
  const petEvent = bindEvent(world, everydayLifeTemplates.find(t => t.id === 'pet-familiar-presence')!); expect(petEvent.body).toContain('Pip $& {child}'); expect(petEvent.choices[0].journal).toContain('Pip $& {child}');
  const edge = world.relationships.find(e => e.from === world.activePersonId && e.roles.includes('parent') && ageOn(world.people[e.to], world.date) >= 3 && ageOn(world.people[e.to], world.date) <= 11)!;
  world.people[edge.to].firstName = 'A{pet}$&';
  const childEvent = bindEvent(world, everydayLifeTemplates.find(t => t.id === 'family-drawing-label')!); expect(childEvent.body).toContain(fullName(world.people[edge.to])); expect(childEvent.choices[0].journal).toContain(fullName(world.people[edge.to]));
});
