import { countryCodes, countries } from '../../src/game/countries';
import { monthFrom } from '../../src/game/calendar';
import { hobbyContent, HobbyKind } from '../../src/game/content/leisure';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { resolveCommand, GameCommand } from '../../src/game/engine';
import { decodeWorld, encodeWorld, validateWorld, World } from '../../src/game/model';
import { randomInteger } from '../../src/game/random';
import { accountFor, post } from '../../src/game/systems/common';
import { activeHobbyPlan } from '../../src/game/systems/leisureSchemas';
import { hobbyFee, hobbyReason, leisureMonth, leisurePayer, refreshLeisure } from '../../src/game/systems/leisure';
import { ownHousehold } from '../../src/game/systems/households';
import { pupil } from '../support/pupil';

const kinds = ['reading', 'gaming', 'cooking', 'gardening'] as const;
function finish(world: World) {
  let guard = 0;
  while (world.pending && guard++ < 100) {
    world = world.pending.kind === 'decision' ? resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: world.pending.choices.find(item => !choiceUnavailable(world, item))!.id }) : resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
  }
  expect(guard).toBeLessThan(100); return world;
}
const act = (world: World, command: GameCommand) => finish(resolveCommand(world, command));
function permission(world: World, accepted = true) {
  const payer = leisurePayer(world)!, person = world.people[world.activePersonId];
  const edge = world.relationships.find(item => [item.from, item.to].includes(person.id) && [item.from, item.to].includes(payer.id))!, chance = Math.min(95, 45 + Math.floor(edge.strength / 2));
  // Explicit unit fixture only; the connected journey uses the genuine saved RNG.
  world.random.npcs = Array.from({ length: 1000 }, (_, index) => index + 1).find(seed => (randomInteger(seed, 1, 100).value <= chance) === accepted)!;
}
function request(world: World, kind: HobbyKind, mode: 'community' | 'lessons' = 'community') {
  return { type: 'hobby-plan' as const, kind, mode, reviewedPayerId: leisurePayer(world)!.id, quotedMonthlyFee: hobbyFee(world.people[world.activePersonId].country, kind, mode) };
}
function enroll(world: World, kind: HobbyKind, mode: 'community' | 'lessons' = 'community') { permission(world); return act(world, request(world, kind, mode)); }
function month(world: World) { world.date = monthFrom(world.date, 1, world.calendarAnchorDay); leisureMonth(world); return finish(validateWorld(world)); }

test.each(countryCodes.flatMap(country => kinds.map(kind => [country, kind] as const)))('%s %s records the original quote and actual monthly payment without creating possessions, diet, qualifications or a career', (country, kind) => {
  const initial = pupil(country, 8), payer = leisurePayer(initial)!, accounts = structuredClone(initial.accounts), assets = structuredClone(initial.assets), health = structuredClone(initial.people[initial.activePersonId].health.routine), education = structuredClone(initial.people[initial.activePersonId].education), fee = hobbyFee(country, kind, 'community');
  let world = enroll(initial, kind); expect(world.accounts).toEqual(accounts); expect(world.assets).toEqual(assets);
  expect(world.hobbies[0]).toMatchObject({ kind, proficiency: 0, practices: [], plans: [{ payerId: payer.id, monthlyFee: fee, currency: countries[country].currency, status: 'active' }] });
  world = month(world); const hobby = world.hobbies[0];
  expect(hobby).toMatchObject({ proficiency: 2, practices: [{ source: 'monthly', attended: true, paid: fee, gain: 2 }] });
  expect(accountFor(world, world.people[payer.id]).cash).toBe(accounts.find(account => account.id === accountFor(initial, payer).id)!.cash - fee);
  expect(accountFor(world).cash).toBe(accountFor(initial).cash);
  expect(world.assets).toEqual(assets); expect(world.people[world.activePersonId].health.routine).toEqual(health); expect(world.people[world.activePersonId].education).toEqual(education);
  expect(world.creatorStudios).toEqual([]); expect(world.careers).toEqual([]); expect(world.musicReleases).toEqual([]);
  expect(world.hobbies[0].practices[0].effects.map(effect => effect.stat)).toEqual(['energy', 'happiness', 'stress']);
  expect(decodeWorld(encodeWorld(world))).toEqual(world);
});

