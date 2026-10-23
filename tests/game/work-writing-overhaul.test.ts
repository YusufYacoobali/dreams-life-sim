import { bindEvent, eligibleTemplates } from '../../src/game/content/events';
import { workingLifeTemplates } from '../../src/game/content/workingLifeStories';
import { workplaceTemplates } from '../../src/game/content/workplaceStories';
import { specialCareerTemplates } from '../../src/game/content/specialCareerStories';
import { specialCareerDepthTemplates } from '../../src/game/content/specialCareerDepthStories';
import { type EventTemplate } from '../../src/game/content/eventTypes';
import { resolveCommand } from '../../src/game/engine';
import { decodeWorld, encodeWorld, fullName, type World } from '../../src/game/model';
import { offerPending } from '../../src/game/pendingQueue';
import { formatMoney } from '../../src/game/money';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { countries } from '../../src/game/countries';
import { currentWorkplace } from '../../src/game/systems/workplaceSchemas';
import { endEmployment } from '../../src/game/systems/work';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { employee } from '../support/employee';
import { careerDepthWorld } from '../support/specialCareerDepth';

const identities = {
  'work-shared-note-riddle': ['clarify', 'template', 'guess'],
  'work-final-file': ['confirm', 'label', 'title'],
  'work-room-temperature': ['compare', 'adapt', 'insist'],
  'work-training-slogan': ['practical', 'ask', 'echo'],
  'work-invitation-outside': ['accept', 'later', 'boundary'],
  'work-unfamiliar-process': ['ask', 'notes', 'pretend'],
  'work-safety-arrow': ['report', 'route', 'ignore'],
  'work-shared-credit': ['name', 'both', 'take'],
  'work-question-at-door': ['later', 'clarify', 'all'],
  'work-quiet-kindness': ['thanks', 'laugh', 'rush'],
  'career-musician-setlist-handwriting': ['rewrite', 'check', 'guess'],
  'career-military-checklist-language': ['clarify', 'reference', 'pretend'],
  'career-astronaut-plain-explanation': ['plain', 'analogy', 'expand'],
  'career-royalty-ribbon-end': ['patient', 'light', 'demand'],
  'career-model-backdrop-fan': ['adjust', 'still', 'more'],
  'career-astronaut-loose-snack': ['stow', 'check', 'rename'],
  'career-youtuber-thumbnail-face': ['natural', 'topic', 'bigger'],
  'career-youtuber-drill-interview': ['wait', 'sections', 'argue'],
  'career-streamer-chair-soundcheck': ['input', 'record', 'louder'],
  'career-business-breakfast-cards': ['salvage', 'talk', 'offer'],
};
const catalogue = [...workingLifeTemplates, ...workplaceTemplates, ...specialCareerTemplates, ...specialCareerDepthTemplates];
const scenes = Object.keys(identities).map(id => catalogue.find(row => row.id === id)!);
const bounded = (value: number) => Math.max(0, Math.min(100, value));
let employeeSave: string | undefined;
function arranged(template: EventTemplate): World {
  if (!template.specialCareer && !employeeSave) employeeSave = encodeWorld(employee());
  const world = template.specialCareer ? careerDepthWorld(template) : decodeWorld(employeeSave!);
  const actor = world.people[world.activePersonId];
  actor.publicLife.image = 50;
  for (const stat of ['health', 'energy', 'stress', 'respect', 'happiness', 'discipline', 'smarts'] as const) actor.stats[stat] = 50;
  if (actor.employment && !template.specialCareer) actor.employment.performance = 50;
  for (const relation of world.relationships) { relation.strength = 50; relation.trust = 50; }
  // Declared test funding keeps all optional donations available; preserve the
  // account's existing ledger reconciliation rather than replacing its balance.
  for (const account of world.accounts.filter(row => row.ownerId === actor.id)) { account.cash += 10000000n; account.openingCash += 10000000n; }
  return world;
}

