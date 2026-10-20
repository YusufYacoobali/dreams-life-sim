import { gunzipSync, strFromU8 } from 'fflate';
import { pupil } from '../support/pupil';
import { bindEvent, eligibleTemplates, eventTemplates } from '../../src/game/content/events';
import { decodeWorld, encodeWorld, validateWorld, World } from '../../src/game/model';
import { recordDeath, resolveCommand } from '../../src/game/engine';
import { monthFrom } from '../../src/game/calendar';
import { countryCodes, CountryCode } from '../../src/game/countries';
import { rules } from '../../src/game/rules';
import { roundRatio } from '../../src/game/money';
import { randomInteger } from '../../src/game/random';
import { offerPending } from '../../src/game/pendingQueue';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { accountFor, post } from '../../src/game/systems/common';
import { currentSchool } from '../../src/game/systems/schoolSchemas';
import { refreshSchools } from '../../src/game/systems/school';
import { relationFor } from '../../src/game/systems/relationships';
import { storyMonthNumber, storyParent } from '../../src/game/systems/storyContext';
import { refreshStoryThreads, storyMonth } from '../../src/game/systems/stories';
import { decodeSave } from '../../src/persistence/archive';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import archived from '../fixtures/v22-school-story-archive.json';

const template = (id: string) => eventTemplates.find(item => item.id === id)!;
function consent(world: World, accepted: boolean) {
  const edge = storyParent(world)!, chance = Math.min(95, 50 + Math.floor(edge.trust / 2));
  for (let seed = 1; seed < 10000; seed++) if ((randomInteger(seed, 1, 100).value <= chance) === accepted) { world.random.npcs = seed; return; }
  throw new Error('No consent fixture seed');
}
function start(kind: 'arcade' | 'project', country: CountryCode = 'US', accepted = true) {
  const world = pupil(country, 8), scene = template(kind === 'arcade' ? 'school-arcade-invitation' : 'school-project-promise');
  if (kind === 'arcade') consent(world, accepted);
  const before = encodeWorld(world), event = bindEvent(world, scene); expect(encodeWorld(world)).toBe(before); offerPending(world, event);
  const next = resolveCommand(world, { type: 'choose', eventId: event.id, choiceId: kind === 'arcade' ? 'ask' : 'promise' });
  if (next.pending?.kind !== 'result') throw new Error('Missing origin result');
  return resolveCommand(next, { type: 'acknowledge', resultId: next.pending.id });
}
function due(world: World) {
  const offered = resolveCommand(world, { type: 'advance' });
  expect(offered.pending?.kind === 'decision' && offered.pending.templateId).toMatch(/^story-/);
  return offered;
}
function choose(world: World, id: string) {
  if (world.pending?.kind !== 'decision') throw new Error('Missing callback decision');
  return resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: id });
}
function finish(world: World) {
  for (let i = 0; i < 20 && world.pending; i++) {
    if (world.pending.kind === 'result') world = resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
    else world = choose(world, world.pending.choices.find(item => !choiceUnavailable(world, item))!.id);
  }
  return world;
}
test.each(countryCodes)('%s real permission, one due-month offer and parent payment preserve local units and all identities', country => {
  const original = start('arcade', country), thread = original.storyThreads[0], before = encodeWorld(original);
  expect(thread.status).toBe('scheduled'); expect(thread.permission?.accepted).toBe(true); expect(thread.permission?.accepted).toBe(thread.permission!.roll <= thread.permission!.chance);
  expect(thread.quote.amount).toBe(roundRatio(rules[country].baseWage, 2000n) || 1n); expect(original.ledger.filter(item => item.category === 'story-outing')).toEqual([]);
  expect(decodeWorld(before)).toEqual(original); expect(encodeWorld(original)).toBe(before);
  const offered = due(decodeWorld(before)), saved = offered.storyThreads[0], event = offered.pending!;
  expect(storyMonthNumber(offered.date)).toBe(thread.dueMonth); expect(offered.annual?.monthsProcessed).toBe(1);
  expect(event.kind === 'decision' && event.personIds).toEqual([thread.personId, thread.peerId, thread.parentId]);
  const parent = offered.people[thread.parentId!], balance = accountFor(offered, parent).cash, playerCash = accountFor(offered).cash, peerCash = accountFor(offered, offered.people[thread.peerId]).cash, rng = { ...offered.random };
  const repeated = encodeWorld(offered); storyMonth(offered); expect(encodeWorld(offered)).toBe(repeated);
  const result = choose(decodeWorld(repeated), 'attend'), paid = result.storyThreads[0];
  expect(accountFor(result, result.people[parent.id]).cash).toBe(balance - thread.quote.amount); expect(accountFor(result).cash).toBe(playerCash); expect(accountFor(result, result.people[thread.peerId]).cash).toBe(peerCash);
  const payment = result.ledger.find(item => item.id === paid.paidTransactionId)!; expect(payment.cashDelta).toBe(-thread.quote.amount); expect(payment.personId).toBe(parent.id); expect(payment.currency).toBe(thread.quote.currency); expect(payment.debtDelta).toBe(0n);
  expect(result.random).toEqual(rng); expect(paid.status).toBe('resolved'); expect(paid.resolution).toBe('attend'); expect(decodeWorld(encodeWorld(result))).toEqual(result);
  expect(() => choose(result, 'attend')).toThrow(); expect(saved.peerId).toBe(thread.peerId); validateWorld(result);
});
test('asking consumes exactly one NPC draw; refusal persists without a booked visit, charge or future offer', () => {
  const initial = pupil('US', 8); consent(initial, false); const rng = { ...initial.random }, event = bindEvent(initial, template('school-arcade-invitation')); offerPending(initial, event);
  const answer = resolveCommand(initial, { type: 'choose', eventId: event.id, choiceId: 'ask' }), thread = answer.storyThreads[0];
  expect(answer.random).toEqual({ ...rng, npcs: randomInteger(rng.npcs, 1, 100).state }); expect(thread.permission?.accepted).toBe(false); expect(thread.status).toBe('cancelled'); expect(thread.offeredEventId).toBeNull(); expect(thread.paidTransactionId).toBeNull();
  expect(answer.pending?.kind === 'result' && answer.pending.effects.some(item => item.value.includes('declined'))).toBe(true);
  const completed = finish(resolveCommand(finish(answer), { type: 'advance' })); expect(completed.storyThreads[0]).toEqual(thread); expect(completed.ledger.some(item => item.category === 'story-outing')).toBe(false);
});
test('the saved quote makes low funds visible while a free decline stays available and never creates debt', () => {
  const offered = due(start('arcade')), thread = offered.storyThreads[0], parentAccount = accountFor(offered, offered.people[thread.parentId!]);
  post(offered, -parentAccount.cash, 0n, 'fixture-spending', 'Earlier parent spending', null, offered.people[thread.parentId!], parentAccount.currency); const prior = encodeWorld(offered), choice = offered.pending?.kind === 'decision' && offered.pending.choices.find(item => item.id === 'attend');
  expect(choice && choiceUnavailable(offered, choice)).toMatch(/cannot cover/); expect(() => choose(offered, 'attend')).toThrow(/cannot cover/); expect(encodeWorld(offered)).toBe(prior);
  const declined = choose(offered, 'decline'); expect(declined.storyThreads[0].status).toBe('resolved'); expect(declined.storyThreads[0].paidTransactionId).toBeNull(); expect(declined.liabilities).toEqual(offered.liabilities); expect(declined.ledger).toEqual(offered.ledger);
});
test.each(['complete', 'ask-help', 'leave-to-peer'])('a saved project deadline applies actual %s grades, peer bond and teacher trust without a qualification', resolution => {
  const planned = start('project'), first = planned.storyThreads[0]; expect(first.permission).toBeNull(); expect(first.quote.amount).toBe(0n);
  const offered = due(planned), person = offered.people[offered.activePersonId], teacher = relationFor(offered, person.id, first.teacherId!)!, peer = relationFor(offered, person.id, first.peerId)!, before = encodeWorld(offered);
  expect(offered.annual?.monthsProcessed).toBe(2); expect(storyMonthNumber(offered.date)).toBe(first.dueMonth);
  const result = choose(decodeWorld(before), resolution), next = result.people[result.activePersonId];
  expect(next.education.grades).toBe(Math.max(0, Math.min(100, person.education.grades + (resolution === 'complete' ? 3 : resolution === 'ask-help' ? 1 : -2))));
  expect(relationFor(result, next.id, first.teacherId!)!.trust).toBe(Math.max(0, Math.min(100, teacher.trust + (resolution === 'leave-to-peer' ? -4 : 2))));
  expect(relationFor(result, next.id, first.peerId)!.strength).toBe(Math.max(0, Math.min(100, peer.strength + (resolution === 'complete' ? 4 : resolution === 'ask-help' ? 2 : -6))));
  expect(next.education.qualifications).toEqual(person.education.qualifications); expect(result.ledger).toEqual(offered.ledger); expect(result.random).toEqual(offered.random); expect(result.storyThreads[0].resolution).toBe(resolution); validateWorld(result);
});
test.each(['arcade', 'project'] as const)('%s pauses actual Age Up, survives cold results and resumes only the remaining months', kind => {
  const planned = start(kind), startDate = { ...planned.date }, offered = due(planned), selected = choose(offered, kind === 'arcade' ? 'decline' : 'complete'), resumed = finish(decodeWorld(encodeWorld(selected)));
  expect(resumed.date).toEqual(monthFrom(startDate, 12)); expect(resumed.annual).toBeNull(); expect(resumed.pending).toBeNull(); expect(currentSchool(resumed)!.periods).toHaveLength(13); expect(resumed.storyThreads[0].status).toBe('resolved');
  const ids = Object.keys(resumed.people); expect(new Set(ids).size).toBe(ids.length); expect(resumed.journal.filter(item => item.id === offered.pending!.id + '_choice')).toHaveLength(1);
});
test.each(['player-hospital', 'peer-hospital', 'parent-hospital', 'wanted'] as const)('%s at the due date cancels the exact party instead of postponing or charging', condition => {
  const planned = start('arcade'), thread = planned.storyThreads[0];
  if (condition === 'wanted') planned.people[planned.activePersonId].legal.wanted = true;
  else planned.people[condition === 'player-hospital' ? thread.personId : condition === 'peer-hospital' ? thread.peerId : thread.parentId!].health.hospitalizedUntil = thread.dueMonth + 2;
  planned.date = monthFrom(planned.date, 1); storyMonth(planned); expect(thread.status).toBe('cancelled'); expect(thread.offeredEventId).toBeNull(); expect(planned.pending).toBeNull(); expect(planned.ledger.some(item => item.category === 'story-outing')).toBe(false); validateWorld(planned);
});
test('a changed school cancels a promise with its original identities, and a death removes only its queued callback', () => {
  const changed = start('project'), school = currentSchool(changed)!; changed.people[changed.activePersonId].education.school = 'A different school'; refreshSchools(changed); refreshStoryThreads(changed);
  expect(changed.storyThreads[0].status).toBe('cancelled'); expect(changed.storyThreads[0].communityId).toBe(school.id); validateWorld(changed);
  const offered = due(start('arcade')), thread = offered.storyThreads[0];
  offerPending(offered, { kind: 'result', id: 'urgent_saved_result', title: 'A more urgent matter', body: 'Preserve this result.', illustration: 'journal', effects: [] }, 120);
  expect(offered.deferred.some(item => item.event.id === thread.offeredEventId)).toBe(true); recordDeath(offered, thread.peerId, 'test illness');
  expect(thread.status).toBe('cancelled'); expect(offered.pending?.id).toBe('urgent_saved_result'); expect(offered.deferred.some(item => item.event.id === thread.offeredEventId)).toBe(false); expect(thread.paidTransactionId).toBeNull(); validateWorld(offered);
});
test('read-only eligibility/loads do not generate threads or RNG, and an unavailable parent cannot approve an arcade plan', () => {
  const world = pupil('US', 8), before = encodeWorld(world); eligibleTemplates(world); bindEvent(world, template('school-project-promise')); decodeWorld(before); expect(encodeWorld(world)).toBe(before); expect(world.storyThreads).toEqual([]);
  for (const edge of world.relationships.filter(item => item.kind === 'parent' && item.to === world.activePersonId)) world.people[edge.from].health.hospitalizedUntil = storyMonthNumber(world.date) + 5;
  expect(eligibleTemplates(world).some(item => item.id === 'school-arcade-invitation')).toBe(false); expect(() => bindEvent(world, template('school-arcade-invitation'))).toThrow(/living parent/);
});
test('malformed permission, payment, resolution and pending references are rejected instead of silently repaired', () => {
  const planned = start('arcade'), altered = decodeWorld(encodeWorld(planned)); altered.storyThreads[0].permission!.accepted = false; expect(() => validateWorld(altered)).toThrow(/permission/);
  const offered = due(planned), wrong = decodeWorld(encodeWorld(offered)); if (wrong.pending?.kind !== 'decision') throw new Error('Missing callback'); wrong.pending.choices[0].effects = [{ kind: 'resolve-story', threadId: 'missing', resolution: 'attend' }]; expect(() => validateWorld(wrong)).toThrow(/story/);
  const paid = choose(offered, 'attend'), damaged = decodeWorld(encodeWorld(paid)); damaged.storyThreads[0].quote.amount++; expect(() => validateWorld(damaged)).toThrow(/payment/);
  const badDate = decodeWorld(encodeWorld(paid)); badDate.storyThreads[0].dueMonth++; expect(() => validateWorld(badDate)).toThrow(/origin/);
});
test('the genuine world22 archive preserves all story effects, named school people, ledger and prior decision without generating a callback', () => {
  const original = JSON.parse(strFromU8(gunzipSync(Buffer.from(JSON.parse(archived.checkpoint).data, 'base64')))), save = decodeSave(JSON.stringify(archived)), world = save.world, encoded = JSON.parse(encodeWorld(world));
  expect(world.schemaVersion).toBe(30); expect(world.engineVersion).toBe(31); expect(world.contentVersion).toBe(8); expect(world.storyThreads).toEqual([]);
  for (const key of Object.keys(original).filter(key => !['schemaVersion', 'engineVersion', 'contentVersion'].includes(key))) expect(encoded[key]).toEqual(original[key]);
  expect(world.pending?.kind === 'result' && world.pending.title).toBe('Useful, eventually'); const prior = unpackCheckpoint(save.snapshots[0].payload); expect(prior.storyThreads).toEqual([]); expect(prior.pending?.kind === 'decision' && prior.pending.templateId).toBe('school-volcano-breach'); expect(decodeWorld(encodeWorld(world))).toEqual(world);
});
