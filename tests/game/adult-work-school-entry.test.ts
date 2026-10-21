import { monthFrom } from '../../src/game/calendar';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { jobs } from '../../src/game/content/jobs';
import { createLife, randomCreation } from '../../src/game/createLife';
import { GameCommand, resolveCommand } from '../../src/game/engine';
import { ageOn, encodeWorld, validateWorld, World } from '../../src/game/model';
import { rules } from '../../src/game/rules';
import { accountFor } from '../../src/game/systems/common';
import { personalLoanCapacity } from '../../src/game/systems/credit';
import { educationMonth } from '../../src/game/systems/education';
import { hireNpc } from '../../src/game/systems/npcs';
import { moveQuote, relocationFee } from '../../src/game/systems/relocation';
import { schoolMonth } from '../../src/game/systems/school';
import { currentSchool } from '../../src/game/systems/schoolSchemas';
import { jobReason } from '../../src/game/systems/work';
import { decodeSave } from '../../src/persistence/archive';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import archive from '../fixtures/v23-low-grade-school-archive.json';
import { pupil } from '../support/pupil';

function cold(world: World) {
  const reopened = unpackCheckpoint(packCheckpoint(world));
  expect(encodeWorld(reopened)).toBe(encodeWorld(world));
  return reopened;
}
function finish(input: World) {
  let world = input;
  for (let count = 0; count < 150; count++) {
    if (world.pending?.kind === 'decision') {
      const choice = world.pending.choices.find(item => !choiceUnavailable(world, item));
      if (!choice) throw new Error('No eligible actual choice');
      world = resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: choice.id });
    } else if (world.pending) world = resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
    else if (world.annual) world = resolveCommand(world, { type: 'resume' });
    else return world;
  }
  throw new Error('Bounded year did not finish');
}
const act = (world: World, command: GameCommand) => finish(resolveCommand(world, command));
function hire(world: World, roleIds = ['cleaner', 'retail', 'barista', 'warehouse']) {
  for (const roleId of roleIds) {
    if (jobReason(world, jobs.find(role => role.id === roleId)!)) continue;
    world = act(world, { type: 'apply-job', roleId });
    if (world.people[world.activePersonId].employment) return world;
  }
  throw new Error('No job offered after the bounded ordinary applications');
}
let failedSchool: World;
beforeAll(() => {
  const previous = unpackCheckpoint(decodeSave(JSON.stringify(archive)).snapshots.at(-1)!.payload);
  expect(ageOn(previous.people[previous.activePersonId], previous.date)).toBe(17);
  failedSchool = cold(act(previous, { type: 'advance' }));
  expect(ageOn(failedSchool.people[failedSchool.activePersonId], failedSchool.date)).toBe(18);
  expect(failedSchool.people[failedSchool.activePersonId].education.qualifications).toEqual([]);
  expect(failedSchool.schoolCompletions.find(row => row.personId === failedSchool.activePersonId)).toMatchObject({ passed: false, grade: 0 });
}, 30_000);
function fundedWorker() {
  let world = hire(failedSchool);
  const available = personalLoanCapacity(world).available;
  expect(available).toBeGreaterThan(0n);
  world = act(world, { type: 'borrow', amount: available });
  return cold(world);
}
function moveToRome(world: World, route: 'settlement' | 'work') {
  world = act(world, { type: 'apply-relocation', destinationId: 'rome', route, roleId: route === 'work' ? 'cleaner' : null, program: null, field: null, quotedFee: relocationFee(world) });
  const application = world.relocations.at(-1)!;
  expect(application.status).toBe('approved');
  world = act(world, { type: 'relocate', applicationId: application.id, companionIds: [], reserveMonths: 3, reviewedQuote: moveQuote(world, application) });
  expect(world.people[world.activePersonId]).toMatchObject({ country: 'IT', city: 'Rome' });
  expect(ageOn(world.people[world.activePersonId], world.date)).toBe(18);
  return cold(world);
}

