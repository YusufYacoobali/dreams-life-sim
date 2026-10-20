import { countryCodes, countries, type CountryCode } from '../../src/game/countries';
import { monthFrom } from '../../src/game/calendar';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { encodeWorld, decodeWorld, validateWorld, type World } from '../../src/game/model';
import { jobs } from '../../src/game/content/jobs';
import { randomInteger } from '../../src/game/random';
import { roundRatio } from '../../src/game/money';
import { incomeTax, monthlyAmount, rules } from '../../src/game/rules';
import { accountFor, post } from '../../src/game/systems/common';
import { hourlyAnnual, hourlyContract, hourlyPeriodGross, hourlyQuote, currentHourlyRate, currentHourlyTerms } from '../../src/game/systems/hourlyWork';
import { hourlyHours } from '../../src/game/systems/hourlyWorkSchemas';
import { enrollmentReason } from '../../src/game/systems/education';
import { salaryFor, workMonth } from '../../src/game/systems/work';
import { currentWorkplace } from '../../src/game/systems/workplaceSchemas';
import { settleBackground } from '../../src/game/systems/npcBudget';
import { fxMoney } from '../../src/game/valuation';
import { tripQuote } from '../../src/game/systems/travel';
import { pupil } from '../support/pupil';
const ack = (world: World) => world.pending ? resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id }) : world;
/** Isolated unit setup: age, stats/funds/RNG deliberately controlled, not a natural life. */
function applicant(country: CountryCode = 'US', age = 20) {
  const world = pupil(country, age), person = world.people[world.activePersonId]; person.stats.discipline = 0; person.stats.energy = 100; person.education.grades = 80;
  if (age >= rules[country].schoolEnd) person.education.qualifications = [{ level: 'secondary', field: 'general', year: world.date.year - 1 }];
  post(world, rules[country].baseWage * 10n, 0n, 'test-funding', 'Explicit unit funding'); world.random.outcomes = 1; return world;
}
function apply(world: World, hours: typeof hourlyHours[number] = 12, roleId = 'shop-assistant-part') {
  return resolveCommand(world, { type: 'apply-job', roleId, reviewedHourlyTerms: hourlyQuote(world.people[world.activePersonId].country, jobs.find(row => row.id === roleId)!, hours) });
}
function hire(country: CountryCode = 'US', hours: typeof hourlyHours[number] = 12, roleId = 'shop-assistant-part') {
  const world = apply(applicant(country), hours, roleId); return ack(resolveCommand(world, { type: 'choose', eventId: world.pending!.id, choiceId: 'careful' }));
}
function pay(world: World, months = 1) { for (let i = 0; i < months; i++) { world.date = monthFrom(world.date, 1); workMonth(world); } return validateWorld(world); }

test.each(countryCodes.flatMap(country => hourlyHours.map(hours => [country, hours] as const)))('%s %s hours bind exact reviewed terms, pay a full year and retain real time/service without upfront money', (country, hours) => {
  const initial = applicant(country), before = encodeWorld(initial), terms = hourlyQuote(country, jobs[0], hours), pending = apply(initial, hours);
  expect(encodeWorld(initial)).toBe(before); expect(pending.random).toEqual(initial.random); expect(pending.accounts).toEqual(initial.accounts); expect(pending.hourlyContracts).toEqual([]);
  if (pending.pending?.kind !== 'decision') throw new Error('Missing interview');
  for (const choice of pending.pending.choices) expect(choice.effects[0]).toMatchObject({ hourly: terms, annualPay: hourlyAnnual(terms) });
  let world = ack(resolveCommand(decodeWorld(encodeWorld(pending)), { type: 'choose', eventId: pending.pending.id, choiceId: 'careful' })); const job = world.people[world.activePersonId].employment!, cash = accountFor(world).cash;
  expect(world.ledger).toEqual(initial.ledger); expect(job.paidMonths).toBe(0); expect(hourlyContract(world)!.periods).toEqual([]); expect(world.workHistory.at(-1)?.hourlyContractId).toBe(job.id);
  world = pay(world, 12); const contract = hourlyContract(world)!;
  expect(contract.periods.reduce((sum, row) => sum + row.gross, 0n)).toBe(hourlyAnnual(terms));
  expect(contract.periods.reduce((sum, row) => sum + row.paidMinutes, 0)).toBe(hours * 52 * 60); expect(contract.periods.every(row => row.paidMinutes === row.workedMinutes)).toBe(true);
  expect(world.people[world.activePersonId].finance.serviceMonths).toBe(12); expect(accountFor(world).cash - cash).toBe(hourlyAnnual(terms) - incomeTax(hourlyAnnual(terms), rules[country]));
  expect(decodeWorld(encodeWorld(world))).toEqual(world);
});