test.each(kinds)('%s respects its authored minimum age and a refused mode change keeps earned progress and original funding', kind => {
  const young = pupil('US', hobbyContent[kind].minAge - 1), original = encodeWorld(young);
  expect(hobbyReason(young, kind, 'community')).toMatch(new RegExp('age ' + hobbyContent[kind].minAge));
  expect(() => resolveCommand(young, request(young, kind))).toThrow(/age/); expect(encodeWorld(young)).toBe(original);
  let world = month(enroll(pupil('US', 8), kind)); permission(world, false);
  const before = structuredClone(world.accounts), command = request(world, kind, 'lessons');
  world = act(world, command); expect(world.accounts).toEqual(before);
  expect(world.hobbies[0]).toMatchObject({ proficiency: 2, plans: [{ status: 'active', mode: 'community' }, { status: 'declined', mode: 'lessons' }] });
  expect(() => resolveCommand(decodeWorld(encodeWorld(world)), command)).toThrow(/already.*requested/);
});

test('reading rewards six actual attended months; an unfunded calendar month and optional extra practice add no reading credit', () => {
  let world = enroll(pupil('US', 8), 'reading'), personId = world.activePersonId, initialSmarts = world.people[personId].stats.smarts;
  world = month(world); const hobby = world.hobbies[0], plan = activeHobbyPlan(hobby)!;
  world = act(world, { type: 'practise-hobby', hobbyId: hobby.id, planId: plan.id });
  expect(world.people[personId].stats.smarts).toBe(initialSmarts);
  expect(world.hobbies[0].practices.at(-1)?.effects.some(effect => effect.stat === 'smarts')).toBe(false);
  for (let index = 0; index < 4; index++) world = month(world);
  const payer = world.people[plan.payerId]; post(world, -accountFor(world, payer).cash, 0n, 'fixture-spending', 'Unit fixture funds exhausted', null, payer);
  world = month(world); expect(world.hobbies[0].practices.at(-1)).toMatchObject({ attended: false, reason: 'funds', gain: 0, paid: 0n, effects: [] });
  expect(world.people[personId].stats.smarts).toBe(initialSmarts);
  post(world, 1000000n, 0n, 'fixture-funding', 'Unit fixture renewed funds', null, world.people[payer.id]);
  world = month(world); expect(world.people[personId].stats.smarts).toBe(initialSmarts + 1);
  expect(world.hobbies[0].practices.flatMap(row => row.effects).filter(effect => effect.stat === 'smarts')).toHaveLength(1);
  expect(world.hobbies[0].practices.filter(row => row.source === 'monthly' && row.attended)).toHaveLength(6);
  expect(decodeWorld(encodeWorld(world))).toEqual(world);
});

test.each(['gaming', 'cooking', 'gardening'] as const)('%s improves personal proficiency without awarding Smarts, music or professional progress', kind => {
  let world = enroll(pupil('US', 8), kind, 'lessons'); const person = world.people[world.activePersonId], smarts = person.stats.smarts, skills = structuredClone(person.skills), diet = structuredClone(person.health.routine);
  for (let index = 0; index < 6; index++) world = month(world);
  expect(world.hobbies[0].proficiency).toBe(24); expect(world.people[world.activePersonId].stats.smarts).toBe(smarts);
  expect(world.people[world.activePersonId].skills).toEqual(skills); expect(world.people[world.activePersonId].health.routine).toEqual(diet);
  expect(world.hobbies[0].practices.flatMap(row => row.effects).some(effect => effect.stat === 'music' || effect.stat === 'smarts')).toBe(false);
  expect(decodeWorld(encodeWorld(world))).toEqual(world);
});

test.each(kinds)('%s ends the original household arrangement without silently replacing its payer or losing proficiency', kind => {
  let world = month(enroll(pupil('US', 8), kind)); const payerId = activeHobbyPlan(world.hobbies[0])!.payerId, paid = structuredClone(world.ledger);
  ownHousehold(world, world.people[payerId]); refreshLeisure(world); world = finish(validateWorld(world));
  expect(world.hobbies[0]).toMatchObject({ kind, proficiency: 2, plans: [{ payerId, status: 'payer-lost' }] });
  expect(world.ledger).toEqual(paid); expect(world.hobbies[0].practices).toHaveLength(1);
  expect(decodeWorld(encodeWorld(world))).toEqual(world);
});
