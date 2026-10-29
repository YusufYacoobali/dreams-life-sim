import { countryCodes, CountryCode } from '../../src/game/countries';
import { monthFrom } from '../../src/game/calendar';
import { GameCommand, resolveCommand } from '../../src/game/engine';
import { copyWorld, decodeWorld, encodeWorld, validateWorld, World } from '../../src/game/model';
import { minimumSchoolLeavingAge, rules } from '../../src/game/rules';
import { educationMonth } from '../../src/game/systems/education';
import { recoveryMonth, recoveryReason } from '../../src/game/systems/educationRecovery';
import { currentRecovery } from '../../src/game/systems/educationRecoverySchemas';
import { currentSchool } from '../../src/game/systems/schoolSchemas';
import { schoolMonth, schoolWithdrawalReason } from '../../src/game/systems/school';
import { validateSchools } from '../../src/game/systems/schoolValidation';
import { hourlyQuote, hourlyStudentReason } from '../../src/game/systems/hourlyWork';
import { jobReason } from '../../src/game/systems/work';
import { jobs } from '../../src/game/content/jobs';
import { borrow } from '../../src/game/systems/common';
import { isConfined } from '../../src/game/systems/legalSchemas';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { bindEvent, eligibleTemplates } from '../../src/game/content/events';
import { offerPending } from '../../src/game/pendingQueue';
import { storyMonth } from '../../src/game/systems/stories';
import { decodeSave } from '../../src/persistence/archive';
import court from '../fixtures/v9-court-archive.json';
import { pupil } from '../support/pupil';

const command = (world: World): Extract<GameCommand, { type: 'school-withdraw' }> => {
  const school = currentSchool(world)!;
  return { type: 'school-withdraw', communityId: school.id, school: school.school, country: school.country, city: school.city };
};
const acknowledge = (world: World) => world.pending ? resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id }) : world;
function attend(world: World) { world.date = monthFrom(world.date, 1); educationMonth(world, world.people[world.activePersonId]); schoolMonth(world); }

test.each(countryCodes)('%s allows explicit secondary withdrawal on its authored minimum birthday, preserving actual attendance and all unrelated state', country => {
  const ages: Record<CountryCode, number> = { US: 16, CA: 16, GB: 16, AU: 17, FR: 16, DE: 16, ES: 16, IT: 16, BR: 17, IN: 14, JP: 15, ZA: 15 };
  expect(minimumSchoolLeavingAge[country]).toBe(ages[country]);
  const world = pupil(country, ages[country] - 1), endAge = rules[country].schoolEnd;
  for (let month = 0; month < 11; month++) attend(world);
  const beforeBirthday = encodeWorld(world); expect(schoolWithdrawalReason(world)).toContain('age ' + ages[country]);
  expect(() => resolveCommand(world, command(world))).toThrow('age ' + ages[country]); expect(encodeWorld(world)).toBe(beforeBirthday);
  attend(world); const before = validateWorld(world), school = currentSchool(before)!, person = before.people[before.activePersonId], random = { ...before.random };
  expect(schoolWithdrawalReason(before)).toBeUndefined(); const after = resolveCommand(before, command(before), true), withdrawal = after.schoolWithdrawals[0];
  expect(withdrawal).toMatchObject({ personId: person.id, communityId: school.id, country, school: school.school, city: school.city, date: before.date, age: ages[country], minimumLeavingAge: ages[country], recordedStudyMonths: person.education.months, recordedAttendanceMonths: school.periods.length, grade: person.education.grades, effort: person.education.effort, lastStudyYear: person.education.lastStudyYear });
  expect(after.schoolWithdrawals).toHaveLength(1); expect(after.people[person.id]).toEqual({ ...person, education: { ...person.education, stage: 'none', paused: false, tuition: 0n } });
  for (const field of ['accounts', 'liabilities', 'ledger', 'relationships', 'workHistory', 'hourlyContracts', 'schoolCompletions'] as const) expect(after[field]).toEqual(before[field]);
  expect(after.random).toEqual(random); expect(after.people).toEqual({ ...before.people, [person.id]: after.people[person.id] });
  expect(after.schoolCommunities.find(item => item.id === school.id)).toEqual({ ...school, ended: before.date, endReason: 'withdrawn' }); expect(currentSchool(after)).toBeUndefined();
  expect(() => resolveCommand(acknowledge(after), command(before))).toThrow(/current school/); expect(rules[country].schoolEnd).toBe(endAge);
  expect(decodeWorld(encodeWorld(after), true)).toEqual(after);
});

