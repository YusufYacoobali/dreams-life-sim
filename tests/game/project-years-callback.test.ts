import { arrangedProject, ordinaryStoryCommand, realProjectRecall } from '../support/projectRecall';
import { decodeSave } from '../../src/persistence/archive';
import { recordDeath, resolveCommand } from '../../src/game/engine';
import { decodeWorld, encodeWorld, moneyJSON, validateWorld, type World } from '../../src/game/model';
import { monthFrom } from '../../src/game/calendar';
import { storyMonthNumber } from '../../src/game/systems/storyContext';
import { refreshStoryThreads, resolveStory, storyMonth } from '../../src/game/systems/stories';
import { relationFor } from '../../src/game/systems/relationships';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import oldPlans from '../fixtures/v23-school-plans-archive.json';
import oldResolved from '../fixtures/v28-native-school-archive.json';

test.each([
  ['complete', 'remember-project', 'you finished your section', 3, 2, 'I finished my section'],
  ['ask-help', 'dismiss-project', 'you asked for help and completed a shorter section', -3, -2, 'I asked for help and completed a shorter section'],
  ['leave-to-peer', 'pass-project', 'you left your promised section blank', 0, 0, 'I left my promised section blank'],
] as const)('a genuine saved pupil resolves %s, lives 24 real months, then chooses %s without rewriting school work', (original, resolution, past, bond, trust, journalPast) => {
  const offered = realProjectRecall(original), thread = offered.storyThreads[0], recall = thread.projectRecall!, event = offered.pending!;
  expect(thread.resolution).toBe(original); expect(recall.dueMonth - storyMonthNumber(thread.ended!)).toBe(24); expect(storyMonthNumber(offered.date)).toBe(recall.dueMonth);
  expect(recall.expiresMonth).toBe(recall.dueMonth + 2); expect(event.kind === 'decision' && event.personIds).toEqual([thread.personId, thread.peerId]); expect(event.body).toContain(past);
  const before = encodeWorld(offered), edge = relationFor(offered, thread.personId, thread.peerId)!; storyMonth(offered); expect(encodeWorld(offered)).toBe(before);
  const next = resolveCommand(offered, { type: 'choose', eventId: event.id, choiceId: resolution }), updated = next.storyThreads[0];
  expect(updated).toEqual({ ...thread, projectRecall: { ...recall, status: 'resolved', resolution, ended: next.date } });
  expect(next.people).toEqual(offered.people); expect(next.ledger).toEqual(offered.ledger); expect(next.random).toEqual(offered.random);
  expect(relationFor(next, thread.personId, thread.peerId)).toMatchObject({ strength: Math.max(0, Math.min(100, edge.strength + bond)), trust: Math.max(0, Math.min(100, edge.trust + trust)) });
  expect(next.relationships.filter(item => item.id !== edge.id)).toEqual(offered.relationships.filter(item => item.id !== edge.id));
  const remembered = resolution === 'remember-project' ? next : resolveCommand(offered, { type: 'choose', eventId: event.id, choiceId: 'remember-project' });
  expect(remembered.journal.find(row => row.id === thread.id + '_project_recall_choice')!.text).toBe('I talked honestly with ' + offered.people[thread.peerId].firstName + ' about our old project, when ' + journalPast + '.');
  expect(decodeWorld(encodeWorld(remembered))).toEqual(remembered);
  expect(decodeWorld(encodeWorld(next))).toEqual(next); expect(encodeWorld(offered)).toBe(before);
  const wrongChoice = decodeWorld(encodeWorld(next)); wrongChoice.storyThreads[0].projectRecall!.resolution = resolution === 'pass-project' ? 'remember-project' : 'pass-project'; expect(() => validateWorld(wrongChoice)).toThrow(/choice record/);
  const missingChoice = decodeWorld(encodeWorld(next)); missingChoice.journal = missingChoice.journal.filter(row => row.id !== thread.id + '_project_recall_choice'); expect(() => validateWorld(missingChoice)).toThrow(/choice record/);
  expect(() => resolveCommand(next, { type: 'choose', eventId: event.id, choiceId: resolution })).toThrow(/no longer open/);
});

