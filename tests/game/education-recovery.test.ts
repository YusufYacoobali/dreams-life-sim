import { gunzipSync, strFromU8 } from 'fflate';
import { countries, countryCodes, CountryCode } from '../../src/game/countries';
import { monthFrom } from '../../src/game/calendar';
import { GameCommand, recordDeath, resolveCommand } from '../../src/game/engine';
import { decodeWorld, encodeWorld, validateWorld, World } from '../../src/game/model';
import { rules } from '../../src/game/rules';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { educationMonth, enrollmentReason } from '../../src/game/systems/education';
import { recoveryMonth, recoveryReason, refreshRecoveries } from '../../src/game/systems/educationRecovery';
import { currentRecovery } from '../../src/game/systems/educationRecoverySchemas';
import { refreshSchools, schoolMonth } from '../../src/game/systems/school';
import { currentSchool } from '../../src/game/systems/schoolSchemas';
import { accountFor } from '../../src/game/systems/common';
import { isConfined, legalMonth } from '../../src/game/systems/legal';
import { activeTrip } from '../../src/game/systems/travelSchemas';
import { tripQuote } from '../../src/game/systems/travel';
import { moveQuote, relocationFee, relocationReason } from '../../src/game/systems/relocation';
import { childrenOf } from '../../src/game/systems/family';
import { workMonth } from '../../src/game/systems/work';
import { decodeSave } from '../../src/persistence/archive';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import archive from '../fixtures/v23-low-grade-school-archive.json';
import birthArchive from '../fixtures/v6-birth-result.json';
import { pupil } from '../support/pupil';

function drain(initial: World) {
  let world = initial, guard = 0;
  while ((world.pending || world.annual) && guard++ < 150) {
    if (world.pending?.kind === 'decision') { const choice = world.pending.choices.find(item => !choiceUnavailable(world, item))!; world = resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: choice.id }); }
    else if (world.pending) world = resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
    else world = resolveCommand(world, { type: 'resume' });
  }
  if (guard >= 150) throw new Error('Unfinished test year'); return world;
}
const act = (world: World, command: GameCommand) => drain(resolveCommand(world, command));
function schoolOutcome(country: CountryCode = 'US', grade = 0, attend = true) {
  const world = pupil(country, rules[country].schoolEnd - 1), person = world.people[world.activePersonId];
  if (attend) for (let month = 0; month < 11; month++) { world.date = monthFrom(world.date, 1); educationMonth(world, person); schoolMonth(world); }
  world.date = { year: person.born.year + rules[country].schoolEnd, month: person.born.month, day: person.born.day };
  person.education.grades = grade; educationMonth(world, person); refreshSchools(world); return drain(validateWorld(world));
}
function start(world = schoolOutcome(), purpose: 'secondary' | 'grades' = 'secondary') { return act(world, { type: 'enroll-recovery', purpose }); }
function month(world: World) {
  world.date = monthFrom(world.date, 1); recoveryMonth(world); return world;
}
const raw = (payload: string) => JSON.parse(strFromU8(gunzipSync(Buffer.from(JSON.parse(payload).data, 'base64'))));

