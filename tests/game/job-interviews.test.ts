import { createLife, randomCreation } from '../../src/game/createLife';
import { resolveCommand } from '../../src/game/engine';
import { countries, countryCodes, CountryCode } from '../../src/game/countries';
import { decodeWorld, encodeWorld, validateWorld, World } from '../../src/game/model';
import { jobs } from '../../src/game/content/jobs';
import { jobInterviews } from '../../src/game/content/jobInterviews';
import { randomInteger } from '../../src/game/random';
import { rules } from '../../src/game/rules';
import { hourlyAnnual, hourlyQuote } from '../../src/game/systems/hourlyWork';
import { jobReason, salaryFor } from '../../src/game/systems/work';
import { interviewResult } from '../support/interview';
import { employee } from '../support/employee';

function applicant(country: CountryCode = 'US') {
  const world = createLife('life_interview', 42, { ...randomCreation(42), country, city: countries[country].cities[0] }, { year: 2000, month: 1, day: 1 });
  world.birthAcknowledged = true; world.date.year += 30;
  const p = world.people[world.activePersonId]; p.stats.smarts = 90; p.stats.respect = 60; p.stats.discipline = 60; p.stats.fame = 0;
  p.education.qualifications = [{ level: 'secondary', field: 'general', year: 2018 }, { level: 'trade', field: 'science', year: 2020 }, { level: 'degree', field: 'computing', year: 2022 }, { level: 'degree', field: 'arts', year: 2022 }, { level: 'degree', field: 'business', year: 2022 }, { level: 'degree', field: 'science', year: 2022 }, { level: 'medicine', field: 'medicine', year: 2025 }, { level: 'law', field: 'law', year: 2025 }];
  return world;
}
const apply = (world: World, roleId = 'retail') => resolveCommand(world, { type: 'apply-job', roleId }, true);
const ack = (world: World) => resolveCommand(world, { type: 'acknowledge', resultId: world.pending!.id });

// Experience-gated senior roles have their receipt-backed fixture in ordinary-jobs.test.ts.
test.each(jobs.filter(role => !role.specialCareer && !role.experienceMonths))('$id binds its actual duties, question, employer and exact pay without drawing, hiring or paying', role => {
  const world = applicant(), original = encodeWorld(world), next = apply(world, role.id);
  expect(next.pending).toMatchObject({ kind: 'decision', templateId: 'job-interview', title: role.title + ' interview', personIds: [world.activePersonId] });
  if (next.pending?.kind !== 'decision') throw new Error('Missing interview');
  expect(next.pending.body).toContain(jobInterviews[role.id].question);
  expect(next.pending.choices).toHaveLength(4);
  for (const choice of next.pending.choices) expect(choice.effects).toEqual([{ kind: 'job-interview', personId: world.activePersonId, roleId: role.id, employer: world.people[world.activePersonId].city + ' ' + role.sector, annualPay: role.partTime ? hourlyAnnual(hourlyQuote(world.people[world.activePersonId].country, role)) : salaryFor(world, role), ...(role.partTime ? { hourly: hourlyQuote(world.people[world.activePersonId].country, role) } : {}), experience: { policyVersion: 1, paidMonths: 0, bonus: 0, chance: choice.id === 'withdraw' ? null : ({ careful: 85, rush: 65, avoid: 55 } as Record<string, number>)[choice.id] }, copyVersion: 18, answerId: choice.id }]);
  expect(next.random).toEqual(world.random); expect(next.people).toEqual(world.people); expect(next.accounts).toEqual(world.accounts); expect(next.ledger).toEqual(world.ledger); expect(next.workHistory).toEqual(world.workHistory);
  expect(jobReason(next, role)).toMatch(/already applied/); expect(encodeWorld(world)).toBe(original); expect(decodeWorld(encodeWorld(next))).toEqual(next);
});

test.each(countryCodes)('%s hires only after the answer, creates one local contract and pays no upfront salary', country => {
  const world = applicant(country); world.random.outcomes = 1;
  const next = interviewResult(apply(world)); const job = next.people[next.activePersonId].employment!;
  expect(next.pending).toMatchObject({ kind: 'result', title: 'You got the job' });
  expect(job).toMatchObject({ roleId: 'retail', annualPay: salaryFor(world, jobs.find(j => j.id === 'retail')!), currency: countries[country].currency, paidMonths: 0, performance: 55 });
  expect(next.accounts).toEqual(world.accounts); expect(next.ledger).toEqual(world.ledger); expect(next.people[next.activePersonId].finance).toEqual(world.people[world.activePersonId].finance);
  expect(next.workHistory).toHaveLength(world.workHistory.length + 1); expect(next.workHistory.at(-1)).toMatchObject({ monthsWorked: 0, grossEarned: 0n, started: world.date });
  expect(next.random).toEqual({ ...world.random, outcomes: randomInteger(1, 1, 100).state });
  const ready = ack(next); expect(() => interviewResult(ready)).toThrow(); expect(() => resolveCommand(ready, { type: 'choose', eventId: 'interview_0', choiceId: 'careful' })).toThrow(/no longer open/);
});

