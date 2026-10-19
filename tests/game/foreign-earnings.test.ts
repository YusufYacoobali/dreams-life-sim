import { gunzipSync, strFromU8 } from 'fflate';
import { createLife, randomCreation } from '../../src/game/createLife';
import { countries, CountryCode } from '../../src/game/countries';
import { decodeWorld, encodeWorld, validateWorld, World } from '../../src/game/model';
import { currencyDigits, Currency, roundRatio } from '../../src/game/money';
import { monthFrom } from '../../src/game/calendar';
import { incomeTax, monthlyAmount, rules } from '../../src/game/rules';
import { fxMoney } from '../../src/game/valuation';
import { accountFor } from '../../src/game/systems/common';
import { endEmployment, employmentBackPay, workMonth } from '../../src/game/systems/work';
import { householdMonth, settleBackground } from '../../src/game/systems/npcBudget';
import { createContact, hireNpc } from '../../src/game/systems/npcs';
import { settleTax } from '../../src/game/systems/finance';
import { qualifyingAnnualIncome } from '../../src/game/systems/credit';
import { careerMonth, startCareerContract } from '../../src/game/systems/careers';
import { decodeSave } from '../../src/persistence/archive';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import royalArchive from '../fixtures/v17-royal-archive.json';
import pensionArchive from '../fixtures/v17-pension-archive.json';

function fixture(country: CountryCode = 'US', age = 30) {
  const world = createLife('life_foreign_earnings', 42, { ...randomCreation(42), country, city: countries[country].cities[0], background: 'ordinary' }, { year: 2000, month: 1, day: 1 });
  world.date = { year: 2026, month: 1, day: 1 }; world.birthAcknowledged = true;
  const person = createContact(world, { age, country, qualifiedRole: 'administrator' });
  world.activePersonId = person.id;
  return world;
}
/** A financial unit setup; the subsequent travel milestone supplies the reviewed move command. */
function reside(world: World, country: CountryCode) {
  const person = world.people[world.activePersonId];
  endEmployment(world); settleTax(world); person.country = country; person.city = countries[country].cities[0];
  const currency = countries[country].currency;
  if (!world.accounts.some(item => item.ownerId === person.id && item.currency === currency)) world.accounts.push({ id: 'account_' + person.id + '_' + currency, ownerId: person.id, currency, cash: 0n, openingCash: 0n, lockedCash: 0n });
}
function retired(country: CountryCode) {
  const world = fixture(country, rules[country].retirementAge);
  const person = world.people[world.activePersonId];
  // NPC retirement uses real recorded background service, before selecting that person.
  const previous = world.activePersonId; world.activePersonId = 'person_player'; householdMonth(world); world.activePersonId = previous;
  expect(person.employment).toBeNull(); expect(person.finance.serviceMonths).toBeGreaterThanOrEqual(120); expect(person.finance.pensionAnnual).toBeGreaterThan(0n);
  return world;
}
const currencies = Object.keys(currencyDigits) as Currency[];
const countryFor = (currency: Currency) => (Object.keys(countries) as CountryCode[]).find(code => countries[code].currency === currency)!;