test.each(countryCodes)('%s cafe uses its actual role rate and JPY/currency rounding without rewriting the annual quote helper', country => {
  const world = hire(country, 8, 'cafe-part'), contract = hourlyContract(world)!, role = jobs[1];
  expect(contract.terms.hourlyRate).toBe(roundRatio(rules[country].baseWage * BigInt(role.wageBps), 10000n * 12n * 52n));
  expect(world.people[world.activePersonId].employment!.annualPay).toBe(contract.terms.hourlyRate * 8n * 52n);
  expect(salaryFor(world, role)).toBe(roundRatio(rules[country].baseWage * BigInt(role.wageBps), 10000n));
});

test('student hours and enrolling around an existing 20-hour contract reject before payment, attempts or draws', () => {
  const student = applicant('US', 16), before = encodeWorld(student);
  expect(() => apply(student, 20)).toThrow(/16 contracted hours/); expect(encodeWorld(student)).toBe(before); expect(apply(student, 12).pending?.kind).toBe('decision');
  const adult = hire('US', 20), original = encodeWorld(adult); expect(enrollmentReason(adult, 'university', 'business')).toMatch(/20-hour/);
  expect(() => resolveCommand(adult, { type: 'enroll', program: 'university', field: 'business', funding: 'cash' })).toThrow(/20-hour/); expect(encodeWorld(adult)).toBe(original);
  expect(enrollmentReason(hire('US', 12), 'university', 'business')).toBeUndefined();
  const stale = applicant(); expect(() => resolveCommand(stale, { type: 'apply-job', roleId: jobs[0].id, reviewedHourlyTerms: { ...hourlyQuote('US', jobs[0]), hourlyRate: 1n } })).toThrow(/quote changed/);
});

test.each(['withdraw', 'declined'] as const)('%s consumes the annual application once without wages, time or rerolled results', outcome => {
  const initial = applicant(); if (outcome === 'declined') initial.random.outcomes = Array.from({ length: 10000 }, (_, i) => i + 1).find(seed => randomInteger(seed, 1, 100).value > 80)!;
  const pending = apply(initial, 8), next = resolveCommand(pending, { type: 'choose', eventId: pending.pending!.id, choiceId: outcome === 'withdraw' ? 'withdraw' : 'avoid' });
  expect(next.hourlyContracts).toEqual([]); expect(next.accounts).toEqual(initial.accounts); expect(next.workHistory).toEqual(initial.workHistory); expect(decodeWorld(encodeWorld(next))).toEqual(next);
  if (outcome === 'withdraw') expect(next.random).toEqual(initial.random);
  expect(() => apply(ack(next), 20)).toThrow(/already applied/);
});

test('hospital half pay adds paid time and service but no worked hours, performance, stress or outcome draw', () => {
  const world = hire(), person = world.people[world.activePersonId], job = person.employment!, before = { performance: job.performance, stress: person.stats.stress, rng: world.random.outcomes };
  person.health.hospitalizedUntil = world.date.year * 12 + world.date.month + 2; pay(world);
  const period = hourlyContract(world)!.periods[0]; expect(period).toMatchObject({ attendance: 'hospital', factorBps: 5000, paidMinutes: 1560, workedMinutes: 0, gross: hourlyPeriodGross(hourlyContract(world)!.terms, 0, 1, 5000) });
  expect(job.performance).toBe(before.performance); expect(person.stats.stress).toBe(before.stress); expect(world.random.outcomes).toBe(before.rng); expect(person.finance.serviceMonths).toBe(1); expect(decodeWorld(encodeWorld(world))).toEqual(world);
});

test.each([false, true])('actual travel paid=%s distinguishes paid time/service from worked time and leaves unused months unpaid', paid => {
  let world = hire(); if (paid) world = pay(world, 12); const person = world.people[world.activePersonId], count = hourlyContract(world)!.periods.length, service = person.finance.serviceMonths, performance = person.employment!.performance;
  world = ack(resolveCommand(world, { type: 'book-trip', destinationId: 'paris', duration: 1, companionIds: [], focus: 'rest', quotedTotal: tripQuote(world, 'paris', 1).total }));
  world = ack(resolveCommand(world, { type: 'advance' })); const contract = hourlyContract(world)!;
  expect(world.people[world.activePersonId].finance.serviceMonths).toBe(service + (paid ? 1 : 0)); expect(contract.periods).toHaveLength(count + (paid ? 1 : 0));
  if (paid) expect(contract.periods.at(-1)).toMatchObject({ attendance: 'paid-leave', paidMinutes: 3120, workedMinutes: 0 });
  expect(world.people[world.activePersonId].employment!.performance).toBe(performance);
});

