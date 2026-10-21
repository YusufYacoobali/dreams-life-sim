import { pupil } from '../support/pupil';
import { bindEvent, eligibleTemplates, eventTemplates } from '../../src/game/content/events';
import { decodeWorld, encodeWorld, validateWorld, World } from '../../src/game/model';
import { recordDeath, resolveCommand } from '../../src/game/engine';
import { monthFrom } from '../../src/game/calendar';
import { randomInteger } from '../../src/game/random';
import { offerPending } from '../../src/game/pendingQueue';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { accountFor, post } from '../../src/game/systems/common';
import { addChild } from '../../src/game/systems/family';
import { ownHousehold } from '../../src/game/systems/households';
import { addCondition } from '../../src/game/systems/health';
import { isConfined, resolveLegal } from '../../src/game/systems/legal';
import { moveQuote, relocationFee, resolveRelocation } from '../../src/game/systems/relocation';
import { relationFor } from '../../src/game/systems/relationships';
import { refreshSchools, schoolMonth } from '../../src/game/systems/school';
import { currentSchool } from '../../src/game/systems/schoolSchemas';
import { refreshStoryThreads, storyMonth } from '../../src/game/systems/stories';
import { storyMonthNumber, storyParent } from '../../src/game/systems/storyContext';
import { resolveTravel, travelMonth, tripQuote } from '../../src/game/systems/travel';
import { activeTrip } from '../../src/game/systems/travelSchemas';
import { endEmployment } from '../../src/game/systems/work';

