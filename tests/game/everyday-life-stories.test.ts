import { originalCatalogue } from '../support/entertainmentBaseline';
import { laterLifeFamilyTemplates } from '../../src/game/content/laterLifeFamilyStories';
import { laterLifeRecordTemplates } from '../../src/game/content/laterLifeRecordStories';
import { retiredLife, widowedLife } from '../support/laterLifeStory';
import { decodeSave } from '../../src/persistence/archive';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import pensionArchive from '../fixtures/v18-foreign-pension-archive.json';
import { everydayLifeTemplates } from '../../src/game/content/everydayLifeStories';
import { bindEvent, eligibleTemplates, eventTemplates } from '../../src/game/content/events';
import { countries, countryCodes } from '../../src/game/countries';
import { ageOn, decodeWorld, encodeWorld, fullName, moneyJSON, validateWorld, type World } from '../../src/game/model';
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

test.each(laterLifeRecordTemplates.map(scene => [scene.id, scene] as const))('%s uses recorded retirement or the actual late spouse; every capped response preserves all pension, marriage, death and other facts', (_id, scene) => {
  // Retirement is the fixed historical financial fixture, not newly earned
  // here. Widowhood explicitly arranges the actual spouse's death on the
  // genuine married fixture; it is not a natural-death/annual-selection claim.
  const original = scene.widowed ? widowedLife() : retiredLife();
  expect(original.pending).toBeNull(); expect(original.deferred).toEqual([]);
  expect(originalCatalogue(eventTemplates).slice(272)).toEqual(laterLifeRecordTemplates);
  expect(eligibleTemplates(original)).toContainEqual(scene);
  const personId = original.activePersonId, before = encodeWorld(original), event = bindEvent(original, scene);
  if (scene.widowed) {
    const marriage = original.marriages.find(row => row.endReason === 'death' && (row.a === personId || row.b === personId))!;
    const spouseId = marriage.a === personId ? marriage.b : marriage.a;
    expect(original.people[spouseId].died).toEqual(marriage.ended);
    expect(event.personIds).toEqual([personId]); expect(event.body).toContain(fullName(original.people[spouseId]));
  } else expect(event.personIds).toEqual([personId]);
  expect(event.personIds.every(id => original.people[id] && !original.people[id].died)).toBe(true);
  expect(JSON.stringify(event)).not.toContain('{lateSpouse}'); expect(encodeWorld(original)).toBe(before);
  for (const boundary of [0, 100]) {
    const input = decodeWorld(before), person = input.people[personId];
    for (const key of new Set(scene.choices.flatMap(choice => Object.keys(choice.changes)))) person.stats[key as keyof typeof person.stats] = boundary;
    const bound = bindEvent(input, scene); offerPending(input, bound);
    const encoded = encodeWorld(input), cold = unpackCheckpoint(packCheckpoint(input), true);
    expect(encodeWorld(cold)).toBe(encoded); expect(cold.pending).toEqual(bound);
    for (const choice of bound.choices) {
      expect(choice.effects.every(effect => effect.kind === 'stat' && effect.personId === personId)).toBe(true);
      const command = { type: 'choose' as const, eventId: bound.id, choiceId: choice.id }, result = resolveCommand(cold, command, true);
      if (result.pending?.kind !== 'result') throw new Error('Expected recorded later-life consequence');
      expect(encodeWorld(result)).toBe(encodeWorld(resolveCommand(input, command, true)));
      for (const key of Object.keys(person.stats) as (keyof typeof person.stats)[]) {
        const effect = choice.effects.find(row => row.kind === 'stat' && row.stat === key), from = person.stats[key];
        const to = Math.max(0, Math.min(100, from + (effect?.kind === 'stat' ? effect.delta : 0))), delta = to - from;
        expect(result.people[personId].stats[key]).toBe(to);
        if (effect) expect(result.pending.effects.find(row => row.label === key[0].toUpperCase() + key.slice(1))?.value).toBe((delta >= 0 ? '+' : '') + delta + '%');
      }
      for (const key of Object.keys(input) as (keyof World)[]) if (!['people', 'pending', 'journal', 'revision', 'pendingPriority'].includes(key)) expect(result[key]).toEqual(input[key]);
      for (const [id, oldPerson] of Object.entries(input.people)) {
        if (id !== personId) expect(result.people[id]).toEqual(oldPerson);
        else { const { stats: _old, ...oldRest } = oldPerson, { stats: _next, ...nextRest } = result.people[id]; expect(nextRest).toEqual(oldRest); }
      }
      expect(result.pending).toMatchObject({ title: choice.resultTitle, body: choice.resultBody });
      expect(result.journal.slice(0, input.journal.length)).toEqual(input.journal); expect(result.journal.at(-1)?.text).toBe(choice.journal);
      const saved = unpackCheckpoint(packCheckpoint(result), true); expect(encodeWorld(saved)).toBe(encodeWorld(result));
      expect(() => resolveCommand(saved, command, true)).toThrow();
      const done = resolveCommand(saved, { type: 'acknowledge', resultId: saved.pending!.id }, true);
      expect(done.people).toEqual(result.people); expect(done.random).toEqual(result.random); expect(done.marriages).toEqual(result.marriages);
      expect(() => resolveCommand(done, { type: 'acknowledge', resultId: saved.pending!.id }, true)).toThrow();
    }
    expect(encodeWorld(input)).toBe(encoded);
  }
  expect(encodeWorld(original)).toBe(before);
}, 30000);

