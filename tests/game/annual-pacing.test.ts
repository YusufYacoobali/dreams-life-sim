import * as content from '../../src/game/content/events';
import { eventWeight } from '../../src/game/content/eventRarity';
import { noteImportantDecision, optionalSceneChance } from '../../src/game/annualPacing';
import { annualPacingSchema, importantDecisionTemplatesV1 } from '../../src/game/systems/annualPacingSchemas';
import { createLife, randomCreation } from '../../src/game/createLife';
import { countries } from '../../src/game/countries';
import { resolveCommand } from '../../src/game/engine';
import { decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { randomInteger } from '../../src/game/random';
import { addChild } from '../../src/game/systems/family';
import { decodeSave } from '../../src/persistence/archive';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { projectPacingOffer, projectPacingCommand, reachPacingYearEnd } from '../support/annualPacing';
import { annualCommand } from '../support/npcRelationships';
import projectArchive from '../fixtures/v27-leisure-archive.json';
import courtArchive from '../fixtures/v9-court-archive.json';

afterEach(() => jest.restoreAllMocks());

test('a genuinely due project is recorded only by its successful choice, suppresses the optional scene and retains the exact old selection draw', () => {
  const fresh = projectPacingOffer(), old = projectPacingOffer(true), before = encodeWorld(fresh), command = projectPacingCommand(fresh);
  expect(fresh.annual?.pacing).toEqual({ ruleVersion: 1, decisions: [] }); expect(old.annual).not.toHaveProperty('pacing');
  expect(fresh.pending).toEqual(old.pending); expect(fresh.random).toEqual(old.random);
  expect(() => resolveCommand(fresh, { ...command, choiceId: 'missing' })).toThrow(/available/); expect(encodeWorld(fresh)).toBe(before);
  const resolved = resolveCommand(fresh, command), legacyResolved = resolveCommand(old, command), observation = resolved.annual!.pacing!.decisions[0];
  expect(observation).toEqual({ eventId: fresh.pending!.id, templateId: 'story-project-promise', personId: fresh.activePersonId, date: fresh.date, journalIndex: resolved.journal.length - 1 });
  expect(resolved.journal[observation.journalIndex].id).toBe(observation.eventId + '_choice');
  expect(resolved.random).toEqual(fresh.random); expect(resolved.people).toEqual(legacyResolved.people); expect(resolved.storyThreads).toEqual(legacyResolved.storyThreads); expect(resolved.ledger).toEqual(fresh.ledger);
  expect(() => resolveCommand(resolved, command)).toThrow(/no longer open/); expect(encodeWorld(fresh)).toBe(before);
  const eligible = jest.spyOn(content, 'eligibleTemplates'), quiet = reachPacingYearEnd(resolved), offered = reachPacingYearEnd(legacyResolved);
  expect(eligible).toHaveBeenCalledTimes(2); expect(randomInteger(1, 1, 100).value).toBe(63);
  const guard = randomInteger(1, 1, 100), pool = content.eligibleTemplates(offered), selected = randomInteger(guard.state, 0, pool.reduce((sum, row) => sum + eventWeight(row), 0) - 1);
  expect(offered.pending?.kind).toBe('decision'); expect(quiet.pending).toMatchObject({ kind: 'result', id: quiet.annual!.id + '_summary' });
  expect(quiet.random).toEqual(offered.random); expect(quiet.random.events).toBe(selected.state);
  expect(quiet.eventHistory).toEqual(fresh.eventHistory); expect(offered.eventHistory).toHaveLength(fresh.eventHistory.length + 1);
  expect(quiet.annual!.pacing!.decisions).toEqual([observation]); expect(offered.annual).not.toHaveProperty('pacing');
  // Only the documented pacing/display/history/quiet-summary differences exist.
  const normalize = (world: World) => { const copy = decodeWorld(encodeWorld(world)); delete copy.annual!.pacing; copy.pending = null; copy.pendingPriority = 0; copy.eventHistory = fresh.eventHistory; copy.journal = copy.journal.filter(row => row.id !== copy.annual!.id + '_quiet'); return copy; };
  expect(normalize(quiet)).toEqual(normalize(offered));
  expect(unpackCheckpoint(packCheckpoint(quiet))).toEqual(quiet); expect(unpackCheckpoint(packCheckpoint(offered))).toEqual(offered);
});

test('an empty eligible pool consumes only the original offer roll, even after a real important resolution', () => {
  const fresh = projectPacingOffer(), old = projectPacingOffer(true), resolved = resolveCommand(fresh, projectPacingCommand(fresh)), legacy = resolveCommand(old, projectPacingCommand(old));
  jest.spyOn(content, 'eligibleTemplates').mockReturnValue([]);
  const quiet = reachPacingYearEnd(resolved), legacyQuiet = reachPacingYearEnd(legacy);
  expect(quiet.random).toEqual(legacyQuiet.random); expect(quiet.random.events).toBe(randomInteger(1, 1, 100).state);
  expect(quiet.pending?.kind).toBe('result'); expect(legacyQuiet.pending?.kind).toBe('result'); expect(quiet.eventHistory).toEqual(fresh.eventHistory);
});

test('first birthday still guarantees the actual uniform introductory choice with no offer roll', () => {
  const input = randomCreation(900), world = createLife('life_busy_year_birthday_unit', 900, { ...input, country: 'US', city: countries.US.cities[0] }, { year: 2000, month: 1, day: 1 });
  // Declared Begin flag only; no natural/SQLite-birth acceptance claim.
  world.birthAcknowledged = true;
  const actual = content.eligibleTemplates, calls: { random: World['random']; pool: ReturnType<typeof actual> }[] = [];
  jest.spyOn(content, 'eligibleTemplates').mockImplementation(current => { const pool = actual(current); calls.push({ random: { ...current.random }, pool }); return pool; });
  const next = reachPacingYearEnd(resolveCommand(world, { type: 'advance' })); expect(calls).toHaveLength(1);
  const introductory = calls[0].pool.filter(row => row.min === 1), draw = randomInteger(calls[0].random.events, 0, introductory.length - 1);
  expect(next.pending).toMatchObject({ kind: 'decision', templateId: introductory[draw.value].id }); expect(next.random).toEqual({ ...calls[0].random, events: draw.state });
  expect(next.annual?.pacing).toEqual({ ruleVersion: 1, decisions: [] });
  const chosen = resolveCommand(next, annualCommand(next)); expect(chosen.annual?.pacing?.decisions).toEqual([]);
});

test('actual medical and queued court choices count in order; result acknowledgements, replay and previews do not', () => {
  let world = decodeSave(JSON.stringify(courtArchive)).world;
  // Declared opt-in frame boundary on genuine unchanged pending/deferred facts;
  // this is not an automatic migration or natural-birth workload claim.
  world.annual!.pacing = { ruleVersion: 1, decisions: [] }; world = validateWorld(world);
  const emergency = world.pending!, command = { type: 'choose' as const, eventId: emergency.id, choiceId: 'care' }, original = encodeWorld(world);
  expect(optionalSceneChance(world.annual)).toBe(78); expect(encodeWorld(world)).toBe(original);
  world = resolveCommand(world, command); expect(world.annual!.pacing!.decisions.map(row => row.templateId)).toEqual(['medical-emergency']);
  expect(optionalSceneChance(world.annual)).toBe(50); const once = encodeWorld(world); expect(() => resolveCommand(world, command)).toThrow(); expect(encodeWorld(world)).toBe(once);
  world = resolveCommand(world, annualCommand(world)); expect(world.pending).toMatchObject({ kind: 'decision', templateId: 'court-hearing' }); expect(world.annual!.pacing!.decisions).toHaveLength(1);
  world = resolveCommand(world, annualCommand(world)); expect(world.annual!.pacing!.decisions.map(row => row.templateId)).toEqual(['medical-emergency', 'court-hearing']); expect(optionalSceneChance(world.annual)).toBe(25);
  expect(world.annual!.pacing!.decisions.map(row => row.journalIndex)).toEqual([...world.annual!.pacing!.decisions.map(row => row.journalIndex)].sort((a, b) => a - b));
  expect(unpackCheckpoint(packCheckpoint(world))).toEqual(world);
});

test('all genuinely old archived frames stay absent through real choices/cold continuation without backfilling', () => {
  for (const archive of [projectArchive, courtArchive]) {
    let world = decodeSave(JSON.stringify(archive)).world;
    const bound = world.pending, encoded = encodeWorld(world); expect(world.annual).not.toHaveProperty('pacing'); expect(decodeWorld(encoded).pending).toEqual(bound);
    world = resolveCommand(world, annualCommand(world)); expect(world.annual).not.toHaveProperty('pacing'); expect(optionalSceneChance(world.annual)).toBe(78);
    expect(unpackCheckpoint(packCheckpoint(world))).toEqual(world); expect(world.annual).not.toHaveProperty('pacing');
  }
});

test('the capped factual recorder ignores manual/ordinary choices and duplicates without creating journals or draws', () => {
  const world = projectPacingOffer(), frame = world.annual!, event = world.pending!;
  if (event.kind !== 'decision') throw new Error('Expected actual callback');
  const original = encodeWorld(world), pending = structuredClone(event), journal = { id: event.id + '_choice', category: 'event', personId: world.activePersonId, date: world.date, text: 'Recorder-only synthetic fact, not whole-save evidence' };
  for (const templateId of ['job-interview', 'meet-people', 'quiet-morning', 'school-project-promise']) noteImportantDecision(frame, { ...pending, templateId }, journal, 0);
  expect(encodeWorld(world)).toBe(original);
  for (const [index, templateId] of importantDecisionTemplatesV1.entries()) { const id = 'recorder_only_' + index; noteImportantDecision(frame, { ...pending, id, templateId }, { ...journal, id: id + '_choice' }, index); }
  expect(frame.pacing!.decisions).toHaveLength(3); expect(optionalSceneChance(frame)).toBe(10); expect(world.journal).toHaveLength(JSON.parse(original).journal.length); expect(world.random).toEqual(JSON.parse(original).random);
  const first = frame.pacing!.decisions[0]; noteImportantDecision(frame, { ...pending, id: first.eventId }, { ...journal, id: first.eventId + '_choice' }, first.journalIndex); expect(frame.pacing!.decisions).toHaveLength(3);
  expect(annualPacingSchema.safeParse({ ruleVersion: 1, decisions: [...frame.pacing!.decisions, first] }).success).toBe(false);
});

test('forged workload journals, classifications, duplicates and dates are rejected rather than repaired', () => {
  const offered = projectPacingOffer(), valid = resolveCommand(offered, projectPacingCommand(offered)), original = encodeWorld(valid);
  const damage: ((world: World) => void)[] = [
    world => { world.annual!.pacing!.decisions[0].journalIndex = world.journal.length; },
    world => { world.annual!.pacing!.decisions[0].eventId = 'another_event'; },
    world => { world.annual!.pacing!.decisions[0].personId = 'missing'; },
    world => { world.annual!.pacing!.decisions[0].templateId = 'quiet-morning' as never; },
    world => { world.annual!.pacing!.decisions[0].date.day--; },
    world => { world.annual!.pacing!.decisions.push({ ...world.annual!.pacing!.decisions[0] }); },
    world => { world.annual!.pacing!.decisions[0].journalIndex = 0; },
  ];
  for (const alter of damage) { const broken = decodeWorld(original); alter(broken); expect(() => validateWorld(broken)).toThrow(); }
  expect(encodeWorld(valid)).toBe(original);
});

test('a real resolved choice survives critical-health death and ordinary child continuation on its actual archived frame', () => {
  let world = decodeSave(JSON.stringify(courtArchive)).world; const parent = world.people[world.activePersonId];
  // Explicit unit mortality/family boundary, not a natural pregnancy or death:
  // standard child creation + initial critical health isolate the actual hooks.
  const child = addChild(world, [parent], 'adoptive', 3); parent.stats.health = 0; world.annual!.pacing = { ruleVersion: 1, decisions: [] }; world = validateWorld(world);
  const eventId = world.pending!.id;
  world = resolveCommand(world, { type: 'choose', eventId, choiceId: 'decline' });
  expect(world.people[parent.id].died).toEqual(world.date); expect(world.annual).toBeNull(); expect(world.legacyAnnual!.pacing!.decisions).toHaveLength(1);
  const saved = world.legacyAnnual!.pacing!, date = world.date; expect(saved.decisions[0].eventId).toBe(eventId); expect(decodeWorld(encodeWorld(world)).legacyAnnual!.pacing).toEqual(saved);
  world = resolveCommand(world, { type: 'continue-child', personId: child.id }); expect(world.activePersonId).toBe(child.id); expect(world.date).toEqual(date); expect(world.annual!.pacing).toEqual(saved); expect(world.legacyAnnual).toBeNull();
  world = resolveCommand(world, annualCommand(world)); expect(world.annual!.pacing).toEqual(saved); expect(world.date).toEqual(date); expect(world.annual!.pausedForPlanning).toBe(true);
  expect(unpackCheckpoint(packCheckpoint(world))).toEqual(world);
});
