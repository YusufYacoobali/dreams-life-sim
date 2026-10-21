import { copyWorld, decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { observeIncompleteStudy } from '../../src/game/systems/studyCourses';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import studying from '../fixtures/v24-university-loan-archive.json';
import graduate from '../fixtures/v3-employed-graduate.json';
import incomplete from '../fixtures/v35-legacy-incomplete-course.json';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function ordinaryYear(initial: World): World {
  let world = resolveCommand(initial, { type: 'advance' }, true), guard = 0;
  while (world.pending || world.annual) {
    if (++guard > 120) throw new Error('Ordinary study continuation stalled');
    const event = world.pending, choice = event?.kind === 'decision' ? event.choices.find(item => !choiceUnavailable(world, item)) : undefined;
    const command: GameCommand = event?.kind === 'decision' ? { type: 'choose', eventId: event.id, choiceId: choice!.id } : event ? { type: 'acknowledge', resultId: event.id } : { type: 'resume' };
    world = resolveCommand(world, command, true);
  }
  return world;
}

test('the unchanged old course completes through real attended months without inventing its earlier admission, start date or first payment', () => {
  const initial = unpackCheckpoint(studying.checkpoint), personId = initial.activePersonId;
  expect(initial.studyCourses).toEqual([]); expect(initial.people[personId].education.months).toBe(12); expect(initial.ledger.filter(row => row.category === 'tuition')).toHaveLength(1);
  let world = initial;
  for (let year = 0; year < 5 && world.people[personId].education.stage !== 'none'; year++) world = ordinaryYear(world);
  expect(world.people[personId].education.qualifications).toContainEqual({ level: 'degree', field: 'computing', year: world.studyCourses[0].ended!.year });
  expect(world.studyCourses).toHaveLength(1); expect(world.studyCourses[0]).toMatchObject({ origin: 'legacy-current', status: 'completed', program: 'university', field: 'computing', months: 48, requiredMonths: 48, tuitionPaidMonths: 48, started: null, firstPayment: null, admissionId: null, country: null, city: null, currency: null });
  expect(world.universityApplications).toEqual([]); expect(world.ledger.slice(0, initial.ledger.length)).toEqual(initial.ledger); expect(world.ledger.filter(row => row.category === 'tuition').map(row => row.cashDelta)).toEqual([-1400000n, -1400000n, -1400000n, -1400000n]); expect(decodeWorld(encodeWorld(world))).toEqual(world);
}, 60000);

test('a genuinely completed old slot is never relabelled as an earlier incomplete course', () => {
  const world = decodeWorld(JSON.stringify(graduate)), before = encodeWorld(world), person = world.people[world.activePersonId]; expect(person.education.months).toBe(48); expect(person.education.requiredMonths).toBe(48); expect(person.education.qualifications.some(item => item.level === 'degree')).toBe(true);
  observeIncompleteStudy(world, person); expect(world.studyCourses).toEqual([]); expect(encodeWorld(world)).toBe(before);
});

test('real legacy withdrawal observations cannot be corrupted into reconstructed past starts or payments', () => {
  const initial = unpackCheckpoint(studying.checkpoint), left = resolveCommand(initial, { type: 'leave-school' }, true); expect(left.studyCourses[0].origin).toBe('legacy-current');
  const corruptions: ((value: World) => void)[] = [
    value => { value.studyCourses[0].started = { ...value.date }; },
    value => { value.studyCourses[0].currency = 'USD'; },
    value => { value.studyCourses[0].country = 'US'; value.studyCourses[0].city = 'New York'; },
    value => { value.studyCourses[0].status = 'completed'; },
    value => { const impossible = { year: value.people[value.activePersonId].born.year - 1, month: 1, day: 1 }; value.studyCourses[0].recorded = impossible; value.studyCourses[0].ended = impossible; },
    value => { value.studyCourses[0].firstPayment = { funding: 'loan', billed: 1400000n, waived: 0n, scholarshipId: null, transactionId: initial.ledger.find(row => row.category === 'tuition')!.id, loanTransactionId: initial.ledger.find(row => row.category === 'borrowing')!.id }; },
  ];
  for (const corrupt of corruptions) { const invalid = copyWorld(left); corrupt(invalid); expect(() => validateWorld(invalid)).toThrow(); }
  expect(left.ledger).toEqual(initial.ledger); expect(left.liabilities).toEqual(initial.liabilities); expect(left.accounts).toEqual(initial.accounts); expect(left.random).toEqual(initial.random);
});

test('the separately pinned old producer uses only original leave and acknowledgement, preserving a real incomplete slot for later observation', () => {
  const sha = (bytes: string | Buffer) => createHash('sha256').update(bytes).digest('hex');
  expect(incomplete.sourceBefore).toEqual(incomplete.sourceAfter); expect(incomplete.sourceBefore.gitRevision).toBe('6f4b34c40005f5fba8eeee540bada9e0787ccbb0'); expect(incomplete.sourceBefore.game).toBe('24a5a40521b31fa94eca4c4d161bbbd74e24c460a08bc675afcd340e392e7ba5');
  expect(incomplete.input.sha256).toBe(sha(readFileSync(join(__dirname, '../fixtures/v24-university-loan-archive.json')))); expect(incomplete.captureToolSha256).toBe(sha(readFileSync(join(__dirname, '../support/capture-legacy-incomplete-course.cjs')))); expect(sha(incomplete.before.checkpoint)).toBe(incomplete.before.checkpointSha256); expect(sha(incomplete.after.checkpoint)).toBe(incomplete.after.checkpointSha256); expect(incomplete.commands).toEqual([{ type: 'leave-school' }, { type: 'acknowledge', resultId: incomplete.leftResult.pending.id }]);
  const before = unpackCheckpoint(incomplete.before.checkpoint), after = unpackCheckpoint(incomplete.after.checkpoint); expect(after.date).toEqual(before.date); expect(after.people[after.activePersonId].education).toEqual({ ...before.people[before.activePersonId].education, stage: 'none', paused: false }); expect(after.studyCourses).toEqual([]); expect(after.universityApplications).toEqual([]);
  for (const key of ['ledger', 'accounts', 'liabilities', 'random'] as const) expect(after[key]).toEqual(before[key]);
});