test('primary school, stale bound location and unavailable routine guards refuse without state or RNG changes', () => {
  const primary = pupil(), primaryBefore = encodeWorld(primary); expect(() => resolveCommand(primary, command(primary))).toThrow(/Only secondary/); expect(encodeWorld(primary)).toBe(primaryBefore);
  const secondary = pupil('US', 16), school = currentSchool(secondary)!;
  for (const replacement of [{ school: 'Another school' }, { country: 'CA' as const }, { city: 'Another city' }, { communityId: 'old_school' }]) {
    const before = encodeWorld(secondary); expect(() => resolveCommand(secondary, { ...command(secondary), ...replacement })).toThrow(/current.*school/); expect(encodeWorld(secondary)).toBe(before);
  }
  secondary.people[secondary.activePersonId].health.hospitalizedUntil = secondary.date.year * 12 + secondary.date.month + 2;
  const beforeHospital = encodeWorld(secondary); expect(() => resolveCommand(secondary, command(secondary))).toThrow(/normal school/); expect(encodeWorld(secondary)).toBe(beforeHospital);
  expect(currentSchool(secondary)?.id).toBe(school.id);
  let confined = decodeSave(JSON.stringify(court)).world, guard = 0;
  // Follow the genuine archive's saved medical/court queue and actually plead
  // guilty; never mutate a case or discard its bound pending effects.
  while (!isConfined(confined) && guard++ < 30) {
    if (confined.pending?.kind === 'decision') { const event = confined.pending, choice = event.choices.find(item => item.id === 'guilty' && !choiceUnavailable(confined, item)) ?? event.choices.find(item => !choiceUnavailable(confined, item))!; confined = resolveCommand(confined, { type: 'choose', eventId: event.id, choiceId: choice.id }); }
    else if (confined.pending) confined = resolveCommand(confined, { type: 'acknowledge', resultId: confined.pending.id });
    else confined = resolveCommand(confined, { type: confined.annual ? 'resume' : 'advance' });
  }
  expect(isConfined(confined)).toBe(true); const beforeCustody = encodeWorld(confined);
  expect(() => resolveCommand(confined, { type: 'school-withdraw', communityId: school.id, school: school.school, country: school.country, city: school.city })).toThrow(/custody/);
  expect(encodeWorld(confined)).toBe(beforeCustody);
});