test('the same interview draw can accept a responsible answer and decline a shortcut; failure retains the current contract and team', () => {
  const world = employee('US'), p = world.people[world.activePersonId]; p.stats.smarts = 90; p.stats.respect = 60; p.stats.discipline = 60; p.stats.fame = 0;
  // Base chance 75: responsible answer 85, shortcut 65.
  world.random.outcomes = Array.from({ length: 10000 }, (_, i) => i + 1).find(seed => randomInteger(seed, 1, 100).value > 65 && randomInteger(seed, 1, 100).value <= 85)!;
  const pending = apply(world, 'cleaner'), hired = interviewResult(pending, 'careful'), declined = interviewResult(pending, 'rush');
  expect(hired.pending).toMatchObject({ title: 'You got the job' }); expect(hired.people[p.id].employment?.roleId).toBe('cleaner'); expect(hired.workHistory.find(item => item.id === p.employment!.id)?.ended).toEqual(world.date);
  expect(declined.pending).toMatchObject({ title: 'They chose another applicant' }); expect(declined.people).toEqual(world.people); expect(declined.workplaces).toEqual(world.workplaces); expect(declined.workHistory).toEqual(world.workHistory);
  expect(hired.random).toEqual(declined.random); expect(hired.accounts).toEqual(world.accounts); expect(declined.accounts).toEqual(world.accounts);
});

test('withdrawal preserves existing work and RNG and spends only this year’s application', () => {
  const world = employee(), pending = apply(world, 'cleaner'), withdrawn = interviewResult(decodeWorld(encodeWorld(pending)), 'withdraw'), ready = ack(withdrawn);
  expect(withdrawn.pending).toMatchObject({ title: 'Application withdrawn' }); expect(withdrawn.people).toEqual(world.people); expect(withdrawn.workplaces).toEqual(world.workplaces); expect(withdrawn.random).toEqual(world.random); expect(withdrawn.accounts).toEqual(world.accounts);
  expect(() => apply(ready, 'cleaner')).toThrow(/already applied/); ready.date.year++; expect(jobReason(ready, jobs.find(item => item.id === 'cleaner')!)).toBeUndefined();
});

test.each(['pay', 'person', 'role', 'employer', 'answer', 'duplicate', 'extra-effect', 'missing-attempt'] as const)('a corrupted bound interview with changed %s is rejected', change => {
  const world = decodeWorld(encodeWorld(apply(applicant()))); if (world.pending?.kind !== 'decision') throw new Error('Missing interview');
  const effect = world.pending.choices[0].effects[0]; if (effect.kind !== 'job-interview') throw new Error('Missing effect');
  if (change === 'pay') effect.annualPay++;
  if (change === 'person') effect.personId = 'person_parent1';
  if (change === 'role') effect.roleId = 'doctor';
  if (change === 'employer') effect.employer = 'Another employer';
  if (change === 'answer') world.pending.choices[0].id = 'rush';
  if (change === 'duplicate') world.pending.choices[1].effects = [...world.pending.choices[0].effects];
  if (change === 'extra-effect') world.pending.choices[0].effects.push({ kind: 'stat', personId: world.activePersonId, stat: 'fame', delta: 10 });
  if (change === 'missing-attempt') world.actionCounts = {};
  expect(() => validateWorld(world)).toThrow(/interview|Duplicate/);
});

test('country part-time ages still gate interviews and full-time work still requires finishing school', () => {
  for (const country of countryCodes) { const world = applicant(country), role = jobs.find(item => item.id === 'shop-assistant-part')!; world.date.year = world.people[world.activePersonId].born.year + rules[country].partTimeAge - 1; expect(() => apply(world, role.id)).toThrow(/age/); world.date.year++; expect(apply(world, role.id).pending?.kind).toBe('decision'); }
  const world = applicant(); world.people[world.activePersonId].education.stage = 'secondary'; expect(() => apply(world)).toThrow(/studying/);
});

test('an arranged engine-29/content-6 envelope upgrades its versions, preserving employment, people, money and RNG', () => {
  const world = employee(), encoded = JSON.parse(encodeWorld(world)); encoded.schemaVersion = 30; encoded.engineVersion = 29; encoded.contentVersion = 6; delete encoded.hobbyEvents; const restored = decodeWorld(JSON.stringify(encoded));
  expect(JSON.parse(encodeWorld(restored))).toEqual({ ...encoded, schemaVersion: 46, engineVersion: 48, contentVersion: 25, miniGames: [], personSupportRequests: [], personActionHistory: [], rentalLeases: [], campusCommunities: [], bestFriendships: [], teenRelationships: [], universityApplications: [], studyCourses: [], npcSeparations: [], npcMoves: [], hobbyEvents: [], hourlyContracts: [] });
});


test.each(['hired', 'rejected'] as const)('content-18 interview copy preserves an unmarked saved %s result and all actual consequences', outcome => {
  const initial = applicant();
  let seed = 0;
  while ((randomInteger(seed, 1, 100).value <= 85) !== (outcome === 'hired')) seed++;
  initial.random.outcomes = seed;
  const current = apply(initial), legacy = decodeWorld(encodeWorld(current));
  if (current.pending?.kind !== 'decision' || legacy.pending?.kind !== 'decision') throw new Error('Expected actual interviews');
  for (const choice of legacy.pending.choices) for (const effect of choice.effects) if (effect.kind === 'job-interview') delete effect.copyVersion;
  const selected = { type: 'choose' as const, eventId: current.pending.id, choiceId: 'careful' };
  const next = resolveCommand(current, selected, true), old = resolveCommand(decodeWorld(encodeWorld(legacy)), selected, true);
  if (next.pending?.kind !== 'result' || old.pending?.kind !== 'result') throw new Error('Expected interview results');
  expect(next.pending.body).toContain(outcome === 'hired' ? 'new reason to set an alarm' : 'a year to think of a better answer');
  expect(old.pending.body).toContain(outcome === 'hired' ? 'Pay starts as months pass' : 'The application was unsuccessful');
  expect({ ...next, pending: { ...next.pending, body: old.pending.body } }).toEqual(old);
  expect(next.random).toEqual({ ...current.random, outcomes: randomInteger(seed, 1, 100).state });
  expect(decodeWorld(encodeWorld(old)).pending).toEqual(old.pending);
});
