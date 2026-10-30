import { formatMoney } from '../../src/game/money';
import { countries, countryCodes } from '../../src/game/countries';
import { createLife, randomCreation } from '../../src/game/createLife';
import { resolveCommand } from '../../src/game/engine';
import { copyWorld, decodeWorld, encodeWorld, fullName, validateWorld, type World } from '../../src/game/model';
import { randomInteger } from '../../src/game/random';
import { accountFor } from '../../src/game/systems/common';
import { dateActivities, type DateActivity } from '../../src/game/systems/dateActivities';
import { dateBudget, partnerRelation, relationFor } from '../../src/game/systems/relationships';
import graduate from '../fixtures/v3-employed-graduate.json';
import marriage from '../fixtures/v5-marriage-result.json';

const ids = ['walk', 'coffee', 'meal', 'movie'] as const;
function ack(world: World) { if (world.pending?.kind !== 'result') throw new Error('Expected a result'); return resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id }); }
function spouses() { const world = ack(decodeWorld(JSON.stringify(marriage))); return { world, personId: partnerRelation(world)!.to }; }
function introduced() {
  let world = resolveCommand(decodeWorld(JSON.stringify(graduate)), { type: 'meet-people', purpose: 'dating', gender: 'female' });
  if (world.pending?.kind !== 'decision') throw new Error('Expected the genuine introductions');
  const personId = world.pending.choices[0].id; world = ack(resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: personId }));
  return { world, personId };
}

test('all12 country quotes use actual currency and exact minor amounts without changing state or drawing', () => {
  const mealAmounts = [4000n, 4800n, 2900n, 5800n, 3000n, 3600n, 2500n, 2600n, 3000n, 36000n, 3200n, 15000n];
  countryCodes.forEach((country, index) => {
    const world = createLife('life_quote_' + country, 42, { ...randomCreation(42), background: 'ordinary', country, city: countries[country].cities[0] }, { year: 2026, month: 1, day: 1 });
    const parentId = world.relationships[0].from, original = encodeWorld(world), rows = dateActivities(world, parentId), meal = mealAmounts[index];
    expect(rows.map(row => row.id)).toEqual([...ids,'dinner','outing','park','concert','cooking','surprise']); expect(rows.slice(0,4).map(row => row.cost)).toEqual([0n, meal / 4n, meal, meal * 3n / 4n]);
    expect(rows.every(row => row.currency === countries[country].currency && !!row.disabledReason)).toBe(true);
    expect(dateActivities(world, parentId)).toEqual(rows); expect(encodeWorld(world)).toBe(original);
  });
});

test.each([
  ['walk', 5, 4, -5, 0n], ['coffee', 6, 4, -3, 1000n], ['meal', 7, 6, -4, 4000n], ['movie', 4, 6, -3, 3000n],
] as const)('%s accepted consent charges its actual quote once and applies only the activity’s bounded effects', (activity, bond, happiness, energy, cost) => {
  const { world, personId } = spouses(), player = world.people[world.activePersonId], relation = relationFor(world, player.id, personId)!;
  // Declared unit boundaries expose non-capped deltas; no natural attainment,
  // seed search or new paid history is claimed for this arranged starting point.
  relation.strength = 55; relation.trust = 70; player.stats.happiness = 40; player.stats.energy = 50; world.random.outcomes = 0; validateWorld(world);
  const quote = dateActivities(world, personId).find(row => row.id === activity)!; expect(quote.disabledReason).toBeUndefined(); expect(quote.cost).toBe(cost);
  const before = encodeWorld(world), cash = accountFor(world).cash, after = resolveCommand(world, { type: 'ask-date', personId, activity }), updated = relationFor(after, player.id, personId)!;
  expect(updated.strength).toBe(55 + bond); expect(updated.trust).toBe(75); expect(updated.romance).toBe('married'); expect(updated.memories.at(-1)).toBe('date:2023');
  expect(after.pending?.kind === 'result' && after.pending.effects).toContainEqual({ id: 'trust', label: 'Trust', value: '+5%', tone: 'positive' });
  expect(after.people[player.id].stats).toEqual({ ...player.stats, happiness: 40 + happiness, energy: 50 + energy });
  expect(accountFor(after).cash).toBe(cash - cost);
  const payments = after.ledger.filter(row => row.category === 'dating' && !world.ledger.some(old => old.id === row.id));
  expect(payments).toHaveLength(cost ? 1 : 0); if (cost) expect(payments[0]).toMatchObject({ cashDelta: -cost, currency: quote.currency, personId: player.id });
  expect(after.random).toEqual({ ...world.random, outcomes: randomInteger(0, 1, 100).state });
  expect(after.people[player.id].education).toEqual(player.education); expect(after.people[player.id].employment).toEqual(player.employment); expect(after.people[player.id].finance).toEqual(player.finance);
  expect(after.assets).toEqual(world.assets); expect(after.people[player.id].skills).toEqual(player.skills); expect(after.marriages).toEqual(world.marriages);
  expect(after.journal.at(-1)!.text).toContain(fullName(world.people[personId])); expect(decodeWorld(encodeWorld(after))).toEqual(after); expect(encodeWorld(world)).toBe(before);
  const done = ack(after); for (const next of ids) expect(() => resolveCommand(done, { type: 'ask-date', personId, activity: next })).toThrow(/already tried/);
  expect(() => resolveCommand(done, { type: 'ask-date', personId })).toThrow(/already tried/);
});

