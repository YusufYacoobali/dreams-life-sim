import { monthFrom } from '../../src/game/calendar';
import { hobbyKinds } from '../../src/game/content/leisure';
import { resolveCommand } from '../../src/game/engine';
import { ageOn, copyWorld, encodeWorld, fullName, World } from '../../src/game/model';
import { accountFor, post } from '../../src/game/systems/common';
import { activeHobbyPlan } from '../../src/game/systems/leisureSchemas';
import { hobbyContacts, hobbyFee, hobbyIntroductionReason, leisureMonth, resolveLeisure } from '../../src/game/systems/leisure';
import { createContact } from '../../src/game/systems/npcs';
import { relationFor } from '../../src/game/systems/relationships';
import { decodeSave } from '../../src/persistence/archive';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import archive from '../fixtures/v28-ordinary-hobby-archive.json';
import { pupil } from '../support/pupil';

const acknowledge = (world: World) => world.pending ? resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id }, true) : world;
const savedChild = () => acknowledge(decodeSave(JSON.stringify(archive)).world);
const commandFor = (world: World, index = 0) => { const hobby = world.hobbies[index], plan = activeHobbyPlan(hobby)!; return { type: 'meet-hobby-peer' as const, hobbyId: hobby.id, planId: plan.id, reviewedPayerId: plan.payerId, reviewedMonth: world.date.year * 12 + world.date.month - 1 }; };

test.each([0, 1])('actual saved child hobby %s creates exactly one local peer with bounded bond and no extra charge or practice', index => {
  const world = savedChild(), hobby = world.hobbies[index], before = encodeWorld(world), command = commandFor(world, index);
  expect(hobbyIntroductionReason(world, hobby, activeHobbyPlan(hobby)!)).toBeUndefined();
  expect(hobbyContacts(world, hobby)).toEqual([]); expect(encodeWorld(world)).toBe(before);
  const next = resolveCommand(world, command, true), peer = hobbyContacts(next, next.hobbies[index])[0], edge = relationFor(next, world.activePersonId, peer.id)!;
  expect(Object.keys(next.people)).toHaveLength(Object.keys(world.people).length + 1);
  expect(ageOn(peer, next.date)).toBe(ageOn(world.people[world.activePersonId], world.date)); expect(peer.country).toBe(world.people[world.activePersonId].country); expect(peer.city).toBe(world.people[world.activePersonId].city);
  expect(edge).toMatchObject({ strength: 35, trust: 35, romance: 'none', memories: ['met:' + world.date.year, 'hobby-introduction:' + hobby.id + ':' + world.date.year] }); expect(edge.roles).not.toContain('friend');
  expect(next.accounts.slice(0, world.accounts.length)).toEqual(world.accounts); expect(accountFor(next, peer).cash).toBe(0n); expect(next.ledger).toEqual(world.ledger); expect(next.liabilities).toEqual(world.liabilities); expect(next.hobbies).toEqual(world.hobbies); expect(next.people[world.activePersonId]).toEqual(world.people[world.activePersonId]);
  expect(next.pending).toMatchObject({ kind: 'result', title: 'An introduction at practice' }); expect(next.pending?.kind === 'result' && next.pending.body).toContain(fullName(world.people[command.reviewedPayerId]) + ', came with you.');
  const cold = unpackCheckpoint(packCheckpoint(next), true); expect(encodeWorld(cold)).toBe(encodeWorld(next));
  const done = acknowledge(cold), exact = encodeWorld(done); expect(() => resolveCommand(done, command, true)).toThrow(/already made an introduction/); expect(encodeWorld(done)).toBe(exact); expect(encodeWorld(world)).toBe(before);
});

