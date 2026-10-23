import { bindEvent, eligibleTemplates } from '../../src/game/content/events';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { resolveCommand } from '../../src/game/engine';
import { copyWorld, decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { countries, type CountryCode } from '../../src/game/countries';
import { convertMoney, formatMoney } from '../../src/game/money';
import { fxRate } from '../../src/game/valuation';
import { accountFor, post } from '../../src/game/systems/common';
import { relationFor } from '../../src/game/systems/relationships';
import { endEmployment } from '../../src/game/systems/work';
import { currentWorkplace } from '../../src/game/systems/workplaceSchemas';
import { currentSchool } from '../../src/game/systems/schoolSchemas';
import { addChild } from '../../src/game/systems/family';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { employee } from '../support/employee';
import { adultSocial } from '../support/adultSocial';
import { pupil } from '../support/pupil';
import { chooseImmediate, immediateDecision, immediateEffect, immediateScene } from '../support/immediateStory';
import type { StoryOptionExtras } from '../../src/game/content/eventTypes';

const bases = new Map<string, string>();
function base(country: CountryCode = 'US', social = false) {
  const key = country + social; if (!bases.has(key)) bases.set(key, encodeWorld(social ? adultSocial(country).world : employee(country)));
  return decodeWorld(bases.get(key)!);
}

test.each(['US', 'FR', 'JP'] as const)('%s freezes actual local cash quotes, expands money once and posts income/expense without credit or random draws', country => {
  for (const cash of [-120, 80]) {
    const initial = base(country), account = accountFor(initial); post(initial, 10000000n, 0n, 'fixture', 'Unit funds');
    const expected = convertMoney({ currency: 'USD', minor: BigInt(cash) * 100n }, countries[country].currency, fxRate(initial, 'USD', account.currency).numerator, fxRate(initial, 'USD', account.currency).denominator);
    const world = immediateDecision(initial, { cash }), effect = immediateEffect(world), before = encodeWorld(world);
    expect(effect.cash).toMatchObject({ minor: expected.minor, currency: account.currency, accountId: account.id, usdWhole: cash });
    if (world.pending?.kind !== 'decision') throw new Error('Missing choice');
    const formatted = formatMoney({ ...expected, minor: expected.minor < 0n ? -expected.minor : expected.minor });
    expect(world.pending.choices[0].label).toBe('Choose ' + formatted); expect(world.pending.choices[0].resultBody).toContain(formatted); expect(world.pending.choices[0].journal).toContain(formatted);
    // A deferred saved quote is a price already offered, not a new live FX calculation.
    if (country !== 'US') world.market.fx[account.currency].numerator *= 2n;
    const cold = unpackCheckpoint(packCheckpoint(world), true), next = chooseImmediate(cold);
    expect(accountFor(next).cash - accountFor(cold).cash).toBe(expected.minor);
    expect(next.ledger.slice(cold.ledger.length)).toEqual([expect.objectContaining({ cashDelta: expected.minor, debtDelta: 0n, category: cash > 0 ? 'story-income' : 'story-expense', accountId: account.id })]);
    expect(next.people[next.activePersonId].finance.supportIncomeDue - cold.people[cold.activePersonId].finance.supportIncomeDue).toBe(cash > 0 ? expected.minor : 0n);
    expect(next.liabilities).toEqual(cold.liabilities); expect(next.random).toEqual(cold.random); expect(next.storyThreads).toEqual(cold.storyThreads);
    expect(next.pending).toMatchObject({ kind: 'result', effects: [expect.objectContaining({ id: 'story-cash', value: (cash > 0 ? '+' : '−') + formatted })] });
    expect(unpackCheckpoint(packCheckpoint(next), true)).toEqual(next);
    expect(before).toContain('story-immediate'); expect(accountFor(initial).cash).toBe(account.cash);
  }
});

test('unaffordable and locked funds disable a debit dynamically; rejection is atomic and adding real cash restores the same saved choice', () => {
  const initial = base(); const account = accountFor(initial), delta = 10000n - account.cash; post(initial, delta, 0n, 'fixture', 'Unit balance');
  let world = immediateDecision(initial, { cash: -120 }), before = encodeWorld(world);
  if (world.pending?.kind !== 'decision') throw new Error('Missing choice');
  expect(choiceUnavailable(world, world.pending.choices[0])).toMatch(/funds/); expect(() => chooseImmediate(world)).toThrow(/funds/); expect(encodeWorld(world)).toBe(before);
  post(world, 3000n, 0n, 'fixture', 'Unit funds'); accountFor(world).lockedCash = 2000n;
  expect(choiceUnavailable(world, world.pending.choices[0])).toMatch(/funds/); expect(() => chooseImmediate(world)).toThrow(/funds/);
  accountFor(world).lockedCash = 1000n; world = validateWorld(world); before = encodeWorld(world);
  const next = chooseImmediate(world); expect(accountFor(next).cash).toBe(1000n); expect(accountFor(next).lockedCash).toBe(1000n); expect(next.liabilities).toEqual(world.liabilities); expect(encodeWorld(world)).toBe(before);
});

test.each([0, 100])('trust and public image report actual clamped changes from %i, on bound actual friend and partner', boundary => {
  const initial = base('US', true);
  for (const relation of initial.relationships) relation.trust = boundary;
  initial.people[initial.activePersonId].publicLife.image = boundary;
  const world = immediateDecision(initial, { trust: { friend: boundary === 0 ? -20 : 20, partner: boundary === 0 ? 12 : -12 }, publicImage: boundary === 0 ? -40 : 40 }, { friend: true, partner: true });
  const effect = immediateEffect(world), next = chooseImmediate(world);
  for (const target of effect.trust!) {
    expect(next.relationships.find(row => row.id === target.relationshipId)!.trust).toBe(target.role === 'friend' ? boundary : boundary === 0 ? 12 : 88);
    expect(next.pending).toMatchObject({ effects: expect.arrayContaining([expect.objectContaining({ id: 'story-trust:' + target.relationshipId, label: target.label + ' · trust', value: target.role === 'friend' ? '+0%' : boundary === 0 ? '+12%' : '-12%' })]) });
  }
  expect(next.people[next.activePersonId].publicLife.image).toBe(boundary); expect(next.pending).toMatchObject({ effects: expect.arrayContaining([expect.objectContaining({ id: 'story-public-image', value: '+0%' })]) });
  expect(next.random).toEqual(world.random); expect(next.accounts).toEqual(world.accounts);
});

test.each(['parent', 'peer', 'teacher', 'coworker', 'supervisor', 'child'] as const)('%s trust binds its declared real role and survives exact cold choice replay', role => {
  const initial = ['parent', 'peer', 'teacher'].includes(role) ? pupil('US', 9) : base();
  if (role === 'child') addChild(initial, [initial.people[initial.activePersonId]], 'adoptive', 2);
  const context = role === 'parent' ? { parent: true } : role === 'peer' ? { school: 'primary' as const, classmate: true } : role === 'teacher' ? { school: 'primary' as const, teacher: true } : role === 'child' ? { child: 'baby' as const } : { workplace: true, [role]: true };
  const world = immediateDecision(initial, { trust: { [role]: -12 } }, context), effect = immediateEffect(world), target = effect.trust![0], relation = world.relationships.find(row => row.id === target.relationshipId)!;
  expect(target.role).toBe(role); expect(target.otherId).not.toBe(world.activePersonId);
  if (role === 'peer' || role === 'teacher') expect(target.contextId).toBe(currentSchool(world)!.id);
  if (role === 'coworker' || role === 'supervisor') expect(target.contextId).toBe(currentWorkplace(world)!.id);
  const next = chooseImmediate(unpackCheckpoint(packCheckpoint(world), true));
  expect(next.relationships.find(row => row.id === relation.id)!.trust).toBe(Math.max(0, relation.trust - 12));
  expect(encodeWorld(next)).toBe(encodeWorld(chooseImmediate(world))); expect(next.random).toEqual(world.random);
});

test.each(['friend-role', 'friend-city', 'school', 'work-contract', 'work-member'] as const)('%s staleness rejects a saved choice without rebinding or consuming draws', kind => {
  let world = kind === 'school' ? immediateDecision(pupil('US', 9), { trust: { peer: -8 } }, { school: 'primary', classmate: true }) : kind.startsWith('work') ? immediateDecision(base(), { workPerformance: -12, trust: { coworker: -8 } }, { workplace: true, coworker: true }) : immediateDecision(base('US', true), { trust: { friend: -8 } }, { friend: true });
  const effect = immediateEffect(world), target = effect.trust![0];
  if (kind === 'friend-role') { const edge = world.relationships.find(row => row.id === target.relationshipId)!; edge.roles = edge.roles.filter(role => role !== 'friend'); edge.kind = 'coworker'; }
  if (kind === 'friend-city') { endEmployment(world, target.otherId); world.people[target.otherId].city = 'Another city'; }
  if (kind === 'school') { const school = currentSchool(world)!; school.ended = { ...world.date }; school.endReason = 'changed-school'; }
  if (kind === 'work-contract') endEmployment(world);
  if (kind === 'work-member') endEmployment(world, target.otherId);
  // Historical context references remain loadable; current availability refuses them.
  world = unpackCheckpoint(packCheckpoint(validateWorld(world)), true); const before = encodeWorld(world);
  if (world.pending?.kind !== 'decision') throw new Error('Missing choice');
  expect(choiceUnavailable(world, world.pending.choices[0])).toMatch(/changed/); expect(() => chooseImmediate(world)).toThrow(/changed/); expect(encodeWorld(world)).toBe(before);
});

test('ending an actual friendship closes its best-friend agreement, retains coworker/history and accepts the same choice’s preceding bond change', () => {
  let initial = base('US', true), friend = initial.relationships.find(row => row.roles.includes('friend') && row.romance === 'none')!, friendId = friend.from === initial.activePersonId ? friend.to : friend.from;
  friend.strength = 85; friend.trust = 80;
  for (let seed = 1; seed < 100; seed++) {
    initial.random.npcs = seed;
    const proposed = resolveCommand(initial, { type: 'propose-best-friendship', lifeId: initial.id, actorId: initial.activePersonId, personId: friendId, relationshipId: friend.id, country: initial.people[initial.activePersonId].country, city: initial.people[initial.activePersonId].city });
    if (proposed.bestFriendships[0].status === 'active') { initial = resolveCommand(proposed, { type: 'acknowledge', resultId: proposed.pending!.id }); break; }
  }
  expect(initial.bestFriendships[0].status).toBe('active');
  const world = immediateDecision(initial, { friendBond: -30, trust: { friend: -25 }, endFriendship: true }, { friend: true }), next = chooseImmediate(world), edge = relationFor(next, next.activePersonId, friendId)!;
  expect(edge.roles).not.toContain('friend'); expect(edge.roles).toContain('coworker'); expect(edge.kind).toBe('coworker'); expect(edge.strength).toBe(55); expect(edge.trust).toBe(55);
  expect(next.bestFriendships[0]).toEqual({ ...world.bestFriendships[0], status: 'ended', ended: world.date, endReason: 'choice', endedById: world.activePersonId });
  expect(edge.memories).toEqual([...relationFor(world, world.activePersonId, friendId)!.memories, 'friendship-ended:' + world.date.year]);
  expect(next.random).toEqual(world.random); expect(next.workHistory).toEqual(world.workHistory); expect(next.storyThreads).toEqual(world.storyThreads);
});

test.each([0, 100])('ordinary performance %i is bounded and job loss closes the actual contract and introduced workplace', boundary => {
  const initial = base(); initial.people[initial.activePersonId].employment!.performance = boundary;
  const world = immediateDecision(initial, { workPerformance: boundary === 0 ? -50 : 50, loseJob: true, trust: { supervisor: -20 } }, { workplace: true, supervisor: true }), job = world.people[world.activePersonId].employment!, next = chooseImmediate(world);
  expect(next.people[next.activePersonId].employment).toBeNull(); expect(next.workHistory.find(row => row.id === job.id)).toEqual({ ...world.workHistory.find(row => row.id === job.id), ended: world.date });
  expect(next.workplaces.find(row => row.employmentId === job.id)).toMatchObject({ ended: world.date, endReason: 'left-job' });
  expect(next.pending).toMatchObject({ effects: expect.arrayContaining([expect.objectContaining({ id: 'story-performance', value: '+0%' }), expect.objectContaining({ id: 'story-job', value: expect.stringContaining('employment ended') })]) });
  expect(next.random).toEqual(world.random); expect(next.accounts).toEqual(world.accounts); expect(next.liabilities).toEqual(world.liabilities);
});

test('absent ordinary work, undeclared contacts, invalid values and new follow-up chains cannot bind a genuine immediate consequence', () => {
  const initial = base(), unemployed = copyWorld(initial); endEmployment(unemployed);
  expect(() => bindEvent(unemployed, immediateScene({ workPerformance: -10 }))).toThrow(/ordinary employment/);
  expect(() => bindEvent(initial, immediateScene({ trust: { friend: -20 } }))).toThrow(/declared actual friend/);
  expect(() => bindEvent(initial, immediateScene({ endFriendship: true }))).toThrow(/actual friendship/);
  expect(() => bindEvent(initial, immediateScene({ cash: 0 }))).toThrow(); expect(() => bindEvent(initial, immediateScene({ publicImage: 101 }))).toThrow();
  expect(() => bindEvent(initial, immediateScene({ cash: 10, followUp: 'arcade-invitation' }))).toThrow(/finish in this decision/);
  // Existing no-extra bindings receive no new effect and keep the old effect shape.
  const old = bindEvent(initial, immediateScene({ coworkerBond: -3 }, { workplace: true, coworker: true })); expect(old.choices[0].effects.map(row => row.kind)).toEqual(['relationship']);
  expect(eligibleTemplates(unemployed).every(scene => scene.choices.every(choice => choice.workPerformance === undefined && !choice.loseJob))).toBe(true);
});

test.each(['quote', 'duplicate', 'actor', 'target', 'context', 'empty'] as const)('invalid saved %s consequence is rejected structurally rather than repaired', mutation => {
  const world = immediateDecision(base(), { cash: -10, trust: { coworker: -10 }, workPerformance: -10 }, { workplace: true, coworker: true }), effect = immediateEffect(world);
  if (mutation === 'quote') effect.cash!.minor--;
  if (mutation === 'duplicate' && world.pending?.kind === 'decision') world.pending.choices[0].effects.push(structuredClone(effect));
  if (mutation === 'actor') effect.personId = effect.trust![0].otherId;
  if (mutation === 'target') effect.trust![0].otherId = 'person_missing';
  if (mutation === 'context') effect.trust![0].contextId = 'missing-workplace';
  if (mutation === 'empty') { delete effect.cash; delete effect.trust; delete effect.work; }
  expect(() => validateWorld(world)).toThrow();
});