test('two later-life scenes append after the unchanged catalogue and need an actual local adult child, not retirement or an invented family', () => {
  expect(originalCatalogue(eventTemplates).slice(268, 270)).toEqual(laterLifeFamilyTemplates.filter(item => originalCatalogue(eventTemplates).some(original => original.id === item.id)));
  for (const template of laterLifeFamilyTemplates) {
    expect(template).toMatchObject({ min: 55, max: 120, local: true, child: 'adult' });
    const world = lifeStoryWorld(), before = encodeWorld(world), context = lifeStoryContexts(world), child = context.children.adult!;
    expect(eligibleTemplates(world)).toContain(template);
    const event = bindEvent(world, template);
    expect(event.personIds).toEqual([world.activePersonId, child.person.id]);
    expect(event.body).toContain(fullName(child.person));
    expect(event.choices.every(choice => choice.effects.every(effect => effect.kind === 'stat' || effect.kind === 'relationship' && effect.relationshipId === child.relationshipId))).toBe(true);
    expect(encodeWorld(world)).toBe(before);
    for (const missing of ['below55', 'minor-child', 'no-link', 'reverse-link', 'different-city', 'different-country', 'dead-child', 'hospital-child', 'wanted-child', 'hospital-parent', 'cooldown'] as const) {
      // Explicit predicate boundaries on the established arranged domain setup;
      // no claim of natural birth, ageing, travel, illness or bereavement.
      const changed = decodeWorld(before), person = changed.people[changed.activePersonId], target = changed.people[child.person.id], edge = changed.relationships.find(row => row.id === child.relationshipId)!;
      if (missing === 'below55') person.born = { ...changed.date, year: changed.date.year - 54 };
      if (missing === 'minor-child') target.born = { ...changed.date, year: changed.date.year - 17 };
      if (missing === 'no-link') edge.roles = [];
      if (missing === 'reverse-link') { edge.from = target.id; edge.to = person.id; }
      if (missing === 'different-city') target.city = 'Elsewhere';
      if (missing === 'different-country') target.country = 'JP';
      if (missing === 'dead-child') target.died = { ...changed.date };
      if (missing === 'hospital-child') target.health.hospitalizedUntil = changed.date.year * 12 + changed.date.month + 2;
      if (missing === 'wanted-child') target.legal.wanted = true;
      if (missing === 'hospital-parent') person.health.hospitalizedUntil = changed.date.year * 12 + changed.date.month + 2;
      if (missing === 'cooldown') changed.eventHistory.push({ templateId: template.id, year: changed.date.year - 4 });
      const unchanged = structuredClone(changed);
      expect(eligibleTemplates(changed)).not.toContain(template);
      if (missing === 'cooldown') {
        changed.eventHistory.at(-1)!.year--;
        expect(eligibleTemplates(changed)).toContain(template);
      } else expect(changed).toEqual(unchanged);
    }
    const independent = decodeWorld(before), adult = independent.people[child.person.id], edge = independent.relationships.find(row => row.id === child.relationshipId)!;
    adult.householdId = null; edge.kind = 'guardian'; edge.roles = ['guardian']; edge.parentType = 'guardian';
    expect(eligibleTemplates(independent)).toContain(template);
    expect(bindEvent(independent, template).personIds).toEqual(event.personIds);
    // This genuine older pensioner archive has no recorded child. Age/pension
    // cannot manufacture one; its saved pending/journal/history stay untouched.
    const pensioner = decodeSave(JSON.stringify(pensionArchive)).world, old = encodeWorld(pensioner);
    expect(ageOn(pensioner.people[pensioner.activePersonId], pensioner.date)).toBeGreaterThanOrEqual(55);
    expect(eligibleTemplates(pensioner)).not.toContain(template);
    expect(() => bindEvent(pensioner, template)).toThrow(/available life context/);
    expect(encodeWorld(unpackCheckpoint(packCheckpoint(pensioner), true))).toBe(old);
  }
});