test('actual new acquaintances enter dating only on consent; declined activities spend nothing and all attempts share the date limit', () => {
  const { world, personId } = introduced(), relation = relationFor(world, world.activePersonId, personId)!;
  expect(relation.romance).toBe('none');
  for (const activity of ids) {
    const input = copyWorld(world); input.random.outcomes = 4; // Fixed declared refusal boundary, not a search.
    expect(randomInteger(4, 1, 100).value).toBeGreaterThan(90);
    const after = resolveCommand(input, { type: 'ask-date', personId, activity });
    expect(accountFor(after).cash).toBe(accountFor(input).cash); expect(after.ledger.filter(row => row.category === 'dating')).toEqual(input.ledger.filter(row => row.category === 'dating'));
    expect(relationFor(after, after.activePersonId, personId)).toMatchObject({ romance: 'none', strength: relation.strength, trust: relation.trust });
    expect(after.pending!.body).toMatch(/no date costs were charged/i); expect(after.random).toEqual({ ...input.random, outcomes: randomInteger(4, 1, 100).state });
    const done = ack(after); expect(dateActivities(done, personId).every(row => /already tried/.test(row.disabledReason ?? ''))).toBe(true);
    expect(() => resolveCommand(done, { type: 'ask-date', personId, activity: 'walk' })).toThrow(/already tried/);
  }
  const consenting = copyWorld(world); consenting.random.outcomes = 0;
  const accepted = resolveCommand(consenting, { type: 'ask-date', personId, activity: 'walk' });
  expect(relationFor(accepted, accepted.activePersonId, personId)!.romance).toBe('dating'); expect(accepted.marriages).toEqual(world.marriages); expect(accepted.pregnancies).toEqual(world.pregnancies);
});

test('omitted activity keeps its price, effects and original consent draw with concise role-aware copy', () => {
  const { world, personId } = spouses(), player = world.people[world.activePersonId], relation = relationFor(world, player.id, personId)!, draw = randomInteger(world.random.outcomes, 1, 100);
  const after = resolveCommand(world, { type: 'ask-date', personId }), chance = Math.min(95, 20 + Math.round(relation.strength * 0.6 + player.stats.looks * 0.15));
  expect(resolveCommand(world, { type: 'ask-date', personId, activity: undefined })).toEqual(after);
  expect(after.random).toEqual({ ...world.random, outcomes: draw.state });
  if (draw.value <= chance) {
    expect(after.pending).toMatchObject({ title: 'You made an evening of it', body: 'You went on a date with your spouse, Morgan. You spent '+formatMoney({minor:dateBudget(world),currency:accountFor(world).currency})+'.' });
    expect(accountFor(after).cash).toBe(accountFor(world).cash - dateBudget(world));
    expect(after.pending?.kind === 'result' && after.pending.effects).toEqual([{ id: 'bond', label: 'Relationship', value: '+0%', tone: 'positive' }, { id: 'happiness', label: 'Happiness', value: '+0%', tone: 'neutral' }, { id: 'energy', label: 'Energy', value: '-4%', tone: 'negative' }]);
    expect(after.journal.at(-1)!.text).toBe('I went on a date with Morgan.');
  } else {
    expect(after.pending).toMatchObject({ title: 'Not this time', body: 'Your spouse, Morgan, declined your invitation. No date costs were charged.' });
    expect(accountFor(after).cash).toBe(accountFor(world).cash);
  }
});

test('cash locks, hospital, different places, relatives and unknown people keep their real guards, with a genuinely free walk', () => {
  const { world, personId } = introduced(), account = accountFor(world); account.lockedCash = account.cash; validateWorld(world);
  expect(dateActivities(world, personId).find(row => row.id === 'walk')!.disabledReason).toBeUndefined();
  expect(dateActivities(world, personId).filter(row => row.id !== 'walk').every(row => /available balance/.test(row.disabledReason ?? ''))).toBe(true);
  const before = encodeWorld(world); expect(() => resolveCommand(world, { type: 'ask-date', personId, activity: 'coffee' })).toThrow(/available balance/); expect(encodeWorld(world)).toBe(before);
  const hospital = copyWorld(world); hospital.people[world.activePersonId].health.hospitalizedUntil = world.date.year * 12 + world.date.month;
  expect(dateActivities(hospital, personId).every(row => /hospital/.test(row.disabledReason ?? ''))).toBe(true); expect(() => resolveCommand(hospital, { type: 'ask-date', personId, activity: 'walk' })).toThrow(/hospital/);
  const away = copyWorld(world); away.people[personId].city = 'A declared different city'; validateWorld(away);
  expect(dateActivities(away, personId).every(row => /same city/.test(row.disabledReason ?? ''))).toBe(true); expect(() => resolveCommand(away, { type: 'ask-date', personId, activity: 'walk' })).toThrow(/same city/);
  const family = decodeWorld(JSON.stringify(graduate)); expect(dateActivities(family, 'person_parent1').every(row => /relative/.test(row.disabledReason ?? ''))).toBe(true);
  expect(dateActivities(world, 'person_missing').every(row => /living person/.test(row.disabledReason ?? ''))).toBe(true);
  expect(() => resolveCommand(world, { type: 'ask-date', personId, activity: 'invented' as DateActivity })).toThrow(/not available/);
});