test('rate-first promotions and raises retain fixed hours and exact prior receipts', () => {
  let world = hire('JP'), person = world.people[world.activePersonId]; person.employment!.performance = 100; person.stats.discipline = 100;
  world = pay(world, 11); person = world.people[world.activePersonId]; person.employment!.performance = 100;
  // The monthly performance draw is followed by the promotion draw.
  world.random.outcomes = Array.from({ length: 10000 }, (_, i) => i + 1).find(seed => randomInteger(randomInteger(seed, -2, 2).state, 1, 100).value <= 35)!;
  const beforeRate = currentHourlyRate(hourlyContract(world)!); world = pay(world); expect(world.people[world.activePersonId].employment!.rank).toBe(1); expect(currentHourlyRate(hourlyContract(world)!)).toBe(roundRatio(beforeRate * 125n, 100n));
  world = ack(resolveCommand(world, { type: 'meet-coworkers' })); const place = currentWorkplace(world)!, supervisor = place.members.find(row => row.role === 'supervisor')!; world.people[world.activePersonId].stats.energy = 100; world.random.outcomes = 1;
  const originalPeriods = structuredClone(hourlyContract(world)!.periods), rate = currentHourlyRate(hourlyContract(world)!);
  world = ack(resolveCommand(world, { type: 'request-raise', workplaceId: place.id, supervisorId: supervisor.personId }));
  expect(currentHourlyRate(hourlyContract(world)!)).toBe(roundRatio(rate * 105n, 100n)); expect(hourlyContract(world)!.periods).toEqual(originalPeriods); expect(world.workRaises.at(-1)!.hourly).toMatchObject({ hourlyRateBefore: rate, hourlyRateAfter: roundRatio(rate * 105n, 100n), weeklyHours: 12 });
  world = pay(world); expect(hourlyContract(world)!.periods.at(-1)!.gross).toBe(monthlyAmount(hourlyAnnual(currentHourlyTerms(hourlyContract(world)!)), 12)); expect(decodeWorld(encodeWorld(world))).toEqual(world);
});

test('an inactive actual hourly employee settles a foreign contract once, preserving fixed earnings currency and historical rates', () => {
  const world = hire('JP'), person = world.people[world.activePersonId], originalId = person.id; person.finance.earningsCurrency = 'USD'; person.finance.lifetimeGross = 0n;
  world.activePersonId = 'person_parent1'; const from = world.date.year * 12 + world.date.month - 1; person.lastEconomicMonth = from; world.date = monthFrom(world.date, 4); settleBackground(world, person, from + 4);
  const history = world.workHistory.find(row => row.personId === originalId)!, contract = world.hourlyContracts[0], reference = history.normalizedGross;
  expect(contract.periods[0]).toMatchObject({ attendance: 'background', periods: 4, workedMinutes: 12480, paidMinutes: 12480 }); expect(history.grossEarned).toBe(hourlyPeriodGross(contract.terms, 0, 4)); expect(reference).toBe(fxMoney(world, { minor: history.grossEarned, currency: 'JPY' }, 'USD').minor);
  const before = encodeWorld(world); settleBackground(world, person, from + 4); expect(encodeWorld(world)).toBe(before); world.market.fx.JPY.numerator *= 2n; expect(history.normalizedGross).toBe(reference); expect(decodeWorld(encodeWorld(world))).toEqual(world);
});

test.each(['missing', 'rate', 'time', 'gross', 'payment', 'marker', 'hours'] as const)('rejects corrupted hourly %s history', change => {
  const world = pay(hire()), contract = hourlyContract(world)!;
  if (change === 'missing') world.hourlyContracts = [];
  if (change === 'rate') contract.terms.hourlyRate++;
  if (change === 'time') contract.periods[0].workedMinutes++;
  if (change === 'gross') contract.periods[0].gross++;
  if (change === 'payment') contract.periods[0].transactionId = 'missing';
  if (change === 'marker') world.workHistory.find(row => row.id === contract.employmentId)!.hourlyContractId = 'wrong';
  if (change === 'hours') contract.terms.weeklyHours = 20;
  expect(() => decodeWorld(encodeWorld(world))).toThrow(/Hourly|hourly|employment/);
});