type Kind = 'arcade' | 'project';
test('a dissolved household cancels the actual parent-approved plan without treating missing household IDs as co-residence', () => {
  const world = planned(), thread = world.storyThreads[0], parentId = thread.parentId!, householdId = world.people[world.activePersonId].householdId;
  const money = structuredClone(world.accounts), random = { ...world.random };
  for (const person of Object.values(world.people)) if (person.householdId === householdId) person.householdId = null;
  world.households = world.households.filter(item => item.id !== householdId);
  refreshStoryThreads(world); expect(thread.status).toBe('cancelled'); expect(thread.cancellationReason).toMatch(/parent.*home/i); expect(thread.parentId).toBe(parentId);
  expect(world.accounts).toEqual(money); expect(world.random).toEqual(random); validateWorld(world);
});
function choose(world: World, choiceId: string) {
  if (world.pending?.kind !== 'decision') throw new Error('Expected decision');
  return resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId });
}
function ack(world: World) {
  if (world.pending?.kind !== 'result') throw new Error('Expected result');
  return resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
}
function drain(world: World) {
  for (let guard = 0; world.pending; guard++) {
    if (guard > 100) throw new Error('Unfinished queue');
    world = world.pending.kind === 'result' ? ack(world) : choose(world, world.pending.choices.find(item => !choiceUnavailable(world, item))!.id);
  }
  return world;
}
function promise(world: World, kind: Kind) {
  if (kind === 'arcade') {
    const parent = storyParent(world)!, chance = Math.min(95, 50 + Math.floor(parent.trust / 2));
    world.random.npcs = Array.from({ length: 1000 }, (_, i) => i + 1).find(seed => randomInteger(seed, 1, 100).value <= chance)!;
  }
  const event = bindEvent(world, eventTemplates.find(item => item.id === (kind === 'arcade' ? 'school-arcade-invitation' : 'school-project-promise'))!);
  offerPending(world, event);
  return ack(choose(world, kind === 'arcade' ? 'ask' : 'promise'));
}
const planned = (kind: Kind = 'arcade', age = 8) => promise(pupil('US', age), kind);
test.each(['arcade', 'project'] as const)('a valid sparse history cannot offer the already-recorded %s origin again under the same ID', kind => {
  const world = planned(kind), thread = world.storyThreads[0], template = eventTemplates.find(item => item.id === thread.originTemplateId)!;
  expect(world.eventHistory).toEqual([]); validateWorld(world); const before = encodeWorld(world);
  // The age and participants still fit. The durable origin, rather than a
  // coincidental context restriction, must exclude the duplicate offer.
  expect(bindEvent(world, template).id).toBe(thread.originEventId);
  expect(eligibleTemplates(world)).not.toContainEqual(template); expect(eligibleTemplates(world).length).toBeGreaterThan(0);
  expect(encodeWorld(world)).toBe(before); expect(eligibleTemplates(decodeWorld(before))).not.toContainEqual(template);
});
function funds(world: World, personId: string) {
  post(world, 100000000n, 0n, 'fixture-funding', 'Lifecycle fixture funds', null, world.people[personId]);
}
/** Run the real NPC subsystem as that person, then return to the child's story. */
function asPerson(world: World, personId: string, action: () => void) {
  const child = world.activePersonId;
  world.activePersonId = personId;
  try { action(); } finally { world.activePersonId = child; }
}
function travel(world: World, parentId: string, companions: string[] = [], duration: 1 | 3 = 1) {
  funds(world, parentId); world.random.npcs = 1;
  if (duration > 1) endEmployment(world, parentId);
  asPerson(world, parentId, () => resolveTravel(world, { type: 'book-trip', destinationId: 'paris', duration, companionIds: companions, focus: 'sightseeing', quotedTotal: tripQuote(world, 'paris', duration, companions).total }));
  expect(activeTrip(world, parentId)).toBeDefined();
  return drain(world);
}
function arrest(world: World, personId: string) {
  for (let seed = 1; seed < 100; seed++) {
    const candidate = decodeWorld(encodeWorld(world)); candidate.random.outcomes = seed;
    asPerson(candidate, personId, () => resolveLegal(candidate, { type: 'crime', offence: 'vandalism' }, recordDeath));
    if (personId !== world.activePersonId) { candidate.pending = null; candidate.pendingPriority = 0; }
    if (isConfined(candidate, candidate.people[personId])) return candidate;
  }
  throw new Error('No arrest seed');
}
function cancelled(world: World, index = 0) {
  const thread = world.storyThreads[index];
  expect(thread.status).toBe('cancelled'); expect(thread.ended).toEqual(world.date);
  expect(thread.resolution).toBeNull(); expect(thread.paidTransactionId).toBeNull();
  expect([world.pending, ...world.deferred.map(item => item.event)].some(item => item && item.id === thread.offeredEventId)).toBe(false);
  expect(world.ledger.some(item => item.category === 'story-outing')).toBe(false);
  expect(decodeWorld(encodeWorld(world))).toEqual(world);
}

test('a real parental trip may return before the outing, but absence on its due date cancels without a charge', () => {
  let world = planned(), thread = world.storyThreads[0];
  world = travel(world, thread.parentId!, [], 3); refreshStoryThreads(world);
  expect(world.storyThreads[0].status).toBe('scheduled');
  world.date = monthFrom(world.date, 1); travelMonth(world); storyMonth(world); cancelled(world);
  expect(activeTrip(world, thread.parentId!)).toBeDefined();

  world = planned(); thread = world.storyThreads[0]; world = travel(world, thread.parentId!);
  asPerson(world, thread.parentId!, () => resolveTravel(world, { type: 'return-trip', tripId: activeTrip(world, thread.parentId!)!.id }));
  world = drain(world); refreshStoryThreads(world);
  world = resolveCommand(world, { type: 'advance' }); expect(world.pending?.kind === 'decision' && world.pending.templateId).toBe('story-arcade-invitation');
  expect(choose(world, 'attend').storyThreads[0].status).toBe('resolved');
});

