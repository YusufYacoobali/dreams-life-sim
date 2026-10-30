import { decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { monthFrom } from '../../src/game/calendar';
import { prisonStories } from '../../src/game/content/prisonStories';
import { organisedCrimeStories } from '../../src/game/content/organisedCrimeStories';
import { romanceDramaStories } from '../../src/game/content/romanceDramaStories';
import { crimeStoryConsequences, prisonStoryConsequences, romanceStoryConsequences } from '../../src/game/content/prospectiveStoryEffects';
import { activeOrganisation, eligibleMissionCrew, organisedCrimeChoiceReason } from '../../src/game/systems/organisedCrime';
import { activeSentence, prisonContacts } from '../../src/game/systems/legal';
import { isConfined } from '../../src/game/systems/legalSchemas';
import { prisonFamilyReason, prisonLife, prisonMonth, prisonActionReason } from '../../src/game/systems/prison';
import { prisonWorkSuspended } from '../../src/game/systems/prisonSchemas';
import { enableOverhaul } from '../../src/game/systems/overhaul';
import { relationFor } from '../../src/game/systems/relationshipQueries';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { escapePrisoner } from '../support/prisonEscape';
import graduate from '../fixtures/v3-employed-graduate.json';

const ack = (world: World): World => world.pending?.kind === 'result' ? resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id }) : world;
function choose(world: World, id: string) {
  if (world.pending?.kind !== 'decision') throw new Error('A bound decision is required');
  return resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: id });
}
let prisonBase: string, crimeBase: string;
beforeAll(() => {
  let world = escapePrisoner(); enableOverhaul(world);
  world = ack(resolveCommand(world, { type: 'prison-action', personId: prisonContacts(world)[0].id, action: 'talk' }));
  prisonBase = encodeWorld(world);
  world = ack(decodeWorld(JSON.stringify(graduate))); world.pending = null; world.deferred = [];
  crimeBase = encodeWorld(ack(resolveCommand(world, { type: 'organised-join', style: 'street-syndicate' })));
});
function crimeStory(id: string, source = decodeWorld(crimeBase)) {
  const gang = activeOrganisation(source)!, state = gang.organised!;
  state.rank = 3; gang.rank = 3;
  state.seenStories = organisedCrimeStories.filter(story => story.id !== id).map(story => story.id);
  return resolveCommand(source, { type: 'organised-decision', gangId: gang.id });
}
function prisonStory(id: string) {
  const world = decodeWorld(prisonBase), life = prisonLife(world)!;
  life.seenStoryIds = prisonStories.filter(story => story.id !== id).map(story => story.id);
  activeSentence(world)!.routine = { work: true, study: true, exercise: true, conduct: 'quiet' };
  activeSentence(world)!.behavior = 20;
  for (let seed = 1; seed < 100; seed++) {
    const candidate = decodeWorld(encodeWorld(world)); candidate.random.events = seed; prisonMonth(candidate);
    if (candidate.pending?.kind === 'decision' && candidate.pending.templateId === id) return validateWorld(candidate);
  }
  throw new Error('No eligible scene ' + id);
}

test('all80 authored situations have an audited stable identity and30 selected templates own typed operations', () => {
  expect([organisedCrimeStories.length, prisonStories.length, romanceDramaStories.length]).toEqual([20, 25, 35]);
  expect([Object.keys(crimeStoryConsequences).length, Object.keys(prisonStoryConsequences).length, Object.keys(romanceStoryConsequences).length]).toEqual([9, 9, 12]);
  for (const [definitions, operations] of [[organisedCrimeStories.map(story => ({ id: story.id, choices: story.choices.map(choice => choice.action) })), crimeStoryConsequences], [prisonStories.map(story => ({ id: story.id, choices: story.choices.map(choice => choice.id) })), prisonStoryConsequences], [romanceDramaStories.map(story => ({ id: story.id, choices: story.choices.map(choice => choice.id) })), romanceStoryConsequences]] as const) {
    for (const [id, choices] of Object.entries(operations)) {
      const definition = definitions.find(story => story.id === id); expect(definition).toBeDefined();
      for (const choice of Object.keys(choices)) expect(definition!.choices).toContain(choice);
    }
  }
});

