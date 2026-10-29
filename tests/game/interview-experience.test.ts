import { jobs } from '../../src/game/content/jobs';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { copyWorld, encodeWorld, moneyJSON, validateWorld, type World } from '../../src/game/model';
import { paidInterviewExperience } from '../../src/game/systems/interviewExperience';
import { jobInterviewChance } from '../../src/game/systems/work';
import { randomInteger } from '../../src/game/random';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import native from '../fixtures/v32-native-hourly-checkpoints.json';

const role = (id: string) => jobs.find(row => row.id === id)!;
const original = () => unpackCheckpoint(native.checkpoints.final.payload);
const command = (world: World, input: GameCommand) => resolveCommand(world, input, true);
const ack = (world: World) => command(world, { type: 'acknowledge', resultId: world.pending!.id });
const quit = (world: World) => ack(command(world, { type: 'quit-job' }));
function cold(world: World) {
  const resumed = unpackCheckpoint(packCheckpoint(world)); expect(encodeWorld(resumed)).toBe(encodeWorld(world)); return resumed;
}
function interview(world: World) {
  if (world.pending?.kind !== 'decision' || world.pending.templateId !== 'job-interview') throw new Error('Expected a real interview');
  return world.pending;
}

test('genuine paid Retail and Hospitality history has distinct relevant experience without granting work or changing source data', () => {
  const world = original(), before = encodeWorld(world);
  expect(paidInterviewExperience(world, role('retail'))).toEqual({ paidMonths: 12, bonus: 2 });
  expect(paidInterviewExperience(world, role('barista'))).toEqual({ paidMonths: 30, bonus: 5 });
  expect(paidInterviewExperience(world, role('cleaner'))).toEqual({ paidMonths: 0, bonus: 0 });
  expect(paidInterviewExperience(world, role('screen-actor'))).toEqual({ paidMonths: 0, bonus: 0 });
  expect(encodeWorld(world)).toBe(before);
});

test.each([[0, 0], [5, 0], [6, 1], [11, 1], [12, 2]])('explicit hourly evidence boundary %i months gives only %i points', (count, bonus) => {
  // Isolated evidence truncation, not an edited/earned ordinary gameplay journey.
  const world = original(), contract = world.hourlyContracts[0];
  const boundary = { ...world, hourlyContracts: [{ ...contract, periods: contract.periods.slice(0, count) }] };
  expect(paidInterviewExperience(boundary, role('retail'))).toEqual({ paidMonths: count, bonus });
});

test.each([[29, 4], [30, 5], [31, 5]])('genuine salaried receipt subset %i months respects the %i-point cap', (count, bonus) => {
  // Isolated omission of real evidence; no extra tenure, receipt, money or date.
  const world = original(), receipts = world.ledger.filter(row => row.personId === world.activePersonId && row.description === 'Employment pay' && row.cashDelta > 0n);
  expect(receipts.length).toBeGreaterThanOrEqual(31);
  const retained = new Set(receipts.slice(0, count).map(row => row.id));
  const ledger = world.ledger.filter(row => row.personId !== world.activePersonId || row.description !== 'Employment pay' || retained.has(row.id));
  expect(paidInterviewExperience({ ...world, ledger }, role('barista'))).toEqual({ paidMonths: Math.min(30, count), bonus });
});

test('paid hourly months require actual worked period/receipt identity and distinct calendar months, independent of amount or residence', () => {
  const world = original(), contract = world.hourlyContracts[0], rows = contract.periods;
  // Arranged helper boundaries: no command, saved-world or country-move claim.
  const periods = [rows[0], rows[0], { ...rows[1], attendance: 'hospital' as const }, { ...rows[2], attendance: 'paid-leave' as const }, { ...rows[3], attendance: 'background' as const }, { ...rows[4], transactionId: null }, { ...rows[5], gross: 0n }, { ...rows[6], workedMinutes: 0 }, { ...rows[7], transactionId: rows[0].transactionId }, ...rows.slice(8)];
  expect(paidInterviewExperience({ ...world, hourlyContracts: [{ ...contract, periods }] }, role('retail'))).toEqual({ paidMonths: 5, bonus: 0 });
  const foreign = { ...world, workHistory: world.workHistory.map(row => row.id === contract.employmentId ? { ...row, currency: 'JPY' as const } : row), hourlyContracts: [{ ...contract, currency: 'JPY' as const }], ledger: world.ledger.map(row => rows.some(period => period.transactionId === row.id) ? { ...row, currency: 'JPY' as const } : row) };
  expect(paidInterviewExperience(foreign, role('retail'))).toEqual({ paidMonths: 12, bonus: 2 });
});