test('a real family holiday completes before the same-month callback, retaining the trip result and original parent', () => {
  let world = planned(); const thread = world.storyThreads[0], periods = currentSchool(world)!.periods.length;
  world = travel(world, thread.parentId!, [world.activePersonId]);
  world = resolveCommand(world, { type: 'advance' });
  expect(world.trips[0].status).toBe('completed'); expect(world.annual?.monthsProcessed).toBe(1);
  expect(world.pending?.id).toBe('trip_end_' + world.trips[0].id);
  expect(currentSchool(world)!.periods).toHaveLength(periods);
  expect(world.deferred.map(item => item.event.id)).toContain(thread.id + '_due');
  world = ack(decodeWorld(encodeWorld(world))); expect(world.pending?.id).toBe(thread.id + '_due');
  world = choose(world, 'attend'); expect(world.storyThreads[0].parentId).toBe(thread.parentId);
  expect(world.ledger.filter(item => item.category === 'story-outing')).toHaveLength(1);
});

test('real player and peer remand cancel their own project at its due date without replacing the classmate', () => {
  for (const who of ['player', 'peer'] as const) {
    let world = planned('project', 16); const original = { ...world.storyThreads[0] }, target = who === 'player' ? world.activePersonId : original.peerId;
    world = arrest(world, target); refreshStoryThreads(world); expect(world.storyThreads[0].status).toBe('scheduled');
    world.date = monthFrom(world.date, 2); storyMonth(world);
    cancelled(world); expect(world.storyThreads[0].peerId).toBe(original.peerId);
    expect(isConfined(world, world.people[target])).toBe(true);
    if (who === 'player') expect(world.pending?.kind === 'decision' && world.pending.templateId).toBe('arrest');
  }
});

test('an arrested approving parent cancels at the due date even when the other parent stays available', () => {
  let world = planned(); const thread = world.storyThreads[0]; world = arrest(world, thread.parentId!);
  refreshStoryThreads(world); expect(world.storyThreads[0].status).toBe('scheduled');
  world.date = monthFrom(world.date, 1); storyMonth(world); cancelled(world);
  expect(world.storyThreads[0].parentId).toBe(thread.parentId); expect(storyParent(world)?.from).not.toBe(thread.parentId);
});

test.each([false, true])('real permanent relocation cancels the original party when the child moves: %s', includeChild => {
  let world = planned(); const thread = world.storyThreads[0], parent = world.people[thread.parentId!]; funds(world, parent.id);
  world.random.outcomes = 1; world.random.npcs = 1;
  asPerson(world, parent.id, () => {
    resolveRelocation(world, { type: 'apply-relocation', destinationId: 'paris', route: 'settlement', roleId: null, program: null, field: null, quotedFee: relocationFee(world) });
    world.pending = null; world.pendingPriority = 0; // Dismiss the NPC's factual application result.
    const application = world.relocations[0], companions = includeChild ? [thread.personId] : [];
    expect(application.status).toBe('approved');
    resolveRelocation(world, { type: 'relocate', applicationId: application.id, companionIds: companions, reserveMonths: 3, reviewedQuote: moveQuote(world, application, companions) });
  });
  expect(world.relocations[0].status).toBe('moved'); refreshSchools(world); refreshStoryThreads(world);
  cancelled(world); expect(world.storyThreads[0].country).toBe('US'); expect(world.storyThreads[0].parentId).toBe(parent.id);
  expect(world.people[thread.personId].country).toBe(includeChild ? 'FR' : 'US');
  expect(world.storyThreads[0].cancellationReason).toMatch(includeChild ? /moved away/ : /no longer at home/);
});

test.each(['quit', 'death'] as const)('teacher %s cancels a project and a later replacement never inherits the promise', departure => {
  const world = planned('project'), thread = world.storyThreads[0], school = currentSchool(world)!, ids = [...school.teacherIds];
  if (departure === 'quit') endEmployment(world, thread.teacherId!); else recordDeath(world, thread.teacherId!, 'test illness');
  refreshStoryThreads(world); cancelled(world); world.date = monthFrom(world.date, 1); schoolMonth(world); refreshStoryThreads(world);
  expect(school.currentTeacherId).not.toBe(thread.teacherId); expect(school.teacherIds).toEqual([...ids, school.currentTeacherId]);
  expect(thread.teacherId).toBe(ids[0]); expect(thread.status).toBe('cancelled'); validateWorld(world);
});

