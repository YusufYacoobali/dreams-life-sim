import { createHash } from 'node:crypto';
import { gunzipSync, strFromU8 } from 'fflate';
import { bindEvent, eligibleTemplates, eventTemplates } from '../../src/game/content/events';
import type { EventTemplate } from '../../src/game/content/eventTypes';
import { resolveCommand } from '../../src/game/engine';
import { ageOn, decodeWorld, encodeWorld, type World } from '../../src/game/model';
import { offerPending } from '../../src/game/pendingQueue';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { adultSocial } from '../support/adultSocial';
import { employee } from '../support/employee';
import { actualReleasedStoryWorld, pendingCaseStoryWorld, prisonPeerStoryWorld } from '../support/legalStories';
import { retiredLife, widowedLife } from '../support/laterLifeStory';
import { lifeStoryWorld } from '../support/lifeStory';
import { pupil } from '../support/pupil';
import { careerDepthWorld } from '../support/specialCareerDepth';
import { pausedStudy, startStudy } from '../support/studyStory';
import nativeChoice from '../fixtures/v39-content15-native-choice.json';
import oldResult from '../fixtures/v30-native-workplace-story-archive.json';
import { decodeSave } from '../../src/persistence/archive';

import { originalChoices } from '../support/entertainmentBaseline';

const newScenes = eventTemplates.filter(scene => !originalChoices.has(scene.id) && !scene.dramatic);
const sha = (text: string) => createHash('sha256').update(text).digest('hex');
const clamp = (value: number) => Math.max(0, Math.min(100, value));

test('the overhaul keeps all 274 original event identities, their 822 choice identities and original eligibility/illustrations', () => {
  expect(originalChoices.size).toBe(274);
  expect([...originalChoices.values()].flat()).toHaveLength(822);
  const originals = eventTemplates.filter(scene => originalChoices.has(scene.id));
  expect(originals).toHaveLength(originalChoices.size);
  for (const [id, choices] of originalChoices) expect(originals.find(scene => scene.id === id)?.choices.map(choice => choice.id)).toEqual(choices);
  const contexts = originals.map(({ id, title: _title, body: _body, choices: _choices, ...context }) => ({
    id, ...Object.fromEntries(Object.entries(context).sort(([left], [right]) => left.localeCompare(right))),
  })).sort((left, right) => left.id.localeCompare(right.id));
  expect(sha(JSON.stringify(contexts))).toBe('ac884f0cb5c2b48bef3a9d5446cd2a498497e4ac4956642f30d3fb4d5644e1d0');
  expect(newScenes.length).toBeGreaterThanOrEqual(25);
  expect(newScenes.length).toBeLessThanOrEqual(35);
  expect(new Set(eventTemplates.map(scene => scene.id)).size).toBe(eventTemplates.length);
  for (const scene of newScenes) {
    expect(scene.choices).toHaveLength(3);
    expect(new Set(scene.choices.map(choice => choice.id)).size).toBe(3);
    expect(new Set(scene.choices.map(choice => choice.label)).size).toBe(3);
    expect(scene.rarity ?? 'common').toMatch(/^(?:common|uncommon|rare|extremely-rare)$/);
    expect(scene.min).toBeLessThanOrEqual(scene.max);
  }
});

const contexts = new Map<string, string>();
/** Declared unit contexts reuse the established domain factories: these bind
 * scenes explicitly, and are not evidence of natural event encounter rates. */
function contextFor(scene: EventTemplate): World {
  const key = JSON.stringify([scene.legal, scene.specialCareer, scene.study, scene.retired, scene.widowed, scene.friend, scene.partner, scene.workplace, scene.coworker, scene.supervisor,
    scene.child, scene.home, scene.pet, scene.hobby, scene.visited, scene.chronicCondition, scene.school, scene.parent, scene.min, scene.max]);
  if (!contexts.has(key)) {
    let world: World;
    if (scene.legal === 'awaiting-trial') world = pendingCaseStoryWorld();
    else if (scene.legal === 'prison-peer') world = prisonPeerStoryWorld();
    else if (scene.legal === 'released') world = actualReleasedStoryWorld();
    else if (scene.specialCareer) world = careerDepthWorld(scene.specialCareer === 'creator' ? { ...scene, specialCareer: 'streamer' } : scene);
    else if (scene.study) world = scene.study === 'active' ? startStudy() : pausedStudy();
    else if (scene.retired) world = retiredLife();
    else if (scene.widowed) world = widowedLife();
    else if (scene.friend || scene.partner) world = adultSocial().world;
    else if (scene.child || scene.home || scene.pet || scene.hobby || scene.visited || scene.chronicCondition) world = lifeStoryWorld('US', scene.hobby && scene.hobby !== 'any' ? scene.hobby : 'guitar');
    else if (scene.workplace || scene.coworker || scene.supervisor) world = employee('US', true, Math.min(scene.max, Math.max(scene.min, 22)));
    else if (scene.school || scene.parent || scene.min < 18 || scene.min >= 60) {
      const schoolAge = scene.school === 'secondary' ? 15 : scene.school ? 8 : scene.min;
      world = pupil('US', Math.min(scene.max, Math.max(scene.min, schoolAge)));
    } else world = employee('US', true, Math.min(scene.max, Math.max(scene.min, 22)));
    // The factories sometimes end at a real pending setup acknowledgement.
    // Clear only the queue/cursor to isolate an explicitly bound unit scene.
    world = structuredClone(world);
    world.pending = null; world.pendingPriority = 0; world.deferred = []; world.annual = null;
    contexts.set(key, encodeWorld(world));
  }
  return decodeWorld(contexts.get(key)!);
}

