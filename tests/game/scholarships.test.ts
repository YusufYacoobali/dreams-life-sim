import { gunzipSync, strFromU8 } from 'fflate';
import { createLife, randomCreation } from '../../src/game/createLife';
import { countries, countryCodes, CountryCode } from '../../src/game/countries';
import { monthFrom } from '../../src/game/calendar';
import { GameCommand, recordDeath, resolveCommand } from '../../src/game/engine';
import { decodeWorld, encodeWorld, validateWorld, World } from '../../src/game/model';
import { randomInteger } from '../../src/game/random';
import { rules } from '../../src/game/rules';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { educationMonth, tuitionFor } from '../../src/game/systems/education';
import { accountFor } from '../../src/game/systems/common';
import { activeScholarship, scholarshipPolicies } from '../../src/game/systems/scholarshipSchemas';
import { refreshScholarships, scholarshipOfferReason, scholarshipReason, scholarshipResources, scholarshipWaiver } from '../../src/game/systems/scholarships';
import { ownHousehold } from '../../src/game/systems/households';
import { childrenOf } from '../../src/game/systems/family';
import { tripQuote } from '../../src/game/systems/travel';
import { moveQuote, relocationFee } from '../../src/game/systems/relocation';
import { isConfined } from '../../src/game/systems/legalSchemas';
import { decodeSave } from '../../src/persistence/archive';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import archive from '../fixtures/v24-university-loan-archive.json';
import birthArchive from '../fixtures/v6-birth-result.json';

function seedFor(first: (roll: number) => boolean, second = (_roll: number) => true) {
  for (let seed = 0; seed < 1000; seed++) { const a = randomInteger(seed, 1, 100), b = randomInteger(a.state, 1, 100); if (first(a.value) && second(b.value)) return seed; }
  throw new Error('No test seed');
}
function fixture(country: CountryCode = 'US', grade = 90) {
  const world = createLife('life_scholarship', 42, { ...randomCreation(42), country, city: countries[country].cities[0] }, { year: 2000, month: 1, day: 1 });
  world.birthAcknowledged = true; world.date.year = 2020;
  const player = world.people[world.activePersonId]; ownHousehold(world, player);
  player.stats.smarts = 90; player.stats.health = 100; player.education.grades = grade; player.education.effort = 'focused';
  player.education.qualifications = [{ level: 'secondary', field: 'general', year: 2019 }];
  world.random.outcomes = seedFor(roll => roll <= 65, roll => roll <= 95);
  return validateWorld(world);
}
function drain(initial: World) {
  let world = initial, guard = 0;
  while ((world.pending || world.annual) && guard++ < 150) {
    if (world.pending?.kind === 'decision') { const choice = world.pending.choices.find(item => !choiceUnavailable(world, item))!; world = resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: choice.id }); }
    else if (world.pending) world = resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
    else world = resolveCommand(world, { type: 'resume' });
  }
  if (guard >= 150) throw new Error('Unfinished year'); return world;
}
const act = (world: World, command: GameCommand) => drain(resolveCommand(world, command));
const offer = (world = fixture(), kind: 'merit' | 'access' = 'merit') => act(world, { type: 'apply-scholarship', kind, program: 'university', field: 'computing' });
function enroll(world = offer(), funding: 'cash' | 'loan' = 'loan') { return act(world, { type: 'enroll', program: 'university', field: 'computing', funding, scholarshipId: world.scholarships.at(-1)!.id }); }
function month(world: World) { world.date = monthFrom(world.date, 1); educationMonth(world, world.people[world.activePersonId]); refreshScholarships(world); validateWorld(world); }
function fund(world: World, amount: bigint) { const account = accountFor(world); account.cash += amount; account.openingCash += amount; }

