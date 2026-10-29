import { ordinaryAdultTemplates } from '../../src/game/content/ordinaryAdultStories';
import { homeLifeTemplates } from '../../src/game/content/homeLifeStories';
import { rareAdultTemplates } from '../../src/game/content/rareAdultStories';
import { bindEvent, eligibleTemplates } from '../../src/game/content/events';
import type { EventTemplate } from '../../src/game/content/eventTypes';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { resolveCommand } from '../../src/game/engine';
import { countries, type CountryCode } from '../../src/game/countries';
import { decodeWorld, encodeWorld, fullName, validateWorld, type World } from '../../src/game/model';
import { convertMoney, formatMoney } from '../../src/game/money';
import { fxRate } from '../../src/game/valuation';
import { offerPending } from '../../src/game/pendingQueue';
import { assetCatalog } from '../../src/game/content/assets';
import { assetPrice } from '../../src/game/systems/assets';
import { accountFor, post } from '../../src/game/systems/common';
import { refreshFriendship, relationFor } from '../../src/game/systems/relationships';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { adultSocial } from '../support/adultSocial';
import { originalChoices } from '../support/entertainmentBaseline';

const rewritten = [
  'adult-wrong-name-badge', 'adult-wave-behind', 'adult-queue-merge', 'adult-community-map',
  'adult-open-mic-list', 'adult-borrowed-pen', 'adult-weather-expert', 'adult-instruction-last-page',
  'adult-shortcut-stairs', 'adult-small-volunteer-task', 'adult-seat-with-a-view', 'adult-lost-glove',
  'adult-perfect-introduction', 'adult-silent-notification', 'adult-neighbourhood-song',
  'home-key-bowl', 'home-box-worth-keeping', 'home-window-cleaning-discovery', 'home-found-old-list',
];
const all = [...ordinaryAdultTemplates, ...homeLifeTemplates, ...rareAdultTemplates];
// These five scenes already existed before this batch, but were introduced after
// the immutable274-scene entertainment baseline. Keep that historical table exact.
const laterOriginalChoices = new Map([
  ['adult-jackpot-handler', ['end', 'interview', 'play']],
  ['adult-prop-cash-rain', ['return', 'pose', 'pocket']],
  ['adult-inheritance-rehearsal', ['sincere', 'learn', 'scheme']],
  ['adult-invisible-yacht', ['ask', 'enjoy', 'perform']],
  ['adult-accidental-living-exhibit', ['explain', 'pose', 'lecture']],
]);
const scene = (id: string) => all.find(item => item.id === id)!;
const fixtures = new Map<CountryCode, string>();
/** Explicit domain fixture: real colleagues/friendship and a real purchased home.
 * This isolates authored scenes; it is not natural encounter-rate evidence. */
function fixture(country: CountryCode = 'US') {
  if (!fixtures.has(country)) {
    let { world } = adultSocial(country);
    post(world, 1_000_000_000_000n, 0n, 'fixture-funding', 'Declared adult story test funds');
    const home = assetCatalog.find(item => item.kind === 'property')!;
    world = resolveCommand(world, { type: 'buy-asset', catalogId: home.id, financing: 'cash', depositBps: 10000, termMonths: 120, quotedPrice: assetPrice(world, home) }, true);
    world = resolveCommand(world, { type: 'acknowledge', resultId: world.pending!.id }, true);
    world.pending = null; world.pendingPriority = 0; world.deferred = []; world.annual = null;
    fixtures.set(country, encodeWorld(validateWorld(world)));
  }
  return decodeWorld(fixtures.get(country)!);
}
function offered(world: World, template: EventTemplate) {
  const event = bindEvent(world, template); offerPending(world, event); return event;
}
function choose(world: World, choiceId: string) {
  if (world.pending?.kind !== 'decision') throw new Error('Expected an explicitly bound decision');
  return resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId }, true);
}

test('the adult audit preserves all36 identities, the original choices, grounded contexts and complete immediate endings', () => {
  expect(all).toHaveLength(36); expect(rewritten).toHaveLength(19);
  for (const template of all) {
    expect(template.choices.map(choice => choice.id)).toEqual(originalChoices.get(template.id) ?? laterOriginalChoices.get(template.id));
    expect(template.min).toBe(18); expect(template.max).toBe(template.id.startsWith('adult-') && template.id !== 'adult-accidental-living-exhibit' ? 65 : 120);
    expect(template.body).not.toContain('{money}');
    expect(template.choices.every(choice => !choice.followUp)).toBe(true);
  }
  const friendScenes = all.filter(template => template.friend).map(template => template.id);
  expect(friendScenes).toEqual(['adult-wave-behind', 'adult-borrowed-pen']);
  for (const id of rewritten) {
    const template = scene(id);
    expect(new Set(template.choices.map(choice => choice.result)).size).toBe(3);
    expect(new Set(template.choices.map(choice => choice.title)).size).toBe(3);
    expect(new Set(template.choices.map(choice => choice.journal)).size).toBe(3);
  }
});

