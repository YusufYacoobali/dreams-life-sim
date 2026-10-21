import { createLife, randomCreation } from '../../src/game/createLife';
import { countryCodes, countries } from '../../src/game/countries';
import { decodeWorld, encodeWorld, validateWorld, World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { accountFor, post } from '../../src/game/systems/common';
import { addCondition, consultationCost, emergencyCare, healthFinanceMonth, healthMonth, medicalQuote, providerFor, treatmentCost } from '../../src/game/systems/health';
import { educationMonth } from '../../src/game/systems/education';
import { endEmployment, workMonth } from '../../src/game/systems/work';
import { randomInteger } from '../../src/game/random';
import { monthlyAmount } from '../../src/game/rules';
import { monthFrom } from '../../src/game/calendar';
import graduateFixture from '../fixtures/v3-employed-graduate.json';
import historyFixture from '../fixtures/v7-history-archive.json';
import { decodeSave } from '../../src/persistence/archive';
import { addChild } from '../../src/game/systems/family';
import { createContact } from '../../src/game/systems/npcs';
function fixture() { const world = decodeWorld(JSON.stringify(graduateFixture)); const account = accountFor(world); account.cash += 10000000n; account.openingCash += 10000000n; return world; }
function ack(world: World) { if (world.pending?.kind !== 'result') throw new Error('Expected result'); return resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id }); }
function rollState(min: number, max = 100) { for (let state = 0; state < 10000; state++) { const value = randomInteger(state, 1, 100).value; if (value >= min && value <= max) return state; } throw new Error('No test state'); }
test('a genuine v7 branch archive migrates its live checkpoint and compressed history without inventing prior illnesses', () => {
  const archive = decodeSave(JSON.stringify(historyFixture)), world = archive.world;
  expect(world.schemaVersion).toBe(39); expect(world.annual?.monthsProcessed).toBe(9); expect(world.pending?.kind === 'result' && world.pending.title).toBe('Welcome, little one');
  expect(archive.branch?.snapshotId).toBe(archive.snapshots[0].summary.id);
  for (const person of Object.values(world.people)) expect(person.health.conditions).toEqual([]);
  expect(decodeWorld(encodeWorld(world))).toEqual(world);
});
test('a real qualified clinician persists, receives an actual fee and never cures an illness just by being visited', () => {
  let world = fixture(); const player = world.people[world.activePersonId], condition = addCondition(world, player, 'asthma', 45), provider = providerFor(world, player);
  const before = accountFor(world).cash, professional = accountFor(world, provider).cash, health = player.stats.health; world.random.outcomes = rollState(1, 50);
  const cost = consultationCost(world, 'tests'); world = ack(resolveCommand(world, { type: 'consult', service: 'tests' }));
  const patient = world.people[world.activePersonId]; expect(patient.health.conditions.find(item => item.id === condition.id)!.diagnosed).toEqual(world.date);
  expect(patient.stats.health).toBe(health); expect(accountFor(world).cash).toBe(before - cost); expect(accountFor(world, world.people[provider.id]).cash).toBe(professional + cost);
  expect(world.people[provider.id].employment?.roleId).toBe('doctor'); expect(world.people[provider.id].education.qualifications.some(item => item.level === 'medicine')).toBe(true);
  expect(decodeWorld(encodeWorld(world)).people[patient.id].health.providerId).toBe(provider.id);
  expect(() => resolveCommand(world, { type: 'consult', service: 'tests' })).toThrow(/already tried/);
});
test('a missed diagnosis and treatment response stay fixed after save/reload', () => {
  let world = fixture(); const condition = addCondition(world, world.people[world.activePersonId], 'asthma', 45); providerFor(world, world.people[world.activePersonId]);
  world.random.outcomes = rollState(99); world = resolveCommand(world, { type: 'consult', service: 'checkup' });
  expect(world.people[world.activePersonId].health.conditions[0].diagnosed).toBeNull(); const saved = decodeWorld(encodeWorld(world)); expect(saved.pending).toEqual(world.pending);
  world = ack(saved); world.random.outcomes = rollState(1, 50); world = ack(resolveCommand(world, { type: 'consult', service: 'specialist' }));
  const before = world.people[world.activePersonId].health.conditions[0].severity, start = world;
  world = resolveCommand(world, { type: 'treat', conditionId: condition.id }); expect(resolveCommand(start, { type: 'treat', conditionId: condition.id })).toEqual(world);
  expect(world.people[world.activePersonId].health.conditions[0].severity).toBe(before); expect(decodeWorld(encodeWorld(world)).people[world.activePersonId].health.conditions[0].treatment).toEqual(world.people[world.activePersonId].health.conditions[0].treatment);
});
test('treatment progresses by month, funding can pause it, and visits cannot be tapped for instant recovery', () => {
  let world = fixture(); const person = world.people[world.activePersonId], condition = addCondition(world, person, 'asthma', 45); condition.diagnosed = { ...world.date }; providerFor(world, person); world.random.outcomes = rollState(1, 50);
  world = ack(resolveCommand(world, { type: 'treat', conditionId: condition.id })); const patient = world.people[world.activePersonId], treated = patient.health.conditions[0];
  expect(() => resolveCommand(world, { type: 'treat', conditionId: condition.id })).toThrow(/already active/);
  const start = { ...world.date }; world.date = monthFrom(start, 1, start.day); healthMonth(world); const severity = treated.severity;
  healthMonth(world); expect(treated.severity).toBe(severity); expect(treated.treatment?.months).toBe(1);
  post(world, -accountFor(world).cash, 0n, 'fixture-spending', 'Test empty treatment budget'); healthFinanceMonth(world);
  expect(treated.treatment).toBeNull(); expect(treated.status).toBe('active'); expect(patient.health.records.some(item => item.kind === 'funding-pause')).toBe(true); validateWorld(world);
});
test('a child consultation is paid by a real caregiver, with the receipt bound to that payer', () => {
  let world = createLife('life_child_care', 42, randomCreation(42), { year: 2020, month: 1, day: 18 }); world.birthAcknowledged = true; world.date.year = 2026;
  const child = world.people[world.activePersonId], quote = medicalQuote(world, consultationCost(world, 'symptoms')), before = accountFor(world, quote.payer).cash;
  expect(quote.payer.id).not.toBe(child.id); world = ack(resolveCommand(world, { type: 'consult', service: 'symptoms' }));
  expect(accountFor(world).cash).toBe(0n); expect(accountFor(world, world.people[quote.payer.id]).cash).toBe(before - quote.amount); expect(world.people[child.id].health.records.at(-1)!.payerId).toBe(quote.payer.id); validateWorld(world);
});
test('an emergency interrupts a real year, and a fatal care outcome has priority over its result popup', () => {
  let world = fixture(); const patient = world.people[world.activePersonId]; patient.stats.health = 2; addCondition(world, patient, 'asthma', 95);
  world = resolveCommand(world, { type: 'advance' }); expect(world.pending?.kind === 'decision' && world.pending.templateId).toBe('medical-emergency'); expect(world.annual?.monthsProcessed).toBe(1);
  if (world.pending?.kind !== 'decision') throw new Error('Expected emergency'); world.random.outcomes = rollState(99);
  const restored = decodeWorld(encodeWorld(world)); world = resolveCommand(restored, { type: 'choose', eventId: restored.pending!.id, choiceId: 'care' });
  expect(world.people[world.activePersonId].died).not.toBeNull(); expect(world.pending).toBeNull(); expect(world.annual).toBeNull(); expect(world.estates).toHaveLength(1); validateWorld(world);
});
test('a two-month hospital stay pays only the defined half-rate periods and pauses course progress', () => {
  const world = fixture(), patient = world.people[world.activePersonId], condition = addCondition(world, patient, 'asthma', 80); patient.stats.health = 50; world.random.outcomes = rollState(1, 50);
  emergencyCare(world, patient.id, condition.id, true); const initialMonths = patient.employment!.paidMonths, annual = patient.employment!.annualPay, initialGross = patient.finance.lifetimeGross;
  const start = { ...world.date }; let expected = 0n;
  for (let index = 1; index <= 3; index++) { world.date = monthFrom(start, index, start.day); const amount = monthlyAmount(annual, initialMonths + index - 1); expected += index <= 2 ? amount / 2n : amount; workMonth(world, patient); healthFinanceMonth(world); }
  expect(patient.finance.lifetimeGross - initialGross).toBe(expected); expect(patient.health.hospitalizedUntil).toBeNull(); validateWorld(world);
  const school = fixture(), student = school.people[school.activePersonId]; endEmployment(school, student.id);
  student.education.stage = 'university'; student.education.months = 0; student.education.requiredMonths = 48; student.education.tuition = 0n;
  const injury = addCondition(school, student, 'fracture', 80); school.random.outcomes = rollState(1, 50); emergencyCare(school, student.id, injury.id, true);
  for (let index = 1; index <= 3; index++) { school.date = monthFrom(start, index, start.day); educationMonth(school, student); healthFinanceMonth(school); }
  expect(student.education.months).toBe(1); validateWorld(school);
});
test('routines and vaccines have dated effects, preserve money, and respect local habit ages', () => {
  let world = fixture(), patient = world.people[world.activePersonId];
  expect(() => resolveCommand(world, { type: 'health-routine', routine: { ...patient.health.routine, smoking: true } })).not.toThrow();
  world = ack(resolveCommand(world, { type: 'vaccinate', vaccine: 'seasonal' })); expect(world.people[world.activePersonId].health.vaccinations[0].expiresMonth).toBe(world.date.year * 12 + world.date.month - 1 + 12);
  expect(() => resolveCommand(world, { type: 'vaccinate', vaccine: 'seasonal' })).toThrow(/still current/);
  const baby = createLife('life_habit_age', 42, { ...randomCreation(42), country: 'US', city: countries.US.cities[0] }, { year: 2006, month: 1, day: 18 }); baby.birthAcknowledged = true; baby.date.year = 2026;
  expect(() => resolveCommand(baby, { type: 'health-routine', routine: { ...baby.people[baby.activePersonId].health.routine, drinking: 'moderate' } })).toThrow(/restricted/);
});
test('biological family history changes inherited risk without inventing an illness, while adoption preserves independent health', () => {
  const world = fixture(), parent = world.people[world.activePersonId], other = createContact(world, { age: 24 }); addCondition(world, parent, 'asthma', 45);
  const biological = addChild(world, [parent, other], 'biological'), adopted = addChild(world, [parent, other], 'adoptive', 2);
  expect(biological.health.familyRisks).toContain('asthma'); expect(biological.health.conditions).toEqual([]); expect(adopted.health.familyRisks).toEqual([]); validateWorld(world);
});
test('a saved emergency honours its stored quoted bill when it differs from the current programme price', () => {
  let world = fixture(); addCondition(world, world.people[world.activePersonId], 'asthma', 80); world = resolveCommand(world, { type: 'advance' });
  if (world.pending?.kind !== 'decision' || world.pending.templateId !== 'medical-emergency') throw new Error('Expected emergency');
  const effect = world.pending.choices[0].effects[0]; if (effect.kind !== 'emergency-care') throw new Error('Expected medical terms');
  effect.quotedCost = 41000n; world.pending.body = 'The saved hospital assessment quote is $410.'; const balance = accountFor(world).cash; world.random.outcomes = rollState(1, 50);
  world = decodeWorld(encodeWorld(world)); world = resolveCommand(world, { type: 'choose', eventId: world.pending!.id, choiceId: 'care' });
  expect(accountFor(world).cash).toBe(balance - 41000n); expect(world.people[world.activePersonId].health.conditions[0].treatment!.paid).toBe(41000n); validateWorld(world);
});
test.each(countryCodes)('%s uses its actual local visit price and currency rather than a universal dollar charge', code => {
  let world = createLife('life_care_' + code, 12, { ...randomCreation(12), country: code, city: countries[code].cities[0] }, { year: 2020, month: 1, day: 18 }); world.birthAcknowledged = true; world.date.year = 2026;
  const cost = consultationCost(world, 'tests'), quote = medicalQuote(world, cost), before = accountFor(world, quote.payer).cash;
  world = ack(resolveCommand(world, { type: 'consult', service: 'tests' })); expect(accountFor(world, world.people[quote.payer.id]).cash).toBe(before - quote.amount);
  const receipt = world.people[world.activePersonId].health.records.at(-1)!; expect(receipt.currency).toBe(countries[code].currency); expect(receipt.cost).toBe(cost); validateWorld(world);
});
