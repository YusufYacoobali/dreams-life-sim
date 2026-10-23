import { bindEvent, eligibleTemplates, eventTemplates } from '../../src/game/content/events';
import type { EventTemplate } from '../../src/game/content/eventTypes';
import type { CountryCode } from '../../src/game/countries';
import { resolveCommand } from '../../src/game/engine';
import { copyWorld, decodeWorld, encodeWorld, moneyJSON, type World } from '../../src/game/model';
import { formatMoney } from '../../src/game/money';
import { offerPending } from '../../src/game/pendingQueue';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { post } from '../../src/game/systems/common';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { originalChoices } from '../support/entertainmentBaseline';
import { lifeStoryWorld } from '../support/lifeStory';
import { startStudy } from '../support/studyStory';
import { retiredLife } from '../support/laterLifeStory';

const rewritten = [
  'hobby-guitar-familiar-chord', 'hobby-photo-background', 'hobby-gaming-helpful-tip',
  'hobby-cooking-last-instruction', 'hobby-small-improvement',
  'pet-dog-important-smell', 'pet-dog-doorway-greeting', 'pet-cat-unexpected-box', 'pet-care-name-voice',
  'travel-memory-old-ticket', 'travel-memory-folded-map', 'travel-memory-food-photos', 'travel-memory-worth-the-visit',
  'wellbeing-miracle-recommendation', 'wellbeing-one-more-episode', 'study-timetable-colour-code',
  'later-old-handwriting', 'later-old-competition', 'later-another-year-question', 'retired-employer-box',
];
const scene = (id: string) => eventTemplates.find(row => row.id === id)!;
const clamp = (value: number) => Math.max(0, Math.min(100, value));
const contexts = new Map<string, string>();
function context(template: EventTemplate, country: CountryCode = 'US'): World {
  const hobby = template.hobby && template.hobby !== 'any' ? template.hobby : 'guitar';
  const key = JSON.stringify([country, hobby, template.study, template.retired]);
  if (!contexts.has(key)) {
    // Established explicit domain fixtures, not claimed natural encounters.
    // Clear their setup queue only to isolate this one authored decision.
    const world = template.study ? startStudy() : template.retired ? retiredLife() : lifeStoryWorld(country, hobby);
    world.pending = null; world.pendingPriority = 0; world.deferred = []; world.annual = null;
    contexts.set(key, encodeWorld(world));
  }
  return decodeWorld(contexts.get(key)!);
}

test.each(rewritten)('%s preserves its identities, binds real context read-only and cold-replays every distinct payoff once', id => {
  const template = scene(id), world = context(template), before = encodeWorld(world);
  expect(template.choices.map(choice => choice.id)).toEqual(originalChoices.get(id));
  expect(template.choices.length).toBeGreaterThanOrEqual(2);
  expect(template.choices.length).toBeLessThanOrEqual(4);
  expect(new Set(template.choices.map(choice => choice.result)).size).toBe(template.choices.length);
  expect(eligibleTemplates(world)).toContain(template);
  const event = bindEvent(world, template);
  expect(JSON.stringify(event, moneyJSON)).not.toMatch(/\{(?:pet|hobby|destination|friend|condition|studySchool|studyField|money)\}/);
  expect(event.personIds.every(personId => !!world.people[personId])).toBe(true);
  expect(encodeWorld(world)).toBe(before);
  for (const choice of event.choices) {
    const offered = decodeWorld(before); offerPending(offered, event);
    expect(choiceUnavailable(offered, choice)).toBeUndefined();
    const cold = unpackCheckpoint(packCheckpoint(offered), true);
    const command = { type: 'choose' as const, eventId: event.id, choiceId: choice.id };
    const selected = resolveCommand(cold, command, true);
    expect(encodeWorld(selected)).toBe(encodeWorld(resolveCommand(offered, command, true)));
    expect(selected.pending).toMatchObject({ kind: 'result', title: choice.resultTitle, body: choice.resultBody });
    expect(selected.journal.slice(0, offered.journal.length)).toEqual(offered.journal);
    expect(selected.journal.slice(offered.journal.length).some(entry => entry.text === choice.journal)).toBe(true);
    expect(selected.random).toEqual(offered.random);
    expect(selected.storyThreads).toEqual(offered.storyThreads);
    expect(selected.trips).toEqual(offered.trips);
    expect(Object.keys(selected.people)).toEqual(Object.keys(offered.people));
    if (!choice.effects.some(effect => effect.kind === 'story-immediate' && effect.cash)) {
      expect(selected.accounts).toEqual(offered.accounts);
      expect(selected.ledger).toEqual(offered.ledger);
    }
    expect(() => resolveCommand(selected, command, true)).toThrow();
    const restored = unpackCheckpoint(packCheckpoint(selected), true);
    expect(restored.pending).toEqual(selected.pending);
    const done = resolveCommand(restored, { type: 'acknowledge', resultId: restored.pending!.id }, true);
    expect(done.pending).toBeNull();
    expect(done.storyThreads).toEqual(offered.storyThreads);
  }
});