test('the genuine v17 archive keeps every old money fact, royal archive, random stream and historical checkpoint', () => {
  const original = JSON.parse(strFromU8(gunzipSync(Buffer.from(JSON.parse(royalArchive.checkpoint).data, 'base64'))));
  const save = decodeSave(JSON.stringify(royalArchive)), world = save.world, encoded = JSON.parse(encodeWorld(world));
  expect(world.schemaVersion).toBe(19); expect(world.engineVersion).toBe(18);
  expect(encoded.royalHouses).toEqual(original.royalHouses); expect(encoded.ledger).toEqual(original.ledger); expect(encoded.accounts).toEqual(original.accounts); expect(world.random).toEqual(original.random); expect(world.annual).toEqual(original.annual);
  for (const person of Object.values(world.people)) {
    const old = original.people[person.id]; expect(person.finance.earningsCurrency).toBe('JPY'); expect(person.finance.lifetimeGross).toBe(BigInt(old.finance.lifetimeGross.$dreamsBigInt)); expect(person.finance.pensionAnnual).toBe(BigInt(old.finance.pensionAnnual.$dreamsBigInt)); expect(person.finance.pensionRecordedFrom).toBe(old.finance.pensionMonths); expect(person.finance.pensionReceipts).toEqual([]);
  }
  for (const record of world.workHistory) { expect(record.currency).toBe('JPY'); expect(record.normalizedGross).toBe(record.grossEarned); expect(record.conversions).toEqual([]); }
  const prior = unpackCheckpoint(save.snapshots[0].payload); expect(prior.people[prior.activePersonId].finance.earningsCurrency).toBe('JPY'); expect(prior.royalHouses[0].id).toBe(world.royalHouses[0].id); expect(decodeWorld(encodeWorld(world))).toEqual(world);
});

test('native wage history and lifetime reference values survive new jobs abroad and later exchange-rate changes', () => {
  const world = fixture(), person = world.people[world.activePersonId], old = person.employment!.id;
  workMonth(world); const oldGross = world.workHistory.find(item => item.id === old)!.grossEarned;
  reside(world, 'JP'); hireNpc(world, person, 'administrator'); const job = person.employment!, before = person.finance.lifetimeGross;
  world.date = monthFrom(world.date, 1); workMonth(world);
  const record = world.workHistory.find(item => item.id === job.id)!, first = record.normalizedGross;
  expect(record.currency).toBe('JPY'); expect(record.grossEarned).toBe(monthlyAmount(job.annualPay, 0)); expect(record.normalizedGross).toBe(fxMoney(world, { minor: record.grossEarned, currency: 'JPY' }, 'USD').minor); expect(person.finance.lifetimeGross).toBe(before + first); expect(record.conversions).toHaveLength(1);
  world.market.fx.JPY.numerator *= 2n; validateWorld(world); expect(record.normalizedGross).toBe(first); expect(world.workHistory.find(item => item.id === old)!.grossEarned).toBe(oldGross);
  const paid = record.grossEarned; world.date = monthFrom(world.date, 1); workMonth(world);
  const second = fxMoney(world, { minor: record.grossEarned - paid, currency: 'JPY' }, 'USD').minor;
  expect(record.normalizedGross).toBe(first + second); expect(person.finance.lifetimeGross).toBe(before + first + second); expect(record.conversions).toHaveLength(2); expect(decodeWorld(encodeWorld(world))).toEqual(world);
});

test('genuine already-paid v17 pensions preserve their old period counters and begin new receipts at the next actual entitlement', () => {
  const world = decodeSave(JSON.stringify(pensionArchive)).world, person = world.people.person_parent1;
  expect(person.finance.pensionMonths).toBe(44); expect(person.finance.pensionRecordedFrom).toBe(44); expect(person.finance.pensionReceipts).toEqual([]); expect(person.finance.pensionAnnual).toBe(1212632n);
  const old = world.ledger.map(item => ({ ...item })); world.activePersonId = person.id; reside(world, 'US'); const before = person.finance.pensionAnnual; world.date = monthFrom(world.date, 1); workMonth(world);
  const receipt = person.finance.pensionReceipts[0]; expect(receipt.firstPeriod).toBe(44); expect(receipt.nativeGross).toBe(monthlyAmount(before, 44)); expect(receipt.sourceCurrency).toBe('JPY'); expect(receipt.currency).toBe('USD'); expect(person.finance.pensionMonths).toBe(45); expect(world.ledger.slice(0, old.length)).toEqual(old); expect(decodeWorld(encodeWorld(world))).toEqual(world);
});

