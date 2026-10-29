import { countryCodes } from '../../src/game/countries';
import { monthFrom } from '../../src/game/calendar';
import { hobbyKinds, type HobbyKind } from '../../src/game/content/leisure';
import { hobbyEventApproaches, hobbyEventChance } from '../../src/game/content/hobbyEvents';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { randomInteger } from '../../src/game/random';
import { hobbyFee, leisureMonth, leisurePayer } from '../../src/game/systems/leisure';
import { hobbyEventFee, hobbyEventReason } from '../../src/game/systems/hobbyEvents';
import { accountFor, post } from '../../src/game/systems/common';
import { pupil } from '../support/pupil';
const ack = (world: World) => world.pending ? resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id }) : world;
/** Explicit unit setup: controlled age, funds and draws; not a natural journey. */
function prepared(kind: HobbyKind = 'reading', country: typeof countryCodes[number] = 'US', age = 20, months = 12) {
  let world = pupil(country, age); world.people[world.activePersonId].stats.energy = 100;
  post(world, 10000000n, 0n, 'test-funding', 'Explicit unit fixture', null, leisurePayer(world)!);
  world.random.npcs = 1;
  world = ack(resolveCommand(world, { type: 'hobby-plan', kind, mode: 'community', reviewedPayerId: leisurePayer(world)!.id, quotedMonthlyFee: hobbyFee(country, kind, 'community') }));
  expect(world.hobbies[0].plans[0].consent.accepted).toBe(true);
  for (let i = 0; i < months; i++) { world.date = monthFrom(world.date, 1); leisureMonth(world); }
  return validateWorld(world);
}
function command(world: World, approach: typeof hobbyEventApproaches[number] = 'familiar') { const person = world.people[world.activePersonId]; return { type: 'enter-hobby-event' as const, kind: world.hobbies[0].kind, approach, reviewedPayerId: leisurePayer(world)!.id, quotedFee: hobbyEventFee(person.country, world.hobbies[0].kind) }; }

test.each(countryCodes.flatMap(country => hobbyKinds.map(kind => [country, kind] as const)))('%s %s reviews read-only and records one real entry payment, bounded effects and exact cold result', (country, kind) => {
  const world = prepared(kind, country), before = encodeWorld(world), cash = accountFor(world).cash, rng = world.random.npcs, practice = structuredClone(world.hobbies), qualifications = structuredClone(world.people[world.activePersonId].education);
  expect(hobbyEventReason(world, kind, 'familiar')).toBeUndefined(); expect(hobbyEventChance(world.hobbies[0].proficiency, 80, 'familiar')).toBe(72); expect(encodeWorld(world)).toBe(before);
  const next = resolveCommand(world, command(world)), row = next.hobbyEvents[0];
  expect(row).toMatchObject({ personId: world.activePersonId, kind, proficiency: 24, discipline: 80, practiceCursor: 12, consent: { accepted: true, strength: null }, paid: command(world).quotedFee });
  expect(next.random.npcs).toBe(rng); expect(next.random.outcomes).toBe(randomInteger(world.random.outcomes, 1, 100).state);
  expect(accountFor(next).cash).toBe(cash - row.paid); expect(next.ledger.at(-1)).toMatchObject({ id: row.paymentId, category: 'hobby-event', personId: world.activePersonId, cashDelta: -row.paid, debtDelta: 0n });
  expect(next.hobbies).toEqual(practice); expect(next.people[world.activePersonId].education).toEqual(qualifications); expect(next.pending).toMatchObject({ kind: 'result', illustration: 'leisure-' + kind });
  expect(decodeWorld(encodeWorld(next))).toEqual(next); expect(resolveCommand(world, command(world))).toEqual(next); expect(encodeWorld(world)).toBe(before);
  const finished = ack(next); expect(() => resolveCommand(finished, command(finished))).toThrow(/already entered/);
});

test.each(hobbyEventApproaches.flatMap(approach => [true, false].map(recognized => [approach, recognized] as const)))('%s has an actual %s recognition result and only its reviewed consequences', (approach, recognized) => {
  const world = prepared(), person = world.people[world.activePersonId], chance = hobbyEventChance(24, 80, approach);
  world.random.outcomes = Array.from({ length: 2000 }, (_, index) => index + 1).find(seed => (randomInteger(seed, 1, 100).value <= chance) === recognized)!;
  person.stats.happiness = 99; person.stats.respect = 99; person.stats.stress = 1;
  const next = resolveCommand(world, command(world, approach)), row = next.hobbyEvents[0]; expect(row.recognized).toBe(recognized);
  expect(row.effects.find(item => item.stat === 'energy')!.before - row.effects.find(item => item.stat === 'energy')!.after).toBe(approach === 'stretch' ? 8 : 4);
  expect(next.people[world.activePersonId].stats.happiness).toBe(100); expect(next.people[world.activePersonId].stats.respect).toBe(recognized ? 100 : 99); expect(decodeWorld(encodeWorld(next))).toEqual(next);
});