test.each(['household', 'death'] as const)('the named parent’s %s cancels an already offered outing without charging or substituting', change => {
  const world = resolveCommand(planned(), { type: 'advance' }), thread = world.storyThreads[0], original = thread.parentId;
  if (change === 'household') ownHousehold(world, world.people[original!]); else recordDeath(world, original!, 'test illness');
  refreshStoryThreads(world); cancelled(world);
  expect(thread.parentId).toBe(original); expect(storyParent(world)?.from).not.toBe(original);
  expect(world.annual?.monthsProcessed).toBe(1);
});

test('a school-age player death cancels queued plans and never invents a child for legacy', () => {
  const world = resolveCommand(planned('project', 16), { type: 'advance' }), studentId = world.activePersonId, people = Object.keys(world.people);
  recordDeath(world, studentId, 'test illness'); cancelled(world); expect(world.pending).toBeNull(); expect(world.deferred).toEqual([]);
  expect(Object.keys(world.people)).toEqual(people);
  expect(() => resolveCommand(world, { type: 'continue-child', personId: world.storyThreads[0].peerId })).toThrow(/existing living child/);
});

test('an actual existing-child legacy preserves school callback history and the interrupted cursor without reviving a childhood promise', () => {
  let world = drain(resolveCommand(planned('project', 16), { type: 'advance' }));
  world = drain(resolveCommand(world, { type: 'advance' })); // The former student is now eighteen.
  const student = world.people[world.activePersonId], child = addChild(world, [student], 'biological'), thread = structuredClone(world.storyThreads[0]);
  expect(thread.status).toBe('resolved'); expect(thread.projectRecall?.status).toBe('scheduled');
  const startDate = { ...world.date }; world.date = monthFrom(startDate, 4);
  world.annual = { id: 'year_legacy_callback_history', startDate, targetDate: monthFrom(startDate, 12), monthsProcessed: 4, stage: 'months', pausedForPlanning: false };
  const cursor = structuredClone(world.annual); recordDeath(world, student.id, 'test illness');
  // The resolved school project stays exact; only its new, still-unoffered
  // two-year continuation ends when its actual participant dies.
  const endedThread = structuredClone(world.storyThreads[0]);
  expect(endedThread).toEqual({ ...thread, projectRecall: { ...thread.projectRecall, status: 'cancelled', ended: world.date, cancellationReason: 'This part of the family story has ended' } });
  const atDeath = { ...world.date }, existing = structuredClone(world.people[child.id]), people = Object.keys(world.people), random = { ...world.random };
  world = resolveCommand(decodeWorld(encodeWorld(world)), { type: 'continue-child', personId: child.id });
  expect(world.activePersonId).toBe(child.id); expect(world.people[child.id]).toEqual(existing); expect(Object.keys(world.people)).toEqual(people);
  expect(world.random).toEqual(random); expect(world.date).toEqual(atDeath); expect(world.annual?.monthsProcessed).toBe(cursor!.monthsProcessed);
  expect(world.annual?.pausedForPlanning).toBe(true); expect(world.storyThreads[0].personId).toBe(thread.personId);
  world = ack(world); world = drain(resolveCommand(world, { type: 'resume' }));
  expect(world.date).toEqual(cursor!.targetDate); expect(world.annual).toBeNull(); expect(world.storyThreads[0]).toEqual(endedThread);
  expect(world.ledger.some(item => item.category === 'story-outing')).toBe(false);
});