test.each(countryCodes)('%s records the actual passing grade, study credit and original school; 49% never awards a qualification', country => {
  const failed = schoolOutcome(country, 49), passed = schoolOutcome(country, 50);
  for (const [world, earned] of [[failed, false], [passed, true]] as const) {
    const person = world.people[world.activePersonId], outcome = world.schoolCompletions[0];
    expect(person.education.stage).toBe('none'); expect(person.education.qualifications.some(q => q.level === 'secondary')).toBe(earned);
    expect(outcome).toMatchObject({ personId: person.id, country, city: countries[country].cities[0], passed: earned, recordedStudyMonths: 12, requiredStudyMonths: 12 });
    expect(world.schoolCommunities[0].endReason).toBe(earned ? 'graduated' : 'unqualified');
    const before = encodeWorld(world); educationMonth(world, person); expect(encodeWorld(world)).toBe(before);
  }
});
test('a birthday with high grades but only one recorded study month cannot fabricate a diploma', () => {
  const world = schoolOutcome('US', 95, false);
  expect(world.schoolCompletions[0]).toMatchObject({ grade: 95, recordedStudyMonths: 1, passed: false });
  expect(world.people[world.activePersonId].education.qualifications).toEqual([]);
});
test('genuine v23 low-grade graduation and both earlier moments migrate without inventing assessments or changing people, RNG or history', () => {
  const save = decodeSave(JSON.stringify(archive)), originals = [raw(archive.checkpoint), ...archive.snapshots.map(item => raw(item.payload))];
  const migrated = [save.world, ...save.snapshots.map(item => unpackCheckpoint(item.payload))];
  for (let index = 0; index < migrated.length; index++) {
    const encoded = JSON.parse(encodeWorld(migrated[index]));
    expect(originals[index].schemaVersion).toBe(23); expect(encoded.schemaVersion).toBe(49); expect(encoded.engineVersion).toBe(51);
    for (const key of Object.keys(originals[index]).filter(key => !['schemaVersion', 'engineVersion', 'contentVersion'].includes(key))) expect(encoded[key]).toEqual(originals[index][key]);
    expect(migrated[index].schoolCompletions).toEqual([]); expect(migrated[index].recoveryCourses).toEqual([]);
  }
  const person = save.world.people[save.world.activePersonId]; expect(person.education.grades).toBe(0);
  expect(person.education.qualifications).toEqual([{ level: 'secondary', field: 'general', year: 2018 }]);
  const before = encodeWorld(save.world); educationMonth(save.world, person); expect(encodeWorld(save.world)).toBe(before);
  expect(recoveryReason(save.world, 'secondary')).toMatch(/already hold/); expect(recoveryReason(save.world, 'grades')).toBeUndefined();
});
test('the genuine unfinished seventeenth year now reaches a real failed assessment; no qualification is retroactively removed', () => {
  const save = decodeSave(JSON.stringify(archive)), prior = unpackCheckpoint(save.snapshots.at(-1)!.payload);
  expect(prior.people[prior.activePersonId].education.qualifications).toEqual([]);
  const world = act(prior, { type: 'advance' });
  expect(world.schoolCompletions.find(item => item.personId === world.activePersonId)).toMatchObject({ passed: false, grade: 0 });
  expect(world.people[world.activePersonId].education.qualifications).toEqual([]);
  expect(world.schoolCommunities.at(-1)?.endReason).toBe('unqualified');
  expect(decodeSave(JSON.stringify(archive)).world.people[world.activePersonId].education.qualifications).toHaveLength(1);
});
test('enrolment, browsing and routine changes give no credits, cash, loan, qualification or random draw', () => {
  const initial = schoolOutcome(), money = initial.accounts, random = initial.random, ledger = initial.ledger;
  let world = start(initial), course = currentRecovery(world)!;
  expect(course.periods).toEqual([]); expect(course.requiredMonths).toBe(24); expect(course.targetGrade).toBe(50);
  expect(world.people[world.activePersonId].education.qualifications).toEqual([]);
  expect(world.accounts).toEqual(money); expect(world.ledger).toEqual(ledger); expect(world.liabilities).toEqual(initial.liabilities); expect(world.random).toEqual(random);
  world = act(world, { type: 'recovery-effort', courseId: course.id, effort: 'focused' }); course = currentRecovery(world)!;
  expect(course.periods).toEqual([]); expect(world.random).toEqual(random);
  const before = encodeWorld(world); currentRecovery(world); recoveryReason(world, 'secondary'); recoveryMonth(world); expect(encodeWorld(world)).toBe(before);
  expect(() => resolveCommand(world, { type: 'enroll-recovery', purpose: 'secondary' })).toThrow(/current evening course/);
  expect(() => resolveCommand(world, { type: 'recovery-study', courseId: 'stale_course' })).toThrow(/current evening course/);
  expect(() => resolveCommand(world, { type: 'enroll', program: 'university', field: 'science', funding: 'loan' })).toThrow(/evening course/);
});
test('twenty-four actual attended months, extra work and ordinary paid employment produce one secondary qualification', () => {
  let world = start(), course = currentRecovery(world)!;
  world = act(world, { type: 'recovery-effort', courseId: course.id, effort: 'focused' });
  world = act(world, { type: 'recovery-study', courseId: course.id });
  const admission = world;
  for (let seed = 1; seed < 100; seed++) {
    const candidate = validateWorld(admission); candidate.random.outcomes = seed;
    const applied = act(candidate, { type: 'apply-job', roleId: 'retail' });
    if (applied.people[applied.activePersonId].employment) { world = applied; break; }
  }
  expect(world.people[world.activePersonId].employment?.roleId).toBe('retail');
  const firstYear = world.date.year, random = { ...world.random }, ledgerRows = world.ledger.length;
  for (let index = 0; index < 24; index++) {
    month(world); workMonth(world); recoveryMonth(world);
    expect(world.recoveryCourses[0].periods).toHaveLength(index + 1);
    if (index < 23) expect(world.people[world.activePersonId].education.qualifications).toEqual([]);
    if (index === 11) { world = drain(world); expect(world.date.year).toBeGreaterThan(firstYear); world = act(world, { type: 'recovery-study', courseId: course.id }); }
  }
  course = world.recoveryCourses[0]; expect(course.status).toBe('passed'); expect(course.qualificationAwarded).toBe(true); expect(course.finalGrade).toBeGreaterThanOrEqual(55);
  expect(world.people[world.activePersonId].education.qualifications).toEqual([{ level: 'secondary', field: 'general', year: world.date.year }]);
  expect(world.people[world.activePersonId].employment?.paidMonths).toBe(24); expect(world.ledger.length).toBeGreaterThan(ledgerRows);
  expect(world.ledger.some(item => item.personId === world.activePersonId && item.category === 'income' && item.cashDelta > 0n)).toBe(true);
  expect(world.random).not.toEqual(random); // Ordinary work has its own real performance draws.
  world = drain(world); world = act(world, { type: 'quit-job' });
  expect(enrollmentReason(world, 'university', 'computing')).toBeUndefined();
  expect(decodeWorld(encodeWorld(world))).toEqual(world);
  expect(() => resolveCommand(world, { type: 'enroll-recovery', purpose: 'secondary' })).toThrow(/already hold/);
});
test('a low final grade records failure after all credits; withdrawal and retry preserve outcomes without resetting annual extra-study limits', () => {
  let world = start(), id = currentRecovery(world)!.id;
  world = act(world, { type: 'recovery-effort', courseId: id, effort: 'relaxed' });
  for (let index = 0; index < 24; index++) month(world);
  expect(world.recoveryCourses[0]).toMatchObject({ status: 'failed', finalGrade: 0, qualificationAwarded: false });
  expect(world.people[world.activePersonId].education.qualifications).toEqual([]); world = drain(world);
  world = start(world); id = currentRecovery(world)!.id;
  world = act(world, { type: 'recovery-study', courseId: id }); const grade = world.people[world.activePersonId].education.grades;
  world = act(world, { type: 'leave-recovery', courseId: id }); world = start(world);
  expect(world.recoveryCourses.map(item => item.status)).toEqual(['failed', 'withdrawn', 'active']);
  expect(world.people[world.activePersonId].education.grades).toBe(grade);
  expect(() => resolveCommand(world, { type: 'recovery-study', courseId: currentRecovery(world)!.id })).toThrow(/already did/);
  expect(world.recoveryCourses[1].periods).toEqual([]); expect(world.recoveryCourses[2].periods).toEqual([]);
});
test('a twelve-month grade-improvement course preserves the original qualification and unlocks only actual entry grades', () => {
  let world = decodeSave(JSON.stringify(archive)).world; world.people[world.activePersonId].education.grades = 45;
  const qualifications = structuredClone(world.people[world.activePersonId].education.qualifications);
  world = start(world, 'grades'); const id = currentRecovery(world)!.id;
  world = act(world, { type: 'recovery-effort', courseId: id, effort: 'focused' });
  for (let index = 0; index < 12; index++) month(world);
  expect(world.recoveryCourses[0]).toMatchObject({ status: 'passed', finalGrade: 69, qualificationAwarded: false, requiredMonths: 12, targetGrade: 55 });
  expect(world.people[world.activePersonId].education.qualifications).toEqual(qualifications);
  expect(world.random).toEqual(decodeSave(JSON.stringify(archive)).world.random);
  world = drain(world); expect(enrollmentReason(world, 'university', 'science')).toBeUndefined();
  expect(recoveryReason(world, 'grades')).toMatch(/already meet/);
});
test('hospital care, low health and pursuit pause attendance, while completed credits survive cold load', () => {
  let world = start(); month(world); const course = currentRecovery(world)!;
  const player = world.people[world.activePersonId]; player.health.hospitalizedUntil = world.date.year * 12 + world.date.month + 4;
  month(world); expect(course.periods).toHaveLength(1); player.health.hospitalizedUntil = null; player.stats.health = 24;
  month(world); expect(course.periods).toHaveLength(1); player.stats.health = 100; player.legal.wanted = true;
  month(world); expect(course.periods).toHaveLength(1); player.legal.wanted = false;
  world = decodeWorld(encodeWorld(world)); month(world); expect(currentRecovery(world)!.periods).toHaveLength(2); expect(world.people[world.activePersonId].education.qualifications).toEqual([]);
});
test('death closes the original course without awarding or reviving it', () => {
  const world = start(); month(world); const id = currentRecovery(world)!.id;
  recordDeath(world, world.activePersonId, 'test illness');
  expect(world.recoveryCourses[0]).toMatchObject({ id, status: 'died', reason: 'died', qualificationAwarded: false, ended: world.date });
  expect(world.recoveryCourses[0].periods).toHaveLength(1); expect(currentRecovery(world)).toBeUndefined();
  expect(decodeWorld(encodeWorld(world))).toEqual(world);
});
test.each(['gain', 'duplicate-month', 'fake-pass', 'new-target', 'wrong-person', 'revive-after-move'] as const)('contradictory %s recovery imports are rejected without repairing history', change => {
  const world = start(); month(world); const course = currentRecovery(world)!;
  if (change === 'gain') course.periods[0].gradeGain = 2;
  else if (change === 'duplicate-month') course.periods.push({ ...course.periods[0] });
  else if (change === 'fake-pass') { course.status = 'passed'; course.ended = { ...world.date }; course.finalGrade = 80; course.qualificationAwarded = true; }
  else if (change === 'new-target') course.targetGrade = 55;
  else if (change === 'wrong-person') course.personId = 'person_missing';
  else world.people[world.activePersonId].city = 'Different city';
  expect(() => validateWorld(world)).toThrow(/evening|study|Grade recovery/i);
});

