import { createLife, randomCreation } from '../../src/game/createLife';
import { countryCodes, countries, CountryCode } from '../../src/game/countries';
import { resolveCommand } from '../../src/game/engine';
import { decodeWorld, encodeWorld, validateWorld, World } from '../../src/game/model';
import { incomeTax, monthlyAmount, rules } from '../../src/game/rules';
import { educationMonth } from '../../src/game/systems/education';
import { newEducation } from '../../src/game/systems/schemas';
import { accountFor } from '../../src/game/systems/common';
import { workMonth, salaryFor } from '../../src/game/systems/work';
import { jobs } from '../../src/game/content/jobs';
import { financeMonth, cashNetWorth, settleTax } from '../../src/game/systems/finance';

function fixture(country: CountryCode = 'US'): World {
  const input = randomCreation(42);
  const world = createLife('life_systems', 42, { ...input, country, city: countries[country].cities[0] }, { year: 2000, month: 1, day: 1 });
  world.date = { year: 2026, month: 1, day: 1 }; world.birthAcknowledged = true;
  const person = world.people[world.activePersonId]; person.stats.smarts = 90; person.stats.health = 100; person.stats.discipline = 70;
  person.education.qualifications = [{ level: 'secondary', field: 'general', year: 2018 }]; person.education.grades = 90;
  return world;
}
function acknowledge(world: World): World {
  if (world.pending?.kind !== 'result') throw new Error('Expected a result');
  return resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
}
function funded(world: World, amount: bigint) {
  const account = accountFor(world); account.cash = amount; account.openingCash = amount;
}
function employ(world: World, annualPay = rules.US.baseWage) {
  const person = world.people[world.activePersonId];
  person.employment = { id: 'employment_test', roleId: 'retail', employer: 'Local Retail', rank: 0, annualPay, paidMonths: 0, performance: 60, effort: 'balanced' };
  world.workHistory.push({ id: 'employment_test', personId: person.id, roleId: 'retail', employer: 'Local Retail', started: { ...world.date }, ended: null, monthsWorked: 0, grossEarned: 0n });
}

test.each(countryCodes)('%s has exact local money, marginal tax and non-negative financed living costs', country => {
  const world = fixture(country); const rule = rules[country]; const account = accountFor(world);
  expect(account.currency).toBe(countries[country].currency);
  expect(Array.from({ length: 12 }, (_, month) => monthlyAmount(rule.baseWage + 7n, month)).reduce((sum, value) => sum + value, 0n)).toBe(rule.baseWage + 7n);
  for (const band of rule.taxBands) {
    const before = incomeTax(band.above, rule), after = incomeTax(band.above + 1n, rule);
    expect(after >= before && after - before <= 1n).toBe(true);
  }
  financeMonth(world);
  expect(account.cash).toBe(0n);
  expect(world.liabilities.find(debt => debt.kind === 'living')?.principal).toBe(rule.livingCost);
  expect(cashNetWorth(world)).toBe(-rule.livingCost);
  expect(validateWorld(world)).toEqual(world);
});

test('borrowing and repayment conserve cash less debt and cannot exceed the actual balance or principal', () => {
  let world = fixture();
  const person = world.people[world.activePersonId];
  employ(world);
  world = acknowledge(resolveCommand(world, { type: 'borrow', amount: 100000n }));
  expect(cashNetWorth(world)).toBe(0n);
  const debt = world.liabilities[0];
  expect(() => resolveCommand(world, { type: 'repay', liabilityId: debt.id, amount: 100001n })).toThrow(/exceeds/);
  world = acknowledge(resolveCommand(world, { type: 'repay', liabilityId: debt.id, amount: 40000n }));
  expect(accountFor(world).cash).toBe(60000n); expect(world.liabilities[0].principal).toBe(60000n);
  expect(cashNetWorth(world)).toBe(0n);
  expect(() => validateWorld({ ...world, accounts: world.accounts.map((account, i) => i === 0 ? { ...account, cash: account.cash + 1n } : account) })).toThrow(/reconcile/);
});

test('a partial year pays exactly the worked months and refunds excess tax after resignation', () => {
  let world = fixture(); const person = world.people[world.activePersonId]; const annualPay = 6000007n;
  employ(world, annualPay);
  for (let month = 0; month < 6; month++) workMonth(world);
  const gross = person.finance.cycleGross;
  expect(gross).toBe(3000004n);
  world = acknowledge(resolveCommand(world, { type: 'quit-job' }));
  for (let month = 0; month < 6; month++) workMonth(world);
  settleTax(world);
  expect(accountFor(world).cash).toBe(gross - incomeTax(gross, rules.US));
  expect(world.people[world.activePersonId].finance.serviceMonths).toBe(6);
  expect(validateWorld(decodeWorld(encodeWorld(world)))).toEqual(world);
});