test('the twenty revised situations retain stable event/choice identities and distinct finished branches', () => {
  expect(scenes).toHaveLength(20);
  for (const scene of scenes) {
    expect(scene.choices.map(choice => choice.id)).toEqual(identities[scene.id as keyof typeof identities]);
    expect(new Set(scene.choices.map(choice => choice.result)).size).toBe(scene.choices.length);
    expect(new Set(scene.choices.map(choice => choice.journal)).size).toBe(scene.choices.length);
    expect(scene.choices.every(choice => !choice.followUp)).toBe(true);
    if (scene.specialCareer) expect(scene.choices.every(choice => choice.workPerformance === undefined && !choice.loseJob)).toBe(true);
  }
});

test.each(scenes.map(scene => [scene.id, scene] as const))('%s resolves each actual consequence once after cold saving, with no draws or new people', (_id, scene) => {
  const initial = arranged(scene), actor = initial.people[initial.activePersonId], before = encodeWorld(initial);
  expect(eligibleTemplates(initial)).toContainEqual(scene);
  const event = bindEvent(initial, scene);
  expect(encodeWorld(initial)).toBe(before);
  expect(JSON.stringify([event.body, ...event.choices.flatMap(choice => [choice.label, choice.resultBody, choice.journal])])).not.toMatch(/\{(?:coworker|supervisor|money|workplace)\}/);
  for (const choice of event.choices) {
    const input = decodeWorld(before); offerPending(input, event);
    const cold = unpackCheckpoint(packCheckpoint(input), true);
    expect(cold.pending).toEqual(event);
    const command = { type: 'choose' as const, eventId: event.id, choiceId: choice.id };
    const result = resolveCommand(cold, command, true), person = result.people[actor.id];
    expect(result.pending).toMatchObject({ kind: 'result', title: choice.resultTitle, body: choice.resultBody });
    expect(result.journal.at(-1)?.text).toBe(choice.journal);
    expect(result.random).toEqual(initial.random);
    expect(Object.keys(result.people)).toEqual(Object.keys(initial.people));
    for (const effect of choice.effects) {
      if (effect.kind === 'stat') expect(person.stats[effect.stat]).toBe(bounded(actor.stats[effect.stat] + effect.delta));
      else if (effect.kind === 'relationship') expect(result.relationships.find(row => row.id === effect.relationshipId)!.strength).toBe(bounded(initial.relationships.find(row => row.id === effect.relationshipId)!.strength + effect.delta));
      else if (effect.kind === 'skill') expect(person.skills[effect.skill]).toBe(bounded(actor.skills[effect.skill] + effect.delta));
      else if (effect.kind === 'story-immediate') {
        for (const target of effect.trust ?? []) {
          expect(event.personIds).toContain(target.otherId);
          expect(result.relationships.find(row => row.id === target.relationshipId)!.trust).toBe(bounded(initial.relationships.find(row => row.id === target.relationshipId)!.trust + target.delta));
        }
        if (effect.work?.loseJob) {
          expect(person.employment).toBeNull();
          expect(result.workHistory.find(row => row.id === effect.work!.employmentId)!.ended).toEqual(result.date);
          expect(currentWorkplace(result)).toBeUndefined();
        } else if (effect.work?.performance !== undefined) expect(person.employment!.performance).toBe(bounded(actor.employment!.performance + effect.work.performance));
        if (effect.publicImage !== undefined) expect(person.publicLife.image).toBe(bounded(actor.publicLife.image + effect.publicImage));
        if (effect.cash) expect(result.accounts.find(row => row.id === effect.cash!.accountId)!.cash).toBe(initial.accounts.find(row => row.id === effect.cash!.accountId)!.cash + effect.cash.minor);
      } else throw new Error('Unexpected authored consequence');
    }
    if (!choice.effects.some(effect => effect.kind === 'story-immediate' && effect.cash)) { expect(result.accounts).toEqual(initial.accounts); expect(result.ledger).toEqual(initial.ledger); }
    if (!choice.effects.some(effect => effect.kind === 'story-immediate' && effect.work)) expect(person.employment).toEqual(actor.employment);
    expect(result.careers).toEqual(initial.careers); expect(result.serviceCareers).toEqual(initial.serviceCareers); expect(result.creatorStudios).toEqual(initial.creatorStudios); expect(result.businesses).toEqual(initial.businesses);
    const saved = unpackCheckpoint(packCheckpoint(result), true);
    expect(encodeWorld(saved)).toBe(encodeWorld(result));
    expect(() => resolveCommand(saved, command, true)).toThrow();
    const done = resolveCommand(saved, { type: 'acknowledge', resultId: saved.pending!.id }, true);
    expect(done.people).toEqual(saved.people); expect(done.relationships).toEqual(saved.relationships); expect(done.accounts).toEqual(saved.accounts); expect(done.ledger).toEqual(saved.ledger); expect(done.random).toEqual(saved.random);
  }
});