test('unrelated, company, special and zero-paid competing contracts make salaried attribution ambiguous before relevance filtering', () => {
  const world = original(), actual = world.workHistory.find(row => row.personId === world.activePersonId && row.roleId === 'barista')!;
  for (const extra of [{ roleId: 'cleaner', companyId: null }, { roleId: 'barista', companyId: 'arranged-company' }, { roleId: 'screen-actor', companyId: null }]) {
    // Ambiguity unit setup only; the genuine world itself is left exact.
    const competing = { ...actual, ...extra, id: 'arranged-competing', monthsWorked: 0, grossEarned: 0n };
    expect(paidInterviewExperience({ ...world, workHistory: [...world.workHistory, competing] }, role('barista'))).toEqual({ paidMonths: 0, bonus: 0 });
  }
  expect(paidInterviewExperience({ ...world, workHistory: world.workHistory.map(row => row.id === actual.id ? { ...row, companyId: 'arranged-company' } : row) }, role('barista'))).toEqual({ paidMonths: 0, bonus: 0 });
});

test('tenure/gross alone, other people, background income, pensions and back pay cannot manufacture paid experience', () => {
  const world = original();
  expect(paidInterviewExperience({ ...world, ledger: [] }, role('barista'))).toEqual({ paidMonths: 0, bonus: 0 });
  for (const description of ['Pension payment', 'Outstanding wages paid', 'Recorded employment pay for 48 months']) {
    const ledger = world.ledger.map(row => row.personId === world.activePersonId && row.description === 'Employment pay' ? { ...row, description } : row);
    expect(paidInterviewExperience({ ...world, ledger }, role('barista'))).toEqual({ paidMonths: 0, bonus: 0 });
  }
  const ledger = world.ledger.map(row => row.personId === world.activePersonId ? { ...row, personId: 'another-person' } : row);
  expect(paidInterviewExperience({ ...world, ledger }, role('retail'))).toEqual({ paidMonths: 0, bonus: 0 });
});

test('normal resignation/application binds truthful paid experience and answer-specific bounded chances, with no preview draw or payment', () => {
  const world = quit(original()), before = encodeWorld(world), pending = cold(command(world, { type: 'apply-job', roleId: 'retail' }));
  expect(interview(pending).body).toContain('12 recorded paid months in Retail. Experience can add up to 2 percentage points');
  for (const choice of interview(pending).choices) {
    const effect = choice.effects[0]; if (effect.kind !== 'job-interview') throw new Error('Expected interview effect');
    expect(effect.experience).toEqual({ policyVersion: 1, paidMonths: 12, bonus: 2, chance: choice.id === 'withdraw' ? null : jobInterviewChance(world, ({ careful: 10, rush: -10, avoid: -20 } as Record<string, number>)[choice.id], 2) });
  }
  expect(pending.random).toEqual(world.random); expect(pending.accounts).toEqual(world.accounts); expect(pending.ledger).toEqual(world.ledger); expect(pending.workHistory).toEqual(world.workHistory); expect(pending.people).toEqual(world.people); expect(encodeWorld(world)).toBe(before);
  const nextDraw = randomInteger(pending.random.outcomes, 1, 100), choice = interview(pending).choices[1], effect = choice.effects[0];
  if (effect.kind !== 'job-interview') throw new Error('Expected interview effect');
  const result = cold(command(pending, { type: 'choose', eventId: pending.pending!.id, choiceId: choice.id }));
  expect(result.pending?.title).toBe(nextDraw.value <= effect.experience!.chance! ? 'You got the job' : 'They chose another applicant');
  expect(result.random).toEqual({ ...pending.random, outcomes: nextDraw.state }); expect(result.accounts).toEqual(pending.accounts); expect(result.ledger).toEqual(pending.ledger);
  const withdrawn = cold(command(pending, { type: 'choose', eventId: pending.pending!.id, choiceId: 'withdraw' }));
  expect(withdrawn.random).toEqual(pending.random); expect(withdrawn.people).toEqual(pending.people); expect(withdrawn.workHistory).toEqual(pending.workHistory);
});