function funds(world: World) { const account = accountFor(world); account.cash += 100000000n; account.openingCash += 100000000n; return world; }
function arrest(initial: World, offence: 'vandalism' | 'burglary' = 'vandalism') {
  for (let seed = 1; seed < 100; seed++) {
    const candidate = validateWorld(initial); candidate.random.outcomes = seed;
    const world = resolveCommand(candidate, { type: 'crime', offence });
    if (world.pending?.kind === 'decision') return world;
  }
  throw new Error('No actual arrest seed');
}
test('an actual three-month trip pauses evening attendance and returns to the same unfinished course', () => {
  let world = funds(start()), courseId = currentRecovery(world)!.id;
  world = act(world, { type: 'book-trip', destinationId: 'paris', duration: 3, companionIds: [], focus: 'sightseeing', quotedTotal: tripQuote(world, 'paris', 3).total });
  expect(activeTrip(world)).toBeDefined(); expect(currentRecovery(world)!.periods).toEqual([]);
  const startMonth = world.date.year * 12 + world.date.month - 1;
  world = act(world, { type: 'advance' });
  expect(world.trips[0].periods).toHaveLength(3); expect(activeTrip(world)).toBeUndefined();
  expect(currentRecovery(world)!.id).toBe(courseId); expect(currentRecovery(world)!.periods).toHaveLength(9);
  expect(currentRecovery(world)!.periods.every(item => item.month > startMonth + 3)).toBe(true);
  expect(world.people[world.activePersonId].education.qualifications).toEqual([]);
});
test('actual juvenile remand pauses ordinary school credits and classroom attendance', () => {
  let world = arrest(funds(pupil('US', 17)));
  if (world.pending?.kind !== 'decision') throw new Error('Expected the real arrest choice');
  world = act(world, { type: 'choose', eventId: world.pending.id, choiceId: 'remand' });
  expect(isConfined(world)).toBe(true);
  const months = world.people[world.activePersonId].education.months, periods = currentSchool(world)!.periods.length;
  world.date = monthFrom(world.date, 1); educationMonth(world, world.people[world.activePersonId]); schoolMonth(world); legalMonth(world);
  expect(world.people[world.activePersonId].education.months).toBe(months); expect(currentSchool(world)!.periods).toHaveLength(periods); validateWorld(world);
});
test('an actual prison-study qualification closes the paused evening course without invented evening credits or a second diploma', () => {
  let world = funds(start()); world.people[world.activePersonId].legal.crimeSkill = 10;
  world = arrest(world, 'burglary');
  if (world.pending?.kind !== 'decision') throw new Error('Expected arrest');
  world = act(world, { type: 'choose', eventId: world.pending.id, choiceId: 'remand' });
  world.date = monthFrom(world.date, 1); recoveryMonth(world); legalMonth(world);
  if (world.pending?.kind !== 'decision') throw new Error('Expected the saved court hearing');
  world = act(world, { type: 'choose', eventId: world.pending.id, choiceId: 'guilty' });
  expect(world.sentences[0].totalMonths).toBeGreaterThanOrEqual(12);
  world = act(world, { type: 'prison-routine', routine: { study: true, work: false, exercise: false, conduct: 'quiet' } });
  for (let index = 0; index < 12; index++) { world.date = monthFrom(world.date, 1); recoveryMonth(world); legalMonth(world); refreshRecoveries(world); }
  expect(world.sentences[0].studyMonths).toBe(12); expect(world.people[world.activePersonId].education.qualifications.filter(q => q.level === 'secondary')).toHaveLength(1);
  expect(world.recoveryCourses[0]).toMatchObject({ status: 'superseded', reason: 'qualified-elsewhere', qualificationAwarded: false, periods: [] });
  expect(world.journal.some(item => item.text.includes('through prison study'))).toBe(true); validateWorld(world);
});
test('permanent emigration requires leaving evening classes; returning to a longer school path cannot reset failed grades', () => {
  let world = funds(start()), courseId = currentRecovery(world)!.id;
  const choice = { destinationId: 'rome' as const, route: 'settlement' as const, roleId: null, program: null, field: null };
  const before = encodeWorld(world); expect(relocationReason(world, choice)).toMatch(/evening course/);
  expect(() => resolveCommand(world, { type: 'apply-relocation', ...choice, quotedFee: relocationFee(world) })).toThrow(/evening course/); expect(encodeWorld(world)).toBe(before);
  world = act(world, { type: 'leave-recovery', courseId });
  const initial = world;
  for (let seed = 1; seed < 100; seed++) {
    const candidate = validateWorld(initial); candidate.random.outcomes = seed;
    const applied = act(candidate, { type: 'apply-relocation', ...choice, quotedFee: relocationFee(candidate) });
    if (applied.relocations.at(-1)?.status === 'approved') { world = applied; break; }
  }
  const application = world.relocations.at(-1)!; expect(application.status).toBe('approved');
  world = act(world, { type: 'relocate', applicationId: application.id, companionIds: [], reserveMonths: 3, reviewedQuote: moveQuote(world, application, [], 3) });
  expect(world.people[world.activePersonId].country).toBe('IT'); expect(world.recoveryCourses[0]).toMatchObject({ status: 'withdrawn', reason: 'withdrawn', periods: [] });
  const grade = world.people[world.activePersonId].education.grades;
  world.date = monthFrom(world.date, 1); educationMonth(world, world.people[world.activePersonId]);
  expect(world.people[world.activePersonId].education.stage).toBe('secondary'); expect(world.people[world.activePersonId].education.grades).toBe(grade);
  expect(world.people[world.activePersonId].education.qualifications).toEqual([]); validateWorld(world);
});
test('legacy keeps a deceased parent’s partial course and starts the actual existing child with no inherited course credits', () => {
  let world = drain(decodeWorld(JSON.stringify(birthArchive))); world.people[world.activePersonId].education.grades = 45;
  world = start(world, 'grades'); month(world); const parentId = world.activePersonId, childId = childrenOf(world)[0].id, courseId = currentRecovery(world)!.id;
  recordDeath(world, parentId, 'test illness');
  world = resolveCommand(world, { type: 'continue-child', personId: childId });
  expect(world.activePersonId).toBe(childId); expect(world.recoveryCourses[0]).toMatchObject({ id: courseId, personId: parentId, status: 'died', qualificationAwarded: false });
  expect(world.recoveryCourses[0].periods).toHaveLength(1); expect(currentRecovery(world)).toBeUndefined();
  expect(world.people[childId].education.qualifications).toEqual([]); expect(decodeWorld(encodeWorld(world))).toEqual(world);
});
