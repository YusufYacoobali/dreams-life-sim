import { monthFrom } from '../../src/game/calendar';
import { countries } from '../../src/game/countries';
import { ageOn, copyWorld, decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { accountFor } from '../../src/game/systems/common';
import { educationMonth } from '../../src/game/systems/education';
import { financeMonth } from '../../src/game/systems/finance';
import { financialActors } from '../../src/game/systems/households';
import { relationFor } from '../../src/game/systems/relationshipQueries';
import { rules } from '../../src/game/rules';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { campusClubReason, campusCourse, campusIntroductionReason, campusMonth, campusReason, currentCampus, prepareCampusTuition } from '../../src/game/systems/campus';
import { startStudy } from '../support/studyStory';
import graduate from '../fixtures/v3-employed-graduate.json';

function act(world: World, command: GameCommand): World {
  const next = resolveCommand(world, command, true);
  if (next.pending?.kind !== 'result') throw new Error('Expected an actual campus setup result');
  return resolveCommand(next, { type: 'acknowledge', resultId: next.pending.id }, true);
}

/** Monthly-system unit continuation, using the production calendar and actual
 * education hooks in engine order. It is not a complete annual/natural journey.
 * Optional living costs use the real finance function on the real saved peers. */
function attend(world: World, peerLiving = false) {
  world.date = monthFrom(world.date, 1);
  prepareCampusTuition(world);
  for (const person of Object.values(world.people)) if (!person.died) educationMonth(world, person);
  const person = world.people[world.activePersonId], before = { skills: { ...person.skills }, energy: person.stats.energy };
  campusMonth(world);
  if (peerLiving) {
    const ids = new Set(world.campusCommunities.flatMap(item => item.students.map(student => student.personId)));
    for (const id of ids) if (!world.people[id].died) financeMonth(world, world.people[id]);
  }
  return before;
}

/** Unchanged v3 graduate, one fixed ordinary application/payment via startStudy,
 * then a real attended month. No balance, admission, outcome or RNG substitution. */
function studying(program: 'trade' | 'university' | 'graduate' = 'graduate', funding: 'cash' | 'loan' = 'loan') {
  const world = copyWorld(startStudy(program, funding)); attend(world); return world;
}
function introduced(program: 'trade' | 'university' | 'graduate' = 'graduate') {
  const world = studying(program), course = campusCourse(world);
  if (!course) throw new Error('The genuine paid course has not attended');
  return act(world, { type: 'meet-campus', courseId: course.id });
}

// These continuations exercise the three public programs; they do not claim a
// naturally attained degree, complete finance year or a new seed cohort.
test.each(['trade', 'university', 'graduate'] as const)('%s introduces exactly two self-funded real students once, without altering existing people or the actor’s resources', program => {
  const newlyEnrolled = startStudy(program), enrolledCourse = newlyEnrolled.studyCourses.find(item => item.personId === newlyEnrolled.activePersonId && item.status === 'active')!;
  expect(campusCourse(newlyEnrolled)).toBeUndefined();
  const unready = encodeWorld(newlyEnrolled);
  expect(campusIntroductionReason(newlyEnrolled, enrolledCourse.id)).toBeDefined();
  expect(() => resolveCommand(newlyEnrolled, { type: 'meet-campus', courseId: enrolledCourse.id }, true)).toThrow();
  expect(encodeWorld(newlyEnrolled)).toBe(unready);
  const before = copyWorld(newlyEnrolled); attend(before);
  const course = campusCourse(before)!, original = encodeWorld(before), ids = Object.keys(before.people);
  expect(course.months).toBe(1); expect(campusReason(before)).toBeUndefined(); expect(currentCampus(before)).toBeUndefined();
  expect(campusIntroductionReason(before, course.id)).toBeUndefined();
  const world = act(before, { type: 'meet-campus', courseId: course.id }), community = currentCampus(world)!;
  expect(world.activePersonId).toBe(before.activePersonId); expect(community.personId).toBe(before.activePersonId); expect(community.courseId).toBe(course.id);
  expect(community.introducedStudyMonths).toBe(1); expect(community.lastStudyMonths).toBe(1); expect(community.periods).toEqual([]); expect(community.club).toBe('none');
  expect(community.students).toHaveLength(2); expect(new Set(community.students.map(item => item.personId)).size).toBe(2);
  expect(Object.keys(world.people).filter(id => !ids.includes(id)).sort()).toEqual(community.students.map(item => item.personId).sort());
  expect(world.workHistory).toEqual(before.workHistory); expect(world.liabilities).toEqual(before.liabilities);
  expect(world.random.outcomes).toBe(before.random.outcomes); expect(world.random.events).toBe(before.random.events);
  for (const id of ids) expect(world.people[id]).toEqual(before.people[id]);
  for (const account of before.accounts) expect(world.accounts.find(item => item.id === account.id)).toEqual(account);
  expect(world.ledger.filter(item => item.personId === before.activePersonId)).toEqual(before.ledger.filter(item => item.personId === before.activePersonId));
  for (const student of community.students) {
    const peer = world.people[student.personId], record = world.studyCourses.find(item => item.id === student.courseId)!, account = accountFor(world, peer), payment = world.ledger.find(item => item.id === record.firstPayment!.transactionId)!;
    expect(ageOn(peer, world.date)).toBeGreaterThanOrEqual(rules[peer.country].adultAge);
    expect(peer.country).toBe(course.country); expect(peer.city).toBe(course.city); expect(peer.employment).toBeNull();
    expect(peer.finance.serviceMonths).toBe(0); expect(peer.finance.lifetimeGross).toBe(0n);
    expect(record).toMatchObject({ personId: peer.id, origin: 'enrolment', status: 'active', program, school: course.school, field: course.field, country: course.country, city: course.city, currency: course.currency, started: world.date, ended: null, months: 0, tuitionPaidMonths: 12 });
    expect(peer.education.months).toBe(0); expect(peer.education.stage).toBe(program); expect(peer.education.paused).toBe(false);
    expect(record.firstPayment).toMatchObject({ funding: 'cash', billed: record.annualTuition, waived: 0n, loanTransactionId: null, scholarshipId: null });
    expect(payment).toMatchObject({ personId: peer.id, category: 'tuition', currency: record.currency, cashDelta: -record.annualTuition, debtDelta: 0n, year: world.date.year, month: world.date.month });
    expect(account.openingCash).toBe(record.annualTuition * 2n + rules[peer.country].livingCost * 12n);
    expect(account.cash).toBe(account.openingCash - record.annualTuition);
    const secondary = peer.education.qualifications.find(item => item.level === 'secondary')!;
    expect(secondary).toBeDefined(); expect(secondary.year).toBeGreaterThanOrEqual(peer.born.year + rules[peer.country].schoolEnd); expect(secondary.year).toBeLessThanOrEqual(world.date.year);
    const priorDegrees = peer.education.qualifications.filter(item => item.level === 'degree');
    expect(priorDegrees).toHaveLength(program === 'graduate' ? 1 : 0);
    if (program === 'graduate') { expect(priorDegrees[0].year).toBeGreaterThanOrEqual(secondary.year + 4); expect(priorDegrees[0].year).toBeLessThanOrEqual(world.date.year); }
    const bond = relationFor(world, world.activePersonId, peer.id)!;
    expect(bond.roles).toContain('classmate'); expect(bond.roles).not.toContain('friend'); expect(bond.romance).toBe('none');
    expect(world.bestFriendships.some(item => item.proposerId === peer.id || item.friendId === peer.id)).toBe(false);
    expect(financialActors(world).map(item => item.id)).toContain(peer.id);
  }
  const ready = encodeWorld(world), random = { ...world.random };
  for (let n = 0; n < 3; n++) { campusCourse(world); currentCampus(world); campusReason(world); campusIntroductionReason(world, course.id); }
  expect(world.random).toEqual(random); expect(encodeWorld(world)).toBe(ready); expect(encodeWorld(before)).toBe(original);
  expect(() => resolveCommand(world, { type: 'meet-campus', courseId: course.id }, true)).toThrow();
  expect(() => resolveCommand(world, { type: 'meet-campus', courseId: community.students[0].courseId }, true)).toThrow();
  expect(() => resolveCommand(world, { type: 'campus-club', communityId: 'campus_obsolete', club: 'music' }, true)).toThrow();
  expect(encodeWorld(world)).toBe(ready); expect(decodeWorld(ready)).toEqual(world);
  expect(unpackCheckpoint(packCheckpoint(world))).toEqual(world);
});

test.each([
  ['sport', 'sport'], ['music', 'music'], ['drama', 'acting'], ['science', 'science'],
] as const)('%s selection is local to a real course; only a new attended month earns capped %s practice and bounded energy use', (club, skill) => {
  const initial = introduced(), id = currentCampus(initial)!.id, person = initial.people[initial.activePersonId], random = { ...initial.random };
  let world = act(initial, { type: 'campus-club', communityId: id, club });
  expect(world.people[world.activePersonId].skills).toEqual(person.skills); expect(world.people[world.activePersonId].stats).toEqual(person.stats);
  expect(world.ledger).toEqual(initial.ledger); expect(world.accounts).toEqual(initial.accounts); expect(world.random).toEqual(random); expect(currentCampus(world)!.periods).toEqual([]);
  expect(campusClubReason(world, id, club)).toBeDefined();
  expect(() => resolveCommand(world, { type: 'campus-club', communityId: id, club }, true)).toThrow();
  world = copyWorld(world); const before = attend(world), period = currentCampus(world)!.periods.at(-1)!;
  expect(period).toMatchObject({ studyMonth: 2, club, skillBefore: before.skills[skill], skillAfter: Math.min(100, before.skills[skill] + 1), skillGain: Math.min(1, 100 - before.skills[skill]), energyBefore: before.energy, energyAfter: Math.max(0, before.energy - 2) });
  expect(world.people[world.activePersonId].skills[skill]).toBe(period.skillAfter); expect(world.people[world.activePersonId].stats.energy).toBe(period.energyAfter);
  const committed = encodeWorld(world); campusMonth(world); expect(encodeWorld(world)).toBe(committed);
  // Explicit cap controls, not an alleged naturally attained skill/energy state.
  world.people[world.activePersonId].skills[skill] = 100; world.people[world.activePersonId].stats.energy = 1;
  attend(world); const capped = currentCampus(world)!.periods.at(-1)!;
  expect(capped).toMatchObject({ skillBefore: 100, skillAfter: 100, skillGain: 0, energyBefore: 1, energyAfter: 0 });
  world = act(world, { type: 'campus-club', communityId: id, club: 'none' }); world = copyWorld(world);
  const stopped = attend(world), none = currentCampus(world)!.periods.at(-1)!;
  expect(none).toMatchObject({ club: 'none', skillBefore: null, skillAfter: null, skillGain: 0, energyBefore: stopped.energy, energyAfter: stopped.energy });
  expect(world.people[world.activePersonId].skills).toEqual(stopped.skills); expect(decodeWorld(encodeWorld(world))).toEqual(world);
});

test('absence and actual unpaid actor tuition preserve the course and roster without club progress or a free new introduction', () => {
  const ready = introduced();
  let world = act(ready, { type: 'campus-club', communityId: currentCampus(ready)!.id, club: 'science' });
  world = copyWorld(world); const id = currentCampus(world)!.id, roster = currentCampus(world)!.students, months = world.people[world.activePersonId].education.months;
  const person = world.people[world.activePersonId], skills = { ...person.skills };
  // Declared absence control: the real education attendance gate remains active.
  person.health.hospitalizedUntil = world.date.year * 12 + world.date.month + 2;
  expect(campusReason(world)).toBeDefined(); attend(world);
  expect(person.education.months).toBe(months); expect(person.skills).toEqual(skills); expect(currentCampus(world)!.periods).toEqual([]); expect(currentCampus(world)!.students).toEqual(roster);
  person.health.hospitalizedUntil = null; attend(world);
  expect(currentCampus(world)!.id).toBe(id); expect(currentCampus(world)!.periods).toHaveLength(1);
  expect(currentCampus(world)!.periods[0].studyMonth).toBe(months + 1);
  // Genuine cash enrolment and its actual paid-year boundary. The unchanged
  // starting balance cannot cover year two; no pause flag or funds are changed.
  const cash = studying('graduate', 'cash'), recorded = campusCourse(cash)!;
  let paused = act(cash, { type: 'meet-campus', courseId: recorded.id });
  const cashCommunity = currentCampus(paused)!;
  paused = act(paused, { type: 'campus-club', communityId: cashCommunity.id, club: 'science' }); paused = copyWorld(paused);
  for (let n = 0; n < 12; n++) attend(paused);
  expect(paused.people[paused.activePersonId].education.paused).toBe(true); expect(paused.people[paused.activePersonId].education.months).toBe(12);
  expect(campusCourse(paused)).toBeUndefined(); expect(campusReason(paused)).toBeDefined();
  expect(currentCampus(paused)!.id).toBe(cashCommunity.id); expect(currentCampus(paused)!.students).toEqual(cashCommunity.students);
  expect(currentCampus(paused)!.periods).toHaveLength(11); expect(currentCampus(paused)!.lastStudyMonths).toBe(12);
  const exact = encodeWorld(paused); campusMonth(paused);
  expect(() => resolveCommand(paused, { type: 'meet-campus', courseId: recorded.id }, true)).toThrow();
  expect(() => resolveCommand(paused, { type: 'campus-club', communityId: cashCommunity.id, club: 'music' }, true)).toThrow();
  expect(encodeWorld(paused)).toBe(exact);
});

test('a declared residence mismatch cannot turn continued course progress into campus attendance or invalidate saved history', () => {
  const ready = introduced();
  let world = act(ready, { type: 'campus-club', communityId: currentCampus(ready)!.id, club: 'science' });
  world = copyWorld(world); const person = world.people[world.activePersonId], origin = person.city, id = currentCampus(world)!.id;
  const skills = { ...person.skills }, energy = person.stats.energy;
  // Explicit location predicate control on a genuine paid course. This is not
  // a claimed successful relocation, residency grant or natural journey.
  person.city = countries[person.country].cities.find(city => city !== origin)!;
  expect(campusCourse(world)).toBeUndefined(); expect(currentCampus(world)).toBeUndefined();
  attend(world);
  const historical = world.campusCommunities.find(item => item.id === id)!;
  expect(person.education.months).toBe(2); expect(historical.periods).toEqual([]);
  expect(person.skills).toEqual(skills); expect(person.stats.energy).toBe(energy);
  expect(decodeWorld(encodeWorld(world))).toEqual(world);
  person.city = origin; const before = attend(world);
  expect(currentCampus(world)!.id).toBe(id); expect(historical.periods).toHaveLength(1);
  expect(historical.periods[0]).toMatchObject({ studyMonth: 3, club: 'science', skillBefore: before.skills.science, skillAfter: Math.min(100, before.skills.science + 1) });
  expect(person.skills.science).toBe(Math.min(100, skills.science + 1));
  expect(decodeWorld(encodeWorld(world))).toEqual(world);
});

test('a declared active-person association frame preserves another owner’s progressed course without granting NPC club attendance', () => {
  const ready = introduced();
  let world = act(ready, { type: 'campus-club', communityId: currentCampus(ready)!.id, club: 'science' });
  world = copyWorld(world); const ownerId = world.activePersonId, community = currentCampus(world)!, owner = world.people[ownerId];
  const skills = { ...owner.skills }, energy = owner.stats.energy;
  // Association/validation unit control only. This is NOT a real inheritance,
  // a selectable unrelated heir or an engine-generated active-person change.
  world.activePersonId = community.students[0].personId;
  expect(currentCampus(world)).toBeUndefined(); expect(campusClubReason(world, community.id, 'music')).toBeDefined();
  attend(world);
  expect(world.studyCourses.find(item => item.id === community.courseId)!.months).toBe(2);
  expect(community.lastStudyMonths).toBeGreaterThanOrEqual(community.introducedStudyMonths);
  expect(community.lastStudyMonths).toBeLessThanOrEqual(2); expect(community.periods).toEqual([]);
  expect(owner.skills).toEqual(skills); expect(owner.stats.energy).toBe(energy); expect(currentCampus(world)).toBeUndefined();
  const exact = encodeWorld(world);
  expect(() => resolveCommand(world, { type: 'meet-campus', courseId: community.courseId }, true)).toThrow();
  expect(() => resolveCommand(world, { type: 'campus-club', communityId: community.id, club: 'music' }, true)).toThrow();
  expect(encodeWorld(world)).toBe(exact); expect(decodeWorld(exact)).toEqual(world);
});

test('saved peers pay their own actual renewals and living costs after actor withdrawal, then pause before an unfunded month', () => {
  const ready = introduced(), community = currentCampus(ready)!, actorId = ready.activePersonId;
  let world = act(ready, { type: 'campus-club', communityId: community.id, club: 'music' });
  world = copyWorld(world); attend(world, true); const history = structuredClone(currentCampus(world)!);
  world = act(world, { type: 'leave-school' }); world = copyWorld(world);
  expect(currentCampus(world)).toBeUndefined(); expect(world.studyCourses.find(item => item.id === community.courseId)?.status).toBe('withdrawn');
  const actorCash = accountFor(world).cash, actorSkills = { ...world.people[actorId].skills }, actorEnergy = world.people[actorId].stats.energy;
  for (let n = 0; n < 25; n++) {
    const cash = accountFor(world).cash; attend(world, true); expect(accountFor(world).cash).toBe(cash); expect(world.activePersonId).toBe(actorId);
  }
  expect(world.campusCommunities.find(item => item.id === community.id)).toEqual(history);
  expect(accountFor(world).cash).toBe(actorCash); expect(world.people[actorId].skills).toEqual(actorSkills); expect(world.people[actorId].stats.energy).toBe(actorEnergy);
  for (const student of community.students) {
    const peer = world.people[student.personId], record = world.studyCourses.find(item => item.id === student.courseId)!;
    expect(financialActors(world).map(item => item.id)).toContain(peer.id);
    expect(peer.education.paused).toBe(true); expect(peer.education.months).toBe(24); expect(peer.education.tuitionPaidMonths).toBe(24);
    expect(record.months).toBe(24); expect(record.tuitionPaidMonths).toBe(24); expect(record.status).toBe('active');
    const tuition = world.ledger.filter(item => item.personId === peer.id && item.category === 'tuition');
    expect(tuition).toHaveLength(2); expect(tuition.every(item => item.cashDelta === -record.annualTuition && item.debtDelta === 0n)).toBe(true);
    expect(world.ledger.filter(item => item.personId === peer.id && item.category === 'living')).toHaveLength(26);
    expect(world.liabilities.filter(item => item.ownerId === peer.id && item.kind === 'student')).toEqual([]);
  }
  expect(decodeWorld(encodeWorld(world))).toEqual(world);
});

test('the actual final attended trade month is recorded once, while later completion and withdrawal cannot earn club practice', () => {
  let world = introduced('trade'); const id = currentCampus(world)!.id;
  world = act(world, { type: 'campus-club', communityId: id, club: 'drama' }); world = copyWorld(world);
  const person = world.people[world.activePersonId];
  for (let n = 0; n < 23; n++) attend(world);
  const community = world.campusCommunities.find(item => item.id === id)!, course = world.studyCourses.find(item => item.id === community.courseId)!;
  expect(person.education.stage).toBe('none'); expect(course.months).toBe(24); expect(['completed', 'failed']).toContain(course.status);
  expect(community.periods).toHaveLength(23); expect(community.periods.at(-1)!.studyMonth).toBe(24); expect(community.lastStudyMonths).toBe(24);
  expect(currentCampus(world)).toBeUndefined(); const skill = person.skills.acting, energy = person.stats.energy, periods = structuredClone(community.periods);
  campusMonth(world); expect(community.periods).toEqual(periods); attend(world);
  expect(person.skills.acting).toBe(skill); expect(person.stats.energy).toBe(energy); expect(community.periods).toEqual(periods);
  expect(() => resolveCommand(world, { type: 'campus-club', communityId: id, club: 'science' }, true)).toThrow();
  expect(decodeWorld(encodeWorld(world))).toEqual(world);
});

test('old empty worlds and ineligible browsing retain all fields and RNG; raw roster, payment, relationship and period tampering is rejected', () => {
  const old = decodeWorld(JSON.stringify(graduate)), before = encodeWorld(old);
  expect(old.campusCommunities).toEqual([]); expect(campusCourse(old)).toBeUndefined(); expect(currentCampus(old)).toBeUndefined();
  campusReason(old); campusIntroductionReason(old, 'old_course'); campusClubReason(old, 'old_community', 'sport'); prepareCampusTuition(old); campusMonth(old);
  expect(encodeWorld(old)).toBe(before);
  let world = introduced(); world = act(world, { type: 'campus-club', communityId: currentCampus(world)!.id, club: 'science' }); world = copyWorld(world); attend(world);
  expect(validateWorld(world)).toEqual(world);
  const saved = encodeWorld(world), checks: { label: string; alter: (raw: any) => void }[] = [
    { label: 'duplicate community', alter: raw => { raw.campusCommunities.push(raw.campusCommunities[0]); } },
    { label: 'owner course', alter: raw => { raw.campusCommunities[0].courseId = raw.campusCommunities[0].students[0].courseId; } },
    { label: 'duplicate student', alter: raw => { raw.campusCommunities[0].students[1] = raw.campusCommunities[0].students[0]; } },
    { label: 'actor as student', alter: raw => { raw.campusCommunities[0].students[0].personId = raw.activePersonId; } },
    { label: 'other student course', alter: raw => { raw.campusCommunities[0].students[0].courseId = raw.campusCommunities[0].students[1].courseId; } },
    { label: 'missing classmate edge', alter: raw => { const id = raw.campusCommunities[0].students[0].personId; const bond = raw.relationships.find((item: any) => item.from === raw.activePersonId && item.to === id || item.to === raw.activePersonId && item.from === id); bond.roles = ['acquaintance']; bond.kind = 'acquaintance'; } },
    { label: 'other payer receipt', alter: raw => { const first = raw.studyCourses.find((item: any) => item.id === raw.campusCommunities[0].students[0].courseId), second = raw.studyCourses.find((item: any) => item.id === raw.campusCommunities[0].students[1].courseId); first.firstPayment.transactionId = second.firstPayment.transactionId; } },
    { label: 'future study cursor', alter: raw => { raw.campusCommunities[0].lastStudyMonths++; } },
    { label: 'duplicate period', alter: raw => { raw.campusCommunities[0].periods.push(raw.campusCommunities[0].periods[0]); } },
    { label: 'free club energy', alter: raw => { raw.campusCommunities[0].periods[0].energyAfter = raw.campusCommunities[0].periods[0].energyBefore; } },
    { label: 'wrong skill arithmetic', alter: raw => { const period = raw.campusCommunities[0].periods[0]; period.skillBefore = 20; period.skillAfter = 22; period.skillGain = 1; } },
    { label: 'none with claimed skill', alter: raw => { raw.campusCommunities[0].periods[0].club = 'none'; } },
  ];
  for (const { label, alter } of checks) { const raw = JSON.parse(saved); alter(raw); expect({ label, rejected: (() => { try { decodeWorld(JSON.stringify(raw)); return false; } catch { return true; } })() }).toEqual({ label, rejected: true }); }
  expect(encodeWorld(world)).toBe(saved);
});