test.each([0, 100])('all six later-life choices cap actual stats and the bound family bond at%i without granting money, plans or other progress', boundary => {
  for (const template of laterLifeFamilyTemplates) {
    const initial = lifeStoryWorld(), person = initial.people[initial.activePersonId], child = lifeStoryContexts(initial).children.adult!;
    const affected = new Set(template.choices.flatMap(choice => Object.keys(choice.changes)));
    for (const key of affected) person.stats[key as keyof typeof person.stats] = boundary;
    initial.relationships.find(row => row.id === child.relationshipId)!.strength = boundary;
    const event = bindEvent(initial, template); offerPending(initial, event);
    const before = encodeWorld(initial), cold = unpackCheckpoint(packCheckpoint(initial), true);
    expect(encodeWorld(cold)).toBe(before);
    for (const choice of event.choices) {
      const command = { type: 'choose' as const, eventId: event.id, choiceId: choice.id }, result = resolveCommand(cold, command, true);
      expect(encodeWorld(result)).toBe(encodeWorld(resolveCommand(initial, command, true)));
      if (result.pending?.kind !== 'result') throw new Error('Expected saved later-family consequence');
      for (const key of Object.keys(person.stats) as (keyof typeof person.stats)[]) {
        const effect = choice.effects.find(row => row.kind === 'stat' && row.stat === key);
        const beforeStat = person.stats[key], after = Math.max(0, Math.min(100, beforeStat + (effect?.kind === 'stat' ? effect.delta : 0))), delta = after - beforeStat;
        expect(result.people[person.id].stats[key]).toBe(after);
        if (effect) expect(result.pending.effects.find(row => row.label === key[0].toUpperCase() + key.slice(1))?.value).toBe((delta >= 0 ? '+' : '') + delta + '%');
      }
      const bond = choice.effects.find(row => row.kind === 'relationship')!;
      expect(bond).toMatchObject({ kind: 'relationship', relationshipId: child.relationshipId });
      const strength = Math.max(0, Math.min(100, boundary + (bond.kind === 'relationship' ? bond.delta : 0))), bondDelta = strength - boundary;
      expect(result.relationships.find(row => row.id === child.relationshipId)?.strength).toBe(strength);
      expect(result.pending.effects.find(row => row.label.endsWith(' · relationship'))?.value).toBe((bondDelta >= 0 ? '+' : '') + bondDelta + '%');
      for (const key of Object.keys(initial) as (keyof World)[]) if (!['people', 'relationships', 'pending', 'journal', 'revision', 'pendingPriority'].includes(key)) expect(result[key]).toEqual(initial[key]);
      expect(result.journal.slice(0, initial.journal.length)).toEqual(initial.journal);
      expect(result.journal.at(-1)?.text).toBe(choice.journal);
      expect(result.pending).toMatchObject({ kind: 'result', title: choice.resultTitle, body: choice.resultBody });
      expect(encodeWorld(unpackCheckpoint(packCheckpoint(result), true))).toBe(encodeWorld(result));
    }
    expect(encodeWorld(initial)).toBe(before);
  }
});

test('304 unique situations include136 everyday scenes with explicit context and three real choices', () => {
  expect(eventTemplates).toHaveLength(319); expect(everydayLifeTemplates).toHaveLength(136); expect(everydayLifeTemplates.flatMap(t => t.choices)).toHaveLength(408);
  for (const key of ['id', 'title', 'body'] as const) expect(new Set(eventTemplates.map(t => t[key])).size).toBe(319);
  for (const template of everydayLifeTemplates) {
    expect(template.local).toBe(true); expect(template.min).toBeLessThanOrEqual(template.max); expect(template.choices).toHaveLength(3); expect(new Set(template.choices.map(c => c.id)).size).toBe(3);
    const text = JSON.stringify(template);
    for (const [token, flag] of [['child', 'child'], ['pet', 'pet'], ['hobby', 'hobby'], ['destination', 'visited'], ['condition', 'chronicCondition'], ['coworker', 'coworker'], ['supervisor', 'supervisor'], ['friend', 'friend']] as const) if (text.includes('{' + token + '}')) expect(template[flag]).toBeTruthy();
    if (template.choices.some(c => c.childBond)) expect(template.child).toBeTruthy(); if (template.choices.some(c => c.petBond)) expect(template.pet).toBeTruthy();
  }
});