test.each(newScenes.map(scene => [scene.id, scene] as const))('%s uses a real eligible context, stable named people and the existing five-year cooldown', (_id, scene) => {
  const world = contextFor(scene), before = encodeWorld(world), age = ageOn(world.people[world.activePersonId], world.date);
  expect(age).toBeGreaterThanOrEqual(scene.min); expect(age).toBeLessThanOrEqual(scene.max);
  expect(eligibleTemplates(world)).toContain(scene);
  const event = bindEvent(world, scene);
  expect(event.personIds.every(id => Boolean(world.people[id]))).toBe(true);
  expect(JSON.stringify(event)).not.toMatch(/\{(?:parent|classmate|teacher|coworker|supervisor|friend|partner|child|pet|prisonPeer|facility|offence|caseCity|lateSpouse|studyField|studySchool|home|destination|city)\}/);
  expect(encodeWorld(world)).toBe(before);
  world.eventHistory.push({ templateId: scene.id, year: world.date.year - 4 });
  expect(eligibleTemplates(world)).not.toContain(scene);
  world.eventHistory.at(-1)!.year--;
  expect(eligibleTemplates(world)).toContain(scene);
  // Predicate-only age traps: no contradictory world is loaded or resolved.
  world.people[world.activePersonId].born = { ...world.date, year: world.date.year - scene.min + 1 };
  expect(eligibleTemplates(world)).not.toContain(scene);
  world.people[world.activePersonId].born.year = world.date.year - scene.max - 1;
  expect(eligibleTemplates(world)).not.toContain(scene);
});

describe.each([0, 100])('real effects at the %i boundary', boundary => {
  test.each(newScenes.map(scene => [scene.id, scene] as const))('%s resolves all three saved choices once, with exact bounded state and deterministic cold replay', (_id, scene) => {
    const initial = contextFor(scene), player = initial.people[initial.activePersonId];
    for (const stat of Object.keys(player.stats) as (keyof typeof player.stats)[]) player.stats[stat] = boundary;
    // Zero health ends a life after any choice, even one with no health effect.
    // Only an authored health consequence may reach that real death boundary.
    player.stats.health = boundary === 0 && scene.choices.some(choice => choice.changes.health !== undefined) ? 1 : 100;
    for (const skill of Object.keys(player.skills) as (keyof typeof player.skills)[]) player.skills[skill] = boundary;
    if (scene.choices.some(choice => choice.grades !== undefined)) player.education.grades = boundary;
    for (const edge of initial.relationships) edge.strength = boundary;
    for (const pet of initial.pets) if (pet.bonds[player.id] !== undefined) pet.bonds[player.id] = boundary;
    const before = encodeWorld(initial), event = bindEvent(initial, scene);
    for (const choice of event.choices) {
      const input = decodeWorld(before); offerPending(input, event);
      const cold = unpackCheckpoint(packCheckpoint(input), true);
      expect(cold.pending).toEqual(event);
      const command = { type: 'choose' as const, eventId: event.id, choiceId: choice.id };
      const selected = resolveCommand(cold, command, true);
      expect(encodeWorld(selected)).toBe(encodeWorld(resolveCommand(input, command, true)));
      const died = Boolean(selected.people[player.id].died);
      if (died) {
        expect(choice.effects.some(effect => effect.kind === 'stat' && effect.stat === 'health' && effect.delta < 0)).toBe(true);
        expect(selected.people[player.id].stats.health).toBe(0);
        expect(selected.people[player.id].died).toEqual(input.date);
      } else expect(selected.pending).toMatchObject({ kind: 'result', title: choice.resultTitle, body: choice.resultBody });
      expect(selected.journal.slice(input.journal.length).some(entry => entry.text === choice.journal)).toBe(true);
      expect(selected.journal.slice(0, input.journal.length)).toEqual(input.journal);
      for (const effect of choice.effects) {
        expect(['stat', 'relationship', 'pet-bond', 'skill', 'school-grade']).toContain(effect.kind);
        if (effect.kind === 'stat') expect(selected.people[effect.personId].stats[effect.stat]).toBe(clamp(input.people[effect.personId].stats[effect.stat] + effect.delta));
        if (effect.kind === 'relationship') expect(selected.relationships.find(edge => edge.id === effect.relationshipId)!.strength).toBe(clamp(input.relationships.find(edge => edge.id === effect.relationshipId)!.strength + effect.delta));
        if (effect.kind === 'pet-bond') expect(selected.pets.find(pet => pet.id === effect.petId)!.bonds[effect.personId]).toBe(clamp((input.pets.find(pet => pet.id === effect.petId)!.bonds[effect.personId] ?? 0) + effect.delta));
        if (effect.kind === 'skill') expect(selected.people[effect.personId].skills[effect.skill]).toBe(clamp(input.people[effect.personId].skills[effect.skill] + effect.delta));
        if (effect.kind === 'school-grade') expect(selected.people[effect.personId].education.grades).toBe(clamp(input.people[effect.personId].education.grades + effect.delta));
      }
      if (!died) {
        for (const field of ['random', 'accounts', 'ledger', 'liabilities', 'assets', 'businesses', 'cases', 'sentences', 'marriages', 'households', 'workHistory', 'careers', 'creatorStudios', 'trips', 'storyThreads'] as const) expect(selected[field]).toEqual(input[field]);
        expect(Object.keys(selected.people)).toEqual(Object.keys(input.people));
        for (const [id, person] of Object.entries(input.people)) {
          expect(selected.people[id].employment).toEqual(person.employment);
          expect(selected.people[id].education.qualifications).toEqual(person.education.qualifications);
          expect(selected.people[id].legal).toEqual(person.legal);
        }
      }
      const savedResult = unpackCheckpoint(packCheckpoint(selected), true);
      expect(encodeWorld(savedResult)).toBe(encodeWorld(selected));
      expect(() => resolveCommand(savedResult, command, true)).toThrow();
      if (died) continue;
      const done = resolveCommand(savedResult, { type: 'acknowledge', resultId: savedResult.pending!.id }, true);
      expect(done.pending).toBeNull(); expect(done.people).toEqual(selected.people); expect(done.relationships).toEqual(selected.relationships);
      expect(done.random).toEqual(selected.random); expect(done.ledger).toEqual(selected.ledger);
      expect(() => resolveCommand(done, { type: 'acknowledge', resultId: savedResult.pending!.id }, true)).toThrow();
    }
    expect(encodeWorld(initial)).toBe(before);
  }, 30000);
});