test('the new clock is absent until a real project resolution, and old saved bound plans never acquire one', () => {
  let fresh = arrangedProject(); const before = encodeWorld(fresh), choices = fresh.pending?.kind === 'decision' ? fresh.pending.choices : [];
  expect(choices.find(item => item.id === 'promise')!.effects).toContainEqual(expect.objectContaining({ rememberProject: true })); expect(fresh.storyThreads).toEqual([]); expect(encodeWorld(fresh)).toBe(before);
  fresh = resolveCommand(fresh, { type: 'choose', eventId: fresh.pending!.id, choiceId: 'promise' }); expect(fresh.storyThreads[0].rememberProject).toBe(true); expect(fresh.storyThreads[0]).not.toHaveProperty('projectRecall');
  // Explicit old-shape bound-choice compatibility boundary: omission stays omission, never a default.
  let oldShape = arrangedProject();
  if (oldShape.pending?.kind !== 'decision') throw new Error('Missing arranged project');
  for (const choice of oldShape.pending.choices) for (const effect of choice.effects) if (effect.kind === 'schedule-story') delete effect.rememberProject;
  oldShape = decodeWorld(encodeWorld(oldShape)); oldShape = resolveCommand(oldShape, { type: 'choose', eventId: oldShape.pending!.id, choiceId: 'promise' }); expect(oldShape.storyThreads[0]).not.toHaveProperty('rememberProject'); expect(oldShape.storyThreads[0]).not.toHaveProperty('projectRecall');
  for (const archive of [oldPlans, oldResolved]) {
    let world = decodeSave(JSON.stringify(archive)).world;
    const oldIds = world.storyThreads.map(item => item.id), originals = world.storyThreads.map(item => ({ ...item }));
    for (const thread of world.storyThreads) { expect(thread).not.toHaveProperty('rememberProject'); expect(thread).not.toHaveProperty('projectRecall'); }
    const target = storyMonthNumber(world.date) + 36;
    for (let count = 0; count < 350 && storyMonthNumber(world.date) < target; count++) world = resolveCommand(world, ordinaryStoryCommand(world));
    expect(storyMonthNumber(world.date)).toBeGreaterThanOrEqual(target);
    for (const id of oldIds) { const thread = world.storyThreads.find(item => item.id === id)!; expect(thread).not.toHaveProperty('rememberProject'); expect(thread).not.toHaveProperty('projectRecall'); if (originals.find(item => item.id === id)!.status === 'resolved') expect(thread).toEqual(originals.find(item => item.id === id)); }
  }
});

test('the actual former teacher can die without replacing the original peer or closing their later conversation', () => {
  const world = realProjectRecall(), thread = world.storyThreads[0], peerId = thread.peerId, eventId = world.pending!.id;
  // Explicit arranged mortality boundary through the real death/estate helper, not a natural-death claim.
  recordDeath(world, thread.teacherId!, 'arranged former teacher mortality boundary');
  expect(thread.projectRecall!.status).toBe('offered'); expect(world.pending!.id).toBe(eventId);
  const next = resolveCommand(world, { type: 'choose', eventId, choiceId: 'pass-project' });
  expect(next.storyThreads[0].peerId).toBe(peerId); expect(next.storyThreads[0].projectRecall!.resolution).toBe('pass-project'); expect(decodeWorld(encodeWorld(next))).toEqual(next);
});

test('actual peer death cancels an offered memory, retaining its old project and removing only its own decision', () => {
  const world = realProjectRecall(), thread = world.storyThreads[0], original = { ...thread, projectRecall: undefined }, rng = { ...world.random };
  // Explicit arranged mortality boundary on the actual saved peer, not natural death acceptance.
  recordDeath(world, thread.peerId, 'arranged continuation mortality boundary');
  expect(thread.projectRecall).toMatchObject({ status: 'cancelled', resolution: null, ended: world.date, cancellationReason: 'The classmate from that project is no longer alive' });
  expect({ ...thread, projectRecall: undefined }).toEqual(original); expect(world.pending?.id).not.toBe(thread.id + '_project_recall'); expect(world.deferred.some(item => item.event.id === thread.id + '_project_recall')).toBe(false);
  expect(world.random).toEqual(rng); expect(() => resolveCommand(world, { type: 'choose', eventId: thread.id + '_project_recall', choiceId: 'remember-project' })).toThrow(); expect(decodeWorld(encodeWorld(world))).toEqual(world);
});