function lastMonth(world: World) {
  const startDate = monthFrom(world.date, -11);
  world.annual = { id: 'year_callback_boundary', startDate, targetDate: monthFrom(startDate, 12), monthsProcessed: 11, stage: 'months', pausedForPlanning: true };
  return validateWorld(world);
}
test.each(['decline', 'care'] as const)('two genuine callbacks due in month twelve retain medical priority and %s resolves the queue once', care => {
  let world = planned('project'); world.date = monthFrom(world.date, 1); schoolMonth(world); world = promise(world, 'arcade');
  const dueMonth = world.storyThreads[0].dueMonth; expect(world.storyThreads[1].dueMonth).toBe(dueMonth);
  addCondition(world, world.people[world.activePersonId], 'asthma', 75);
  world = resolveCommand(lastMonth(world), { type: 'resume' });
  expect(world.annual?.monthsProcessed).toBe(12); expect(storyMonthNumber(world.date)).toBe(dueMonth);
  expect(world.pending?.kind === 'decision' && world.pending.templateId).toBe('medical-emergency');
  expect(world.deferred.filter(item => item.event.kind === 'decision' && item.event.templateId.startsWith('story-'))).toHaveLength(2);
  const target = { ...world.annual!.targetDate }; world = choose(decodeWorld(encodeWorld(world)), care);
  if (care === 'care') { expect(world.storyThreads.every(item => item.status === 'cancelled')).toBe(true); expect(world.deferred).toEqual([]); }
  world = drain(world);
  if (world.annual) world = drain(resolveCommand(world, { type: 'resume' }));
  expect(world.date).toEqual(target); expect(world.annual).toBeNull(); expect(world.pending).toBeNull();
  expect(world.storyThreads.every(item => item.status === (care === 'care' ? 'cancelled' : 'resolved'))).toBe(true);
  expect(world.ledger.filter(item => item.category === 'story-outing')).toHaveLength(care === 'care' ? 0 : 1);
  for (const thread of world.storyThreads) expect(world.journal.filter(item => item.id === thread.offeredEventId + '_choice')).toHaveLength(care === 'care' ? 0 : 1);
  validateWorld(world);
});

test.each(['not-guilty', 'guilty'] as const)('a real month-twelve hearing precedes the project and a %s verdict keeps or cancels its exact decision', plea => {
  let world = planned('project', 16); world.date = monthFrom(world.date, 1); world = arrest(world, world.activePersonId); funds(world, world.activePersonId);
  // The genuine saved case/roll is retained; use a deterministic acquittal when requested.
  if (plea === 'not-guilty') world.cases[0].trialRoll = 100;
  world = drain(choose(world, 'bail')); expect(world.storyThreads[0].status).toBe('scheduled');
  world = resolveCommand(lastMonth(world), { type: 'resume' });
  expect(world.annual?.monthsProcessed).toBe(12); expect(world.pending?.kind === 'decision' && world.pending.templateId).toBe('court-hearing');
  expect(world.deferred.some(item => item.event.id === world.storyThreads[0].offeredEventId)).toBe(true);
  const target = { ...world.annual!.targetDate }; world = choose(decodeWorld(encodeWorld(world)), plea);
  expect(world.storyThreads[0].status).toBe(plea === 'guilty' ? 'cancelled' : 'offered');
  world = drain(world); if (world.annual) world = drain(resolveCommand(world, { type: 'resume' }));
  expect(world.date).toEqual(target); expect(world.annual).toBeNull(); expect(world.storyThreads[0].status).toBe(plea === 'guilty' ? 'cancelled' : 'resolved');
  validateWorld(world);
});

test.each(['decline', 'care'] as const)('simultaneous actual medical and legal events in month twelve preserve priority, cancellation and the annual cursor after %s', care => {
  let world = planned('project', 16); world.date = monthFrom(world.date, 1); world = arrest(world, world.activePersonId); funds(world, world.activePersonId);
  world.cases[0].trialRoll = 100; world = drain(choose(world, 'bail'));
  addCondition(world, world.people[world.activePersonId], 'asthma', 75);
  world = resolveCommand(lastMonth(world), { type: 'resume' }); const target = { ...world.annual!.targetDate };
  expect(world.pending?.kind === 'decision' && world.pending.templateId).toBe('medical-emergency');
  expect(world.deferred.map(item => item.event.kind === 'decision' && item.event.templateId)).toEqual(['court-hearing', 'story-project-promise']);
  world = ack(choose(decodeWorld(encodeWorld(world)), care));
  expect(world.pending?.kind === 'decision' && world.pending.templateId).toBe('court-hearing');
  expect(world.storyThreads[0].status).toBe(care === 'care' ? 'cancelled' : 'offered');
  world = ack(choose(decodeWorld(encodeWorld(world)), 'not-guilty'));
  if (care === 'decline') { expect(world.pending?.id).toBe(world.storyThreads[0].offeredEventId); world = ack(choose(world, 'ask-help')); }
  world = drain(world); if (world.annual) world = drain(resolveCommand(world, { type: 'resume' }));
  expect(world.date).toEqual(target); expect(world.annual).toBeNull(); expect(world.cases[0].status).toBe('acquitted');
  expect(world.storyThreads[0].status).toBe(care === 'care' ? 'cancelled' : 'resolved'); validateWorld(world);
});

