import { annualFinanceSummary, indexPersonalFinances } from '../../src/ui/annualFinances';
import { copyWorld, decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { exchangeQuote } from '../../src/game/systems/finance';
import { investmentQuote } from '../../src/game/systems/markets';
import { accountFor, post } from '../../src/game/systems/common';
import { decodeSave } from '../../src/persistence/archive';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import graduate from '../fixtures/v3-employed-graduate.json';
import companyArchive from '../fixtures/v11-business-archive.json';
import pensionArchive from '../fixtures/v18-foreign-pension-archive.json';
import tripArchive from '../fixtures/v19-family-trip-archive.json';

const acknowledge = (world: World) => resolveCommand(world, { type: 'acknowledge', resultId: world.pending!.id }, true);
const act = (world: World, command: Parameters<typeof resolveCommand>[1]) => acknowledge(resolveCommand(world, command, true));
const scope = (world: World, year: number, currency: Parameters<typeof annualFinanceSummary>[2], personId = world.activePersonId) => annualFinanceSummary(indexPersonalFinances(world, personId), year, currency);

test('genuine prior loan tuition, capitalised interest and gross employment pay retain their actual separate personal years', () => {
  const world = decodeWorld(JSON.stringify(graduate), true), before = encodeWorld(world), study = scope(world, 2018, 'USD'), pay = scope(world, 2022, 'USD'), current = scope(world, 2023, 'USD');
  expect(study.income).toBe(0n); expect(study.sections.find(row => row.id === 'borrowing')!.received).toBe(1400000n); expect(study.expenses).toBe(1400000n);
  const interest = study.sections.find(row => row.id === 'borrowing')!.categories.find(row => row.category === 'interest')!;
  expect(interest.paid).toBe(0n); expect(interest.debtAdded).toBeGreaterThan(0n);
  expect(pay.income).toBe(6600000n); expect(pay.taxPaid).toBe(874500n); expect(pay.expenses).toBe(1540000n); expect(pay.months).toBe(12);
  expect(current.income).toBe(600000n); expect(current.taxPaid).toBe(79500n); expect(current.months).toBe(1); expect(current.incomeAverage).toBe(600000n);
  const index = indexPersonalFinances(world, world.activePersonId); expect(indexPersonalFinances(world, world.activePersonId)).toBe(index);
  const allMovement = index.years.reduce((sum, year) => sum + annualFinanceSummary(index, year, 'USD').netCash, 0n), account = accountFor(world);
  expect(account.openingCash + allMovement).toBe(account.cash); expect(encodeWorld(world)).toBe(before);
});

test('genuine company sales, corporate costs and owner capital cannot inflate personal income or expenses', () => {
  const world = unpackCheckpoint(packCheckpoint(decodeSave(JSON.stringify(companyArchive)).world), true), before = encodeWorld(world), summary = scope(world, 2023, 'USD');
  expect(world.businessLedger.some(row => row.category === 'sales' && row.cashDelta > 0n)).toBe(true);
  expect(summary.income).toBe(7653772n); expect(summary.sections.find(row => row.id === 'income')!.categories.find(row => row.category === 'business-owner-income')!.received).toBe(453772n);
  const chronological = world.ledger.filter(row => row.personId === world.activePersonId && row.year === 2023 && row.currency === 'USD' && ['income', 'business-owner-income'].includes(row.category));
  expect(new Set(chronological.map(row => row.category)).size).toBe(2); expect(summary.sections.find(row => row.id === 'income')!.entries).toEqual(chronological);
  expect(summary.sections.find(row => row.id === 'company')!.paid).toBe(2040000n); expect(summary.expenses).toBe(1680000n); expect(summary.taxPaid).toBe(954000n);
  expect(summary.entries.every(row => row.personId === world.activePersonId && !row.id.startsWith('business_txn_'))).toBe(true);
  const parent = world.ledger.find(row => row.personId !== world.activePersonId && row.cashDelta > 0n)!.personId, other = scope(world, 2023, 'USD', parent);
  expect(other.entries.every(row => row.personId === parent)).toBe(true); expect(other.entries.some(row => summary.entries.includes(row))).toBe(false); expect(encodeWorld(world)).toBe(before);
});

test('genuine foreign pensions use actual JPY receipts and taxes without adding the USD entitlement or foreign balances', () => {
  const world = unpackCheckpoint(packCheckpoint(decodeSave(JSON.stringify(pensionArchive)).world), true), before = encodeWorld(world), full = scope(world, 2026, 'JPY'), partial = scope(world, 2027, 'JPY'), dollars = scope(world, 2026, 'USD');
  expect(full.income).toBe(3337696n); expect(full.taxPaid).toBe(438374n); expect(full.expenses).toBe(1243383n); expect(full.incomeAverage).toBe(278141n);
  expect(partial.income).toBe(304649n); expect(partial.taxPaid).toBe(40097n); expect(partial.taxRefunded).toBe(2n); expect(partial.months).toBe(1); expect(partial.incomeAverage).toBe(304649n);
  expect(dollars.income).toBe(0n); expect(dollars.entries).toHaveLength(0); expect(full.entries.every(row => row.currency === 'JPY')).toBe(true);
  expect(world.people[world.activePersonId].finance.pensionReceipts.some(row => row.sourceCurrency === 'USD' && row.currency === 'JPY')).toBe(true); expect(encodeWorld(world)).toBe(before);
});

test('a genuine paid family holiday remains a personal expense in its actual payment year and currency', () => {
  const world = unpackCheckpoint(packCheckpoint(decodeSave(JSON.stringify(tripArchive)).world), true), before = encodeWorld(world), trip = world.trips.find(row => row.organizerId === world.activePersonId)!;
  expect(trip.paid).toBe(896497n); expect(trip.status).toBe('completed');
  const summary = scope(world, trip.started.year, trip.quote.currency), travel = summary.sections.find(row => row.id === 'expenses')!.categories.find(row => row.category === 'travel')!;
  expect(travel.paid).toBe(trip.paid); expect(travel.received).toBe(0n); expect(summary.expenses).toBeGreaterThanOrEqual(trip.paid); expect(encodeWorld(world)).toBe(before);
});

test('ordinary loans, repayments, exchange, trades and gifts conserve cash without masquerading as wages', () => {
  let world = decodeWorld(JSON.stringify(graduate), true); if (world.pending) world = acknowledge(world);
  const original = world, year = world.date.year, income = scope(world, year, 'USD').income;
  world = act(world, { type: 'borrow', amount: 10000n }); const debt = world.liabilities.find(row => row.kind === 'personal' && row.ownerId === world.activePersonId)!;
  world = act(world, { type: 'repay', liabilityId: debt.id, amount: 3000n });
  world = act(world, { type: 'exchange', from: 'USD', to: 'EUR', amount: 1000n, quotedNet: exchangeQuote(world, 1000n, 'USD', 'EUR').net });
  const recipient = world.relationships.find(row => row.to === world.activePersonId && row.roles.includes('parent'))!.from;
  world = act(world, { type: 'gift-money', personId: recipient, amount: 500n });
  const buy = investmentQuote(world, 'NORTH', 1n);
  world = act(world, { type: 'buy-investment', instrumentId: 'NORTH', quantity: 1n, quotedMinor: buy.value });
  const sale = investmentQuote(world, 'NORTH', 1n);
  world = act(world, { type: 'sell-investment', holdingId: world.holdings.find(row => row.ownerId === world.activePersonId && row.instrumentId === 'NORTH')!.id, quantity: 1n, quotedMinor: sale.value });
  const summary = scope(world, year, 'USD'), gift = scope(world, year, 'USD', recipient), euro = scope(world, year, 'EUR');
  expect(summary.income).toBe(income); expect(summary.sections.find(row => row.id === 'borrowing')!.categories.find(row => row.category === 'borrowing')!.received).toBe(10000n);
  expect(summary.sections.find(row => row.id === 'borrowing')!.categories.find(row => row.category === 'repayment')!.paid).toBe(3000n);
  expect(summary.sections.find(row => row.id === 'transfers')!.paid).toBe(1000n); expect(euro.income).toBe(0n); expect(euro.received).toBeGreaterThan(0n);
  expect(gift.sections.find(row => row.id === 'family')!.categories.find(row => row.category === 'gift')!.received).toBe(500n);
  expect(summary.sections.find(row => row.id === 'investments')!.paid).toBe(buy.buyCost); expect(summary.sections.find(row => row.id === 'investments')!.received).toBe(sale.sellProceeds);
  expect(accountFor(world).cash - accountFor(original).cash).toBe(5500n - buy.buyCost + sale.sellProceeds);
});

test.each(['unrecognised-receipt', 'constructor', 'toString'])('mutable inputs are never cached and unknown %s categories remain visible without guessed income', category => {
  const world = copyWorld(decodeWorld(JSON.stringify(graduate))), first = indexPersonalFinances(world, world.activePersonId), before = scope(world, world.date.year, 'USD');
  // Explicit projection-only category trap; not a gameplay or earning claim.
  post(world, 123n, 0n, category, 'Projection-only unknown category'); validateWorld(world);
  const next = indexPersonalFinances(world, world.activePersonId), summary = annualFinanceSummary(next, world.date.year, 'USD');
  expect(next).not.toBe(first); expect(summary.income).toBe(before.income); expect(summary.received).toBe(before.received + 123n); expect(summary.sections.find(row => row.id === 'other')!.received).toBe(123n);
  expect(() => indexPersonalFinances(world, 'person_absent')).toThrow(/existing person/); expect(() => annualFinanceSummary(next, world.date.year + 1, 'USD')).toThrow(/recorded financial year/);
});