test.each(rewritten)('%s binds actual context and all three branches finish once without random draws or new arcs', id => {
  const initial = fixture(), template = scene(id), before = encodeWorld(initial);
  expect(eligibleTemplates(initial)).toContain(template);
  const event = bindEvent(initial, template);
  expect(JSON.stringify(event, (_key, value) => typeof value === 'bigint' ? value.toString() : value)).not.toMatch(/\{(?:money|friend|city)\}/);
  expect(encodeWorld(initial)).toBe(before);
  if (template.friend) {
    expect(event.personIds).toHaveLength(2);
    expect(relationFor(initial, initial.activePersonId, event.personIds[1])?.roles).toContain('friend');
    expect(event.body).toContain(fullName(initial.people[event.personIds[1]]));
  }
  for (const choice of event.choices) {
    const input = decodeWorld(before); offerPending(input, event);
    expect(choiceUnavailable(input, choice)).toBeUndefined();
    const cold = unpackCheckpoint(packCheckpoint(input), true), result = choose(cold, choice.id);
    expect(encodeWorld(result)).toBe(encodeWorld(choose(input, choice.id)));
    expect(result.pending).toMatchObject({ kind: 'result', title: choice.resultTitle, body: choice.resultBody });
    expect(result.journal.slice(initial.journal.length).some(entry => entry.text === choice.journal)).toBe(true);
    expect(result.random).toEqual(initial.random); expect(result.storyThreads).toEqual(initial.storyThreads);
    for (const key of ['assets', 'liabilities', 'cases', 'sentences', 'marriages', 'households', 'workHistory'] as const) expect(result[key]).toEqual(initial[key]);
    expect(Object.keys(result.people)).toEqual(Object.keys(initial.people));
    for (const [personId, person] of Object.entries(initial.people)) expect(result.people[personId].appearance).toEqual(person.appearance);
    expect(result.socialAccounts).toEqual(initial.socialAccounts);
    if (!choice.effects.some(effect => effect.kind === 'story-immediate' && effect.cash)) { expect(result.accounts).toEqual(initial.accounts); expect(result.ledger).toEqual(initial.ledger); }
    const saved = unpackCheckpoint(packCheckpoint(result), true); expect(encodeWorld(saved)).toBe(encodeWorld(result));
    expect(() => resolveCommand(saved, { type: 'choose', eventId: event.id, choiceId: choice.id }, true)).toThrow();
    const done = resolveCommand(saved, { type: 'acknowledge', resultId: saved.pending!.id }, true);
    expect(done.pending).toBeNull(); expect(done.random).toEqual(result.random); expect(done.ledger).toEqual(result.ledger); expect(done.relationships).toEqual(result.relationships); expect(done.storyThreads).toEqual(result.storyThreads);
  }
});

const paidBranches = [
  ['adult-wrong-name-badge', 'help', 80], ['adult-queue-merge', 'wait', -250],
  ['home-key-bowl', 'place', -90], ['home-box-worth-keeping', 'recycle', -65],
] as const;
test.each(['US', 'GB', 'IN'] as const)('%s paid adult branches quote local money before selection and post exactly one real transaction', country => {
  for (const [id, choiceId, usdWhole] of paidBranches) {
    const world = fixture(country), initial = encodeWorld(world), event = offered(world, scene(id)), choice = event.choices.find(item => item.id === choiceId)!;
    const effect = choice.effects.find(item => item.kind === 'story-immediate');
    if (effect?.kind !== 'story-immediate' || !effect.cash) throw new Error('Expected an actual frozen cash consequence');
    const currency = countries[country].currency, rate = fxRate(world, 'USD', currency), delta = convertMoney({ minor: BigInt(usdWhole) * 100n, currency: 'USD' }, currency, rate.numerator, rate.denominator).minor;
    const amount = formatMoney({ minor: delta < 0n ? -delta : delta, currency });
    expect(effect.cash).toMatchObject({ accountId: accountFor(world).id, currency, usdWhole, minor: delta });
    for (const text of [choice.label, choice.resultBody, choice.journal]) expect(text).toContain(amount);
    const cash = accountFor(world).cash, ledger = world.ledger.length, result = choose(unpackCheckpoint(packCheckpoint(world), true), choiceId);
    expect(accountFor(result).cash).toBe(cash + delta); expect(result.ledger).toHaveLength(ledger + 1);
    expect(result.ledger.at(-1)).toMatchObject({ accountId: accountFor(world).id, personId: world.activePersonId, currency, cashDelta: delta, debtDelta: 0n, category: delta > 0n ? 'story-income' : 'story-expense' });
    expect(result.pending?.kind === 'result' && result.pending.body).toBe(choice.resultBody);
    expect(result.random).toEqual(world.random); expect(result.liabilities).toEqual(world.liabilities);
    expect(encodeWorld(decodeWorld(initial))).toBe(initial);
  }
});