test('a three-month availability window expires without a late result; inactive lineage never offers a replacement person', () => {
  const offered = realProjectRecall(), event = offered.pending!;
  // Explicit resolver-boundary arrangements isolate stale dates/presence; these are not whole-save journeys.
  const stale = decodeWorld(encodeWorld(offered)); stale.date = monthFrom(stale.date, 3); const before = encodeWorld(offered);
  expect(stale.pending?.kind === 'decision' && choiceUnavailable(stale, stale.pending.choices[0])).toMatch(/no longer open/);
  expect(() => resolveStory(stale, stale.storyThreads[0].id, 'remember-project')).toThrow(/no longer open/);
  refreshStoryThreads(stale); expect(stale.storyThreads[0].projectRecall).toMatchObject({ status: 'cancelled', resolution: null }); expect(stale.pending?.id).not.toBe(event.id); expect(encodeWorld(offered)).toBe(before);
  const lineage = decodeWorld(before); lineage.activePersonId = lineage.storyThreads[0].peerId; refreshStoryThreads(lineage); expect(lineage.storyThreads[0].projectRecall).toMatchObject({ status: 'cancelled', cancellationReason: 'This part of the family story has ended' });
});

test('the resolver waits for the same absent peer inside the window and offers once when they can actually meet', () => {
  const world = realProjectRecall(), thread = world.storyThreads[0], peer = world.people[thread.peerId], city = peer.city, recall = thread.projectRecall!, rng = { ...world.random };
  // Explicit local resolver boundary, not a valid whole-save/calendar journey: reset only this offer
  // and move its actual peer away, then exercise the next eligible month without fabricating a person.
  world.pending = null; world.pendingPriority = 0; recall.status = 'scheduled'; recall.offered = null; recall.offeredEventId = null;
  peer.city = city + ' (away)'; storyMonth(world); expect(recall.status).toBe('scheduled'); expect(world.pending).toBeNull();
  world.date = monthFrom(world.date, 1); peer.city = city; storyMonth(world);
  const event = world.pending as World['pending']; // storyMonth mutates this after the explicit null boundary above.
  expect(recall.status).toBe('offered'); expect(recall.offered).toEqual(world.date); expect(event?.kind === 'decision' && event.personIds).toEqual([thread.personId, peer.id]);
  const once = JSON.stringify(world, moneyJSON); storyMonth(world); expect(JSON.stringify(world, moneyJSON)).toBe(once); expect(world.random).toEqual(rng);
});

test('forged recall dates, original identities, duplicate offers, choice effects and nested states are rejected without repair', () => {
  const offered = realProjectRecall(), original = encodeWorld(offered);
  const damage: ((world: ReturnType<typeof decodeWorld>) => void)[] = [
    world => { world.storyThreads[0].projectRecall!.dueMonth++; },
    world => { world.storyThreads[0].projectRecall!.expiresMonth++; },
    world => { delete world.storyThreads[0].rememberProject; },
    world => { world.storyThreads[0].projectRecall!.status = 'resolved'; },
    world => { world.storyThreads[0].projectRecall!.offered!.month--; },
    world => { world.deferred.push({ priority: 25, event: world.pending! }); },
    world => { if (world.pending?.kind === 'decision') world.pending.personIds[1] = world.storyThreads[0].teacherId!; },
    world => { if (world.pending?.kind === 'decision') world.pending.choices[0].effects = [{ kind: 'resolve-story', threadId: 'other', resolution: 'remember-project' }]; },
  ];
  for (const alter of damage) { const broken = decodeWorld(original); alter(broken); expect(() => validateWorld(broken)).toThrow(/recall|story/); }
  expect(encodeWorld(offered)).toBe(original);
});