test.each(Object.keys(crimeStoryConsequences))('%s freezes prospective crime operations and resolves them after a checkpoint', id => {
  const offered = crimeStory(id), gang = activeOrganisation(offered)!, saved = gang.organised!.activeStory!;
  expect(saved.rulesVersion).toBe(2);
  const checkpoint = unpackCheckpoint(packCheckpoint(offered));
  expect(checkpoint).toStrictEqual(offered);
  expect(decodeWorld(encodeWorld(offered))).toStrictEqual(offered);
  for (const choice of saved.choices.filter(item => item.consequence)) {
    const next = choose(decodeWorld(encodeWorld(offered)), choice.action), state = next.gangs.find(item => item.id === gang.id)!.organised!, target = state.members.find(item => item.personId === saved.personId)!;
    if (choice.consequence === 'named-rival') { expect(target.role).toBe('former'); expect(state.rivals.find(item => item.personId === saved.personId)).toMatchObject({ resolved: false }); }
    if (choice.consequence === 'withdraw-role' || choice.consequence === 'investigation') { expect(target.role).toBe('former'); expect(eligibleMissionCrew(next, next.gangs[0]).map(item => item.personId)).not.toContain(target.personId); }
    if (choice.consequence === 'lieutenant') expect(target.role).toBe('lieutenant');
    if (choice.consequence?.startsWith('leadership-')) expect(target.memories.some(memory => memory.startsWith('story-leadership:'))).toBe(true);
    expect(state.history.some(item => item.kind === 'consequence:' + choice.consequence && item.personId === saved.personId)).toBe(true);
    expect(decodeWorld(encodeWorld(next))).toStrictEqual(next);
  }
});

test('an expelled crew member stays a genuine named rival and can negotiate a later truce', () => {
  let world = crimeStory('informant-rumour'); const targetId = activeOrganisation(world)!.organised!.activeStory!.personId;
  world = ack(choose(world, 'expose')); world.date.year++;
  const gang = activeOrganisation(world)!; gang.organised!.rivals.find(item => item.personId !== targetId)!.resolved = true; gang.organised!.rivals.find(item => item.personId !== targetId)!.influence = 0;
  world = crimeStory('rival-truce', world);
  const state = activeOrganisation(world)!.organised!;
  expect(state.activeStory).toMatchObject({ target: 'rival', personId: targetId });
  const effect = world.pending?.kind === 'decision' ? world.pending.choices[0].effects[0] : null;
  if (effect?.kind !== 'organised-choice') throw new Error('Expected crime choice');
  expect(organisedCrimeChoiceReason(world, effect)).toBeUndefined();
  world = choose(world, 'negotiate');
  expect(activeOrganisation(world)!.organised!.rivals.find(item => item.personId === targetId)).toMatchObject({ resolved: true, influence: 0 });
});