test.each(paidBranches.filter(([_id, _choice, amount]) => amount < 0))('%s debit is unavailable below its real quote and cannot spend locked cash or create debt', (id, choiceId) => {
  const world = fixture(), event = offered(world, scene(id)), choice = event.choices.find(item => item.id === choiceId)!;
  const effect = choice.effects.find(item => item.kind === 'story-immediate');
  if (effect?.kind !== 'story-immediate' || !effect.cash) throw new Error('Missing actual debit');
  const account = accountFor(world), cost = -effect.cash.minor;
  // Move the test balance using a genuine ledger adjustment; no money disappears.
  post(world, cost - 1n - account.cash, 0n, 'fixture-funds-limit', 'Declared affordability boundary');
  const before = encodeWorld(world); expect(choiceUnavailable(world, choice)).toBe('Insufficient available funds');
  expect(() => choose(world, choiceId)).toThrow(/Insufficient available funds/); expect(encodeWorld(world)).toBe(before);
  post(world, 1n, 0n, 'fixture-funds-limit', 'Exact quoted amount'); expect(choiceUnavailable(world, choice)).toBeUndefined();
  const exact = choose(world, choiceId); expect(accountFor(exact).cash).toBe(0n); expect(exact.liabilities).toEqual(world.liabilities);
  // Predicate-only locked-balance condition: no fictional inheritance is loaded
  // or resolved as a claimed valid save. The immediate-effect domain suite owns that setup.
  const locked = decodeWorld(encodeWorld(world)), lockedAccount = accountFor(locked); lockedAccount.lockedCash = 1n;
  expect(choiceUnavailable(locked, choice)).toBe('Insufficient available funds');
});

test('the invoice can end the actual bound friendship while preserving its coworker role, employment and money', () => {
  const world = fixture(), event = offered(world, scene('adult-borrowed-pen')), friendId = event.personIds.find(id => id !== world.activePersonId)!, edge = relationFor(world, world.activePersonId, friendId)!;
  expect(edge.roles).toContain('coworker'); const result = choose(world, 'return'), ended = relationFor(result, world.activePersonId, friendId)!;
  expect(ended.roles).not.toContain('friend'); expect(ended.roles).toContain('coworker'); expect(ended.memories).toContain('friendship-ended:' + world.date.year);
  expect(ended.strength).toBe(edge.strength - 30); expect(ended.trust).toBe(Math.max(0, edge.trust - 20));
  const later = structuredClone(ended); later.strength += 2; refreshFriendship(later);
  expect(later.roles).not.toContain('friend');
  expect(result.accounts).toEqual(world.accounts); expect(result.ledger).toEqual(world.ledger); expect(result.workHistory).toEqual(world.workHistory);
  expect(result.people[friendId]).toEqual(world.people[friendId]); expect(result.people[world.activePersonId].employment).toEqual(world.people[world.activePersonId].employment);
  const stale = decodeWorld(encodeWorld(world)); relationFor(stale, stale.activePersonId, friendId)!.roles = ['coworker']; relationFor(stale, stale.activePersonId, friendId)!.kind = 'coworker';
  const choice = event.choices.find(item => item.id === 'return')!; expect(choiceUnavailable(stale, choice)).toBe('A relationship or role in this story has changed');
  expect(() => choose(stale, 'return')).toThrow('A relationship or role in this story has changed');
});

test('the snoring retaliation affects only its real friend’s bond and trust; strangers cannot fill that role', () => {
  const world = fixture(), event = offered(world, scene('adult-wave-behind')), friendId = event.personIds[1], edge = relationFor(world, world.activePersonId, friendId)!, result = choose(world, 'commit'), changed = relationFor(result, world.activePersonId, friendId)!;
  expect(changed.strength).toBe(Math.max(0, edge.strength - 12)); expect(changed.trust).toBe(Math.max(0, edge.trust - 8));
  for (const other of world.relationships.filter(item => item.id !== edge.id)) expect(result.relationships.find(item => item.id === other.id)).toEqual(other);
  const noFriend = fixture(); for (const relationship of noFriend.relationships) { relationship.roles = relationship.roles.filter(role => role !== 'friend'); if (!relationship.roles.length) relationship.roles = ['acquaintance']; if (relationship.kind === 'friend') relationship.kind = relationship.roles.includes('coworker') ? 'coworker' : 'acquaintance'; }
  for (const id of ['adult-wave-behind', 'adult-borrowed-pen']) { expect(eligibleTemplates(noFriend)).not.toContain(scene(id)); expect(() => bindEvent(noFriend, scene(id))).toThrow(/existing available adult/); }
});

test('racing the visibly swinging axe really reduces health without claiming an invented diagnosis', () => {
  const world = fixture(), person = world.people[world.activePersonId]; person.stats.health = 60;
  offered(world, scene('adult-shortcut-stairs')); const result = choose(world, 'race');
  expect(result.people[world.activePersonId].stats.health).toBe(52); expect(result.people[world.activePersonId].health.conditions).toEqual(person.health.conditions);
  expect(result.random).toEqual(world.random); expect(result.accounts).toEqual(world.accounts);
  expect(result.pending).toMatchObject({ kind: 'result', title: 'Foam has ambitions' });
});