test('chance bonus is modest and retains both original probability bounds', () => {
  const world = copyWorld(original()), person = world.people[world.activePersonId];
  // Explicit scalar probability boundaries, no changed-state command or seed search.
  Object.assign(person.stats, { smarts: 30, respect: 30, discipline: 30, fame: 0 });
  expect(jobInterviewChance(world, -10)).toBe(45); expect(jobInterviewChance(world, -10, 2)).toBe(47);
  Object.assign(person.stats, { smarts: 100, respect: 100, discipline: 100, fame: 100 }); expect(jobInterviewChance(world, 10, 5)).toBe(95);
  expect(jobInterviewChance(world, -100, 5)).toBe(15);
});

test('one fixed genuine continuation earns its next paid year normally after the new experience-aware interview', () => {
  const initial = original(), pending = command(initial, { type: 'apply-job', roleId: 'retail' });
  const hired = command(pending, { type: 'choose', eventId: pending.pending!.id, choiceId: 'careful' });
  expect(hired.pending?.title).toBe('You got the job');
  expect(hired.accounts).toEqual(initial.accounts); expect(hired.ledger).toEqual(initial.ledger);
  const job = hired.people[hired.activePersonId].employment!; expect(job).toMatchObject({ roleId: 'retail', rank: 0, paidMonths: 0 });
  let world = command(ack(hired), { type: 'advance' });
  for (let count = 0; count < 100 && (world.pending || world.annual); count++) {
    if (world.pending?.kind === 'decision') {
      const choice = world.pending.choices.find(row => !choiceUnavailable(world, row)); if (!choice) throw new Error('No available ordinary decision');
      world = command(world, { type: 'choose', eventId: world.pending.id, choiceId: choice.id });
    } else if (world.pending) world = ack(world);
    else world = command(world, { type: 'resume' });
  }
  expect(world.pending).toBeNull(); expect(world.annual).toBeNull(); expect(world.date.year).toBe(initial.date.year + 1);
  const history = world.workHistory.find(row => row.id === job.id)!;
  expect(history.monthsWorked).toBe(12); expect(history.grossEarned).toBeGreaterThan(0n);
  expect(world.ledger.slice(initial.ledger.length).filter(row => row.personId === world.activePersonId && row.category === 'income' && row.description === 'Employment pay').reduce((sum, row) => sum + row.cashDelta, 0n)).toBe(history.grossEarned);
  expect(paidInterviewExperience(world, role('retail'))).toEqual({ paidMonths: 24, bonus: 4 });
  expect(cold(world)).toEqual(world); expect(encodeWorld(initial)).toBe(encodeWorld(original()));
});

test.each(['paidMonths', 'bonus', 'chance', 'mixed'] as const)('forged or inconsistent %s quote refuses before randomness or source mutation', field => {
  const world = copyWorld(command(quit(original()), { type: 'apply-job', roleId: 'retail' })), originalText = encodeWorld(world), choices = interview(world).choices;
  const effect = choices[0].effects[0]; if (effect.kind !== 'job-interview') throw new Error('Expected effect');
  if (field === 'mixed') delete effect.experience;
  else effect.experience![field] = (effect.experience![field] ?? 0) + 1;
  expect(() => validateWorld(world)).toThrow(/experience|chance|quote|bound|expected/i);
  const altered = JSON.stringify(world, moneyJSON);
  expect(() => command(world, { type: 'choose', eventId: world.pending!.id, choiceId: choices[0].id })).toThrow(/experience/i);
  expect(JSON.stringify(world, moneyJSON)).toBe(altered); expect(originalText).not.toBe(altered);
});

test('the genuine saved old interview/result and their exact legacy chance/one draw remain unchanged', () => {
  const old = cold(unpackCheckpoint(native.checkpoints.interview.payload)), bound = structuredClone(old.pending), journal = structuredClone(old.journal);
  for (const choice of interview(old).choices) {
    const effect = choice.effects[0]; expect(effect.kind).toBe('job-interview'); expect(effect).not.toHaveProperty('experience');
  }
  const hired = cold(command(old, { type: 'choose', eventId: old.pending!.id, choiceId: 'careful' }));
  expect(hired).toEqual(unpackCheckpoint(native.checkpoints.hired.payload)); expect(old.pending).toEqual(bound); expect(hired.journal.slice(0, journal.length)).toEqual(journal);
  expect(hired.random).toEqual({ ...old.random, outcomes: randomInteger(old.random.outcomes, 1, 100).state });
  const withdrawn = cold(command(old, { type: 'choose', eventId: old.pending!.id, choiceId: 'withdraw' })); expect(withdrawn.random).toEqual(old.random);
});
