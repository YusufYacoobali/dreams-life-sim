import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createLife, randomCreation } from '../../src/game/createLife';
import { decodeWorld, encodeWorld, moneyJSON, validateWorld, type World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { countries, countryCodes } from '../../src/game/countries';
import { monthFrom } from '../../src/game/calendar';
import { rules, incomeTax } from '../../src/game/rules';
import { roundRatio } from '../../src/game/money';
import { accountFor, post } from '../../src/game/systems/common';
import { settleTax } from '../../src/game/systems/finance';
import { financialActors } from '../../src/game/systems/households';
import { npcMovesYear, settleAnnualTaxesForNpcMoves, settleTaxForNpcMove } from '../../src/game/systems/npcMoves';
import { npcMoveAttemptKey, npcMoveRulesV1, npcMoveTaxV1 } from '../../src/game/systems/npcMoveSchemas';
import { validateNpcMoves } from '../../src/game/systems/npcMoveValidation';
import { unpackCheckpoint, packCheckpoint } from '../../src/persistence/checkpoints';
import { npcMoveFixture, npcMoveJourney } from '../support/npcMoves';
import { annualCommand } from '../support/npcRelationships';
import pensionArchive from '../fixtures/v18-foreign-pension-archive.json';
import oldPensionArchive from '../fixtures/v17-pension-archive.json';

const raw = (world: World) => JSON.stringify(world, moneyJSON);
const clone = (world: World) => decodeWorld(encodeWorld(world));
function attempt(state = 7) {
  const setup = npcMoveFixture(state), proof = settleTaxForNpcMove(setup.world, setup.world.people[setup.retireeId])!;
  npcMovesYear(setup.world, new Map([[setup.retireeId, proof]])); return { ...setup, proof };
}

test.each(countryCodes)('%s V1 retains actual cities, local currency, retirement/cost/tax rounding including JPY', country => {
  const old = npcMoveRulesV1[country], current = rules[country];
  expect(old.cities).toEqual(countries[country].cities); expect(old.currency).toBe(countries[country].currency); expect(old.retirementAge).toBe(current.retirementAge);
  expect(old.fee).toBe(roundRatio(current.baseWage, 50n)); expect(old.living).toBe(current.livingCost);
  for (const gross of [0n, current.baseWage, current.baseWage * 3n + 1n]) expect(npcMoveTaxV1(gross, country)).toBe(incomeTax(gross, current));
  expect(Object.isFrozen(old)).toBe(true); expect(Object.isFrozen(old.cities)).toBe(true);
});

test.each([[7, 'moved'], [1, 'stayed']] as const)('fixed declared stream%s records one%s outcome, exact genuine pension/household/roles and only its actual fee', (state, outcome) => {
  const setup = npcMoveFixture(state), { world, retireeId } = setup, person = world.people[retireeId], original = clone(world);
  const proof = settleTaxForNpcMove(world, person)!, cash = accountFor(world, person).cash, settledFinance = structuredClone(person.finance), random = { ...world.random }; npcMovesYear(world, new Map([[retireeId, proof]]));
  const row = world.npcMoves[0]; expect(row.outcome).toBe(outcome); expect(row.recordedPaidPeriods).toBe(13); expect(row.currency).toBe('JPY'); expect(row.cashBefore).toBe(cash);
  expect(person.city).toBe(outcome === 'moved' ? row.destinationCity : 'Tokyo'); expect(accountFor(world, person).cash).toBe(cash - (outcome === 'moved' ? 64000n : 0n));
  expect(world.households).toEqual(original.households); expect(world.relationships).toEqual(original.relationships); expect(person.finance).toEqual(settledFinance); expect(person.finance.pensionReceipts).toEqual(original.people[retireeId].finance.pensionReceipts); expect(person.education).toEqual(original.people[retireeId].education);
  expect(person.country).toBe('JP'); expect(person.nationality).toBe(original.people[retireeId].nationality); expect(world.workHistory).toEqual(original.workHistory);
  expect(world.random.events).toBe(random.events); expect(world.random.outcomes).toBe(random.outcomes); expect(world.random.economy).toBe(random.economy); expect(world.random.npcs).not.toBe(random.npcs);
  validateWorld(world); expect(unpackCheckpoint(packCheckpoint(world))).toEqual(world);
  const done = encodeWorld(world); npcMovesYear(world, new Map([[retireeId, proof]])); expect(encodeWorld(world)).toBe(done);
  if (outcome === 'moved') expect(() => resolveCommand(world, { type: 'interact', personId: retireeId, action: 'spend-time' })).toThrow(/same place/);
});

test('no-candidate tax pass preserves every original effect, original actor order and zero-cycle missing-native-account success', () => {
  const world = createLife('life_tax_move_parity', 42, randomCreation(42), { year: 2027, month: 1, day: 1 });
  const parent = world.people.person_parent1;
  world.accounts = world.accounts.filter(row => row.ownerId !== parent.id); // Existing zero-tax behaviour needs no account.
  const before = structuredClone(world), expected = structuredClone(world);
  for (const person of financialActors(expected)) settleTax(expected, person);
  const proofs = settleAnnualTaxesForNpcMoves(world, financialActors(world)); npcMovesYear(world, proofs);
  expect(world).toEqual(expected); expect(proofs.has(parent.id)).toBe(false); expect(world.random).toEqual(before.random);
});

test.each(['charge', 'refund', 'zero'] as const)('actual%s reconciliation is bound before the moving fee and agrees exactly with original settleTax', mode => {
  const { world, retireeId } = npcMoveFixture(), person = world.people[retireeId];
  // Declared tax-unit opening state, not additional earned pension/service.
  person.finance.cycleGross = 4000000n;
  person.finance.cycleWithheld = mode === 'refund' ? 900000n : mode === 'zero' ? incomeTax(4000000n, rules.JP) : person.finance.pensionReceipts.at(-1)!.withheld;
  const expected = clone(world); settleTax(expected, expected.people[retireeId]);
  const proof = settleTaxForNpcMove(world, person)!; expect(world).toEqual(expected);
  npcMovesYear(world, new Map([[retireeId, proof]])); const row = world.npcMoves[0];
  expect(row.tax).toEqual(proof); expect(proof.ledgerEnd).toBeLessThanOrEqual(row.ledgerCursor); expect(person.finance.cycleGross).toBe(0n); expect(person.finance.cycleWithheld).toBe(0n);
  expect(proof.ledgerEnd - proof.ledgerStart).toBe(mode === 'zero' ? 0 : 1); validateWorld(world);
});

test('remaining locked cash, one-unit reserve shortfall, missing tax proof and unsettled budget defer without RNG or state changes', () => {
  for (const kind of ['locked', 'reserve', 'tax', 'month', 'cycle'] as const) {
    const { world, retireeId } = npcMoveFixture(), person = world.people[retireeId], proof = settleTaxForNpcMove(world, person)!;
    if (kind === 'locked') accountFor(world, person).lockedCash = 1n;
    if (kind === 'reserve') { const account = accountFor(world, person), target = 64000n + 330000n - 1n; post(world, target - account.cash, 0n, 'unit-spending', 'Declared reserve-boundary spending', null, person); }
    if (kind === 'month') person.lastEconomicMonth--;
    if (kind === 'cycle') person.finance.cycleGross = 1n;
    const before = raw(world); npcMovesYear(world, kind === 'tax' ? new Map() : new Map([[retireeId, proof]])); expect(raw(world)).toBe(before);
  }
  const { world, retireeId } = npcMoveFixture(), person = world.people[retireeId], account = accountFor(world, person), proof = settleTaxForNpcMove(world, person)!;
  post(world, 394000n - account.cash, 0n, 'unit-spending', 'Declared exact reserve-boundary spending', null, person);
  npcMovesYear(world, new Map([[retireeId, proof]])); expect(account.cash).toBe(330000n); validateWorld(world);
});

test('legacy paid counters without actual recorded pension receipts cannot qualify', () => {
  const world = unpackCheckpoint(oldPensionArchive.checkpoint), person = world.people.person_parent1;
  expect(person.finance.pensionMonths).toBe(44); expect(person.finance.pensionReceipts).toEqual([]);
  // Pure eligibility boundary: no made-up receipts, retrospective pay or draw.
  const proof = settleTaxForNpcMove(world, person)!, before = encodeWorld(world); npcMovesYear(world, new Map([[person.id, proof]])); expect(raw(world)).toBe(before);
});

test.each(['unknown', 'player', 'partner', 'employment', 'training', 'study', 'health', 'wanted', 'household', 'home', 'liability', 'creditor', 'business-payable', 'bound', 'pension-month', 'paid-periods'] as const)('%s boundary does not silently settle commitments or draw', kind => {
  const { world, retireeId, observerId } = npcMoveFixture(), person = world.people[retireeId], proof = settleTaxForNpcMove(world, person)!;
  if (kind === 'unknown') world.relationships = world.relationships.filter(row => row.id !== world.relationships.at(-1)!.id);
  if (kind === 'player') world.activePersonId = retireeId;
  if (kind === 'partner') world.relationships.at(-1)!.romance = 'dating'; // Guard-only invalid-family romance trap, never saved.
  if (kind === 'employment') person.employment = world.people[observerId].employment;
  if (kind === 'training') person.training = { skill: 'music', mode: 'self', started: world.date, lastMonth: person.lastEconomicMonth, months: 0, fees: 0n, currency: 'JPY' };
  if (kind === 'study') person.education.stage = 'trade';
  if (kind === 'health') person.stats.health = 34;
  if (kind === 'wanted') person.legal.wanted = true;
  if (kind === 'household') world.households.find(row => row.id === person.householdId)!.members.push(observerId);
  if (kind === 'home') world.households.find(row => row.id === person.householdId)!.homeAssetId = 'unowned-unit-house';
  if (kind === 'liability' || kind === 'creditor') world.liabilities.push({ id: 'unit-debt', ownerId: kind === 'liability' ? retireeId : observerId, creditorId: kind === 'creditor' ? retireeId : null, principal: 1n, currency: 'JPY', kind: 'personal', interestBps: 0, assetId: null, monthlyPayment: 0n, remainingMonths: 0, missedPayments: 0 });
  if (kind === 'business-payable') {
    world.businesses.push({ id: 'unit-closed-business', name: 'Declared closed company', kind: 'cafe', ownerId: retireeId, founderId: retireeId, country: 'JP', city: 'Tokyo', currency: 'JPY', started: world.date, ended: world.date, status: 'closed', cash: 0n, equipment: 0n, costBasis: 0n, ownerOperated: false, locations: 1, facilities: 0, condition: 50, reputation: 50, priceBps: 10000, marketing: 'none', lastMonth: person.lastEconomicMonth, distressMonths: 0, cumulativeProfit: 0n, dividends: 0n, monthsOperated: 0, provenance: [], pendingExpenses: 0n, pendingPayroll: 0n, payoutBps: 0, staff: [], months: [], archives: [] });
    world.businessPayables.push({ id: 'unit-payable', businessId: 'unit-closed-business', creditorId: observerId, employmentId: null, kind: 'supplier', currency: 'JPY', principal: 1n, writtenOff: 0n });
  }
  if (kind === 'bound') world.pending = { kind: 'decision', id: 'unit-bound', templateId: 'quiet-morning', title: 'Bound', body: 'Original', illustration: 'home', personIds: [retireeId], choices: [{ id: 'one', label: 'One', effects: [], resultTitle: 'One', resultBody: 'Original', journal: 'Original' }, { id: 'two', label: 'Two', effects: [], resultTitle: 'Two', resultBody: 'Original', journal: 'Original' }] };
  if (kind === 'pension-month') person.finance.pensionReceipts.at(-1)!.month--;
  if (kind === 'paid-periods') person.finance.pensionReceipts = person.finance.pensionReceipts.slice(-11);
  const before = raw(world); npcMovesYear(world, new Map([[retireeId, proof]])); expect(raw(world)).toBe(before);
});

test.each(['cash', 'available', 'cursor', 'fee', 'reserve', 'tax-due', 'tax-span', 'tax-payment', 'pension-count', 'pension-receipt', 'member', 'observer', 'destination', 'roll', 'counter', 'payment', 'orphan', 'zero-tax', 'journal-id', 'journal-text', 'journal-index'] as const)('saved%s forgery is refused', kind => {
  const { world, retireeId } = attempt(), row = world.npcMoves[0];
  if (kind === 'cash') { row.cashBefore++; row.availableBefore++; }
  if (kind === 'available') row.availableBefore++;
  if (kind === 'cursor') row.ledgerCursor++;
  if (kind === 'fee') row.movingCost++;
  if (kind === 'reserve') row.reserveRequired++;
  if (kind === 'tax-due') row.tax.due++;
  if (kind === 'tax-span') row.tax.ledgerEnd++;
  if (kind === 'tax-payment') row.tax.paymentId = row.pensionTransactionId;
  if (kind === 'pension-count') row.recordedPaidPeriods++;
  if (kind === 'pension-receipt') row.pensionTransactionId = world.people[retireeId].finance.pensionReceipts[0].grossTransactionId!;
  if (kind === 'member') row.householdMembers.push(world.activePersonId);
  if (kind === 'observer') row.observerId = retireeId;
  if (kind === 'destination') row.destinationCity = row.originCity;
  if (kind === 'roll') row.roll = 100;
  if (kind === 'counter') delete world.actionCounts[npcMoveAttemptKey(row.date.year)];
  if (kind === 'payment') row.paymentId = row.pensionTransactionId;
  if (kind === 'orphan') world.npcMoves = [];
  if (kind === 'zero-tax') { row.tax.gross = 0n; row.tax.withheld = 0n; row.tax.due = 0n; row.tax.ledgerStart = row.ledgerCursor; row.tax.ledgerEnd = row.ledgerCursor; row.tax.paymentId = null; row.tax.journalId = null; row.tax.journalText = null; row.tax.journalIndex = null; }
  if (kind === 'journal-id') row.tax.journalId = world.journal.find(entry => entry.personId !== retireeId)?.id ?? 'wrong';
  if (kind === 'journal-text') row.tax.journalText = 'Changed historical formatting';
  if (kind === 'journal-index') row.tax.journalIndex = 0;
  expect(() => validateNpcMoves(world)).toThrow();
});

test('later spending, household dissolution, death and new residence retain the original affordability evidence', () => {
  const { world, retireeId } = attempt(), person = world.people[retireeId], row = structuredClone(world.npcMoves[0]);
  post(world, -100000n, 0n, 'unit-later-spending', 'Declared later spending', null, person);
  world.households = world.households.filter(household => household.id !== person.householdId); person.householdId = null; person.city = 'Later player-led residence';
  person.died = monthFrom(world.date, 1); world.date = { ...person.died }; validateNpcMoves(world); expect(world.npcMoves[0]).toEqual(row);
});

test('actual ordinary annual completion moves the genuine paid retiree once, and later twelve months preserve old rights/pay while continuing the pension', () => {
  const { before, command, after, retireeId } = npcMoveJourney(), original = before.people[retireeId], person = after.people[retireeId], row = after.npcMoves.find(row => row.outcome === 'moved')!;
  expect(resolveCommand(before, command, true)).toEqual(after); expect(row.tax.ledgerEnd).toBeLessThanOrEqual(row.ledgerCursor); expect(person.city).toBe(row.destinationCity);
  const terms = { annual: person.finance.pensionAnnual, service: person.finance.serviceMonths, lifetime: person.finance.lifetimeGross, qualifications: person.education.qualifications }, oldPayments = structuredClone(person.finance.pensionReceipts);
  let world = after; const target = monthFrom(after.date, 12);
  for (let steps = 0; steps < 100 && (world.date.year * 12 + world.date.month < target.year * 12 + target.month || world.pending || world.annual); steps++) { world = resolveCommand(world, annualCommand(world), true); if (world.people[retireeId].died) break; }
  const continued = world.people[retireeId]; expect(continued.died).toBeNull(); expect(continued.finance.pensionReceipts.slice(0, oldPayments.length)).toEqual(oldPayments); expect(continued.finance.pensionMonths - person.finance.pensionMonths).toBe(12);
  expect(continued.finance.pensionAnnual).toBe(terms.annual); expect(continued.finance.serviceMonths).toBe(terms.service); expect(continued.finance.lifetimeGross).toBe(terms.lifetime); expect(continued.education.qualifications).toEqual(terms.qualifications); expect(world.npcMoves.filter(row => row.personId === retireeId && row.outcome === 'moved')).toHaveLength(1);
  expect(person.finance.pensionReceipts.slice(0, original.finance.pensionReceipts.length)).toEqual(original.finance.pensionReceipts); expect(unpackCheckpoint(packCheckpoint(world))).toEqual(world);
  writeFileSync('/tmp/dreams-npc-retirement-move-fixed-journey.json', JSON.stringify({ scope: 'Genuine v18 paid pension plus declared observer/calendar/initial RNG unit context; ordinary subsequent commands, no seed search or naturalbirth claim', archiveSha256: '67204e03663bb0715af6f101932eb7d5371090e5e6a1e1d9ffe7236dc72add9a', beforeRevision: before.revision, command, committedRevision: after.revision, movingRecord: row, oldReceiptCount: original.finance.pensionReceipts.length, paidPeriodsAtMove: person.finance.pensionMonths, continuedDate: world.date, continuedPaidPeriods: continued.finance.pensionMonths, annualPay: continued.finance.pensionAnnual, serviceMonths: continued.finance.serviceMonths, beforeWorldSha256: createHash('sha256').update(encodeWorld(before)).digest('hex'), movedWorldSha256: createHash('sha256').update(encodeWorld(after)).digest('hex'), continuedWorldSha256: createHash('sha256').update(encodeWorld(world)).digest('hex') }, moneyJSON, 2) + '\n');
});

test('genuine v18 original archive bytes, old receipts and raw checkpoint remain unchanged', () => {
  expect(createHash('sha256').update(readFileSync(join(__dirname, '../fixtures/v18-foreign-pension-archive.json'))).digest('hex')).toBe('67204e03663bb0715af6f101932eb7d5371090e5e6a1e1d9ffe7236dc72add9a');
  const world = unpackCheckpoint(pensionArchive.checkpoint);
  expect(world.npcMoves).toEqual([]); expect(world.people[world.activePersonId].finance.pensionReceipts).toHaveLength(12); expect(decodeWorld(encodeWorld(world))).toEqual(world);
});
