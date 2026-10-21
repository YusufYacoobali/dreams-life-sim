import { createHash } from 'node:crypto';
import * as events from '../../src/game/content/events';
import { EVENT_RARITY_VERSION, EVENT_RARITY_WEIGHTS, eventWeight, weightedEvent } from '../../src/game/content/eventRarity';
import type { EventTemplate } from '../../src/game/content/eventTypes';
import { countries } from '../../src/game/countries';
import { randomCreation } from '../../src/game/createLife';
import { resolveCommand } from '../../src/game/engine';
import { ageOn, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { randomInteger } from '../../src/game/random';
import { decodeSave } from '../../src/persistence/archive';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { SaveRepository } from '../../src/persistence/repository';
import { createGameStore } from '../../src/state/gameStore';
import { createEditorialLife } from '../support/editorialPolicy';
import { database } from '../support/sqlite';
import hobbies from '../fixtures/v28-ordinary-hobby-archive.json';
import service from '../fixtures/v16-service-archive.json';

test('version one retains original251 tiers and the historical original250 golden with one explicit neutral-copy bridge', () => {
  const originalCatalogue = events.eventTemplates.slice(0, 251);
  expect(EVENT_RARITY_VERSION).toBe(1);
  expect(EVENT_RARITY_WEIGHTS).toEqual({ common: 100, uncommon: 25, rare: 5, 'extremely-rare': 1 });
  expect(events.eventTemplates).toHaveLength(270);
  expect(originalCatalogue.filter(row => row.rarity === 'uncommon').map(row => row.id).sort()).toEqual([
    'adult-uncertain-memory', 'adult-wrong-name-badge', 'later-old-competition', 'pet-parrot-perfect-timing', 'school-label-swap', 'school-mascot-petition', 'school-secret-language', 'school-tree-audition', 'school-volcano-breach', 'small-mistake', 'teen-family-interview', 'teen-yearbook-proof',
  ]);
  expect(originalCatalogue.filter(row => row.rarity === 'rare').map(row => row.id)).toEqual(['child-shop-separation']);
  expect(originalCatalogue.filter(row => row.rarity === 'extremely-rare').map(row => row.id)).toEqual(['adult-accidental-living-exhibit']);
  expect(originalCatalogue.filter(row => !row.rarity || row.rarity === 'common')).toHaveLength(237);
  expect(['common', 'uncommon', 'rare', 'extremely-rare'].map(tier => events.eventTemplates.filter(row => (row.rarity ?? 'common') === tier).length)).toEqual([250, 18, 1, 1]);
  const copy = events.eventTemplates.slice(0, 250).map(({ id, title, body, choices }) => ({ id, title, body, choices: choices.map(({ id, label, title, result, journal }) => ({ id, label, title, result, journal })) }));
  // Preserve the C12 historical narrative golden by restoring ONLY this copied result.
  // Newly bound C13 scenes use neutral copy; existing saved choices are never rewritten.
  const cameraAway = copy.find(row => row.id === 'first-camera-closeup')!.choices.find(choice => choice.id === 'away')!;
  expect(cameraAway.result).toBe('{parent} gets a photograph of the back of your head. You have already found something else to do.');
  cameraAway.result = '{parent} gets a photograph of your hair. You have already found something else to do.';
  expect(createHash('sha256').update(JSON.stringify(copy)).digest('hex')).toBe('3bcaeee8d5d03b0710cf9a96d0dff6cb53b182f452bc8f52c9a85e5c26be6d01');
});

test('cumulative selection gives each tier its exact relative span, including first and last positions, using one draw', () => {
  // Selector-only entries demonstrate all supported tiers; they are never
  // registered, bound or submitted as observations of a natural story.
  const entries: EventTemplate[] = (['common', 'uncommon', 'rare', 'extremely-rare'] as const).map(rarity => ({ ...events.eventTemplates[0], rarity }));
  const counts = [0, 0, 0, 0];
  for (let ticket = 0; ticket < 131; ticket++) {
    const draw = jest.fn((total: number) => { expect(total).toBe(131); return ticket; });
    const selected = weightedEvent(entries, draw);
    counts[entries.indexOf(selected)]++;
    expect(draw).toHaveBeenCalledTimes(1);
  }
  expect(counts).toEqual([100, 25, 5, 1]);
  expect(weightedEvent(entries, () => 0)).toBe(entries[0]);
  expect(weightedEvent(entries, () => 100)).toBe(entries[1]);
  expect(weightedEvent(entries, () => 125)).toBe(entries[2]);
  expect(weightedEvent(entries, () => 130)).toBe(entries[3]);
});

test('every position of a genuine eligible school/pet/hobby pool selects only its existing eligible scene without reading or changing RNG', () => {
  const world = decodeSave(JSON.stringify(hobbies)).world, before = encodeWorld(world), pool = events.eligibleTemplates(world);
  expect(pool.some(row => row.id === 'child-shop-separation')).toBe(true);
  const total = pool.reduce((sum, row) => sum + eventWeight(row), 0), counts = new Map<string, number>();
  for (let ticket = 0; ticket < total; ticket++) {
    const selected = weightedEvent(pool, () => ticket);
    expect(pool.includes(selected)).toBe(true);
    counts.set(selected.id, (counts.get(selected.id) ?? 0) + 1);
  }
  for (const row of pool) expect(counts.get(row.id)).toBe(eventWeight(row));
  expect(encodeWorld(world)).toBe(before);
});

test('weighting cannot restore an ineligible age/context or a scene still on its five-year cooldown', () => {
  const world = decodeSave(JSON.stringify(hobbies)).world;
  // Explicit saved-history boundary setup only; no new scene is manufactured.
  world.eventHistory.push({ templateId: 'child-shop-separation', year: world.date.year - 4 });
  const cooling = events.eligibleTemplates(world);
  expect(cooling.some(row => row.id === 'child-shop-separation')).toBe(false);
  expect(cooling.some(row => row.partner || row.specialCareer || row.child)).toBe(false);
  for (const row of cooling) { expect(ageOn(world.people[world.activePersonId], world.date)).toBeGreaterThanOrEqual(row.min); expect(ageOn(world.people[world.activePersonId], world.date)).toBeLessThanOrEqual(row.max); }
  const total = cooling.reduce((sum, row) => sum + eventWeight(row), 0);
  for (let ticket = 0; ticket < total; ticket++) expect(weightedEvent(cooling, () => ticket).id).not.toBe('child-shop-separation');
  world.eventHistory.at(-1)!.year--;
  expect(events.eligibleTemplates(world).some(row => row.id === 'child-shop-separation')).toBe(true);
});

test('invalid pools and tickets fail rather than consume another draw or fall back to a different story', () => {
  const draw = jest.fn(() => 0);
  expect(() => weightedEvent([], draw)).toThrow(/empty/); expect(draw).not.toHaveBeenCalled();
  expect(() => weightedEvent([{ ...events.eventTemplates[0], rarity: 'unknown' } as unknown as EventTemplate], draw)).toThrow(/weights/); expect(draw).not.toHaveBeenCalled();
  for (const ticket of [-1, 0.5, 100, NaN]) expect(() => weightedEvent([events.eventTemplates[0]], () => ticket)).toThrow(/selection draw/);
});

function observeSelection() {
  const actual = events.eligibleTemplates;
  const calls: { random: World['random']; eligible: readonly EventTemplate[] }[] = [];
  const spy = jest.spyOn(events, 'eligibleTemplates').mockImplementation(world => {
    const eligible = actual(world); calls.push({ random: { ...world.random }, eligible }); return eligible;
  });
  return { calls, close: () => spy.mockRestore() };
}

test('an actual stored birth retains the exact old uniform first-year introduction and one events draw', async () => {
  const initial = (await createEditorialLife({ createGameStore, SaveRepository, randomCreation, countries, database }, 'US', 900)).world;
  const observed = observeSelection();
  try {
    const next = resolveCommand(initial, { type: 'advance' }, true);
    expect(observed.calls).toHaveLength(1);
    const { random, eligible } = observed.calls[0], introductory = eligible.filter(row => row.min === 1), draw = randomInteger(random.events, 0, introductory.length - 1);
    expect(next.pending).toMatchObject({ kind: 'decision', templateId: introductory[draw.value].id });
    expect(next.random).toEqual({ ...random, events: draw.state });
    expect(next.annual).toMatchObject({ stage: 'complete', monthsProcessed: 12 });
    expect(unpackCheckpoint(packCheckpoint(next), true)).toEqual(next);
  } finally { observed.close(); }
});

test('the genuine saved month-twelve service boundary keeps the 78% guard, exact draw count and deterministic cold continuation', () => {
  const original = decodeSave(JSON.stringify(service)).world;
  if (original.pending?.kind !== 'result') throw new Error('Expected original service result');
  const boundary = resolveCommand(original, { type: 'acknowledge', resultId: original.pending.id }, true);
  expect(boundary.annual).toMatchObject({ monthsProcessed: 12, pausedForPlanning: true });
  const restored = unpackCheckpoint(packCheckpoint(boundary), true); expect(encodeWorld(restored)).toBe(encodeWorld(boundary));
  const observed = observeSelection();
  try {
    const next = resolveCommand(restored, { type: 'resume' }, true);
    expect(observed.calls).toHaveLength(1);
    const { random, eligible } = observed.calls[0], guard = randomInteger(random.events, 1, 100);
    if (guard.value <= 78 && eligible.length) {
      const total = eligible.reduce((sum, row) => sum + eventWeight(row), 0), selection = randomInteger(guard.state, 0, total - 1);
      expect(next.pending).toMatchObject({ kind: 'decision', templateId: weightedEvent(eligible, () => selection.value).id });
      expect(next.random).toEqual({ ...random, events: selection.state });
    } else {
      expect(next.pending?.kind).toBe('result'); expect(next.random).toEqual({ ...random, events: guard.state });
    }
    expect(next.date).toEqual(boundary.date); expect(next.annual).toMatchObject({ monthsProcessed: 12, stage: 'complete' });
    expect(unpackCheckpoint(packCheckpoint(next), true)).toEqual(next);
    expect(encodeWorld(resolveCommand(boundary, { type: 'resume' }, true))).toBe(encodeWorld(next));
    validateWorld(next);
  } finally { observed.close(); }
});