test('foreign back pay stays in its original account, adds no service and enters current-residence tax/support once', () => {
  const world = fixture(), person = world.people[world.activePersonId], original = person.employment!.id;
  reside(world, 'JP'); const service = person.finance.serviceMonths, lifetime = person.finance.lifetimeGross, usd = accountFor(world, person, 'USD').cash, jpy = accountFor(world).cash, support = person.finance.supportIncomeDue;
  employmentBackPay(world, person, original, 100001n);
  const gross = fxMoney(world, { minor: 100001n, currency: 'USD' }, 'JPY').minor;
  expect(person.finance.serviceMonths).toBe(service); expect(person.finance.lifetimeGross).toBe(lifetime + 100001n); expect(person.finance.cycleGross).toBe(gross); expect(person.finance.supportIncomeDue).toBe(support + gross); expect(accountFor(world).cash).toBe(jpy); expect(accountFor(world, person, 'USD').cash).toBeGreaterThan(usd); expect(world.ledger.at(-1)!.currency).toBe('USD'); validateWorld(world);
});

test('returning to a special career abroad preserves each earlier project currency and values only new actual earnings', () => {
  const world = fixture(), person = world.people[world.activePersonId]; endEmployment(world);
  const career = startCareerContract(world, 'actor', 6000007n, person, false); world.date = monthFrom(world.date, 1); workMonth(world); careerMonth(world); endEmployment(world);
  const earlier = structuredClone(career.projects[0]); expect(earlier.grossEarned).toBeGreaterThan(0n); expect(earlier.currency).toBe('USD');
  reside(world, 'JP'); startCareerContract(world, 'actor', 9000007n, person, false); world.date = monthFrom(world.date, 1); workMonth(world); careerMonth(world);
  expect(career.currency).toBe('JPY'); expect(career.projects[0]).toEqual(earlier); expect(career.projects[1].currency).toBe('JPY'); expect(career.projects[1].grossEarned).toBe(monthlyAmount(9000007n, 0)); expect(decodeWorld(encodeWorld(world))).toEqual(world);
});

test('a background foreign contract settles once at its saved reference quote without changing historical native pay', () => {
  const world = fixture(), person = world.people[world.activePersonId]; reside(world, 'JP'); hireNpc(world, person, 'administrator');
  const id = person.employment!.id, previous = person.finance.lifetimeGross, through = world.date.year * 12 + world.date.month + 4;
  world.date = monthFrom(world.date, 5); world.activePersonId = 'person_player'; settleBackground(world, person, through);
  const record = world.workHistory.find(item => item.id === id)!; expect(record.monthsWorked).toBe(5); expect(record.normalizedGross).toBe(fxMoney(world, { minor: record.grossEarned, currency: 'JPY' }, 'USD').minor); expect(person.finance.lifetimeGross).toBe(previous + record.normalizedGross); expect(record.conversions).toHaveLength(1);
  const saved = encodeWorld(world); settleBackground(world, person, through); expect(encodeWorld(world)).toBe(saved);
});

test.each(currencies.flatMap(source => currencies.map(destination => [source, destination] as const)))('%s pension paid in %s preserves earned rights, exact converted gross, fees, tax and actual cash', (source, destination) => {
  const world = retired(countryFor(source)), person = world.people[world.activePersonId], annual = person.finance.pensionAnnual;
  reside(world, countryFor(destination)); const cash = accountFor(world).cash, sourceCash = accountFor(world, person, source).cash, lifetime = person.finance.lifetimeGross, service = person.finance.serviceMonths;
  world.date = monthFrom(world.date, 1); workMonth(world);
  const receipt = person.finance.pensionReceipts.at(-1)!, native = monthlyAmount(annual, receipt.firstPeriod), gross = fxMoney(world, { minor: native, currency: source }, destination).minor, fee = source === destination ? 0n : (gross + 99n) / 100n;
  expect(person.finance.earningsCurrency).toBe(source); expect(person.finance.pensionAnnual).toBe(annual); expect(receipt.nativeGross).toBe(native); expect(receipt.gross).toBe(gross); expect(receipt.fee).toBe(fee); expect(accountFor(world).cash - cash).toBe(gross - fee - receipt.withheld); expect(person.finance.cycleGross).toBe(gross); expect(person.finance.cycleWithheld).toBe(receipt.withheld); expect(person.finance.lifetimeGross).toBe(lifetime); expect(person.finance.serviceMonths).toBe(service); expect(person.finance.supportIncomeDue).toBe(gross);
  if (source !== destination) expect(accountFor(world, person, source).cash).toBe(sourceCash);
  expect(qualifyingAnnualIncome(world).parts.find(item => item.id === 'pension')!.annual).toBe(fxMoney(world, { minor: annual, currency: source }, destination).minor); expect(decodeWorld(encodeWorld(world))).toEqual(world);
});