test('arcade attendance reports capped happiness, energy and both bonds while still charging the exact quote once', () => {
  let world = resolveCommand(planned(), { type: 'advance' }); const thread = world.storyThreads[0], person = world.people[world.activePersonId];
  person.stats.happiness = 99; person.stats.energy = 2;
  relationFor(world, person.id, thread.peerId)!.strength = 99; relationFor(world, person.id, thread.parentId!)!.strength = 100;
  const parentCash = accountFor(world, world.people[thread.parentId!]).cash;
  world = choose(decodeWorld(encodeWorld(world)), 'attend');
  expect(world.people[person.id].stats.happiness).toBe(100); expect(world.people[person.id].stats.energy).toBe(0);
  expect(relationFor(world, person.id, thread.peerId)!.strength).toBe(100); expect(relationFor(world, person.id, thread.parentId!)!.strength).toBe(100);
  if (world.pending?.kind !== 'result') throw new Error('Expected result');
  expect(world.pending.effects.slice(1).map(item => item.value)).toEqual(['+1%', '-2%', '+1%', '+0%']);
  expect(accountFor(world, world.people[thread.parentId!]).cash).toBe(parentCash - thread.quote.amount);
  expect(world.ledger.filter(item => item.category === 'story-outing')).toHaveLength(1);
});

test.each([
  { resolution: 'complete', grade: 99, bond: 99, trust: 99, energy: 2, expected: [100, 100, 100, 0], deltas: ['+1%', '+1%', '+1%', '-2%'] },
  { resolution: 'ask-help', grade: 100, bond: 100, trust: 100, energy: 0, expected: [100, 100, 100, 0], deltas: ['+0%', '+0%', '+0%', '+0%'] },
  { resolution: 'leave-to-peer', grade: 1, bond: 2, trust: 1, energy: 100, expected: [0, 0, 0, 100], deltas: ['-1%', '-2%', '-1%', '+0%'] },
])('project $resolution reports only actual bounded grades, bonds, trust and energy', sample => {
  let world = resolveCommand(planned('project'), { type: 'advance' }); const thread = world.storyThreads[0], person = world.people[world.activePersonId];
  person.education.grades = sample.grade; person.stats.energy = sample.energy;
  relationFor(world, person.id, thread.peerId)!.strength = sample.bond; relationFor(world, person.id, thread.teacherId!)!.trust = sample.trust;
  const qualifications = structuredClone(person.education.qualifications), random = { ...world.random }, ledger = structuredClone(world.ledger);
  world = choose(decodeWorld(encodeWorld(world)), sample.resolution); const next = world.people[person.id];
  expect([next.education.grades, relationFor(world, person.id, thread.peerId)!.strength, relationFor(world, person.id, thread.teacherId!)!.trust, next.stats.energy]).toEqual(sample.expected);
  if (world.pending?.kind !== 'result') throw new Error('Expected result');
  expect(['Grades', world.people[thread.peerId].firstName + ' · relationship', world.people[thread.teacherId!].firstName + ' · trust', 'Energy'].map(label => world.pending?.kind === 'result' && world.pending.effects.find(item => item.label === label)!.value)).toEqual(sample.deltas);
  expect(next.education.qualifications).toEqual(qualifications); expect(world.random).toEqual(random); expect(world.ledger).toEqual(ledger);
});
