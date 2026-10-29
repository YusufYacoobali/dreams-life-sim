import { copyWorld, decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { randomInteger } from '../../src/game/random';
import { countryCodes } from '../../src/game/countries';
import { rules } from '../../src/game/rules';
import { admissionChance, initialAdmissionStatus, universityTuitionV1 } from '../../src/game/systems/universityAdmissionSchemas';
import * as admissions from '../../src/game/systems/universityAdmissions';
import { enrollmentReason } from '../../src/game/systems/education';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import archive from '../fixtures/v24-university-loan-archive.json';

const ack = (world: World) => resolveCommand(world, { type: 'acknowledge', resultId: world.pending!.id }, true);
function step(world: World) {
  const event = world.pending, choice = event?.kind === 'decision' ? event.choices.find(item => !choiceUnavailable(world, item)) : undefined;
  const command: GameCommand = event?.kind === 'decision' ? { type: 'choose', eventId: event.id, choiceId: choice!.id } : event ? { type: 'acknowledge', resultId: event.id } : { type: 'resume' };
  return resolveCommand(world, command, true);
}
function year(world: World, onStep?: (value: World) => World) {
  world = resolveCommand(world, { type: 'advance' }, true); let guard = 0;
  while (world.pending || world.annual) {
    if (++guard > 120) throw new Error('Ordinary university year stalled');
    if (onStep) world = onStep(world);
    if (world.pending || world.annual) world = step(world);
  }
  return world;
}
let qualified: World;
beforeAll(() => {
  const pupil = unpackCheckpoint(archive.snapshots[0].payload);
  expect(pupil.people[pupil.activePersonId].education.qualifications).toEqual([]);
  qualified = year(pupil);
  expect(qualified.date).toEqual({ year: 2018, month: 1, day: 1 }); expect(qualified.schoolCompletions.find(item => item.personId === qualified.activePersonId)?.passed).toBe(true);
});

test.each([[75, 80, 'accepted'], [76, 80, 'waitlisted'], [80, 80, 'waitlisted'], [85, 80, 'waitlisted'], [86, 80, 'rejected'], [90, 95, 'accepted'], [91, 95, 'waitlisted'], [100, 95, 'waitlisted']] as const)('authored policy roll%s/chance%s produces %s without a world, payment or random draw', (roll, chance, status) => {
  expect(initialAdmissionStatus(roll, chance)).toBe(status);
});
test('policy v1 freezes the actual twelve-country tuition and preserves the existing admission cutoff', () => {
  for (const country of countryCodes) expect(universityTuitionV1[country]).toBe(rules[country].universityTuition);
  expect(admissionChance(55, 40)).toBe(68); expect(admissionChance(100, 100)).toBe(95);
});

test('legacy university enrolment retains its one-draw immediate course/charge behavior without manufacturing admission history', () => {
  const initial = qualified, expectedDraw = randomInteger(initial.random.outcomes, 1, 100), result = resolveCommand(initial, { type: 'enroll', program: 'university', field: 'computing', funding: 'loan' }, true);
  expect(result.universityApplications).toEqual([]); expect(result.random).toEqual({ ...initial.random, outcomes: expectedDraw.state }); expect(result.people[result.activePersonId].education).toMatchObject({ stage: 'university', months: 0, tuitionPaidMonths: 12, tuition: 1400000n });
  expect(result.ledger.slice(initial.ledger.length).map(row => [row.category, row.cashDelta, row.debtDelta])).toEqual([['borrowing', 1400000n, 1400000n], ['tuition', -1400000n, 0n]]);
  const done = ack(result); expect(enrollmentReason(done, 'university', 'computing')).toBe('You are already enrolled'); expect(decodeWorld(encodeWorld(result))).toEqual(result);
});

test('an unchanged pupil’s bounded eight-year application journey resolves real waitlists once, expires the first offer and never starts study or charges tuition', () => {
  let world = qualified; const observed: { year: number; initial: string; final: string }[] = [], reviews: { accepted: boolean; paused: boolean }[] = [];
  const realMonth = admissions.universityAdmissionsMonth;
  const month = jest.spyOn(admissions, 'universityAdmissionsMonth').mockImplementation(value => {
    const before = { random: { ...value.random }, ledger: [...value.ledger], accounts: value.accounts.map(row => ({ ...row })), liabilities: value.liabilities.map(row => ({ ...row })), education: { ...value.people[value.activePersonId].education } }, count = value.universityApplications.filter(item => item.review).length;
    realMonth(value);
    expect(value.random).toEqual(before.random); expect(value.ledger).toEqual(before.ledger); expect(value.accounts).toEqual(before.accounts); expect(value.liabilities).toEqual(before.liabilities); expect(value.people[value.activePersonId].education).toEqual(before.education);
    if (value.universityApplications.filter(item => item.review).length > count) { const item = value.universityApplications.at(-1)!; reviews.push({ accepted: item.status === 'accepted', paused: value.annual?.pausedForPlanning ?? false }); }
  });
  try {
    for (let attempt = 0; attempt < 8; attempt++) {
      if (world.people[world.activePersonId].employment) world = ack(resolveCommand(world, { type: 'quit-job' }, true));
      expect(admissions.universityApplicationReason(world, 'computing')).toBeUndefined();
      const before = world, random = randomInteger(world.random.outcomes, 1, 100);
      world = resolveCommand(world, { type: 'apply-university', field: 'computing' }, true); const application = world.universityApplications.at(-1)!;
      expect(world.random).toEqual({ ...before.random, outcomes: random.state }); expect(world.people).toEqual(before.people); expect(world.ledger).toEqual(before.ledger); expect(world.accounts).toEqual(before.accounts); expect(world.liabilities).toEqual(before.liabilities);
      world = ack(world);
      if (attempt > 0 && application.status === 'accepted') world = ack(resolveCommand(world, { type: 'withdraw-university-application', applicationId: application.id }, true));
      world = year(world, current => {
        const item = current.universityApplications.find(candidate => candidate.id === application.id)!;
        // The fixed policy withdraws later waitlist offers only after their real
        // result has been acknowledged at the ordinary planning pause.
        return application.status === 'waitlisted' && item.status === 'accepted' && !current.pending ? resolveCommand(current, { type: 'withdraw-university-application', applicationId: item.id }, true) : current;
      });
      const final = world.universityApplications.find(item => item.id === application.id)!;
      observed.push({ year: application.applied.year, initial: application.status, final: final.status });
      expect(enrollmentReason(world, 'university', 'computing')).toBeUndefined(); expect(final.enrolment).toBeNull();
    }
    expect(observed[0]).toEqual({ year: 2018, initial: 'accepted', final: 'expired' });
    expect(observed.some(item => item.initial === 'waitlisted')).toBe(true); expect(reviews.length).toBeGreaterThan(0); expect(reviews.every(item => !item.accepted || item.paused)).toBe(true);
    expect(world.universityApplications).toHaveLength(8); expect(world.universityApplications.every(item => item.transitions.length <= 3)).toBe(true); expect(world.people[world.activePersonId].education.stage).toBe('none'); expect(world.ledger.filter(row => row.category === 'tuition')).toEqual([]); expect(world.liabilities.filter(row => row.kind === 'student')).toEqual([]);
    expect(decodeWorld(encodeWorld(world))).toEqual(world);
    process.stdout.write('University archived-pupil eight-year decisions: ' + JSON.stringify(observed) + '\n');
  } finally { month.mockRestore(); }
}, 120000);

test('persisted admission corruption cannot change an accepted quote, receipt, rate, owner or transition history', () => {
  const offered = resolveCommand(qualified, { type: 'apply-university', field: 'computing' }, true), item = offered.universityApplications[0]; expect(item.status).toBe('accepted');
  const enrolled = resolveCommand(ack(offered), { type: 'accept-university-place', applicationId: item.id, funding: 'loan' }, true);
  const corruptions: ((world: World) => void)[] = [
    value => { value.universityApplications[0].annualTuition = 0n; },
    value => { value.universityApplications[0].annualTuition = 1n; },
    value => { value.universityApplications[0].enrolment!.loanInterestBps = 0; },
    value => { value.universityApplications[0].enrolment!.transactionId = null; },
    value => { value.universityApplications[0].enrolment!.billed++; },
    value => { value.universityApplications[0].personId = 'person_missing'; },
    value => { value.universityApplications[0].transitions.shift(); },
    value => { value.universityApplications.push(value.universityApplications[0]); },
    value => { delete value.actionCounts[value.activePersonId + ':education:2018:university:computing']; },
  ];
  for (const corrupt of corruptions) { const invalid = copyWorld(enrolled); corrupt(invalid); expect(() => validateWorld(invalid)).toThrow(); }
  expect(validateWorld(enrolled)).toEqual(enrolled);
});
