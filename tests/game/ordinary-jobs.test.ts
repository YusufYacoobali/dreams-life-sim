import { jobs, npcBackgroundRoleIds } from '../../src/game/content/jobs';
import { jobInterviews } from '../../src/game/content/jobInterviews';
import { resolveCommand } from '../../src/game/engine';
import { copyWorld, decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { countryCodes } from '../../src/game/countries';
import { rules } from '../../src/game/rules';
import { monthFrom } from '../../src/game/calendar';
import { roundRatio } from '../../src/game/money';
import { jobReason, salaryFor, workMonth } from '../../src/game/systems/work';
import { hourlyAnnual, hourlyContract, hourlyQuote } from '../../src/game/systems/hourlyWork';
import { hourlyHours } from '../../src/game/systems/hourlyWorkSchemas';
import { paidInterviewExperience } from '../../src/game/systems/interviewExperience';
import { currentWorkplace } from '../../src/game/systems/workplaceSchemas';
import { isConfined, legalMonth } from '../../src/game/systems/legal';
import { ordinaryApplicant, experiencedApplicant, hireOrdinary } from '../support/ordinaryJobs';
import beforeCatalogue from '../fixtures/jobs-before-polish3.json';
import graduate from '../fixtures/v3-employed-graduate.json';

const ordinary = jobs.filter(role => !role.specialCareer), partTime = ordinary.filter(role => role.partTime);

test('the expanded job sectors retain all existing IDs, salaries and special-career definitions', () => {
  expect(jobs.slice(0, beforeCatalogue.length)).toEqual(beforeCatalogue);
  expect(ordinary.filter(role => !role.partTime).length).toBeGreaterThanOrEqual(50); expect(partTime.length).toBeGreaterThanOrEqual(6);
  for (const id of ['firefighter', 'paramedic', 'police-officer', 'construction-worker']) expect(ordinary.some(role => role.id === id && !role.partTime)).toBe(true);
  expect(new Set(jobs.map(role => role.id)).size).toBe(jobs.length);
  expect(new Set(jobs.map(role => role.title)).size).toBe(jobs.length);
  expect(jobs.filter(role => role.specialCareer)).toHaveLength(7);
  expect(npcBackgroundRoleIds).toEqual(beforeCatalogue.filter(role => !role.partTime && !role.specialCareer).map(role => role.id));
  expect(new Set(ordinary.map(role => jobInterviews[role.id].question)).size).toBe(ordinary.length);
  for (const role of ordinary) {
    const interview = jobInterviews[role.id];
    expect(interview.duties.length).toBeGreaterThan(30); expect(interview.question.length).toBeGreaterThan(30);
    expect(interview.answers.map(answer => answer.id)).toEqual(['careful', 'rush', 'avoid']);
    expect(new Set(interview.answers.map(answer => answer.label)).size).toBe(3);
    expect(Number.isInteger(role.wageBps)).toBe(true); expect(role.wageBps).toBeGreaterThan(0);
  }
});

test.each(ordinary)('$title offers its own interview, hires at its exact local quote and cold-restores the same contract', role => {
  const initial = experiencedApplicant(role), original = encodeWorld(initial);
  const terms = role.partTime ? hourlyQuote('US', role) : undefined;
  const pending = resolveCommand(initial, { type: 'apply-job', roleId: role.id, ...(terms ? { reviewedHourlyTerms: terms } : {}) });
  expect(encodeWorld(initial)).toBe(original); expect(pending.random).toEqual(initial.random);
  expect(pending.accounts).toEqual(initial.accounts); expect(pending.ledger).toEqual(initial.ledger);
  expect(pending.pending).toMatchObject({ kind: 'decision', templateId: 'job-interview', title: role.title + ' interview', illustration: 'job:' + role.id });
  expect(pending.pending!.body).toContain(jobInterviews[role.id].question);
  const cold = decodeWorld(encodeWorld(pending)); expect(cold.pending).toEqual(pending.pending);
  const hired = resolveCommand(cold, { type: 'choose', eventId: cold.pending!.id, choiceId: 'careful' });
  expect(hired.people[hired.activePersonId].employment).toMatchObject({ roleId: role.id, annualPay: terms ? hourlyAnnual(terms) : salaryFor(initial, role), paidMonths: 0, rank: 0 });
  expect(hired.ledger).toEqual(initial.ledger); expect(hired.accounts).toEqual(initial.accounts);
  expect(hired.pending?.illustration).toBe('job:' + role.id);
  if (terms) expect(hourlyContract(hired)).toMatchObject({ roleId: role.id, terms, periods: [] });
  expect(decodeWorld(encodeWorld(hired))).toEqual(hired); validateWorld(hired);
}, 30000);

test.each(partTime)('$title supports every reviewed hour option and country rate without a two-role restriction', role => {
  for (const country of countryCodes) for (const hours of hourlyHours) {
    const quote = hourlyQuote(country, role, hours);
    const rounded = roundRatio(rules[country].baseWage * BigInt(role.wageBps), 10000n * 12n * 52n);
    expect(quote).toEqual({ hourlyRate: rounded > 0n ? rounded : 1n, weeklyHours: hours, paidWeeks: 52 });
  }
  for (const hours of hourlyHours) {
    let world = hireOrdinary(ordinaryApplicant(role, 'JP'), role, hours);
    world.date = monthFrom(world.date, 1); workMonth(world); world = validateWorld(world);
    expect(hourlyContract(world)).toMatchObject({ roleId: role.id, terms: { weeklyHours: hours }, periods: [{ attendance: 'worked', periods: 1 }] });
    expect(hourlyContract(world)!.periods[0].workedMinutes).toBe(hours * 52 * 5);
    expect(decodeWorld(encodeWorld(world))).toEqual(world);
    const invalid = JSON.parse(encodeWorld(world)); invalid.hourlyContracts[0].roleId = 'developer';
    expect(() => decodeWorld(JSON.stringify(invalid))).toThrow();
  }
}, 30000);

test.each(ordinary.filter(role => role.experienceMonths))('$title requires real paid sector work, not elapsed time or an unrelated career', role => {
  const unworked = ordinaryApplicant(role), original = encodeWorld(unworked);
  expect(jobReason(unworked, role)).toContain(role.experienceMonths + ' recorded paid months');
  expect(() => resolveCommand(unworked, { type: 'apply-job', roleId: role.id })).toThrow(/recorded paid months/);
  expect(encodeWorld(unworked)).toBe(original);
  const elapsed = copyWorld(unworked); elapsed.date.year += 5;
  expect(jobReason(elapsed, role)).toContain('recorded paid months');
  const unrelated = hireOrdinary(ordinaryApplicant(role), jobs.find(item => item.id === 'cleaner')!);
  for (let index = 0; index < role.experienceMonths!; index++) { unrelated.date = monthFrom(unrelated.date, 1); workMonth(unrelated); }
  expect(paidInterviewExperience(unrelated, role).paidMonths).toBe(0);
  expect(jobReason(unrelated, role)).toContain('recorded paid months');
  const qualified = experiencedApplicant(role);
  expect(paidInterviewExperience(qualified, role).paidMonths).toBe(role.experienceMonths);
  expect(jobReason(qualified, role)).toBeUndefined();
  const missingEvidence = copyWorld(qualified);
  // Removing ledger evidence invalidates the bonus/gate even if history counters claim service.
  missingEvidence.ledger = missingEvidence.ledger.filter(row => row.description !== 'Employment pay');
  expect(jobReason(missingEvidence, role)).toContain('recorded paid months');
});

test.each(ordinary.filter(role => role.experienceMonths || role.partTime))('$title can meet an actual local team without fabricating senior work experience', role => {
  const hired = hireOrdinary(experiencedApplicant(role), role), before = encodeWorld(hired);
  const next = resolveCommand(hired, { type: 'meet-coworkers' });
  expect(encodeWorld(hired)).toBe(before);
  const place = currentWorkplace(next)!;
  expect(place.members).toHaveLength(3);
  expect(place.members.filter(member => member.role === 'supervisor')).toHaveLength(1);
  for (const member of place.members) {
    const person = next.people[member.personId], memberRole = jobs.find(item => item.id === person.employment!.roleId)!;
    expect(person.employment!.employer).toBe(place.employer);
    expect(memberRole.sector).toBe(role.sector);
    expect(memberRole.experienceMonths).toBeUndefined();
    expect(next.workHistory.find(history => history.id === member.employmentId)?.personId).toBe(person.id);
  }
  expect(decodeWorld(encodeWorld(next))).toEqual(next); validateWorld(next);
});

test('new roles keep qualification, smarts, national age and student-hour gates; existing employment survives decode', () => {
  for (const role of ordinary.filter(item => !beforeCatalogue.some(previous => previous.id === item.id))) {
    const world = ordinaryApplicant(role);
    if (role.qualification) {
      world.people[world.activePersonId].education.qualifications = [];
      expect(jobReason(world, role)).toMatch(/Requires/);
    }
    if (role.smarts) {
      const low = ordinaryApplicant(role); low.people[low.activePersonId].stats.smarts = role.smarts - 1;
      expect(jobReason(low, role)).toMatch(/Smarts/);
    }
  }
  for (const country of countryCodes) for (const role of partTime) {
    const world = ordinaryApplicant(role, country), person = world.people[world.activePersonId];
    person.born.year = world.date.year - rules[country].partTimeAge + 1;
    expect(jobReason(world, role)).toContain('Available from age ' + rules[country].partTimeAge);
    person.born.year--; person.education.stage = 'secondary'; person.education.school = 'Configured student';
    expect(jobReason(world, role, false, 20)).toMatch(/16 contracted hours/);
  }
  const old = decodeWorld(JSON.stringify(graduate));
  // The genuine v3 fields remain literal; later currency/company defaults are additive.
  const recorded = graduate.people[graduate.activePersonId as keyof typeof graduate.people].employment;
  const migrated = JSON.parse(encodeWorld(old)).people[old.activePersonId].employment;
  if (recorded === null) expect(migrated).toBeNull();
  else expect(migrated).toMatchObject(recorded);
  expect(decodeWorld(encodeWorld(old)).people[old.activePersonId].employment).toEqual(old.people[old.activePersonId].employment);
});

test('paramedic work needs science training and police work rejects a real unexpired conviction after release', () => {
  const medic = jobs.find(role => role.id === 'paramedic')!, trainee = ordinaryApplicant(medic);
  trainee.people[trainee.activePersonId].education.qualifications.find(item => item.level === 'trade')!.field = 'general';
  expect(jobReason(trainee, medic)).toBe('Requires trade in science');
  const police = jobs.find(role => role.id === 'police-officer')!;
  let world: World | undefined;
  for (let seed = 1; seed < 100; seed++) {
    const candidate = ordinaryApplicant(police); candidate.random.outcomes = seed;
    const arrested = resolveCommand(candidate, { type: 'crime', offence: 'vandalism' });
    if (arrested.pending?.kind === 'decision' && arrested.pending.templateId === 'arrest') { world = arrested; break; }
  }
  if (!world) throw new Error('No configured arrest seed');
  const acknowledge = (value: World) => value.pending?.kind === 'result' ? resolveCommand(value, { type: 'acknowledge', resultId: value.pending.id }) : value;
  const choose = (value: World, choiceId: string) => acknowledge(resolveCommand(value, { type: 'choose', eventId: value.pending!.id, choiceId }));
  world = choose(world, 'remand'); world.date = monthFrom(world.date, 1); legalMonth(world);
  world = choose(world, 'guilty');
  for (let month = 0; month < 12 && isConfined(world); month++) { world.date = monthFrom(world.date, 1); legalMonth(world); world = acknowledge(world); }
  expect(isConfined(world)).toBe(false); expect(world.cases.some(item => item.status === 'convicted')).toBe(true);
  expect(jobReason(world, police)).toBe('This role requires a clear current background check');
  const original = encodeWorld(world);
  expect(() => resolveCommand(world!, { type: 'apply-job', roleId: police.id })).toThrow(/background check/);
  expect(encodeWorld(world)).toBe(original);
});