test.each(['work-relocation', 'local-hiring'] as const)('genuine failed-school continuation keeps valid adult %s through actual monthly progress and cold resume', path => {
  let world = moveToRome(fundedWorker(), path === 'work-relocation' ? 'work' : 'settlement');
  if (path === 'local-hiring') world = cold(hire(world));
  const person = world.people[world.activePersonId], jobId = person.employment!.id;
  const oldCompletions = structuredClone(world.schoolCompletions), oldWithdrawals = structuredClone(world.schoolWithdrawals), oldCommunities = structuredClone(world.schoolCommunities), journal = structuredClone(world.journal);
  const initial = world, original = encodeWorld(world);
  expect(person.education.stage).toBe('none');
  expect(person.education.qualifications).toEqual([]);
  expect(jobs.find(role => role.id === person.employment!.roleId)?.partTime).toBeUndefined();
  world = cold(act(world, { type: 'advance' }));
  expect(encodeWorld(initial)).toBe(original);
  const current = world.people[world.activePersonId], history = world.workHistory.find(row => row.id === jobId)!;
  expect(world.date).toEqual(monthFrom(initial.date, 12, initial.calendarAnchorDay));
  expect(ageOn(current, world.date)).toBe(19);
  expect(current.employment?.id).toBe(jobId);
  expect(current.education.stage).toBe('none');
  expect(current.education.qualifications).toEqual([]);
  expect(history.monthsWorked).toBeGreaterThan(0);
  expect(history.grossEarned).toBeGreaterThan(0n);
  expect(world.ledger.some(row => row.personId === person.id && row.category === 'income' && row.currency === 'EUR')).toBe(true);
  expect(world.schoolCompletions.slice(0, oldCompletions.length)).toEqual(oldCompletions);
  expect(world.schoolCompletions.filter(row => row.personId === person.id)).toEqual(oldCompletions.filter(row => row.personId === person.id));
  expect(world.schoolWithdrawals).toEqual(oldWithdrawals);
  expect(world.schoolCommunities).toEqual(oldCommunities);
  expect(world.journal.slice(0, journal.length)).toEqual(journal);
  expect(currentSchool(world)).toBeUndefined();
  validateWorld(world);
}, 30_000);

/** Declared boundary fixtures below isolate entry; they are not natural journeys. */
function boundary(age = 18) {
  const world = createLife('life_adult_school_boundary', 42, { ...randomCreation(42), country: 'IT', city: 'Rome' }, { year: 2000, month: 1, day: 1 });
  world.birthAcknowledged = true; world.date.year += age;
  return validateWorld(world);
}
function educationPeriod(world: World) {
  world.date = monthFrom(world.date, 1);
  educationMonth(world, world.people[world.activePersonId]); schoolMonth(world);
}
test('automatic school entry preserves pupils and adults with part-time work; ordinary full-time applications still refuse current pupils', () => {
  const enrolled = pupil('IT', 18), student = enrolled.people[enrolled.activePersonId], months = student.education.months;
  expect(jobReason(enrolled, jobs.find(role => role.id === 'cleaner')!)).toMatch(/while you are studying/);
  educationPeriod(enrolled);
  expect(student.education.stage).toBe('secondary'); expect(student.education.months).toBe(months + 1); validateWorld(enrolled);
  const partTime = hire(boundary(), ['shop-assistant-part', 'cafe-part']);
  educationPeriod(partTime);
  expect(partTime.people[partTime.activePersonId].education.stage).toBe('secondary');
  expect(currentSchool(partTime)?.periods).toHaveLength(1); validateWorld(partTime);
});
test('the exception requires an adult full-time contract, gives no qualification or withdrawal and ends when the job ends', () => {
  const world = boundary(), person = world.people[world.activePersonId];
  hireNpc(world, person, 'cleaner');
  const education = structuredClone(person.education), random = structuredClone(world.random), cash = accountFor(world).cash;
  educationPeriod(world);
  expect(person.education).toEqual(education); expect(world.schoolCommunities).toEqual([]);
  expect(world.schoolWithdrawals).toEqual([]); expect(world.schoolCompletions).toEqual([]);
  expect(world.random).toEqual(random); expect(accountFor(world).cash).toBe(cash); validateWorld(world);
  const resigned = act(world, { type: 'quit-job' });
  educationPeriod(resigned);
  expect(resigned.people[resigned.activePersonId].education).toMatchObject({ stage: 'secondary', months: 1, qualifications: [] });
  expect(resigned.schoolWithdrawals).toEqual([]); expect(currentSchool(resigned)?.periods).toHaveLength(1); validateWorld(resigned);
});
test('minors remain subject to normal school entry and cannot apply for a full-time role', () => {
  const world = boundary(17), person = world.people[world.activePersonId];
  expect(ageOn(person, world.date)).toBeLessThan(rules.IT.adultAge);
  expect(jobReason(world, jobs.find(role => role.id === 'cleaner')!)).toBe('Available from age 18');
  educationPeriod(world);
  expect(person.education.stage).toBe('secondary'); expect(currentSchool(world)?.periods).toHaveLength(1); validateWorld(world);
});