test.each([
  ['old paid month', (world: World) => { world.date = monthFrom(world.date, 1, world.calendarAnchorDay); }, /Attend a paid month/],
  ['moved participant', (world: World) => { world.people[world.activePersonId].city = 'Elsewhere'; }, /current local routine/],
  ['unavailable adult', (world: World) => { const plan = activeHobbyPlan(world.hobbies[0])!; world.people[plan.payerId].health.hospitalizedUntil = world.date.year * 12 + world.date.month - 1; }, /adult is unavailable/],
  ['lost household', (world: World) => { world.people[world.activePersonId].householdId = null; }, /responsible payer/],
  ['fatigue', (world: World) => { world.people[world.activePersonId].stats.energy = 1; }, /Rest before/],
  ['illness', (world: World) => { world.people[world.activePersonId].stats.health = 24; }, /Recover your health/],
  ['unpaid month', (world: World) => { world.hobbies[0].practices.at(-1)!.paid = 0n; }, /Attend a paid month/],
  ['missing payment', (world: World) => { world.hobbies[0].practices.at(-1)!.paymentId = null; }, /Attend a paid month/],
  ['current manual practice only', (world: World) => { world.hobbies[0].practices.at(-1)!.source = 'manual'; }, /Attend a paid month/],
  ['permission not accepted', (world: World) => { activeHobbyPlan(world.hobbies[0])!.consent.accepted = false; }, /agreed hobby routine/],
] as const)('%s prevents a new person, RNG draw, payment or journal entry', (_label, configure, expected) => {
  // Resolver-only guard fixtures, not whole valid saves or natural journeys.
  // In particular, moving the date/city alone intentionally does not run other
  // systems' cursors; no configured restriction is saved or imported.
  const world = copyWorld(savedChild()); configure(world); const before = structuredClone(world), hobby = world.hobbies[0];
  expect(hobbyIntroductionReason(world, hobby, activeHobbyPlan(hobby)!)).toMatch(expected);
  expect(() => resolveLeisure(world, commandFor(world))).toThrow(expected); expect(world).toEqual(before);
});

test('stale payer/plan reviews fail and another routine cannot reuse an old paid attendance', () => {
  const world = savedChild(), command = commandFor(world), before = encodeWorld(world);
  expect(() => resolveCommand(world, { ...command, reviewedPayerId: world.activePersonId }, true)).toThrow(/payer changed/);
  expect(() => resolveCommand(world, { ...command, planId: 'old-plan' }, true)).toThrow(/current hobby routine/);
  expect(() => resolveCommand(world, { ...command, reviewedMonth: command.reviewedMonth - 1 }, true)).toThrow(/attended month changed/);
  const reading = world.hobbies[1], plan = activeHobbyPlan(reading)!;
  const changed = acknowledge(resolveCommand(world, { type: 'hobby-plan', kind: reading.kind, mode: 'lessons', reviewedPayerId: plan.payerId, quotedMonthlyFee: hobbyFee(world.people[world.activePersonId].country, reading.kind, 'lessons') }, true));
  if (activeHobbyPlan(changed.hobbies[1])!.mode === 'lessons') expect(() => resolveCommand(changed, commandFor(changed, 1), true)).toThrow(/Attend a paid month/);
  else expect(changed.hobbies[1].plans.at(-1)?.status).toBe('declined');
  expect(encodeWorld(world)).toBe(before);
});

test.each(hobbyKinds)('%s connects a genuine already-attending local participant without generating another person', kind => {
  // Explicit adult unit setup: initial date/stats come from pupil and funding
  // is labelled fixture funding. Both routines and payments are real commands
  // and leisureMonth; this is not claimed as a natural birth-to-hobby journey.
  let world = pupil('US', 20), actorId = world.activePersonId;
  post(world, 1000000n, 0n, 'fixture-funding', 'Hobby introduction unit setup');
  const peerId = createContact(world, { age: 20 }).id;
  const enroll = (initial: World) => acknowledge(resolveCommand(initial, { type: 'hobby-plan', kind, mode: 'community', reviewedPayerId: initial.activePersonId, quotedMonthlyFee: hobbyFee('US', kind, 'community') }, true));
  world.activePersonId = peerId; world = copyWorld(enroll(world)); world.activePersonId = actorId; world = copyWorld(enroll(world));
  world.date = monthFrom(world.date, 1, world.calendarAnchorDay); leisureMonth(world);
  const index = world.hobbies.findIndex(hobby => hobby.personId === actorId), people = copyWorld(world).people, money = structuredClone(world.accounts), random = { ...world.random }, beforeHobbies = structuredClone(world.hobbies);
  const next = resolveCommand(world, commandFor(world, index), true);
  expect(next.people).toEqual(people); expect(next.accounts).toEqual(money); expect(next.random).toEqual(random); expect(next.hobbies).toEqual(beforeHobbies); expect(hobbyContacts(next, next.hobbies[index]).map(person => person.id)).toEqual([peerId]); expect(relationFor(next, actorId, peerId)?.strength).toBe(35);
});