test.each(['US', 'GB', 'JP'] as const)('%s travel refund and bogus cure quote actual local money, settle once and retain no fake treatment', country => {
  for (const [id, optionId, sign] of [
    ['travel-memory-old-ticket', 'remember', 1], ['wellbeing-miracle-recommendation', 'debate', -1],
  ] as const) {
    const template = scene(id), world = context(template, country), before = encodeWorld(world), event = bindEvent(world, template);
    const choice = event.choices.find(row => row.id === optionId)!;
    const immediate = choice.effects.find(effect => effect.kind === 'story-immediate');
    if (immediate?.kind !== 'story-immediate' || !immediate.cash) throw new Error('Missing real quoted story payment');
    const cash = immediate.cash, quote = formatMoney({ minor: cash.minor < 0n ? -cash.minor : cash.minor, currency: cash.currency });
    expect(cash.minor > 0n ? 1 : -1).toBe(sign);
    expect([choice.label, choice.resultBody, choice.journal].every(text => text!.includes(quote))).toBe(true);
    expect(event.body).not.toContain('{money}');
    expect(encodeWorld(world)).toBe(before);
    offerPending(world, event);
    const originalAccount = world.accounts.find(account => account.id === cash.accountId)!;
    const selected = resolveCommand(world, { type: 'choose', eventId: event.id, choiceId: choice.id }, true);
    expect(selected.accounts.find(account => account.id === cash.accountId)!.cash).toBe(originalAccount.cash + cash.minor);
    expect(selected.ledger.slice(world.ledger.length)).toHaveLength(1);
    expect(selected.ledger.at(-1)).toMatchObject({ personId: world.activePersonId, currency: cash.currency, cashDelta: cash.minor, debtDelta: 0n });
    expect(selected.people[world.activePersonId].health.conditions).toEqual(world.people[world.activePersonId].health.conditions);
    expect(selected.random).toEqual(world.random);
    expect(() => resolveCommand(selected, { type: 'choose', eventId: event.id, choiceId: choice.id }, true)).toThrow();
    if (sign < 0) {
      const poor = decodeWorld(before), account = poor.accounts.find(row => row.id === cash.accountId)!;
      post(poor, -(account.cash - account.lockedCash), 0n, 'fixture-spending', 'Explicit affordability boundary');
      offerPending(poor, event);
      const unchanged = encodeWorld(poor);
      expect(choiceUnavailable(poor, choice)).toBe('Insufficient available funds');
      expect(() => resolveCommand(poor, { type: 'choose', eventId: event.id, choiceId: choice.id }, true)).toThrow('Insufficient available funds');
      expect(encodeWorld(poor)).toBe(unchanged);
    }
  }
});

test('the public travel dispute changes the bound actual friend’s bond and trust without ending an unchosen friendship', () => {
  const template = scene('travel-memory-worth-the-visit'), world = context(template), event = bindEvent(world, template);
  const choice = event.choices.find(row => row.id === 'absolute')!;
  const immediate = choice.effects.find(effect => effect.kind === 'story-immediate');
  if (immediate?.kind !== 'story-immediate' || !immediate.trust?.length) throw new Error('Missing real friendship trust target');
  const target = immediate.trust[0], relation = world.relationships.find(row => row.id === target.relationshipId)!;
  expect(target.role).toBe('friend');
  expect(relation.roles).toContain('friend');
  expect(event.personIds).toContain(target.otherId);
  expect(event.body).toContain(target.label);
  offerPending(world, event);
  const selected = resolveCommand(world, { type: 'choose', eventId: event.id, choiceId: choice.id }, true);
  const changed = selected.relationships.find(row => row.id === relation.id)!;
  expect(changed.strength).toBe(clamp(relation.strength - 22));
  expect(changed.trust).toBe(clamp(relation.trust - 12));
  expect(changed.roles).toContain('friend');
  expect(selected.people[target.otherId]).toEqual(world.people[target.otherId]);
  expect(Object.keys(selected.people)).toEqual(Object.keys(world.people));
  expect(selected.people[world.activePersonId].employment).toEqual(world.people[world.activePersonId].employment);
});

test('the named dog’s reunion changes that pet’s real bond and the workout overreach costs actual health', () => {
  const template = scene('pet-dog-doorway-greeting'), world = context(template), event = bindEvent(world, template);
  for (const [optionId, delta] of [['greet', 16], ['ignore', -16]] as const) {
    const offered = copyWorld(world), choice = event.choices.find(row => row.id === optionId)!;
    const effect = choice.effects.find(row => row.kind === 'pet-bond');
    if (effect?.kind !== 'pet-bond') throw new Error('Missing actual pet bond');
    const pet = world.pets.find(row => row.id === effect.petId)!;
    expect(event.body).toContain(pet.name);
    offerPending(offered, event);
    const selected = resolveCommand(offered, { type: 'choose', eventId: event.id, choiceId: choice.id }, true);
    expect(selected.pets.find(row => row.id === pet.id)!.bonds[world.activePersonId]).toBe(clamp(pet.bonds[world.activePersonId] + delta));
    expect(selected.pets.filter(row => row.id !== pet.id)).toEqual(world.pets.filter(row => row.id !== pet.id));
  }
  const workout = bindEvent(world, scene('wellbeing-one-more-episode'));
  offerPending(world, workout);
  const selected = resolveCommand(world, { type: 'choose', eventId: workout.id, choiceId: 'drift' }, true);
  expect(selected.people[world.activePersonId].stats.health).toBe(world.people[world.activePersonId].stats.health - 12);
  expect(selected.people[world.activePersonId].health).toEqual(world.people[world.activePersonId].health);
});