test('world31 migration preserves a legacy part-time interview and resulting annual contract without inventing earlier hours', () => {
  const world = apply(applicant()), role = jobs[0]; if (world.pending?.kind !== 'decision') throw new Error('Missing interview');
  for (const choice of world.pending.choices) { const effect = choice.effects[0]; if (effect.kind !== 'job-interview') throw new Error('Missing effect'); delete effect.hourly; effect.annualPay = salaryFor(world, role); }
  const encoded = JSON.parse(encodeWorld(world)); encoded.schemaVersion = 31; encoded.engineVersion = 32; encoded.contentVersion = 8; delete encoded.hourlyContracts;
  const next = decodeWorld(JSON.stringify(encoded)); expect(JSON.parse(encodeWorld(next))).toEqual({ ...encoded, schemaVersion: 35, engineVersion: 36, contentVersion: 11, bestFriendships: [], hourlyContracts: [] });
  const hired = ack(resolveCommand(next, { type: 'choose', eventId: next.pending!.id, choiceId: 'careful' })); expect(hired.hourlyContracts).toEqual([]); expect(hired.people[hired.activePersonId].employment!.hourlyContractId).toBeUndefined(); expect(hired.people[hired.activePersonId].employment!.annualPay).toBe(salaryFor(hired, role)); expect(pay(hired).hourlyContracts).toEqual([]);
});

function raiseReady(accepted: boolean) {
  let world = pay(hire(), 12); world = ack(resolveCommand(world, { type: 'meet-coworkers' }));
  const place = currentWorkplace(world)!, supervisor = place.members.find(row => row.role === 'supervisor')!;
  world.people[world.activePersonId].employment!.performance = 100; world.people[world.activePersonId].stats.energy = 100;
  world.random.outcomes = accepted ? 1 : Array.from({ length: 10000 }, (_, i) => i + 1).find(seed => randomInteger(seed, 1, 100).value > 95)!;
  return ack(resolveCommand(world, { type: 'request-raise', workplaceId: place.id, supervisorId: supervisor.personId }));
}

test('a declined raise must still bind the actual contract hours and prior rate', () => {
  const world = raiseReady(false), request = world.workRaises.at(-1)!;
  expect(request.accepted).toBe(false); request.hourly!.weeklyHours = 8;
  request.annualPayBefore = hourlyAnnual({ ...request.hourly!, hourlyRate: request.hourly!.hourlyRateBefore }); request.annualPayAfter = request.annualPayBefore;
  expect(() => validateWorld(world)).toThrow(/Hourly raise/);
});

test('an accepted raise cannot disappear from hourly history after immediate resignation', () => {
  const world = raiseReady(true), quit = resolveCommand(world, { type: 'quit-job' });
  expect(world.workRaises.at(-1)!.accepted).toBe(true); quit.hourlyContracts[0].rates.pop();
  expect(() => validateWorld(quit)).toThrow(/Hourly raise/);
});

test.each(['hourly', 'pension'] as const)('matching pension and hourly payments cannot reuse the same receipt in %s history', target => {
  const world = hire(), person = world.people[world.activePersonId];
  // Explicit financial unit setup to create matching gross receipts, not earned-retirement acceptance.
  person.finance.pensionAnnual = person.employment!.annualPay; pay(world); validateWorld(world);
  const period = hourlyContract(world)!.periods[0], pension = person.finance.pensionReceipts[0]; expect(period.gross).toBe(pension.gross);
  if (target === 'hourly') period.transactionId = pension.grossTransactionId; else pension.grossTransactionId = period.transactionId;
  expect(() => validateWorld(world)).toThrow(/Hourly payment/);
});

test('background hourly settlement cannot invent paid periods before the contract existed', () => {
  const world = hire(), person = world.people[world.activePersonId], from = world.date.year * 12 + world.date.month - 1;
  world.activePersonId = 'person_parent1'; person.lastEconomicMonth = from - 24; world.date = monthFrom(world.date, 2); settleBackground(world, person, from + 2);
  expect(world.hourlyContracts[0].periods[0].periods).toBe(2); expect(person.finance.serviceMonths).toBe(2); expect(world.workHistory.find(row => row.personId === person.id)!.monthsWorked).toBe(2); expect(decodeWorld(encodeWorld(world))).toEqual(world);
});