test('an unresolved leadership objection changes an actual later vote after eight genuine assignments', () => {
  let world = decodeWorld(crimeBase);
  const mission = (input: World): World => {
    for (let seed = 1; seed <= 300; seed++) {
      const trial = decodeWorld(encodeWorld(input)); trial.random.outcomes = seed; trial.people[trial.activePersonId].stats.energy = 100;
      const next = resolveCommand(trial, { type: 'organised-mission', gangId: activeOrganisation(trial)!.id, mission: 'missing-envelope', approach: 'cautious' });
      if (!isConfined(next) && activeOrganisation(next)!.organised!.jobs.at(-1)!.success) return ack(next);
    }
    throw new Error('No clean assignment');
  };
  for (let round = 0; round < 4; round++) {
    if (round) world.date.year++;
    world = mission(mission(world));
    if (round < 3) world = ack(resolveCommand(world, { type: 'organised-promotion', gangId: activeOrganisation(world)!.id }));
  }
  world.date.year++; world = ack(choose(crimeStory('boss-accounting', world), 'expose')); world.date.year++;
  const state = activeOrganisation(world)!.organised!;
  expect(state.completedJobs).toBe(8); expect(state.rank).toBe(3);
  expect(state.members.find(member => member.personId === state.leaderId)!.memories.some(memory => memory.startsWith('story-leadership:objection:'))).toBe(true);
  let affectedVote = false;
  for (let seed = 1; seed <= 100 && !affectedVote; seed++) {
    const objection = decodeWorld(encodeWorld(world)), counterfactual = decodeWorld(encodeWorld(world));
    objection.random.outcomes = seed; counterfactual.random.outcomes = seed;
    const leader = activeOrganisation(counterfactual)!.organised!.members.find(member => member.personId === state.leaderId)!;
    leader.memories = leader.memories.filter(memory => !memory.startsWith('story-leadership:'));
    const command = { type: 'organised-challenge' as const, gangId: activeOrganisation(world)!.id, action: 'challenge' as const };
    const actual = resolveCommand(objection, command), without = resolveCommand(counterfactual, command);
    affectedVote = activeOrganisation(actual)?.organised!.rank !== activeOrganisation(without)?.organised!.rank;
  }
  expect(affectedVote).toBe(true);
});

test('an actual prison assault injures the named inmate, forms a rivalry and opens exactly one real case', () => {
  const world = prisonStory('prison-missing-mug'), life = prisonLife(world)!, scene = life.scenes[0], targetId = scene.participantId!, health = world.people[targetId].stats.health, sentence = structuredClone(activeSentence(world)!), cases = world.cases.length;
  expect(scene.choices.find(item => item.id === 'insult')!.label).toMatch(/punch/i);
  const cold = decodeWorld(encodeWorld(world)), next = choose(cold, 'insult');
  expect(prisonLife(next)!.contacts.find(item => item.personId === targetId)).toMatchObject({ rivalry: true, protection: 'none', favours: 0 });
  expect(next.people[targetId].stats.health).toBe(Math.max(1, health - 6));
  expect(next.cases).toHaveLength(cases + 1); expect(next.cases.at(-1)).toMatchObject({ offence: 'assault', personId: world.activePersonId });
  expect(next.incidents.at(-1)).toMatchObject({ offence: 'assault', victimId: targetId });
  expect(activeSentence(next)).toMatchObject({ id: sentence.id, totalMonths: sentence.totalMonths });
  expect(choose(decodeWorld(encodeWorld(world)), 'insult')).toStrictEqual(next);
  expect(() => choose(next, 'insult')).toThrow();
});

test('settling an inmate dispute removes the rivalry and blocks a future rival challenge', () => {
  let world = prisonStory('prison-invisible-border'), life = prisonLife(world)!, targetId = life.scenes[0].participantId!;
  life.contacts.find(item => item.personId === targetId)!.rivalry = true;
  world = ack(choose(world, 'agree')); delete world.actionCounts[world.activePersonId + ':prison-v2:' + world.date.year + ':inmate:' + targetId];
  expect(prisonLife(world)!.contacts.find(item => item.personId === targetId)!.rivalry).toBe(false);
  expect(prisonActionReason(world, targetId, 'challenge')).toMatch(/established rival/);
});