test('withdrawal retains existing debt and qualifications, never resumes attendance, and requires the unchanged adult recovery course before a new qualification', () => {
  const initial = pupil('IT', 16), person = initial.people[initial.activePersonId];
  // Explicit retained legacy qualification/debt setup; not an earned-outcome or native acceptance claim.
  person.education.qualifications.push({ level: 'trade', field: 'arts', year: initial.date.year }); borrow(initial, 1000n, 'student', rules.IT.studentInterestBps);
  const before = validateWorld(initial), school = currentSchool(before)!;
  let world = acknowledge(resolveCommand(before, command(before))), left = world.schoolWithdrawals[0];
  const debt = copyWorld(world).liabilities, qualifications = [...person.education.qualifications], contacts = { classmates: [...school.classmateIds], teachers: [...school.teacherIds] }, skills = { ...person.skills }, study = person.education.months;
  expect(recoveryReason(world, 'secondary')).toMatch(/school years/);
  for (let month = 0; month < 36; month++) attend(world);
  expect(world.people[world.activePersonId].education).toMatchObject({ stage: 'none', months: study, qualifications });
  expect(world.schoolWithdrawals).toEqual([left]); expect(world.schoolCompletions).toEqual([]); expect(world.people[world.activePersonId].skills).toEqual(skills); expect(world.liabilities).toEqual(debt); expect(world.schoolCommunities[0].periods).toEqual(school.periods);
  expect(world.schoolCommunities[0]).toMatchObject({ classmateIds: contacts.classmates, teacherIds: contacts.teachers, endReason: 'withdrawn' });
  expect(recoveryReason(world, 'secondary')).toBeUndefined(); world = acknowledge(resolveCommand(world, { type: 'enroll-recovery', purpose: 'secondary' }));
  expect(world.people[world.activePersonId].education.qualifications).toEqual(qualifications); expect(currentRecovery(world)?.periods).toHaveLength(0);
  expect(hourlyStudentReason(world, 20)).toBeUndefined(); expect(jobReason(world, jobs.find(item => item.id === 'cleaner')!)).toBeUndefined();
  for (let month = 0; month < 23; month++) { world.date = monthFrom(world.date, 1); educationMonth(world, world.people[world.activePersonId]); recoveryMonth(world); schoolMonth(world); }
  expect(world.people[world.activePersonId].education.qualifications).toEqual(qualifications);
  world.date = monthFrom(world.date, 1); recoveryMonth(world);
  expect(world.recoveryCourses[0]).toMatchObject({ status: 'passed', qualificationAwarded: true }); expect(world.recoveryCourses[0].periods).toHaveLength(24);
  expect(world.people[world.activePersonId].education.qualifications).toEqual([...qualifications, { level: 'secondary', field: 'general', year: world.date.year }]); expect(world.schoolWithdrawals).toEqual([left]); expect(world.liabilities).toEqual(debt); validateWorld(world);
  // Explicit deterministic admission unit setup after actual recovery completion;
  // the ordinary command still pays tuition and starts with zero course credits.
  world = acknowledge(world); world.random.outcomes = 1; world = acknowledge(resolveCommand(world, { type: 'enroll', program: 'trade', field: 'science', funding: 'loan' }));
  expect(world.people[world.activePersonId].education).toMatchObject({ stage: 'trade', months: 0 }); expect(hourlyStudentReason(world, 20)).toMatch(/16 contracted hours/); validateWorld(world);
});

test('withdrawal records reject missing, duplicated or contradictory school links', () => {
  const before = pupil('US', 16), world = resolveCommand(before, command(before));
  const missing = copyWorld(world); missing.schoolWithdrawals = []; expect(() => validateWorld(missing)).toThrow(/Missing secondary/);
  const duplicate = copyWorld(world); duplicate.schoolWithdrawals.push({ ...duplicate.schoolWithdrawals[0], id: 'duplicate' }); expect(() => validateWorld(duplicate)).toThrow(/Invalid secondary/);
  const changed = copyWorld(world); changed.schoolWithdrawals[0].school = 'Another school'; expect(() => validateWorld(changed)).toThrow(/Invalid secondary/);
  const falseMinimum = copyWorld(world); falseMinimum.schoolWithdrawals[0].minimumLeavingAge = 14; expect(() => validateWorld(falseMinimum)).toThrow(/Invalid secondary/);
  const enrolled = copyWorld(world); enrolled.people[enrolled.activePersonId].education.stage = 'secondary'; expect(() => validateWorld(enrolled)).toThrow(/Invalid secondary/);
  // Saved-record integrity: isolate lifetime binding from unrelated death/estate rules.
  const afterDeath = copyWorld(world); afterDeath.people[afterDeath.activePersonId].died = monthFrom(afterDeath.date, -1); expect(() => validateSchools(afterDeath)).toThrow(/Invalid secondary/);
  const onDeath = copyWorld(world); onDeath.people[onDeath.activePersonId].died = { ...onDeath.date }; expect(() => validateSchools(onDeath)).not.toThrow();
});