test('already-paid access needs no second reserve and another hobby retains its separate bounded introduction', () => {
  let world = copyWorld(savedChild()); const payer = world.people[activeHobbyPlan(world.hobbies[0])!.payerId]; post(world, -accountFor(world, payer).cash, 0n, 'fixture-spending', 'Unit setup: no remaining reserve', null, payer);
  expect(hobbyIntroductionReason(world, world.hobbies[0], activeHobbyPlan(world.hobbies[0])!)).toBeUndefined();
  world = acknowledge(resolveCommand(world, commandFor(world), true));
  expect(hobbyIntroductionReason(world, world.hobbies[0], activeHobbyPlan(world.hobbies[0])!)).toMatch(/calendar year/); expect(hobbyContacts(world, world.hobbies[0])).toHaveLength(1);
  const other = resolveCommand(world, commandFor(world, 1), true); expect(hobbyContacts(other, other.hobbies[0])).toHaveLength(1); expect(hobbyContacts(other, other.hobbies[1])).toHaveLength(1);
});

test('changing an adult routine after an introduction does not reset the yearly limit', () => {
  let world = pupil('US', 20); post(world, 1000000n, 0n, 'fixture-funding', 'Adult routine-change unit setup');
  const enroll = (mode: 'community' | 'lessons') => acknowledge(resolveCommand(world, { type: 'hobby-plan', kind: 'reading', mode, reviewedPayerId: world.activePersonId, quotedMonthlyFee: hobbyFee('US', 'reading', mode) }, true));
  world = copyWorld(enroll('community')); world.date = monthFrom(world.date, 1, world.calendarAnchorDay); leisureMonth(world); world = acknowledge(resolveCommand(world, commandFor(world), true));
  const peerId = hobbyContacts(world, world.hobbies[0])[0].id, original = commandFor(world); world = copyWorld(enroll('lessons'));
  expect(() => resolveCommand(world, original, true)).toThrow(/current hobby routine/);
  world.date = monthFrom(world.date, 1, world.calendarAnchorDay); leisureMonth(world);
  const before = encodeWorld(world); expect(() => resolveCommand(world, commandFor(world), true)).toThrow(/calendar year/); expect(encodeWorld(world)).toBe(before); expect(hobbyContacts(world, world.hobbies[0]).map(person => person.id)).toEqual([peerId]);
});

test.each([18, 140])('a configured %s-year-old meets an actual adult within eight years rather than a capped much-younger peer', age => {
  let world = pupil('US', age); post(world, 1000000n, 0n, 'fixture-funding', 'Adult introduction age-bound unit setup');
  world = copyWorld(acknowledge(resolveCommand(world, { type: 'hobby-plan', kind: 'reading', mode: 'community', reviewedPayerId: world.activePersonId, quotedMonthlyFee: hobbyFee('US', 'reading', 'community') }, true)));
  world.date = monthFrom(world.date, 1, world.calendarAnchorDay); leisureMonth(world);
  const next = resolveCommand(world, commandFor(world), true), peer = hobbyContacts(next, next.hobbies[0])[0], actualAge = ageOn(next.people[next.activePersonId], next.date), peerAge = ageOn(peer, next.date);
  expect(peerAge).toBeGreaterThanOrEqual(Math.max(18, actualAge - 8)); expect(peerAge).toBeLessThanOrEqual(actualAge + 8); expect(encodeWorld(unpackCheckpoint(packCheckpoint(next), true))).toBe(encodeWorld(next));
});
