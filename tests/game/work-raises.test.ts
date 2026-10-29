import { interviewResult } from '../support/interview';
import { createLife, randomCreation } from '../../src/game/createLife';
import { countryCodes, countries, CountryCode } from '../../src/game/countries';
import { decodeWorld, encodeWorld, validateWorld, World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { monthFrom } from '../../src/game/calendar';
import { jobs } from '../../src/game/content/jobs';
import { randomInteger } from '../../src/game/random';
import { formatMoney, roundRatio } from '../../src/game/money';
import { monthlyAmount } from '../../src/game/rules';
import { employmentMonth, endEmployment, promotedAnnualPay, salaryForPerson } from '../../src/game/systems/work';
import { currentWorkplace } from '../../src/game/systems/workplaceSchemas';
import { refreshWorkplaces, workplaceMonth, workRaiseReason } from '../../src/game/systems/workplaces';
import { relationFor } from '../../src/game/systems/relationships';
import { settleTax } from '../../src/game/systems/finance';

const ack = (w: World) => resolveCommand(w, { type: 'acknowledge', resultId: w.pending!.id }, true);
function employee(country: CountryCode = 'US', periods = 12) {
  let world = createLife('life_raise', 42, { ...randomCreation(42), country, city: countries[country].cities[0] }, { year: 2000, month: 1, day: 1 }); world.birthAcknowledged = true; world.date.year += 22;
  for (let seed = 1; seed < 100; seed++) { world.random.outcomes = seed; const next = interviewResult(resolveCommand(world, { type: 'apply-job', roleId: 'retail' })); if (next.people[next.activePersonId].employment) { world = ack(next); break; } }
  if (!world.people[world.activePersonId].employment) throw new Error('No accepted unit application');
  world = decodeWorld(encodeWorld(ack(resolveCommand(world, { type: 'meet-coworkers' }, true))));
  // Financial units execute real pay periods; no UI/lifetime journey is claimed.
  for (let n = 0; n < periods; n++) { world.date = monthFrom(world.date, 1); workplaceMonth(world); employmentMonth(world); }
  world.people[world.activePersonId].employment!.performance = 80;
  return validateWorld(world);
}
const boss = (world: World) => currentWorkplace(world)!.members.find(item => item.role === 'supervisor' && !item.left)!.personId;
function request(world: World, accepted: boolean) {
  const person = world.people[world.activePersonId], supervisorId = boss(world), trust = relationFor(world, person.id, supervisorId)!.trust;
  const chance = Math.min(90, 20 + Math.floor(person.employment!.performance / 2) + Math.floor(trust / 4));
  world.random.outcomes = Array.from({ length: 1000 }, (_, i) => i + 1).find(seed => (randomInteger(seed, 1, 100).value <= chance) === accepted)!;
  const command = { type: 'request-raise' as const, workplaceId: currentWorkplace(world)!.id, supervisorId };
  const original = encodeWorld(world); return { command, next: resolveCommand(world, command, true), expected: randomInteger(world.random.outcomes, 1, 100), chance, original };
}

test.each(countryCodes)('%s accepts a real salary change with no upfront cash or service, and pays the new rate only in the next period', country => {
  const before = employee(country), person = before.people[before.activePersonId], oldPay = person.employment!.annualPay;
  const { next, command, expected, chance, original } = request(before, true), changed = next.people[next.activePersonId];
  expect(next.pending!.illustration).toBe('person-action:request-raise');expect(next.pending!.body).toContain(formatMoney({minor:changed.employment!.annualPay,currency:changed.employment!.currency}));
  expect(next.pending!.body.match(/[.!?](?=\s|$)/g)).toHaveLength(2);expect(next.pending!.body).toContain('next paid period');
  expect(next.workRaises).toEqual([expect.objectContaining({ workplaceId: command.workplaceId, supervisorId: command.supervisorId, paidMonths: 12, performance: 80, chance, roll: expected.value, accepted: true, annualPayBefore: oldPay, annualPayAfter: roundRatio(oldPay * 105n, 100n), currency: person.employment!.currency })]);
  expect(next.accounts).toEqual(before.accounts); expect(next.ledger).toEqual(before.ledger); expect(changed.finance).toEqual(person.finance); expect(changed.education).toEqual(person.education);
  expect(changed.employment).toEqual({ ...person.employment, annualPay: roundRatio(oldPay * 105n, 100n) }); expect(changed.stats).toEqual({ ...person.stats, energy: person.stats.energy - 6 });
  expect(next.random).toEqual({ ...before.random, outcomes: expected.state }); const ready = ack(next);
  expect(() => resolveCommand(ready, command)).toThrow(/already asked/); expect(ready.workRaises).toHaveLength(1);
  const paid = decodeWorld(encodeWorld(ready)); paid.date = monthFrom(paid.date, 1); const oldRows = paid.ledger.length; employmentMonth(paid);
  expect(paid.ledger.slice(oldRows).find(item => item.category === 'income')!.cashDelta).toBe(monthlyAmount(changed.employment!.annualPay, 12));
  expect(paid.people[paid.activePersonId].employment!.paidMonths).toBe(13); expect(paid.workRaises).toEqual(next.workRaises); validateWorld(paid);
  expect(encodeWorld(before)).toBe(original);
});

test('a declined request costs energy and one draw, retains all pay/history, and remains annual after changing supervisors', () => {
  const world = employee(), { next, command, expected } = request(world, false), person = world.people[world.activePersonId];
  expect(next.pending!.illustration).toBe('person-action:request-raise');expect(next.pending!.body).toContain(formatMoney({minor:person.employment!.annualPay,currency:person.employment!.currency}));
  expect(next.pending!.body).not.toMatch(/budget will not stretch/);expect(next.pending!.body.match(/[.!?](?=\s|$)/g)).toHaveLength(2);
  expect(next.workRaises[0]).toMatchObject({ accepted: false, annualPayBefore: person.employment!.annualPay, annualPayAfter: person.employment!.annualPay });
  expect(next.accounts).toEqual(world.accounts); expect(next.ledger).toEqual(world.ledger); expect(next.workHistory).toEqual(world.workHistory); expect(next.people[next.activePersonId].employment).toEqual(person.employment);
  expect(next.random).toEqual({ ...world.random, outcomes: expected.state }); const ready = decodeWorld(encodeWorld(ack(next)));
  endEmployment(ready, command.supervisorId); workplaceMonth(ready); expect(boss(ready)).not.toBe(command.supervisorId);
  expect(workRaiseReason(ready, currentWorkplace(ready), boss(ready))).toMatch(/already asked/); validateWorld(ready);
});

test('tenure, performance, energy and actual current supervisor gate a request without drawing RNG', () => {
  const world = employee('US', 11), place = currentWorkplace(world)!, supervisorId = boss(world);
  expect(workRaiseReason(world, place, supervisorId)).toMatch(/twelve paid/);
  world.date = monthFrom(world.date, 1); employmentMonth(world); world.people[world.activePersonId].employment!.performance = 64;
  expect(workRaiseReason(world, place, supervisorId)).toMatch(/65%/); world.people[world.activePersonId].employment!.performance = 80; world.people[world.activePersonId].stats.energy = 5;
  expect(workRaiseReason(world, place, supervisorId)).toMatch(/Rest/); world.people[world.activePersonId].stats.energy = 100;
  world.people[supervisorId].health.hospitalizedUntil = world.date.year * 12 + world.date.month + 1;
  const before = encodeWorld(world); expect(() => resolveCommand(world, { type: 'request-raise', workplaceId: place.id, supervisorId })).toThrow(/unavailable/); expect(encodeWorld(world)).toBe(before);
});

test.each(countryCodes)('%s ordinary rank progression retains the existing unraised scale for all eighteen roles', country => {
  const world = employee(country), person = world.people[world.activePersonId];
  for (const role of jobs.filter(item => !item.specialCareer)) for (const rank of [0, 1, 2]) {
    const job = { ...person.employment!, roleId: role.id, rank, annualPay: salaryForPerson(person, role, rank) };
    expect(promotedAnnualPay(job)).toBe(salaryForPerson(person, role, rank + 1));
  }
});

test('an earned raise survives a real later promotion and retained foreign-currency payroll after moving', () => {
  const initial = employee('JP'), accepted = request(initial, true), world = decodeWorld(encodeWorld(ack(accepted.next))), person = world.people[world.activePersonId];
  for (let n = 0; n < 11; n++) { world.date = monthFrom(world.date, 1); employmentMonth(world); }
  settleTax(world, person); person.country = 'ZA'; person.city = 'Johannesburg'; world.accounts.push({ id: 'account_raise_zar', ownerId: person.id, currency: 'ZAR', cash: 0n, openingCash: 0n, lockedCash: 0n }); refreshWorkplaces(world);
  person.employment!.performance = 90; person.stats.stress = 0; const pay = person.employment!.annualPay, rank = person.employment!.rank;
  world.random.outcomes = Array.from({ length: 1000 }, (_, i) => i + 1).find(seed => randomInteger(randomInteger(seed, -2, 2).state, 1, 100).value <= 35)!;
  world.date = monthFrom(world.date, 1); employmentMonth(world);
  expect(person.employment).toMatchObject({ rank: rank + 1, currency: 'JPY', annualPay: roundRatio(pay * BigInt(100 + (rank + 1) * 25), BigInt(100 + rank * 25)) });
  expect(person.employment!.annualPay).toBeGreaterThan(pay); expect(workRaiseReason(world, currentWorkplace(world), boss(initial))).toMatch(/based elsewhere/); validateWorld(world);
});

test.each(['supervisor', 'contract', 'pay', 'chance', 'roll', 'duplicate', 'current pay cut'] as const)('imports reject contradictory raise %s', field => {
  const world = decodeWorld(encodeWorld(ack(request(employee(), true).next))), record = world.workRaises[0];
  if (field === 'supervisor') record.supervisorId = world.activePersonId;
  if (field === 'contract') record.employmentId = world.workplaces[0].members[0].employmentId;
  if (field === 'pay') record.annualPayAfter += 1n;
  if (field === 'chance') record.chance -= 1;
  if (field === 'roll') record.roll = 100;
  if (field === 'duplicate') world.workRaises.push({ ...record, id: record.id + '_duplicate' });
  if (field === 'current pay cut') world.people[world.activePersonId].employment!.annualPay = record.annualPayBefore;
  expect(() => decodeWorld(encodeWorld(world))).toThrow(/raise/);
});