test('actual withdrawal removes only the school-age hourly fallback, retaining student, job-age and qualification gates without granting work', () => {
  const pupilWorld = pupil('IT', 18), role = jobs.find(item => item.id === 'shop-assistant-part')!, fullTime = jobs.find(item => item.id === 'cleaner')!, qualified = jobs.find(item => item.id === 'administrator')!;
  const terms = hourlyQuote('IT', role, 20), application: GameCommand = { type: 'apply-job', roleId: role.id, reviewedHourlyTerms: terms }, before = encodeWorld(pupilWorld);
  expect(jobReason(pupilWorld, role, false, 20)).toMatch(/16 contracted hours/); expect(() => resolveCommand(pupilWorld, application)).toThrow(/16 contracted hours/); expect(encodeWorld(pupilWorld)).toBe(before);
  expect(jobReason(pupilWorld, fullTime)).toMatch(/while you are studying/);
  const withdrawn = acknowledge(resolveCommand(pupilWorld, command(pupilWorld)));
  expect(jobReason(withdrawn, role, false, 20)).toBeUndefined(); expect(jobReason(withdrawn, fullTime)).toBeUndefined(); expect(jobReason(withdrawn, qualified)).toMatch(/Requires secondary/);
  const interview = resolveCommand(withdrawn, application);
  expect(interview.pending).toMatchObject({ kind: 'decision', templateId: 'job-interview' });
  if (interview.pending?.kind !== 'decision') throw new Error('Expected the ordinary interview');
  for (const choice of interview.pending.choices) expect(choice.effects[0]).toMatchObject({ kind: 'job-interview', hourly: terms });
  const cancelled = acknowledge(resolveCommand(interview, { type: 'choose', eventId: interview.pending.id, choiceId: 'withdraw' }));
  for (const state of [withdrawn, interview, cancelled]) {
    expect(state.people[state.activePersonId].employment).toBeNull(); expect(state.workHistory).toEqual(pupilWorld.workHistory); expect(state.hourlyContracts).toEqual(pupilWorld.hourlyContracts); expect(state.accounts).toEqual(pupilWorld.accounts); expect(state.random).toEqual(pupilWorld.random);
  }
  const younger = pupil('IN', 14), youngerWithdrawn = acknowledge(resolveCommand(younger, command(younger)));
  expect(jobReason(youngerWithdrawn, role, false, 20)).toBe('Available from age ' + rules.IN.partTimeAge); expect(jobReason(youngerWithdrawn, fullTime)).toBe('Available from age ' + rules.IN.adultAge);
  const youngerBefore = encodeWorld(youngerWithdrawn); expect(() => resolveCommand(youngerWithdrawn, { ...application, reviewedHourlyTerms: hourlyQuote('IN', role, 20) })).toThrow(/Available from age/); expect(encodeWorld(youngerWithdrawn)).toBe(youngerBefore);
});

test('a genuine eligible project origin must finish before withdrawal; its unfinished callback then cancels without awarding grades or replacing participants', () => {
  const initial = pupil('US', 16), template = eligibleTemplates(initial).find(item => item.id === 'school-project-promise')!;
  expect(template).toBeDefined(); const event = bindEvent(initial, template); offerPending(initial, event);
  const origin = encodeWorld(initial); expect(() => resolveCommand(initial, command(initial))).toThrow(/current event/); expect(encodeWorld(initial)).toBe(origin);
  let world = resolveCommand(initial, { type: 'choose', eventId: event.id, choiceId: 'promise' }); const savedResult = encodeWorld(world);
  expect(() => resolveCommand(world, command(world))).toThrow(/current event/); expect(encodeWorld(world)).toBe(savedResult);
  world = acknowledge(world); const thread = { ...world.storyThreads[0] }, person = world.people[world.activePersonId], random = { ...world.random };
  world = acknowledge(resolveCommand(world, command(world)));
  expect(world.storyThreads[0]).toEqual({ ...thread, status: 'cancelled', ended: world.date, cancellationReason: 'Your school has changed' });
  const cancelled = { ...world.storyThreads[0] }; expect(world.random).toEqual(random); expect(world.people[person.id].stats).toEqual(person.stats);
  for (let month = 0; month < 2; month++) { attend(world); storyMonth(world); }
  expect(world.pending).toBeNull(); expect(world.storyThreads[0]).toEqual(cancelled); expect(world.people[person.id].education.grades).toBe(person.education.grades); expect(world.ledger).toEqual(initial.ledger); validateWorld(world);
});
