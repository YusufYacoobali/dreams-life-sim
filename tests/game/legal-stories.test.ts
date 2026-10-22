import * as events from '../../src/game/content/events';
import { legalTemplates } from '../../src/game/content/legalStories';
import { resolveCommand } from '../../src/game/engine';
import { monthFrom } from '../../src/game/calendar';
import { decodeWorld, encodeWorld, fullName, moneyJSON, validateWorld, type World } from '../../src/game/model';
import { randomInteger } from '../../src/game/random';
import { offerPending } from '../../src/game/pendingQueue';
import { activeSentence } from '../../src/game/systems/legalSchemas';
import { legalStoryContexts } from '../../src/game/systems/legalStoryContext';
import { relationFor } from '../../src/game/systems/relationships';
import { decodeSave } from '../../src/persistence/archive';
import { actualReleasedStoryWorld, pendingCaseStoryWorld, prisonPeerStoryWorld } from '../support/legalStories';
import graduate from '../fixtures/v3-employed-graduate.json';
import archive from '../fixtures/v9-court-archive.json';

const scene = (kind: 'awaiting-trial' | 'prison-peer' | 'released') => legalTemplates.find(item => item.legal === kind)!;
function unavailable(world: World, kind: Parameters<typeof scene>[0]) {
  const before = JSON.stringify(world, moneyJSON);
  expect(events.eligibleTemplates(world)).not.toContainEqual(scene(kind));
  expect(() => events.bindEvent(world, scene(kind))).toThrow('existing available legal context');
  expect(JSON.stringify(world, moneyJSON)).toBe(before);
}
afterEach(() => jest.restoreAllMocks());

test('the three distinct legal dilemmas bind only existing cases, custody and release; a free graduate gets none', () => {
  expect(legalTemplates).toHaveLength(9); expect(legalTemplates.flatMap(item => item.choices)).toHaveLength(27);
  const free = decodeWorld(JSON.stringify(graduate)), before = encodeWorld(free);
  expect(events.eligibleTemplates(free).filter(item => item.legal)).toEqual([]);
  expect(encodeWorld(free)).toBe(before);
  const court = pendingCaseStoryWorld(), saved = encodeWorld(court), bound = events.bindEvent(court, scene('awaiting-trial'));
  expect(events.eligibleTemplates(court)).toContainEqual(scene('awaiting-trial'));
  expect(bound.body).toContain('vandalism hearing in New York'); expect(bound.personIds).toEqual([court.activePersonId]);
  expect(bound.choices.flatMap(choice => choice.effects).every(effect => effect.kind === 'stat')).toBe(true);
  expect(encodeWorld(court)).toBe(saved); expect(bound.body).not.toMatch(/\{\w+\}/);
});

test('hearing preparation requires the actor’s adult current local case and an actually future hearing', () => {
  const initial = pendingCaseStoryWorld();
  for (const change of [
    (world: World) => { world.cases[0].hearing = { ...world.date }; },
    (world: World) => { world.cases[0].personId = 'person_parent1'; },
    (world: World) => { world.cases[0].city = 'Elsewhere'; },
    (world: World) => { world.cases[0].juvenile = true; },
    (world: World) => { world.cases[0].status = 'acquitted'; },
    (world: World) => { world.people[world.activePersonId].born.year = world.date.year - 17; },
    (world: World) => { world.people[world.activePersonId].legal.wanted = true; },
    (world: World) => { world.people[world.activePersonId].health.hospitalizedUntil = world.date.year * 12 + world.date.month - 1; },
  ]) {
    const world = structuredClone(initial); change(world); unavailable(world, 'awaiting-trial');
  }
});

test('a prison peer is a real known adult in the same active facility, never a generated substitute', () => {
  const world = prisonPeerStoryWorld(), context = legalStoryContexts(world), before = encodeWorld(world);
  expect(context.peer).toBeDefined(); expect(context.sentence?.servedMonths).toBe(1);
  const bound = events.bindEvent(world, scene('prison-peer'));
  expect(events.eligibleTemplates(world)).toContainEqual(scene('prison-peer'));
  expect(bound.body).toContain(context.sentence!.facility); expect(bound.body).toContain(fullName(context.peer!.person));
  expect(bound.personIds).toEqual([world.activePersonId, context.peer!.person.id]);
  expect(bound.choices.find(choice => choice.id === 'feelings')!.effects).toContainEqual({ kind: 'relationship', relationshipId: context.peer!.relationshipId, delta: 3 });
  expect(encodeWorld(world)).toBe(before);
  for (const change of [
    (copy: World) => { copy.relationships = copy.relationships.filter(edge => edge.id !== context.peer!.relationshipId); },
    (copy: World) => { activeSentence(copy, context.peer!.person.id)!.facility = 'Another facility'; },
    (copy: World) => { copy.people[context.peer!.person.id].city = 'Elsewhere'; },
    (copy: World) => { copy.people[context.peer!.person.id].born.year = copy.date.year - 17; },
    (copy: World) => { copy.people[context.peer!.person.id].health.hospitalizedUntil = copy.date.year * 12 + copy.date.month - 1; },
    (copy: World) => { activeSentence(copy)!.servedMonths = 0; },
    (copy: World) => { activeSentence(copy, context.peer!.person.id)!.state = 'released'; },
    (copy: World) => { copy.people[context.peer!.person.id].died = { ...copy.date }; },
  ]) {
    // Predicate traps intentionally alter one context fact, not imported valid worlds.
    const copy = structuredClone(world); change(copy); unavailable(copy, 'prison-peer');
  }
});