test('a genuine pre-overhaul pending decision and historical result retain their stored words, choices, effects and journal through migration', () => {
  const frame = JSON.parse(nativeChoice.checkpoint);
  const original = JSON.parse(strFromU8(gunzipSync(Buffer.from((frame.main ?? frame).data, 'base64'))));
  const migrated = unpackCheckpoint(nativeChoice.checkpoint), cold = unpackCheckpoint(packCheckpoint(migrated), true);
  expect(original.pending?.kind).toBe('decision');
  expect(cold.pending).toEqual(original.pending); expect(cold.deferred).toEqual(original.deferred);
  expect(cold.journal).toEqual(original.journal); expect(cold.random).toEqual(original.random);
  const event = cold.pending;
  if (event?.kind !== 'decision') throw new Error('The saved authored choice was lost');
  for (const choice of event.choices) {
    const command = { type: 'choose' as const, eventId: event.id, choiceId: choice.id };
    expect(encodeWorld(resolveCommand(cold, command, true))).toBe(encodeWorld(resolveCommand(migrated, command, true)));
  }
  const historical = decodeSave(JSON.stringify(oldResult)).world;
  expect(historical.pending?.kind).toBe('result');
  const restored = unpackCheckpoint(packCheckpoint(historical), true);
  expect(restored.pending).toEqual(historical.pending); expect(restored.journal).toEqual(historical.journal);
  const acknowledged = resolveCommand(restored, { type: 'acknowledge', resultId: restored.pending!.id }, true);
  expect(acknowledged.journal).toEqual(historical.journal); expect(acknowledged.people).toEqual(historical.people);
  expect(acknowledged.relationships).toEqual(historical.relationships); expect(acknowledged.ledger).toEqual(historical.ledger);
});

test('a declared current-schema content-17 envelope migrates only its version tags and preserves the whole stored world', () => {
  // The underlying pending decision is a genuine historical fixture. Only its
  // root version tags are arranged here to isolate the new 17-to-18 migration.
  const current = unpackCheckpoint(nativeChoice.checkpoint);
  const prior = { ...JSON.parse(encodeWorld(current)), schemaVersion: 41, engineVersion: 42, contentVersion: 17 };
  const migrated = decodeWorld(JSON.stringify(prior));
  expect(migrated.contentVersion).toBe(23);
  expect(JSON.parse(encodeWorld(migrated))).toEqual({ ...prior, schemaVersion: 44, engineVersion: 46, contentVersion: 23, miniGames: [], personSupportRequests: [], personActionHistory: [], rentalLeases: [] });
  expect(migrated.pending).toEqual(current.pending); expect(migrated.random).toEqual(current.random);
  expect(migrated.journal).toEqual(current.journal); expect(migrated.ledger).toEqual(current.ledger);
});