test('the office hit list names actual current coworker and supervisor and damages both saved trust edges', () => {
  const scene = scenes.find(row => row.id === 'work-shared-note-riddle')!, world = arranged(scene), place = currentWorkplace(world)!;
  const coworker = place.members.find(row => row.role === 'coworker')!, supervisor = place.members.find(row => row.role === 'supervisor')!;
  const event = bindEvent(world, scene);
  expect(event.personIds).toEqual([world.activePersonId, coworker.personId, supervisor.personId]);
  expect(event.body).toContain(fullName(world.people[coworker.personId])); expect(event.body).toContain(fullName(world.people[supervisor.personId]));
  const effect = event.choices[0].effects.find(row => row.kind === 'story-immediate')!;
  expect(effect.trust?.map(row => [row.role, row.otherId, row.delta])).toEqual([['coworker', coworker.personId, -20], ['supervisor', supervisor.personId, -15]]);
  endEmployment(world, supervisor.personId);
  expect(eligibleTemplates(world)).not.toContainEqual(scene);
});

test('the resignation choice ends only its actual ordinary contract and cannot quit a replacement or an already ended job', () => {
  const scene = scenes.find(row => row.id === 'work-final-file')!, world = arranged(scene), event = bindEvent(world, scene);
  offerPending(world, event); endEmployment(world);
  const saved = unpackCheckpoint(packCheckpoint(world), true), before = encodeWorld(saved);
  expect(() => resolveCommand(saved, { type: 'choose', eventId: event.id, choiceId: 'title' }, true)).toThrow(/employment|role|changed/i);
  expect(encodeWorld(saved)).toBe(before);
});

test('the optional royal donation displays and charges one frozen local quote, and cannot spend locked funds', () => {
  const scene = scenes.find(row => row.id === 'career-royalty-ribbon-end')!, world = arranged(scene), event = bindEvent(world, scene), choice = event.choices.find(row => row.id === 'light')!;
  const effect = choice.effects.find(row => row.kind === 'story-immediate')!, cash = effect.cash!;
  expect(cash.currency).toBe(countries[world.people[world.activePersonId].country].currency); expect(cash.usdWhole).toBe(-250);
  const quote = formatMoney({ minor: -cash.minor, currency: cash.currency });
  expect(choice.label).toContain(quote); expect(choice.resultBody).toContain(quote); expect(choice.journal).toContain(quote); expect(event.body).not.toMatch(/\{money\}/);
  const account = world.accounts.find(row => row.id === cash.accountId)!; account.lockedCash = account.cash;
  const blocked = bindEvent(world, scene).choices.find(row => row.id === 'light')!;
  expect(choiceUnavailable(world, blocked)).toMatch(/funds/i);
  offerPending(world, event); const before = encodeWorld(world);
  expect(() => resolveCommand(world, { type: 'choose', eventId: event.id, choiceId: choice.id }, true)).toThrow(/funds/i);
  expect(encodeWorld(world)).toBe(before);
});