test('a prison choice reports capped real bond/stress effects and never changes legal facts, pay, identities or RNG', () => {
  const world = prisonPeerStoryWorld(), context = legalStoryContexts(world), person = world.people[world.activePersonId];
  person.stats.stress = 1; relationFor(world, person.id, context.peer!.person.id)!.strength = 99;
  const bound = events.bindEvent(world, scene('prison-peer')); offerPending(world, bound);
  const next = resolveCommand(world, { type: 'choose', eventId: bound.id, choiceId: 'feelings' });
  expect(next.pending).toMatchObject({ kind: 'result', title: 'An answer about today', effects: [
    { label: 'Stress', value: '-1%', tone: 'positive' },
    { label: fullName(context.peer!.person) + ' · relationship', value: '+1%', tone: 'positive' },
  ] });
  expect(next.random).toEqual(world.random); expect(next.cases).toEqual(world.cases); expect(next.sentences).toEqual(world.sentences);
  expect(next.accounts).toEqual(world.accounts); expect(next.ledger).toEqual(world.ledger); expect(Object.keys(next.people)).toEqual(Object.keys(world.people));
  expect(next.relationships.find(edge => edge.id === context.peer!.relationshipId)?.trust).toBe(world.relationships.find(edge => edge.id === context.peer!.relationshipId)!.trust);
  expect(decodeWorld(encodeWorld(next)).pending).toEqual(next.pending);
});

test('ordinary v9 care, conviction and actual served months reach a recorded release; only its first twelve months qualify', () => {
  const world = actualReleasedStoryWorld(), released = legalStoryContexts(world).released!;
  expect(released).toMatchObject({ state: 'released', releaseReason: 'served', servedMonths: 4 });
  expect(events.eligibleTemplates(world)).toContainEqual(scene('released'));
  expect(events.bindEvent(world, scene('released')).body).toContain(released.facility);
  const anniversary = structuredClone(world); anniversary.date = monthFrom(released.ended!, 12);
  expect(legalStoryContexts(anniversary).released?.id).toBe(released.id);
  anniversary.date = monthFrom(released.ended!, 13); unavailable(anniversary, 'released');
  const inpatient = structuredClone(world); inpatient.people[inpatient.activePersonId].health.hospitalizedUntil = inpatient.date.year * 12 + inpatient.date.month - 1;
  unavailable(inpatient, 'released');
  const confined = structuredClone(world); confined.cases.push({ ...confined.cases[0], id: 'new_context_custody', status: 'awaiting-trial', detained: true });
  unavailable(confined, 'released');
});

test('the ordinary custody year-end offers a genuinely eligible legal scene with exactly the old two event draws', () => {
  const world = prisonPeerStoryWorld();
  // Declared final-month frame/stream and a narrowed REAL eligible pool test
  // the engine custody gate, not natural encounter odds or twelve-month play.
  world.random.events = 1;
  world.annual = { id: 'year_legal_context_unit', startDate: monthFrom(world.date, -12), targetDate: { ...world.date }, monthsProcessed: 12, stage: 'months', pausedForPlanning: true };
  const actual = events.eligibleTemplates;
  jest.spyOn(events, 'eligibleTemplates').mockImplementation(current => actual(current).filter(item => item.legal));
  const next = resolveCommand(validateWorld(world), { type: 'resume' });
  expect(next.pending).toMatchObject({ kind: 'decision', templateId: 'prison-case-boundary' });
  const offered = randomInteger(1, 1, 100), selected = randomInteger(offered.state, 0, 99);
  expect(next.random.events).toBe(selected.state); expect(next.eventHistory.at(-1)?.templateId).toBe('prison-case-boundary');
});

test('an explicitly arranged C14 envelope preserves the genuine saved medical/court choices and all facts through current migration', () => {
  const world = decodeSave(JSON.stringify(archive)).world, value = JSON.parse(encodeWorld(world));
  // The medical/court records are genuine. Only this old-version envelope is
  // arranged; it is not a newly claimed C14 producer or gameplay continuation.
  expect(value.campusCommunities).toEqual([]); delete value.campusCommunities; expect(value.miniGames).toEqual([]); delete value.miniGames;
  value.schemaVersion = 39; value.engineVersion = 40; value.contentVersion = 14;
  const migrated = decodeWorld(JSON.stringify(value));
  expect(migrated).toEqual(world); expect(migrated.contentVersion).toBe(20);
  expect(migrated.pending).toEqual(world.pending); expect(migrated.deferred).toEqual(world.deferred); expect(migrated.random).toEqual(world.random);
  const bound = events.bindEvent(pendingCaseStoryWorld(), scene('awaiting-trial'));
  offerPending(world, bound); expect(world.pending?.kind === 'decision' && world.pending.templateId).toBe('medical-emergency');
  expect(world.deferred.map(row => row.priority)).toEqual([110, 20]);
});
