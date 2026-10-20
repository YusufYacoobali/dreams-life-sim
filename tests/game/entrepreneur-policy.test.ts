import { createLife, randomCreation } from '../../src/game/createLife';
const { canonical, coverage, selectChoice, quantityWithinBudget, assertEstateConservation, parseOptions, phases, expectedVersions } = require('../../tools/run-entrepreneur-sweep.cjs');

test('the policy version pin matches the actual frozen newborn source and requires an explicit fixed-cohort selection', () => {
  const initial = createLife('life_entrepreneur_policy_unit', 900, randomCreation(900), { year: 2000, month: 1, day: 1 });
  expect({ world: initial.schemaVersion, engine: initial.engineVersion, content: initial.contentVersion }).toEqual(expectedVersions);
  expect(parseOptions(['--country', 'US'], ['US', 'CA'])).toEqual({ countries: ['US'], output: undefined });
  expect(parseOptions(['--all', '--output', '/tmp/example'], ['US', 'CA'])).toEqual({ countries: ['US', 'CA'], output: '/tmp/example' });
  for (const args of [[], ['--seed', '901'], ['--country', 'US', '--all'], ['--country', 'XX'], ['--country', 'US', '--country', 'CA']]) expect(() => parseOptions(args, ['US', 'CA'])).toThrow();
});

test('canonical trace bytes ignore object insertion order and retain nested commands and exact huge minor units', () => {
  const large = 900719925474099399n;
  const first = { revision: 4, command: { type: 'fund-business', amount: large, businessId: 'real_company' }, omitted: undefined };
  const second = { command: { businessId: 'real_company', amount: large, type: 'fund-business' }, revision: 4 };
  expect(canonical(first)).toBe(canonical(second)); expect(JSON.parse(canonical(first))).toEqual({ command: { amount: large.toString(), businessId: 'real_company', type: 'fund-business' }, revision: 4 });
  expect(canonical({ commands: [{ type: 'start-business' }, { type: 'acknowledge' }] })).not.toBe(canonical({ commands: [{ type: 'acknowledge' }, { type: 'start-business' }] }));
});

test('early death and missing entrepreneurship remain unmet product goals while an ordered actual timeline can complete', () => {
  const early = coverage([{ phase: 'birth', commandIndex: 0 }, { phase: 'school', commandIndex: 20 }, { phase: 'death', commandIndex: 31 }]);
  expect(early.reached).toEqual(['birth', 'school', 'death']); expect(early.unreached).toEqual(['social', 'fame50', 'business', 'brandEarned', 'investment', 'family']); expect(early.orderedScenarioCComplete).toBe(false);
  expect(coverage(phases.map((phase: string, commandIndex: number) => ({ phase, commandIndex }))).orderedScenarioCComplete).toBe(true);
});

test('having every milestone does not pass the required order when family or brand income occurred too early', () => {
  const timeline = phases.map((phase: string, commandIndex: number) => ({ phase, commandIndex: commandIndex * 10 }));
  timeline.find((row: { phase: string }) => row.phase === 'family').commandIndex = 15;
  const report = coverage(timeline); expect(report.allPhasesReached).toBe(true); expect(report.orderedScenarioCComplete).toBe(false);
  timeline.find((row: { phase: string }) => row.phase === 'family').commandIndex = 70;
  timeline.find((row: { phase: string }) => row.phase === 'brandEarned').commandIndex = 40;
  expect(coverage(timeline).orderedScenarioCComplete).toBe(false); // Same command as business cannot silently claim the next phase.
});

test('visible brand choices preserve the registered company-before-contract policy without inspecting hidden outcomes', () => {
  const event = { templateId: 'brand-offer', choices: [{ id: 'accept' }, { id: 'decline' }] };
  Object.defineProperty(event, 'outcomes', { get: () => { throw new Error('Future outcome must not be inspected'); } });
  expect(selectChoice(event, false, () => true).id).toBe('decline'); expect(selectChoice(event, true, () => true).id).toBe('accept');
  expect(selectChoice(event, true, (choice: { id: string }) => choice.id !== 'accept').id).toBe('decline');
  expect(() => selectChoice(event, true, () => false)).toThrow(/eligible choice/);
});

test('interviews and public responses choose declared visible approaches rather than a favourable result', () => {
  expect(selectChoice({ templateId: 'job-interview', choices: [{ id: 'shortcut' }, { id: 'careful' }, { id: 'withdraw' }] }, false, () => true).id).toBe('careful');
  expect(selectChoice({ templateId: 'public-controversy', choices: [{ id: 'ignore' }, { id: 'apologise' }] }, true, () => true).id).toBe('apologise');
  expect(selectChoice({ templateId: 'ordinary-story', choices: [{ id: 'unavailable' }, { id: 'first-available' }, { id: 'expensive' }] }, false, (choice: { id: string }) => choice.id !== 'unavailable').id).toBe('first-available');
});

test('whole fund quantities include rounded fees and never exceed actual discretionary cash', () => {
  const quote = (quantity: bigint) => { const value = 17n * quantity; return { buyCost: value + (value + 99n) / 100n }; };
  expect(quantityWithinBudget(0n, quote)).toBe(0n); expect(quantityWithinBudget(17n, quote)).toBe(0n);
  expect(quantityWithinBudget(51n, quote)).toBe(2n); // Three units cost 52, despite 51 principal.
  const budget = 10n ** 40n, quantity = quantityWithinBudget(budget, quote); expect(quote(quantity).buyCost <= budget).toBe(true); expect(quote(quantity + 1n).buyCost > budget).toBe(true);
});

const money = (minor: bigint, currency = 'USD') => ({ minor, currency });
test('estate conservation respects already-netted paid debt and includes fees, tax, charity and retained equity once', () => {
  const estate = { netWorthAtDeath: money(100n), debtPaid: money(300n), debtWrittenOff: money(0n), fees: money(5n), tax: money(7n), charity: money(3n), distributions: [{ cash: money(45n), assetValue: money(40n) }] };
  expect(assertEstateConservation(estate)).toEqual({ currency: 'USD', left: 100n, right: 100n, distributed: 85n, debtPaid: 300n, debtWrittenOff: 0n, conserved: true });
  expect(() => assertEstateConservation({ ...estate, distributions: [{ cash: money(45n), assetValue: money(41n) }] })).toThrow(/conserve/);
  expect(() => assertEstateConservation({ ...estate, tax: money(7n, 'EUR') })).toThrow(/currency/);
});

test('a naturally insolvent estate can conserve without inventing a solvent payout', () => {
  const estate = { netWorthAtDeath: money(-50n), debtPaid: money(15n), debtWrittenOff: money(50n), fees: money(0n), tax: money(0n), charity: money(0n), distributions: [] };
  expect(assertEstateConservation(estate).distributed).toBe(0n); expect(() => assertEstateConservation({ ...estate, debtWrittenOff: money(49n) })).toThrow(/conserve/);
});