test('an entire domestic pension year pays the exact earned annual amount without FX fees or new employment service', () => {
  const world = retired('US'), person = world.people[world.activePersonId], annual = person.finance.pensionAnnual, service = person.finance.serviceMonths, cash = accountFor(world).cash;
  for (let index = 0; index < 12; index++) { world.date = monthFrom(world.date, 1); workMonth(world); }
  expect(person.finance.pensionReceipts.reduce((sum, item) => sum + item.nativeGross, 0n)).toBe(annual); expect(person.finance.pensionReceipts.every(item => item.fee === 0n)).toBe(true); expect(accountFor(world).cash - cash).toBe(annual - incomeTax(annual, rules.US)); expect(person.finance.serviceMonths).toBe(service); validateWorld(world);
});

test('saved pension quotes remain valid after rates move; a repeated settlement cannot rewrite previous receipts', () => {
  const world = retired('US'), person = world.people[world.activePersonId]; reside(world, 'JP'); world.date = monthFrom(world.date, 1); workMonth(world);
  const first = structuredClone(person.finance.pensionReceipts[0]); world.market.fx.JPY.numerator *= 2n; validateWorld(world); world.date = monthFrom(world.date, 1); workMonth(world);
  expect(person.finance.pensionReceipts[0]).toEqual(first); expect(person.finance.pensionReceipts[1].gross).toBeGreaterThan(first.gross); validateWorld(world);
});

test('a background foreign pension uses actual accrued native periods and is not paid a second time', () => {
  const world = retired('GB'), person = world.people[world.activePersonId]; reside(world, 'JP'); const start = world.date.year * 12 + world.date.month - 1; person.lastEconomicMonth = start; world.date = monthFrom(world.date, 7); world.activePersonId = 'person_player';
  const before = person.finance.pensionMonths; settleBackground(world, person, start + 7); const payment = person.finance.pensionReceipts.at(-1)!; expect(payment.periods).toBe(7); expect(payment.firstPeriod).toBe(before); expect(payment.nativeGross).toBe(roundRatio(person.finance.pensionAnnual * BigInt(before + 7), 12n) - roundRatio(person.finance.pensionAnnual * BigInt(before), 12n)); expect(payment.withheld).toBe(0n);
  const saved = encodeWorld(world); settleBackground(world, person, start + 7); expect(encodeWorld(world)).toBe(saved);
});

test('altered earnings rates, pension cash, source currency or paid-period counters are rejected', () => {
  const world = retired('US'); reside(world, 'JP'); world.date = monthFrom(world.date, 1); workMonth(world);
  for (const alter of [(copy: World) => { copy.people[copy.activePersonId].finance.pensionReceipts[0].gross++; }, (copy: World) => { copy.people[copy.activePersonId].finance.pensionReceipts[0].rate.numerator *= 2n; }, (copy: World) => { copy.people[copy.activePersonId].finance.pensionMonths++; }, (copy: World) => { copy.people[copy.activePersonId].finance.earningsCurrency = 'EUR'; }]) { const copy = decodeWorld(encodeWorld(world)); alter(copy); expect(() => validateWorld(copy)).toThrow(); }
});
