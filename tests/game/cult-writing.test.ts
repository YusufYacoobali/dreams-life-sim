import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';
import fixture from '../fixtures/v48-cult-writing-before.json';
import { resolveCommand } from '../../src/game/engine';
import { decodeWorld, encodeWorld, type World } from '../../src/game/model';
import * as beliefs from '../../src/game/content/cults';
import { cultStories } from '../../src/game/content/cultStories';
import { cultClaims, cultClaimRemedies } from '../../src/game/content/cultClaims';
import { cultClaimAdmissions, cultClaimFailureJournals } from '../../src/game/content/cultClaimWriting';
import { arrangeCultWritingCase, cultWritingMechanics, refreshCultWritingOffer, type CultWritingCase } from '../support/cultWriting';

const sha = (text: string) => createHash('sha256').update(text).digest('hex');
const raw = inflateSync(Buffer.from(fixture.data, 'base64')).toString();
const before = JSON.parse(raw) as {
  producer: string; contexts: { id: string; world: unknown }[];
  outcomes: { id: string; choiceId: string; sha256: string }[];
  baseWorld: unknown; runtimeCases: { item: CultWritingCase; sha256: string }[];
  catalogueMechanicalSha256: string;
};
const load = (value: unknown) => decodeWorld(JSON.stringify(value));
const mechanicalWorld = (world: World) => cultWritingMechanics(JSON.parse(encodeWorld(world)));
const resultFor = (world: World, id: string) => [world.pending, ...world.deferred.map(row => row.event)].find(event => event?.kind === 'result' && event.id === id);
function mechanicalCatalogue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(mechanicalCatalogue);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => !['title', 'description', 'body', 'label', 'result', 'resultTitle', 'journal', 'announcement', 'followup', 'successText'].includes(key)).map(([key, item]) => [key, mechanicalCatalogue(item)]));
}

test('genuine pre-rewrite fixtures cover all 56 stories, 18 failed promises and 296 old bound choices', () => {
  expect(sha(raw)).toBe(fixture.sha256); expect(before.producer).toBe('512d3ac');
  expect(before.contexts).toHaveLength(74); expect(before.outcomes).toHaveLength(296);
  expect(new Set(before.contexts.map(row => row.id))).toEqual(new Set([...cultStories, ...cultClaims].map(row => row.id)));
  const catalogue = { beliefs: Object.fromEntries(Object.entries(beliefs).filter(([key]) => !['cultLeaderTitles', 'cultRandomNames'].includes(key))), stories: cultStories, claims: cultClaims, remedies: cultClaimRemedies };
  expect(sha(JSON.stringify(mechanicalCatalogue(catalogue)))).toBe(before.catalogueMechanicalSha256);
});

test.each(before.contexts)('$id keeps its literal saved offer, histories and every old whole-world outcome', context => {
  const world = load(context.world), saved = encodeWorld(world);
  expect(encodeWorld(decodeWorld(saved))).toBe(saved);
  const event = world.pending;
  if (event?.kind !== 'decision') throw Error('Expected saved cult decision');
  for (const choice of event.choices) {
    const result = resolveCommand(world, { type: 'choose', eventId: event.id, choiceId: choice.id });
    expect(sha(encodeWorld(result))).toBe(before.outcomes.find(row => row.id === context.id && row.choiceId === choice.id)!.sha256);
    expect(result.journal.slice(0, world.journal.length)).toEqual(world.journal);
    expect(resultFor(result, event.id + '_result')?.body).toBe(choice.resultBody);
  }
  expect(encodeWorld(world)).toBe(saved);
});

test.each(before.contexts)('$id binds new prose prospectively with identical effects, cash, people, timing and random streams', context => {
  const original = load(context.world), world = refreshCultWritingOffer(load(context.world), context.id);
  const oldEvent = original.pending;
  if (oldEvent?.kind !== 'decision') throw Error('Expected original offer');
  const event = world.pending as World['pending'];
  if (event?.kind !== 'decision') throw Error('Expected new offer');
  expect(event.body).not.toMatch(/\{\w+\}/);
  for (const choice of event.choices) {
    const previous = oldEvent.choices.find(row => row.id === choice.id)!;
    expect(choice.effects).toEqual(previous.effects);
    expect(choice.resultBody).not.toMatch(/\{\w+\}/);
    expect(choice.journal).toMatch(/^I /); expect(choice.journal.replace(/“[^”]*”/g, '')).not.toMatch(/\byou(?:r)?\b/i);
    const command = { type: 'choose' as const, eventId: event.id, choiceId: choice.id };
    const result = resolveCommand(world, command), oldResult = resolveCommand(original, command);
    expect(mechanicalWorld(result)).toEqual(mechanicalWorld(oldResult));
    expect(resultFor(result, event.id + '_result')?.body).toBe(choice.resultBody);
  }
});

test.each(before.runtimeCases)('routine writing $item stays prose-only for its original deterministic command', ({ item, sha256 }) => {
  const world = load(before.baseWorld), command = arrangeCultWritingCase(world, item), result = resolveCommand(world, command);
  expect(sha(JSON.stringify(mechanicalWorld(result)))).toBe(sha256);
  expect(result.pending?.kind).toBe('result');
  if (result.pending?.kind === 'result') {
    expect(result.pending.body).not.toMatch(/\{\w+\}/);
    expect(result.pending.body).not.toMatch(/organisation remembers|situation remains on record|actually paid|The group feels|Nobody needs to/i);
  }
});

test('every authored payoff has a specific title, readable choices, first-person journals and no unexplained placeholders', () => {
  const payoffs = cultStories.flatMap(row => row.choices);
  expect(cultStories).toHaveLength(56); expect(payoffs).toHaveLength(168);
  expect(new Set(payoffs.map(row => row.result)).size).toBe(168);
  expect(new Set(payoffs.map(row => row.resultTitle)).size).toBe(168);
  for (const story of cultStories) {
    expect(story.title.length).toBeLessThanOrEqual(80);
    expect(story.body.split(/\s+/).length).toBeLessThanOrEqual(65);
    for (const choice of story.choices) {
      expect(choice.label.split(/\s+/).length).toBeLessThanOrEqual(10);
      expect(choice.result.split(/\s+/).length).toBeLessThanOrEqual(55);
      expect(choice.journal).toMatch(/^I /); expect(choice.journal).not.toMatch(/\byou(?:r)?\b/i);
      for (const token of (story.body + choice.result + choice.journal).matchAll(/\{(\w+)\}/g)) expect(['member', 'relative', 'rival', 'philosophy']).toContain(token[1]);
    }
  }
  expect(new Set(Object.values(cultClaimAdmissions)).size).toBe(18);
  for (const claim of cultClaims) {
    expect(cultClaimAdmissions[claim.id]).toMatch(/^You /);
    expect(cultClaimFailureJournals[claim.id]).toMatch(/^I /);
    if (claim.test !== 'impossible') expect(claim.successText).toMatch(/^I /);
    expect(cultClaimRemedies[claim.id].journal).toMatch(/^I /);
  }
});