test.each(countryCodes)('%s scholarship reduces the actual local tuition bill and student loan, never creating a cash grant', country => {
  const offered = offer(fixture(country)), before = accountFor(offered).cash, world = enroll(offered), item = activeScholarship(world)!;
  const tuition = rules[country].universityTuition, waived = tuition * 7500n / 10000n, billed = tuition - waived;
  expect(item.periods).toHaveLength(1); expect(item.periods[0]).toMatchObject({ studyMonth: 0, grossTuition: tuition, waived, billed, funding: 'loan' });
  expect(world.liabilities.find(debt => debt.kind === 'student')?.principal).toBe(billed);
  expect(world.ledger.filter(row => row.category === 'tuition').map(row => row.cashDelta)).toEqual([-billed]);
  expect(accountFor(world).cash).toBe(before); expect(item.currency).toBe(countries[country].currency);
  expect(world.people[world.activePersonId].education.months).toBe(0); expect(decodeWorld(encodeWorld(world))).toEqual(world);
});
test('browsing and application give no cash, loan, tuition payment, study credit or qualification; exactly one saved draw is consumed', () => {
  const initial = fixture(), before = encodeWorld(initial), expected = randomInteger(initial.random.outcomes, 1, 100);
  expect(scholarshipReason(initial, 'merit', 'university', 'computing')).toBeUndefined(); scholarshipResources(initial);
  expect(encodeWorld(initial)).toBe(before);
  const world = offer(initial), item = world.scholarships[0];
  expect(item).toMatchObject({ status: 'offered', roll: expected.value, periods: [], course: null });
  expect(world.random).toEqual({ ...initial.random, outcomes: expected.state });
  for (const key of ['accounts', 'liabilities', 'ledger', 'people'] as const) expect(world[key]).toEqual(initial[key]);
  expect(() => resolveCommand(world, { type: 'apply-scholarship', kind: 'access', program: 'university', field: 'computing' })).toThrow(/existing scholarship/);
});
test('a declined free application stays declined on cold decode and cannot be rerolled this year', () => {
  const initial = fixture(); initial.random.outcomes = seedFor(roll => roll > 85);
  const world = offer(initial); expect(world.scholarships[0].status).toBe('declined');
  expect(world.accounts).toEqual(initial.accounts); expect(world.ledger).toEqual(initial.ledger);
  expect(decodeWorld(encodeWorld(world)).scholarships).toEqual(world.scholarships);
  expect(() => offer(world)).toThrow(/already applied/);
});
test('entry grades, real secondary qualification, ongoing work/study and actual resources gate applications', () => {
  expect(scholarshipReason(fixture('US', 79), 'merit', 'university', 'computing')).toMatch(/80%/);
  expect(scholarshipReason(fixture('US', 59), 'access', 'university', 'computing')).toMatch(/60%/);
  const rich = fixture(); fund(rich, rules.US.universityTuition + 1n);
  expect(scholarshipReason(rich, 'access', 'university', 'computing')).toMatch(/resources/);
  const unqualified = fixture(); unqualified.people[unqualified.activePersonId].education.qualifications = [];
  expect(() => offer(unqualified)).toThrow(/secondary/);
  expect(scholarshipReason(enroll(), 'merit', 'university', 'science')).toMatch(/already enrolled/);
});
test('a full access waiver charges and borrows nothing, including when loan funding was selected', () => {
  const world = enroll(offer(fixture('US', 60), 'access')), item = activeScholarship(world)!;
  expect(item.periods[0]).toMatchObject({ waived: rules.US.universityTuition, billed: 0n, transactionId: null, loanTransactionId: null });
  expect(world.ledger).toEqual([]); expect(world.liabilities).toEqual([]); expect(accountFor(world).cash).toBe(0n);
});
test('cash funding spends only the remainder; locked minor trust funds cannot pay it', () => {
  const initial = fixture(), tuition = rules.US.universityTuition, remainder = tuition / 4n; fund(initial, remainder);
  const offered = offer(initial), locked = decodeWorld(encodeWorld(offered)); accountFor(locked).lockedCash = remainder;
  expect(() => enroll(locked, 'cash')).toThrow(/balance/);
  const world = enroll(offered, 'cash'); expect(accountFor(world).cash).toBe(0n); expect(world.liabilities).toEqual([]);
  expect(world.ledger[0].cashDelta).toBe(-remainder); expect(activeScholarship(world)!.periods[0].loanTransactionId).toBeNull();
});
test('an offer cannot be transferred to another subject, forged, replayed or applied retroactively', () => {
  const offered = offer(), item = offered.scholarships[0], before = encodeWorld(offered);
  expect(() => resolveCommand(offered, { type: 'enroll', program: 'university', field: 'science', funding: 'loan', scholarshipId: item.id })).toThrow(/matches/);
  expect(() => resolveCommand(offered, { type: 'enroll', program: 'university', field: 'computing', funding: 'loan', scholarshipId: 'missing' })).toThrow(/available scholarship/);
  expect(encodeWorld(offered)).toBe(before);
  const world = enroll(offered); expect(() => resolveCommand(world, { type: 'decline-scholarship', scholarshipId: item.id })).toThrow(/available/);
  expect(() => enroll(world)).toThrow(/already enrolled/);
});
test('the exact expiry boundary removes an unused offer without money, RNG or study changes', () => {
  const world = offer(), item = world.scholarships[0], random = { ...world.random };
  world.date = monthFrom(item.expires, -1); refreshScholarships(world); expect(item.status).toBe('offered');
  world.date = { ...item.expires }; refreshScholarships(world); expect(item.status).toBe('expired');
  expect(world.random).toEqual(random); expect(world.ledger).toEqual([]); validateWorld(world);
});
test('declining preserves the offer history and cannot grant another roll for the same award/course/year', () => {
  const offered = offer(), world = act(offered, { type: 'decline-scholarship', scholarshipId: offered.scholarships[0].id });
  expect(world.scholarships[0]).toMatchObject({ status: 'withdrawn', course: null, periods: [] });
  expect(() => offer(world)).toThrow(/already applied/); expect(world.random).toEqual(offered.random);
});
test('admission remains a separate saved draw; rejection uses no waiver, payment or loan', () => {
  const offered = offer(); offered.random.outcomes = seedFor(roll => roll > 95);
  const world = enroll(offered); expect(world.people[world.activePersonId].education.stage).toBe('none');
  expect(world.scholarships[0]).toMatchObject({ status: 'offered', course: null, periods: [] });
  expect(world.ledger).toEqual([]); expect(world.liabilities).toEqual([]);
});
test('four funded years complete a real degree; no birthday grants an extra award or duplicate year', () => {
  const world = enroll(); for (let i = 0; i < 48; i++) month(world);
  const item = world.scholarships[0], tuition = rules.US.universityTuition;
  expect(item.status).toBe('completed'); expect(item.periods.map(p => p.studyMonth)).toEqual([0, 12, 24, 36]);
  expect(item.periods.reduce((sum, p) => sum + p.waived, 0n)).toBe(tuition * 3n);
  expect(world.liabilities.find(debt => debt.kind === 'student')?.principal).toBe(tuition);
  expect(world.people[world.activePersonId].education.qualifications.filter(q => q.level === 'degree')).toHaveLength(1);
  const before = encodeWorld(world); educationMonth(world, world.people[world.activePersonId]); expect(encodeWorld(world)).toBe(before);
});
test('hospital absence uses no study months, tuition periods or renewal; actual attendance resumes later', () => {
  const world = enroll(), player = world.people[world.activePersonId];
  player.health.hospitalizedUntil = world.date.year * 12 + world.date.month + 5;
  for (let i = 0; i < 4; i++) month(world);
  expect(player.education.months).toBe(0); expect(world.scholarships[0].periods).toHaveLength(1);
  player.health.hospitalizedUntil = null; for (let i = 0; i < 13; i++) month(world);
  expect(player.education.months).toBe(13); expect(world.scholarships[0].periods).toHaveLength(2);
});
test('falling below the renewal grade ends future aid; insufficient cash pauses without losing completed study', () => {
  const initial = fixture(); fund(initial, rules.US.universityTuition / 4n); const world = enroll(offer(initial), 'cash');
  for (let i = 0; i < 12; i++) month(world);
  const player = world.people[world.activePersonId]; player.education.grades = 69; month(world);
  expect(world.scholarships[0]).toMatchObject({ status: 'lost', lossReason: 'grades' });
  expect(player.education.paused).toBe(true); expect(player.education.months).toBe(12); expect(world.scholarships[0].periods).toHaveLength(1);
  const resumed = act(world, { type: 'fund-studies', funding: 'loan' });
  expect(resumed.liabilities.find(debt => debt.kind === 'student')?.principal).toBe(rules.US.universityTuition);
  expect(resumed.people[resumed.activePersonId].education.months).toBe(12); expect(resumed.scholarships[0].periods).toHaveLength(1);
});
test('new resources end access aid at renewal; there is no clawback of completed study or past tuition waiver', () => {
  const world = enroll(offer(fixture(), 'access')); for (let i = 0; i < 12; i++) month(world);
  fund(world, rules.US.universityTuition + 1n); month(world);
  expect(world.scholarships[0]).toMatchObject({ status: 'lost', lossReason: 'resources' });
  expect(world.scholarships[0].periods).toHaveLength(1); expect(world.people[world.activePersonId].education.months).toBe(13);
  expect(world.liabilities.find(debt => debt.kind === 'student')?.principal).toBe(rules.US.universityTuition);
});
test('leaving the actual course retains its paid period and debt and prevents future waiver reuse', () => {
  const enrolled = enroll(), world = act(enrolled, { type: 'leave-school' });
  expect(world.scholarships[0].status).toBe('withdrawn'); expect(world.scholarships[0].periods).toEqual(enrolled.scholarships[0].periods);
  expect(world.liabilities).toEqual(enrolled.liabilities);
  expect(scholarshipOfferReason(world, world.scholarships[0], 'university', 'computing')).toMatch(/matches/);
});
test('death closes real aid before estate settlement and cannot transfer an award to a child', () => {
  const world = enroll(), id = world.activePersonId; recordDeath(world, id, 'test fixture mortality'); validateWorld(world);
  expect(world.scholarships[0].status).toBe('died'); expect(activeScholarship(world)).toBeUndefined();
  expect(world.scholarships[0].personId).toBe(id); expect(world.scholarships[0].periods).toHaveLength(1);
});
test('genuine world-24 tuition, debt, school result, RNG and both historical moments migrate without retroactive awards', () => {
  const save = decodeSave(JSON.stringify(archive)), raw = (text: string) => JSON.parse(strFromU8(gunzipSync(Buffer.from(JSON.parse(text).data, 'base64'))));
  const original = [raw(archive.checkpoint), ...archive.snapshots.map(item => raw(item.payload))], worlds = [save.world, ...save.snapshots.map(item => unpackCheckpoint(item.payload))];
  worlds.forEach((world, index) => { const encoded = JSON.parse(encodeWorld(world)); expect(original[index].schemaVersion).toBe(24); expect(world.schemaVersion).toBe(37); expect(world.scholarships).toEqual([]); for (const key of Object.keys(original[index]).filter(key => !['schemaVersion', 'engineVersion', 'contentVersion'].includes(key))) expect(encoded[key]).toEqual(original[index][key]); });
  const player = save.world.people[save.world.activePersonId]; expect(player.education.months).toBe(12);
  const before = save.world.ledger.filter(row => row.category === 'tuition'); month(save.world);
  expect(save.world.scholarships).toEqual([]); expect(save.world.ledger.filter(row => row.category === 'tuition')).toHaveLength(before.length + 1);
  expect(save.world.ledger.at(-1)!.cashDelta).toBe(-player.education.tuition);
});
test.each(['amount', 'loan', 'duplicate', 'grade', 'roll', 'person'] as const)('contradictory imported scholarship %s is rejected', change => {
  const world = enroll(), item = world.scholarships[0];
  if (change === 'amount') item.periods[0].waived++;
  if (change === 'loan') item.periods[0].loanTransactionId = item.periods[0].transactionId;
  if (change === 'duplicate') world.scholarships.push(structuredClone(item));
  if (change === 'grade') item.periods[0].grades = 79;
  if (change === 'roll') item.roll = 100;
  if (change === 'person') item.personId = 'person_missing';
  expect(() => validateWorld(world)).toThrow();
});
test('tuition waiver rounds down in local minor units, leaving the exact remainder payable', () => {
  expect(scholarshipWaiver(scholarshipPolicies.merit, 7n)).toBe(5n);
  expect(tuitionFor(fixture('JP').people.person_player, 'university')).toBe(rules.JP.universityTuition);
});
test.each([['trade', 'computing', 24, 'trade'], ['graduate', 'law', 36, 'law'], ['graduate', 'medicine', 48, 'medicine']] as const)('%s %s aid ends after its actual %i-month course', (program, field, duration, level) => {
  let world = fixture();
  if (program === 'graduate') world.people[world.activePersonId].education.qualifications.push({ level: 'degree', field: 'computing', year: 2019 });
  world = act(world, { type: 'apply-scholarship', kind: 'merit', program, field });
  world = act(world, { type: 'enroll', program, field, funding: 'loan', scholarshipId: world.scholarships[0].id });
  for (let i = 0; i < duration; i++) month(world);
  expect(world.scholarships[0].status).toBe('completed'); expect(world.scholarships[0].periods).toHaveLength(duration / 12);
  expect(world.people[world.activePersonId].education.qualifications.some(item => item.level === level && item.field === field)).toBe(true);
});
test('a final failed course keeps actual tuition waivers but awards no degree', () => {
  const world = enroll(); for (let i = 0; i < 47; i++) month(world);
  world.people[world.activePersonId].education.grades = 0; month(world);
  expect(world.scholarships[0].status).toBe('failed'); expect(world.scholarships[0].periods).toHaveLength(4);
  expect(world.people[world.activePersonId].education.qualifications.some(item => item.level === 'degree')).toBe(false);
});
test('an actual one-month holiday pauses attendance; extended travel requires leaving full-time study first', () => {
  const initial = fixture(); fund(initial, 100000000n); let world = enroll(offer(initial));
  expect(() => resolveCommand(world, { type: 'book-trip', destinationId: 'paris', duration: 3, companionIds: [], focus: 'sightseeing', quotedTotal: tripQuote(world, 'paris', 3).total })).toThrow(/Extended travel/);
  world = act(world, { type: 'book-trip', destinationId: 'paris', duration: 1, companionIds: [], focus: 'sightseeing', quotedTotal: tripQuote(world, 'paris', 1).total });
  const id = world.scholarships[0].id; world = act(world, { type: 'advance' });
  expect(world.trips[0].periods).toHaveLength(1); expect(world.people[world.activePersonId].education.months).toBe(11);
  expect(world.scholarships[0]).toMatchObject({ id, status: 'active' }); expect(world.scholarships[0].periods).toHaveLength(1);
});
test('real remand pauses current university attendance; custody cannot apply for another award', () => {
  const initial = enroll(); fund(initial, 10000000n); let arrested: World | undefined;
  for (let seed = 1; seed < 100; seed++) { const candidate = validateWorld(initial); candidate.random.outcomes = seed; const next = resolveCommand(candidate, { type: 'crime', offence: 'vandalism' }); if (next.pending?.kind === 'decision') { arrested = next; break; } }
  if (!arrested || arrested.pending?.kind !== 'decision') throw new Error('No actual arrest seed');
  const world = act(arrested, { type: 'choose', eventId: arrested.pending.id, choiceId: 'remand' }); expect(isConfined(world)).toBe(true);
  const months = world.people[world.activePersonId].education.months; month(world);
  expect(world.people[world.activePersonId].education.months).toBe(months); expect(world.scholarships[0].periods).toHaveLength(1);
  expect(() => offer(world, 'access')).toThrow(/custody/);
});
test('an actual permanent move closes the old local offer without transferring or paying it abroad', () => {
  const initial = offer(); fund(initial, 100000000n); let world = initial;
  const choice = { destinationId: 'rome' as const, route: 'settlement' as const, roleId: null, program: null, field: null };
  for (let seed = 1; seed < 100; seed++) { const candidate = validateWorld(initial); candidate.random.outcomes = seed; const next = act(candidate, { type: 'apply-relocation', ...choice, quotedFee: relocationFee(candidate) }); if (next.relocations.at(-1)?.status === 'approved') { world = next; break; } }
  const application = world.relocations.at(-1)!; expect(application.status).toBe('approved');
  world = act(world, { type: 'relocate', applicationId: application.id, companionIds: [], reserveMonths: 3, reviewedQuote: moveQuote(world, application, [], 3) });
  expect(world.people[world.activePersonId].country).toBe('IT'); expect(world.scholarships[0]).toMatchObject({ status: 'moved', periods: [], course: null, country: 'US' });
  expect(world.ledger.some(item => item.category === 'tuition')).toBe(false);
});
test('an existing newborn inherits the real estate and identity while the deceased parent’s professional scholarship remains closed', () => {
  let world = drain(decodeWorld(JSON.stringify(birthArchive))); world = act(world, { type: 'quit-job' });
  world.random.outcomes = seedFor(roll => roll <= 85, roll => roll <= 95);
  world = act(world, { type: 'apply-scholarship', kind: 'merit', program: 'graduate', field: 'law' });
  world = act(world, { type: 'enroll', program: 'graduate', field: 'law', funding: 'loan', scholarshipId: world.scholarships[0].id });
  const parent = world.activePersonId, child = childrenOf(world)[0].id, period = world.scholarships[0].periods[0];
  recordDeath(world, parent, 'test fixture mortality'); world = resolveCommand(world, { type: 'continue-child', personId: child });
  expect(world.activePersonId).toBe(child); expect(activeScholarship(world)).toBeUndefined();
  expect(world.scholarships[0]).toMatchObject({ personId: parent, status: 'died', periods: [period] });
  expect(world.people[child].education.qualifications).toEqual([]); expect(decodeWorld(encodeWorld(world))).toEqual(world);
});
test('a forged renewal loss cannot replace the actual saved grade/resource assessment', () => {
  const world = enroll(); for (let i = 0; i < 12; i++) month(world); world.people[world.activePersonId].education.grades = 69; month(world);
  expect(world.scholarships[0].lossAssessment).toMatchObject({ studyMonth: 12, grades: 69 });
  world.scholarships[0].lossReason = 'resources'; expect(() => validateWorld(world)).toThrow(/renewal/);
});