test('a saved protection pledge can be reciprocated, with the real inmate still free to refuse', () => {
  let world = ack(choose(prisonStory('prison-favour-interest'), 'promise')), life = prisonLife(world)!, targetId = life.scenes[0].participantId!;
  expect(life.contacts.find(item => item.personId === targetId)).toMatchObject({ protection: 'offered', rivalry: false });
  world.date.year++; activeSentence(world)!.behavior = 50; world.people[targetId].stats.fitness = 80;
  const relation = relationFor(world, world.activePersonId, targetId)!; relation.strength = 55; relation.trust = 55;
  let reciprocatedBecauseOfPledge = false; const responses = new Set<boolean>();
  for (let seed = 1; seed <= 100 && (!reciprocatedBecauseOfPledge || responses.size < 2); seed++) {
    const pledged = decodeWorld(encodeWorld(world)), without = decodeWorld(encodeWorld(world));
    pledged.random.outcomes = seed; without.random.outcomes = seed;
    const contact = prisonLife(without)!.contacts.find(item => item.personId === targetId)!;
    contact.memories = contact.memories.filter(memory => !memory.startsWith('story:prison-favour-interest:pledge-protection:'));
    const command = { type: 'prison-action' as const, personId: targetId, action: 'ask-protection' as const };
    const helped = resolveCommand(pledged, command), ordinary = resolveCommand(without, command);
    responses.add(prisonLife(helped)!.interactions.at(-1)!.accepted);
    reciprocatedBecauseOfPledge ||= prisonLife(helped)!.contacts.find(item => item.personId === targetId)!.protection === 'received' && prisonLife(ordinary)!.contacts.find(item => item.personId === targetId)!.protection !== 'received';
  }
  expect(reciprocatedBecauseOfPledge).toBe(true);
  expect(responses).toEqual(new Set([true, false]));
});

test('a serious family argument pauses visits until an actual letter reopens contact', () => {
  let world = prisonStory('prison-family-boundary'), scene = prisonLife(world)!.scenes[0], targetId = scene.participantId!;
  world = ack(choose(world, 'insist'));
  expect(prisonFamilyReason(world, targetId, 'visit')).toMatch(/paused/);
  expect(prisonFamilyReason(world, targetId, 'letter')).toBeUndefined();
  world = ack(resolveCommand(world, { type: 'prison-family-contact', personId: targetId, action: 'letter' }));
  expect(relationFor(world, world.activePersonId, targetId)!.memories.some(memory => memory.startsWith('prison-visits-paused:'))).toBe(false);
  expect(prisonLife(world)!.familyContacts.at(-1)).toMatchObject({ personId: targetId, action: 'letter', accepted: true, amount: 0n });
});

test('replying to the ordinary letter produces a real zero-cost family-contact record', () => {
  const offered = prisonStory('prison-letter-ordinary'), ledger = structuredClone(offered.ledger), scene = prisonLife(offered)!.scenes[0];
  const next = choose(offered, 'reply');
  expect(prisonLife(next)!.familyContacts.at(-1)).toMatchObject({ id: 'prisonletter_' + scene.id, personId: scene.participantId, action: 'letter', accepted: true, amount: 0n, transactionIds: [] });
  expect(next.ledger).toEqual(ledger);
});

test.each(['prison-hearing-chair', 'prison-inspection-dignity'])('%s suspends actual work for exactly three calendar months', id => {
  const choice = id === 'prison-hearing-chair' ? 'angry' : 'rage';
  let world = ack(choose(prisonStory(id), choice)), sentence = activeSentence(world)!;
  expect(sentence.routine.work).toBe(false); expect(prisonWorkSuspended(world, sentence.id)).toBe(true);
  sentence.behavior = 90;
  const command = { type: 'prison-routine' as const, routine: { ...sentence.routine, work: true } };
  expect(() => resolveCommand(decodeWorld(encodeWorld(world)), command)).toThrow(/three calendar months/);
  world.date = monthFrom(world.date, 2); expect(prisonWorkSuspended(world, sentence.id)).toBe(true);
  world.date = monthFrom(world.date, 1); expect(prisonWorkSuspended(world, sentence.id)).toBe(false);
  world = ack(resolveCommand(world, command)); expect(activeSentence(world)!.routine.work).toBe(true);
});

test('family contexts cancel after the bound relationship changes without affecting a replacement person', () => {
  const world = prisonStory('prison-family-boundary'), scene = prisonLife(world)!.scenes[0], relation = relationFor(world, world.activePersonId, scene.participantId!)!;
  relation.roles = ['acquaintance']; relation.kind = 'acquaintance'; relation.romance = 'none';
  const trust = relation.trust, next = choose(world, 'insist');
  expect(prisonLife(next)!.scenes[0].status).toBe('cancelled'); expect(next.pending?.title).toBe('Circumstances changed');
  expect(relationFor(next, next.activePersonId, scene.participantId!)!.trust).toBe(trust);
});