test('qualification, study and hiring gates cannot be bypassed by direct commands', () => {
  const world = fixture();
  expect(() => resolveCommand(world, { type: 'apply-job', roleId: 'doctor' })).toThrow(/medicine/);
  expect(() => resolveCommand(world, { type: 'enroll', program: 'graduate', field: 'medicine', funding: 'loan' })).toThrow(/degree/);
  world.people[world.activePersonId].education = newEducation();
  expect(() => resolveCommand(world, { type: 'enroll', program: 'university', field: 'computing', funding: 'loan' })).toThrow(/secondary/);
  expect(() => resolveCommand(world, { type: 'study' })).toThrow(/active course/);
  const employed = fixture(); employ(employed);
  expect(() => resolveCommand(employed, { type: 'enroll', program: 'university', field: 'computing', funding: 'loan' })).toThrow(/Resign/);
});

test('school progression starts locally and awards secondary qualifications at the configured completion age', () => {
  for (const code of countryCodes) {
    const world = fixture(code); const person = world.people[world.activePersonId]; person.education = newEducation();
    world.date.year = person.born.year + rules[code].schoolStart;
    educationMonth(world, person); expect(person.education.stage).toBe('primary');
    world.date.year = person.born.year + rules[code].secondaryStart;
    educationMonth(world, person); expect(person.education.stage).toBe('secondary');
    world.date.year = person.born.year + rules[code].schoolEnd;
    educationMonth(world, person); expect(person.education.qualifications.some(q => q.level === 'secondary')).toBe(true);
  }
});

test('tuition funding pauses preserve progress and resuming never charges the same year twice', () => {
  let world = fixture(); const person = world.people[world.activePersonId]; const tuition = rules.US.universityTuition;
  person.education = { ...person.education, stage: 'university', field: 'computing', school: 'City University', months: 12, requiredMonths: 48, tuitionPaidMonths: 12, tuition, funding: 'cash' };
  educationMonth(world, person); expect(person.education.paused).toBe(true); expect(person.education.months).toBe(12);
  funded(world, tuition);
  world = acknowledge(resolveCommand(world, { type: 'fund-studies', funding: 'cash' }));
  const resumed = world.people[world.activePersonId]; educationMonth(world, resumed);
  expect(resumed.education.months).toBe(13); expect(resumed.education.paused).toBe(false); expect(accountFor(world).cash).toBe(0n);
  expect(world.ledger.filter(entry => entry.category === 'tuition')).toHaveLength(1);
  validateWorld(world);
});

test('a complete funded course costs exactly its four tuition years and unlocks a qualified job', () => {
  const world = fixture(); const person = world.people[world.activePersonId]; const tuition = rules.US.universityTuition;
  person.education = { ...person.education, stage: 'university', field: 'computing', school: 'City University', months: 0, requiredMonths: 48, tuitionPaidMonths: 0, tuition, funding: 'loan' };
  for (let month = 0; month < 48; month++) educationMonth(world, person);
  expect(person.education.qualifications.some(q => q.level === 'degree' && q.field === 'computing')).toBe(true);
  expect(world.ledger.filter(entry => entry.category === 'tuition')).toHaveLength(4);
  expect(world.liabilities.find(debt => debt.kind === 'student')?.principal).toBe(tuition * 4n);
  expect(salaryFor(world, jobs.find(job => job.id === 'developer')!)).toBe(7200000n);
  validateWorld(world);
});

test('one connected life earns school and university qualifications, finds work and receives actual pay', () => {
  const input = randomCreation(16);
  let world = createLife('life_connected', 16, { ...input, country: 'US', city: countries.US.cities[0] }, { year: 2000, month: 1, day: 1 });
  world.birthAcknowledged = true;
  world.people[world.activePersonId].stats.smarts = 90; world.people[world.activePersonId].stats.discipline = 80;
  const year = () => {
    world = resolveCommand(world, { type: 'advance' });
    if (world.pending?.kind === 'decision') world = resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: world.pending.choices[0].id });
    if (world.pending?.kind === 'result') world = acknowledge(world);
  };
  while (world.date.year < 2018) year();
  expect(world.people[world.activePersonId].education.qualifications.some(q => q.level === 'secondary')).toBe(true);
  for (let attempt = 0; attempt < 5 && world.people[world.activePersonId].education.stage === 'none'; attempt++) {
    world = acknowledge(resolveCommand(world, { type: 'enroll', program: 'university', field: 'computing', funding: 'loan' }));
    if (world.people[world.activePersonId].education.stage === 'none') year();
  }
  expect(world.people[world.activePersonId].education.stage).toBe('university');
  world = acknowledge(resolveCommand(world, { type: 'study-effort', effort: 'focused' }));
  for (let i = 0; i < 4; i++) year();
  expect(world.people[world.activePersonId].education.qualifications.some(q => q.level === 'degree' && q.field === 'computing')).toBe(true);
  for (let attempt = 0; attempt < 5 && !world.people[world.activePersonId].employment; attempt++) {
    world = acknowledge(resolveCommand(world, { type: 'apply-job', roleId: 'developer' }));
    if (!world.people[world.activePersonId].employment) year();
  }
  expect(world.people[world.activePersonId].employment?.roleId).toBe('developer');
  const grossBefore = world.people[world.activePersonId].finance.lifetimeGross;
  year();
  expect(world.people[world.activePersonId].finance.lifetimeGross).toBeGreaterThan(grossBefore);
  expect(world.ledger.some(entry => entry.category === 'income' && entry.cashDelta > 0n)).toBe(true);
  expect(decodeWorld(encodeWorld(world))).toEqual(world);
});