test.each([...everydayLifeTemplates, ...laterLifeFamilyTemplates].map(template => [template.id, template] as const))('%s binds its existing context without draws and all three branches apply exact bounded effects once', (_id, template) => {
  const initial = setup(template), before = encodeWorld(initial); expect(eligibleTemplates(initial)).toContainEqual(template);
  const event = bindEvent(initial, template); expect(encodeWorld(initial)).toBe(before); expect(JSON.stringify(event,moneyJSON)).not.toMatch(/\{(?:child|pet|hobby|destination|condition|coworker|supervisor|friend|salary)\}/);
  if (template.child) { const id = event.personIds.find(id => id !== initial.activePersonId)!; const ages = { baby: [0, 2], young: [3, 11], teen: [12, 17], adult: [18, 200] }; expect(ageOn(initial.people[id], initial.date)).toBeGreaterThanOrEqual(ages[template.child][0]); expect(ageOn(initial.people[id], initial.date)).toBeLessThanOrEqual(ages[template.child][1]); expect(event.body).toContain(fullName(initial.people[id])); expect(relationFor(initial, initial.activePersonId, id)?.roles).toContain('parent'); }
  for (const choice of event.choices) {
    const input = decodeWorld(before); offerPending(input, event); const result = resolveCommand(input, { type: 'choose', eventId: event.id, choiceId: choice.id }, true);
    const immediate=choice.effects.find(effect=>effect.kind==='story-immediate'),cash=immediate?.kind==='story-immediate'?immediate.cash:undefined;
    const work=immediate?.kind==='story-immediate'?immediate.work:undefined,lostJob=work?.loseJob===true;
    if(work)expect(work.employmentId).toBe(initial.people[initial.activePersonId].employment!.id);
    expect(result.random).toEqual(initial.random); expect(result.date).toEqual(initial.date);
    expect(result.accounts).toEqual(initial.accounts.map(account=>cash?.accountId===account.id?{...account,cash:account.cash+cash.minor}:account));
    expect(result.ledger.slice(0,initial.ledger.length)).toEqual(initial.ledger);expect(result.ledger).toHaveLength(initial.ledger.length+(cash?1:0));
    if(cash)expect(result.ledger.at(-1)).toMatchObject({accountId:cash.accountId,personId:initial.activePersonId,currency:cash.currency,cashDelta:cash.minor,debtDelta:0n,liabilityId:null,category:cash.minor>0n?'story-income':'story-expense'});
    expect(result.assets).toEqual(initial.assets);expect(result.liabilities).toEqual(initial.liabilities);expect(result.businesses).toEqual(initial.businesses);expect(result.storyThreads).toEqual(initial.storyThreads);expect(result.bestFriendships).toEqual(initial.bestFriendships); expect(result.hobbies).toEqual(initial.hobbies); expect(result.trips).toEqual(initial.trips);
    expect(result.workHistory).toEqual(initial.workHistory.map(row=>lostJob&&row.id===work!.employmentId?{...row,ended:initial.date}:row));
    if(lostJob)expect(initial.people[initial.activePersonId].employment!.companyId).toBeNull();
    expect(result.workplaces).toEqual(initial.workplaces.map(place=>{
      if(!lostJob||place.ended)return place;
      if(place.personId===initial.activePersonId&&place.employmentId===work!.employmentId)return {...place,ended:initial.date,endReason:'left-job'};
      return {...place,members:place.members.map(member=>member.personId===initial.activePersonId&&member.employmentId===work!.employmentId&&!member.left?{...member,left:initial.date,endReason:'left-job'}:member)};
    }));
    expect(result.careers).toEqual(initial.careers); expect(result.serviceCareers).toEqual(initial.serviceCareers); expect(result.creatorStudios).toEqual(initial.creatorStudios); expect(result.royalHouses).toEqual(initial.royalHouses);
    expect(Object.keys(result.people)).toEqual(Object.keys(initial.people));
    for (const person of Object.values(initial.people)) {
      if (person.id !== initial.activePersonId) expect(result.people[person.id]).toEqual(person);
      else { const { stats, ...rest } = person, { stats: nextStats, ...nextRest } = result.people[person.id];const expected={...rest,finance:{...rest.finance},publicLife:{...rest.publicLife},skills:{...rest.skills},employment:rest.employment&&{...rest.employment}};
        if(cash&&cash.minor>0n){expect(cash.currency).toBe(countries[person.country].currency);expected.finance.supportIncomeDue+=cash.minor;}
        if(immediate?.kind==='story-immediate'&&immediate.publicImage!==undefined)expected.publicLife.image=Math.max(0,Math.min(100,person.publicLife.image+immediate.publicImage));
        if(work?.performance!==undefined)expected.employment!.performance=Math.max(0,Math.min(100,person.employment!.performance+work.performance));
        if(lostJob)expected.employment=null;
        for(const effect of choice.effects)if(effect.kind==='skill'){expect(effect.personId).toBe(person.id);expected.skills[effect.skill]=Math.max(0,Math.min(100,person.skills[effect.skill]+effect.delta));}
        expect(nextRest).toEqual(expected); for (const key of Object.keys(stats) as (keyof typeof stats)[]) { const effect = choice.effects.find(e => e.kind === 'stat' && e.personId === person.id && e.stat === key); expect(nextStats[key]).toBe(effect?.kind === 'stat' ? Math.max(0, Math.min(100, stats[key] + effect.delta)) : stats[key]); } }
    }
    for (const edge of initial.relationships) { const effect = choice.effects.find(e => e.kind === 'relationship' && e.relationshipId === edge.id); const expected = {...edge,roles:[...edge.roles],memories:[...edge.memories],strength:Math.max(0,Math.min(100,edge.strength+(effect?.kind==='relationship'?effect.delta:0)))};
      if(immediate?.kind==='story-immediate'){
        const trust=immediate.trust?.find(target=>target.relationshipId===edge.id);if(trust)expected.trust=Math.max(0,Math.min(100,edge.trust+trust.delta));
        if(immediate.endFriendship?.relationshipId===edge.id){expect(edge.roles).toEqual(expect.arrayContaining(['coworker','friend']));expected.roles=expected.roles.filter(role=>role!=='friend');expected.kind='coworker';expected.memories.push('friendship-ended:'+initial.date.year);}
      }
      expect(result.relationships.find(e => e.id === edge.id)).toEqual(expected); }
    for (const pet of initial.pets) { const effect = choice.effects.find(e => e.kind === 'pet-bond' && e.petId === pet.id); const expected = effect?.kind === 'pet-bond' ? { ...pet, bonds: { ...pet.bonds, [effect.personId]: Math.max(0, Math.min(100, (pet.bonds[effect.personId] ?? 0) + effect.delta)) } } : pet; expect(result.pets.find(p => p.id === pet.id)).toEqual(expected); }
    expect(choice.effects.every(e => ['stat', 'relationship', 'pet-bond','skill','story-immediate'].includes(e.kind))).toBe(true); expect(result.pending).toMatchObject({ kind: 'result', title: choice.resultTitle, body: choice.resultBody }); expect(result.journal.at(-1)?.text).toBe(choice.journal); expect(decodeWorld(encodeWorld(result))).toEqual(result);
    expect(() => resolveCommand(result, { type: 'choose', eventId: event.id, choiceId: choice.id })).toThrow();
    const done = resolveCommand(result, { type: 'acknowledge', resultId: result.pending!.id }, true); expect(done.people).toEqual(result.people); expect(done.pets).toEqual(result.pets); expect(done.random).toEqual(result.random); expect(done.relationships).toEqual(result.relationships);
  }
}, 30000);

test.each(countryCodes)('%s reads actual family/pet/hobby/home/trip/condition context without generating people, charges or RNG', country => {
  const world = lifeStoryWorld(country), before = encodeWorld(world), available = eligibleTemplates(world).filter(t => everydayLifeTemplates.includes(t)); expect(available).toHaveLength(119);
  for (const template of available) { const event = bindEvent(world, template); expect(event.personIds.every(id => !!world.people[id])).toBe(true); expect(JSON.stringify(event,moneyJSON)).not.toMatch(/\{(?:child|pet|hobby|destination|condition|coworker|supervisor|friend|salary)\}/); }
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