test.each([true, false])('minor permission accepted=%s uses the actual adult and refuses without fee/outcome draw/attendance', accepted => {
  const world = prepared('reading', 'US', 6), payer = leisurePayer(world)!, edge = world.relationships.find(row => [row.from, row.to].includes(payer.id) && [row.from, row.to].includes(world.activePersonId))!, chance = Math.min(95, 45 + Math.floor(edge.strength / 2));
  world.random.npcs = Array.from({ length: 2000 }, (_, i) => i + 1).find(seed => (randomInteger(seed, 1, 100).value <= chance) === accepted)!;
  const accounts = structuredClone(world.accounts), outcomes = world.random.outcomes, next = resolveCommand(world, command(world)), row = next.hobbyEvents[0]; expect(row.consent.accepted).toBe(accepted); expect(row.payerId).toBe(payer.id);
  if (!accepted) { expect(next.accounts).toEqual(accounts); expect(next.random.outcomes).toBe(outcomes); expect(row).toMatchObject({ paid: 0n, roll: null, recognized: false, paymentId: null, effects: [] }); }
  else { expect(next.ledger.at(-1)?.personId).toBe(payer.id); expect(accountFor(next).cash).toBe(accountFor(world).cash); }
  expect(() => resolveCommand(ack(next), command(next))).toThrow(/already entered/); expect(decodeWorld(encodeWorld(next))).toEqual(next);
});

test('unready practice, stale quotes, lack of funds/energy and stopped routines reject before mutation or draws', () => {
  const world = prepared(), before = encodeWorld(world);
  for (const changed of [{ quotedFee: 1n }, { reviewedPayerId: 'missing' }]) expect(() => resolveCommand(world, { ...command(world), ...changed })).toThrow(/changed/);
  expect(encodeWorld(world)).toBe(before);
  const poor = decodeWorld(before); accountFor(poor).lockedCash = accountFor(poor).cash; expect(() => resolveCommand(poor, command(poor))).toThrow(/cannot cover/);
  const tired = decodeWorld(before); tired.people[tired.activePersonId].stats.energy = 7; expect(hobbyEventReason(tired, 'reading', 'stretch')).toMatch(/Rest/); expect(hobbyEventReason(tired, 'reading', 'relaxed')).toBeUndefined();
  const stopped = ack(resolveCommand(world, { type: 'stop-hobby', hobbyId: world.hobbies[0].id, planId: world.hobbies[0].plans[0].id })); expect(hobbyEventReason(stopped, 'reading', 'familiar')).toMatch(/Join/);
  const early = pupil('US', 20); post(early, 100000n, 0n, 'test-funding', 'Unit fixture'); const enrolled = ack(resolveCommand(early, { type: 'hobby-plan', kind: 'reading', mode: 'community', reviewedPayerId: early.activePersonId, quotedMonthlyFee: hobbyFee('US', 'reading', 'community') })); expect(hobbyEventReason(enrolled, 'reading', 'familiar')).toMatch(/12 monthly/);
});

test.each(['duplicate', 'payment', 'chance', 'practice', 'effect', 'permission', 'future', 'currency'])('rejects corrupted %s event history', field => {
  const next = resolveCommand(prepared(), command(prepared())), row = next.hobbyEvents[0];
  if (field === 'duplicate') next.hobbyEvents.push(structuredClone(row));
  if (field === 'payment') row.paymentId = 'missing';
  if (field === 'chance') row.chance++;
  if (field === 'practice') row.practiceCursor = 11;
  if (field === 'effect') row.effects[0].after++;
  if (field === 'permission') row.consent.accepted = false;
  if (field === 'future') row.date.year += 1;
  if (field === 'currency') row.currency = 'EUR';
  expect(() => decodeWorld(encodeWorld(next))).toThrow();
});


test('manual extra practice does not replace the twelve attended months and a later calendar year permits one new actual entry', () => {
  let world = prepared('reading', 'US', 20, 11), hobby = world.hobbies[0];
  world = ack(resolveCommand(world, { type: 'practise-hobby', hobbyId: hobby.id, planId: hobby.plans[0].id }));
  expect(world.hobbies[0].practices).toHaveLength(12); expect(hobbyEventReason(world, 'reading', 'familiar')).toMatch(/12 monthly/);
  world.date = monthFrom(world.date, 1); leisureMonth(world); world = ack(resolveCommand(validateWorld(world), command(world)));
  expect(world.hobbyEvents).toHaveLength(1);
  for (let i = 0; i < 12; i++) { world.date = monthFrom(world.date, 1); leisureMonth(world); }
  // Rest is an explicit isolated unit setup, not a natural journey.
  world.people[world.activePersonId].stats.energy = 20;
  const next = resolveCommand(validateWorld(world), command(world, 'relaxed')); expect(next.hobbyEvents).toHaveLength(2); expect(decodeWorld(encodeWorld(next))).toEqual(next);
});
