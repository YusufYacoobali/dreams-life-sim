import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { createLife, randomCreation } from '../../src/game/createLife';
import { encodeWorld } from '../../src/game/model';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
const { canonical, coverage, selectChoice, quantityWithinBudget, reputationAllowed, assertEstateConservation, checkpointRoundTrip, assertEstateReceipts, parseOptions, phases, expectedVersions } = require('../../tools/run-entrepreneur-sweep.cjs');

test('the historical policy registration refuses current versions at its actual post-birth, pre-engine-play boundary', () => {
  const initial = createLife('life_entrepreneur_policy_unit', 900, randomCreation(900), { year: 2000, month: 1, day: 1 });
  const versions = { world: initial.schemaVersion, engine: initial.engineVersion, content: initial.contentVersion };
  expect(expectedVersions).toEqual({ world: 34, engine: 35, content: 10 });
  expect(versions).toEqual({ world: 44, engine: 46, content: 23 });
  const driverSource = readFileSync(join(__dirname, '../../tools/run-entrepreneur-sweep.cjs'), 'utf8');
  expect(createHash('sha256').update(driverSource).digest('hex')).toBe('21cb42091ac828b797cccb27d11b712d517dac18d4cbcfdbe74fb620af17c89a');
  // Execute only the actual frozen guard statement, not the CLI or a new birth.
  // Unlike the editorial tool, this driver checks after SQLite birth/ack/cold.
  const guards = driverSource.match(/assert\.deepEqual\(versions, expectedVersions\)/g)!;
  expect(guards).toHaveLength(1); const guard = guards[0];
  const orderedBoundaries = ['store.getState().startLife(input, seed)', 'store.getState().acknowledgeBirth()', 'initialCold.getState().bootstrap()', guard, 'const run = command =>', 'world = resolveCommand(world, command, true)'].map(boundary => driverSource.indexOf(boundary));
  expect(orderedBoundaries.every((position, index) => position >= 0 && (!index || position > orderedBoundaries[index - 1]))).toBe(true);
  const evaluateGuard = (actual: typeof versions) => runInNewContext(guard, { assert, versions: actual, expectedVersions });
  expect(() => evaluateGuard({ ...expectedVersions })).not.toThrow();
  let refusal: unknown; try { evaluateGuard(versions); } catch (error) { refusal = error; }
  expect(refusal).toMatchObject({ code: 'ERR_ASSERTION', actual: versions, expected: expectedVersions, operator: 'deepStrictEqual' });
  expect(initial.revision).toBe(0); expect(initial.birthAcknowledged).toBe(false);
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

test('public reputation requires the actual visible age/fame, yearly availability and fee with the complete living reserve retained', () => {
  const eligible = { age: 18, fame: 10, available: 6100n, reserve: 6000n, fee: 100n, used: false, confined: false, absent: false };
  expect(reputationAllowed(eligible)).toBe(true);
  for (const change of [{ age: 17 }, { fame: 9 }, { available: 6099n }, { used: true }, { confined: true }, { absent: true }]) expect(reputationAllowed({ ...eligible, ...change })).toBe(false);
});

test('policy cold proof uses the production checkpoint and compares every canonical world field', () => {
  const initial = createLife('life_entrepreneur_codec_unit', 900, randomCreation(900), { year: 2000, month: 1, day: 1 });
  const checked = checkpointRoundTrip(initial, { encodeWorld, packCheckpoint, unpackCheckpoint });
  expect(checked.world).toEqual(initial); expect(encodeWorld(checked.world)).toBe(encodeWorld(initial)); expect(checked.proof.canonicalBytes).toBe(Buffer.byteLength(encodeWorld(initial))); expect(checked.proof.checkpointBytes).toBe(Buffer.byteLength(checked.payload)); expect(checked.proof.checkpointSha256).toMatch(/^[a-f0-9]{64}$/);
  expect(() => checkpointRoundTrip(initial, { encodeWorld, packCheckpoint, unpackCheckpoint: (payload: string) => ({ ...unpackCheckpoint(payload, true), revision: initial.revision + 1 }) })).toThrow(/complete canonical world/);
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

function receiptScenario() {
  const estate = { personId: 'deceased', netWorthAtDeath: money(100n), debtPaid: money(10n), charity: money(5n), tax: money(5n), distributions: [{ personId: 'actual_heir', cash: money(80n), assetValue: money(0n) }] };
  const base = { currency: 'USD', year: 2040, month: 1, debtDelta: 0n };
  const world = { accounts: [{ id: 'heir_account', ownerId: 'actual_heir', currency: 'USD' }], ledger: [
    { ...base, id: 'estate_debit', accountId: 'estate_account', personId: 'deceased', category: 'estate-distribution', cashDelta: -80n },
    { ...base, id: 'heir_credit', accountId: 'heir_account', personId: 'actual_heir', category: 'inheritance', cashDelta: 80n },
    { ...base, id: 'debt_payment', accountId: 'estate_account', personId: 'deceased', category: 'estate-debt', cashDelta: -10n },
    { ...base, id: 'charity_payment', accountId: 'estate_account', personId: 'deceased', category: 'estate-charity', cashDelta: -5n },
    { ...base, id: 'tax_payment', accountId: 'estate_account', personId: 'deceased', category: 'estate-tax', cashDelta: -5n },
  ] };
  return { estate, world };
}

test('estate proof reconciles actual matching heir debit/credit pairs and creditor, tax and charity payments', () => {
  const { estate, world } = receiptScenario();
  expect(assertEstateReceipts(world, estate)).toEqual({ actualReceiptPairs: [{ heirId: 'actual_heir', debitId: 'estate_debit', creditId: 'heir_credit', amount: 80n }], charity: 5n, tax: 5n, debtPaid: 10n, conserved: true });
});

test('correct summary totals cannot hide a wrong inheritance account or repeated transfer', () => {
  const { estate, world } = receiptScenario(); world.accounts[0].ownerId = 'someone_else'; expect(() => assertEstateReceipts(world, estate)).toThrow(/actual heir account/);
  world.accounts[0].ownerId = 'actual_heir'; world.ledger.push({ ...world.ledger[0], id: 'extra_debit' }, { ...world.ledger[1], id: 'extra_credit' }); expect(() => assertEstateReceipts(world, estate)).toThrow(/settled distribution/);
});

test('an unpaid creditor or wrong-currency heir receipt cannot pass only the scalar estate check', () => {
  const { estate, world } = receiptScenario(); world.ledger[2].cashDelta = -9n; expect(() => assertEstateReceipts(world, estate)).toThrow();
  world.ledger[2].cashDelta = -10n; world.ledger[1].currency = 'EUR'; expect(() => assertEstateReceipts(world, estate)).toThrow(/currency/);
});

test.each(['estate-debt', 'estate-charity', 'estate-tax', 'estate-distribution'])('an equal numeric %s payment in EUR cannot satisfy a USD estate', category => {
  const { estate, world } = receiptScenario(); world.ledger.find(row => row.category === category)!.currency = 'EUR';
  expect(() => assertEstateReceipts(world, estate)).toThrow(/settlement currency/);
});
