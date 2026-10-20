import { createLife, randomCreation } from '../../src/game/createLife';
import { countryCodes, countries, CountryCode } from '../../src/game/countries';
import { ageOn, decodeWorld, encodeWorld, validateWorld, World } from '../../src/game/model';
import { recordDeath, resolveCommand } from '../../src/game/engine';
import { monthFrom } from '../../src/game/calendar';
import { randomInteger } from '../../src/game/random';
import { employmentMonth, endEmployment } from '../../src/game/systems/work';
import { currentWorkplace } from '../../src/game/systems/workplaceSchemas';
import { refreshWorkplaces, workplaceMonth, workplaceReason, workFeedbackReason } from '../../src/game/systems/workplaces';
import { relationFor } from '../../src/game/systems/relationships';
import { financialActors } from '../../src/game/systems/households';
import { workMonth } from '../../src/game/systems/work';

const ack = (world: World) => { if (world.pending?.kind !== 'result') throw new Error('Missing result'); return resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id }, true); };
function hire(world: World, roleId = 'retail') {
  for (let seed = 1; seed < 100; seed++) {
    const candidate = decodeWorld(encodeWorld(world)); candidate.random.outcomes = seed;
    const hired = resolveCommand(candidate, { type: 'apply-job', roleId }, true);
    if (hired.people[hired.activePersonId].employment?.roleId === roleId) return ack(hired);
  }
  throw new Error('No accepted application fixture');
}
function worker(country: CountryCode = 'US') {
  const world = createLife('life_workplace', 42, { ...randomCreation(42), country, city: countries[country].cities[0] }, { year: 2000, month: 1, day: 1 });
  world.birthAcknowledged = true; world.date.year += 22; return hire(world);
}
function introduced(country: CountryCode = 'US') { return ack(resolveCommand(worker(country), { type: 'meet-coworkers' }, true)); }
/** Execute actual employment periods without inventing tenure or wages. */
function paidMonths(initial: World, count = 3) {
  const world = decodeWorld(encodeWorld(initial));
  for (let n = 0; n < count; n++) { world.date = monthFrom(world.date, 1); workplaceMonth(world); employmentMonth(world); }
  return validateWorld(world);
}
const bossId = (world: World) => currentWorkplace(world)!.members.find(item => item.role === 'supervisor' && !item.left)!.personId;

test.each(countryCodes)('%s introductions create one actual qualified team without awarding the player money, service, qualifications or duplicate people', country => {
  const before = worker(country), player = before.people[before.activePersonId], original = encodeWorld(before), originalIds = Object.keys(before.people);
  expect(workplaceReason(before)).toBeUndefined(); expect(currentWorkplace(before)).toBeUndefined(); expect(encodeWorld(before)).toBe(original);
  const next = resolveCommand(before, { type: 'meet-coworkers' }, true), place = currentWorkplace(next)!;
  expect(place.members).toHaveLength(3); expect(place.members.filter(item => item.role === 'supervisor')).toHaveLength(1);
  expect(new Set(place.members.map(item => item.personId)).size).toBe(3); expect(Object.keys(next.people)).toHaveLength(originalIds.length + 3);
  expect(next.people[player.id]).toEqual(player); expect(next.accounts.find(item => item.ownerId === player.id)).toEqual(before.accounts.find(item => item.ownerId === player.id)); expect(next.ledger).toEqual(before.ledger); expect(next.random.outcomes).toBe(before.random.outcomes);
  for (const member of place.members) {
    const person = next.people[member.personId]; expect(ageOn(person, next.date)).toBeGreaterThanOrEqual(18);
    expect(person).toMatchObject({ country, city: player.city, employment: { id: member.employmentId, employer: player.employment!.employer, companyId: null } });
    expect(next.workHistory.find(item => item.id === member.employmentId)).toMatchObject({ personId: person.id, employer: place.employer, ended: null });
    expect(relationFor(next, player.id, person.id)?.roles).toContain('coworker'); expect(next.accounts.some(item => item.ownerId === person.id)).toBe(true);
  }
  expect(decodeWorld(encodeWorld(next))).toEqual(next); expect(encodeWorld(before)).toBe(original);
  const ready = ack(next); expect(() => resolveCommand(ready, { type: 'meet-coworkers' })).toThrow(/already know/);
});

test.each([true, false])('feedback records its real %s outcome after three paid periods without salary or RNG rerolls', accepted => {
  const initial = introduced(), place = currentWorkplace(initial)!, supervisorId = bossId(initial);
  expect(workFeedbackReason(initial, place, supervisorId)).toMatch(/three paid months/);
  const world = paidMonths(initial), supervisorBond = relationFor(world, world.activePersonId, supervisorId)!, chance = Math.min(95, 50 + Math.floor(supervisorBond.trust / 2));
  world.random.outcomes = Array.from({ length: 10000 }, (_, i) => i + 1).find(seed => (randomInteger(seed, 1, 100).value <= chance) === accepted)!;
  const expectedDraw = randomInteger(world.random.outcomes, 1, 100), player = world.people[world.activePersonId], performance = player.employment!.performance, energy = player.stats.energy;
  const next = resolveCommand(world, { type: 'work-feedback', workplaceId: place.id, supervisorId }, true), review = currentWorkplace(next)!.feedback[0];
  expect(review).toMatchObject({ supervisorId, paidMonths: 3, chance, roll: expectedDraw.value, accepted, performanceBefore: performance, performanceGain: accepted ? Math.min(3, 100 - performance) : 0 });
  expect(next.people[player.id].employment!.performance).toBe(performance + review.performanceGain); expect(next.people[player.id].stats.energy).toBe(energy - 4);
  expect(next.accounts).toEqual(world.accounts); expect(next.ledger).toEqual(world.ledger); expect(next.people[player.id].employment!.annualPay).toBe(player.employment!.annualPay); expect(next.people[player.id].finance.serviceMonths).toBe(player.finance.serviceMonths);
  expect(next.random).toEqual({ ...world.random, outcomes: expectedDraw.state }); const ready = ack(next);
  expect(workFeedbackReason(ready, currentWorkplace(ready), supervisorId)).toMatch(/already asked/); expect(() => resolveCommand(ready, { type: 'work-feedback', workplaceId: place.id, supervisorId })).toThrow(/already asked/);
  expect(decodeWorld(encodeWorld(ready))).toEqual(ready);
});

test('temporary supervisor absence retains the same identity; a real contract departure gets one replacement during actual work', () => {
  const world = paidMonths(introduced()), place = currentWorkplace(world)!, oldBoss = bossId(world), originalPeople = Object.keys(world.people).length;
  world.people[oldBoss].health.hospitalizedUntil = world.date.year * 12 + world.date.month + 1;
  expect(workFeedbackReason(world, place, oldBoss)).toMatch(/unavailable/); const rng = { ...world.random }; workplaceMonth(world);
  expect(bossId(world)).toBe(oldBoss); expect(world.random).toEqual(rng); expect(Object.keys(world.people)).toHaveLength(originalPeople);
  world.people[oldBoss].health.hospitalizedUntil = null; endEmployment(world, oldBoss); expect(place.members.find(item => item.personId === oldBoss)?.endReason).toBe('left-job');
  const beforeBrowse = encodeWorld(world); expect(workFeedbackReason(world, place, oldBoss)).toMatch(/unavailable/); expect(encodeWorld(world)).toBe(beforeBrowse);
  workplaceMonth(world); expect(bossId(world)).not.toBe(oldBoss); expect(Object.keys(world.people)).toHaveLength(originalPeople + 1);
  const after = encodeWorld(world); workplaceMonth(world); expect(encodeWorld(world)).toBe(after); validateWorld(world);
});

test('quitting closes the observed workplace; joining the same employer again reuses the real colleagues and keeps their other roles', () => {
  let world = introduced(); const oldPlace = currentWorkplace(world)!, ids = oldPlace.members.map(item => item.personId), people = Object.keys(world.people).length, relation = relationFor(world, world.activePersonId, ids[1])!;
  const mutable = decodeWorld(encodeWorld(world)); const friend = relationFor(mutable, mutable.activePersonId, ids[1])!; friend.roles.push('friend'); friend.kind = 'friend'; world = validateWorld(mutable, true);
  world = ack(resolveCommand(world, { type: 'quit-job' }, true)); expect(currentWorkplace(world)).toBeUndefined(); expect(world.workplaces[0]).toMatchObject({ ended: world.date, endReason: 'left-job' });
  world = hire(world, 'shop-assistant-part'); world = ack(resolveCommand(world, { type: 'meet-coworkers' }, true));
  expect(currentWorkplace(world)!.members.map(item => item.personId)).toEqual(ids); expect(Object.keys(world.people)).toHaveLength(people); expect(relationFor(world, world.activePersonId, ids[1])?.roles).toEqual(expect.arrayContaining(['friend', 'coworker']));
  expect(relation.id).toBe(relationFor(world, world.activePersonId, ids[1])!.id); expect(world.workplaces).toHaveLength(2);
});

test('death closes only the actual participant contract and retains the historical identities', () => {
  const world = introduced(), place = currentWorkplace(world)!, supervisorId = bossId(world), mutable = decodeWorld(encodeWorld(world));
  recordDeath(mutable, supervisorId, 'workplace fixture mortality'); expect(currentWorkplace(mutable)).toBeDefined(); expect(mutable.workplaces[0].members.find(item => item.personId === supervisorId)?.endReason).toBe('died');
  workplaceMonth(mutable); expect(bossId(mutable)).not.toBe(supervisorId); expect(mutable.people[supervisorId].died).not.toBeNull();
  recordDeath(mutable, mutable.activePersonId, 'workplace fixture mortality'); expect(mutable.workplaces[0]).toMatchObject({ endReason: 'died', ended: mutable.date }); validateWorld(mutable);
});

test('a sixteen-year-old part-time worker meets adult staff without gaining their qualifications or full-time pay', () => {
  const world = createLife('life_teen_worker', 42, { ...randomCreation(42), country: 'ZA', city: 'Johannesburg' }, { year: 2000, month: 1, day: 1 });
  world.birthAcknowledged = true; world.date.year += 16;
  const hired = hire(world, 'shop-assistant-part'), before = hired.people[hired.activePersonId];
  const met = resolveCommand(hired, { type: 'meet-coworkers' }, true), place = currentWorkplace(met)!;
  expect(met.people[met.activePersonId]).toEqual(before);
  expect(met.people[bossId(met)].employment!.roleId).toBe('retail');
  expect(place.members.filter(item => item.role === 'coworker').map(item => met.people[item.personId].employment!.roleId)).toEqual(['shop-assistant-part', 'shop-assistant-part']);
  expect(place.members.every(item => ageOn(met.people[item.personId], met.date) >= 18)).toBe(true);
});

test.each(['teacher', 'doctor'])('%s colleagues have actual qualifications dated before they join', roleId => {
  const initial = decodeWorld(encodeWorld(worker())), player = initial.people[initial.activePersonId]; endEmployment(initial);
  initial.date.year += 12; player.stats.smarts = 100;
  player.education.qualifications.push({ level: 'degree', field: 'general', year: initial.date.year - 8 });
  if (roleId === 'doctor') player.education.qualifications.push({ level: 'medicine', field: 'medicine', year: initial.date.year - 4 });
  const hired = hire(validateWorld(initial), roleId), met = resolveCommand(hired, { type: 'meet-coworkers' }, true);
  for (const member of currentWorkplace(met)!.members) {
    const person = met.people[member.personId]; expect(person.employment!.roleId).toBe(roleId);
    expect(person.education.qualifications.some(item => item.level === (roleId === 'doctor' ? 'medicine' : 'degree') && item.year <= member.joined.year)).toBe(true);
  }
  expect(decodeWorld(encodeWorld(met))).toEqual(met);
});

test('introduced colleagues participate once in ordinary payroll, and observation ends without deleting them when the player moves', () => {
  const world = decodeWorld(encodeWorld(introduced())), place = currentWorkplace(world)!, ids = place.members.map(item => item.personId);
  const before = ids.map(id => ({ id, paid: world.people[id].employment!.paidMonths, service: world.people[id].finance.serviceMonths, earnings: world.workHistory.find(item => item.id === world.people[id].employment!.id)!.grossEarned }));
  world.date = monthFrom(world.date, 1); workplaceMonth(world);
  const actors = financialActors(world); expect(new Set(actors.map(item => item.id)).size).toBe(actors.length);
  for (const person of actors) workMonth(world, person);
  for (const row of before) {
    const person = world.people[row.id]; expect(person.employment!.paidMonths).toBe(row.paid + 1); expect(person.finance.serviceMonths).toBe(row.service + 1);
    expect(world.workHistory.find(item => item.id === person.employment!.id)!.grossEarned).toBeGreaterThan(row.earnings);
    expect(world.ledger.filter(item => item.category === 'income' && item.personId === row.id)).toHaveLength(1);
  }
  const player = world.people[world.activePersonId]; player.city = countries[player.country].cities.find(item => item !== player.city)!;
  refreshWorkplaces(world); expect(currentWorkplace(world)).toBeUndefined(); expect(place.endReason).toBe('moved');
  expect(workplaceReason(world)).toMatch(/based elsewhere/); const after = encodeWorld(world); workplaceMonth(world); expect(encodeWorld(world)).toBe(after);
  expect(ids.every(id => !!world.people[id])).toBe(true);
  // Their earned income still needs the existing annual tax settlement.
  expect(financialActors(world).filter(item => ids.includes(item.id))).toHaveLength(3);
  const unpaid = decodeWorld(encodeWorld(introduced())), unpaidIds = currentWorkplace(unpaid)!.members.map(item => item.personId), mover = unpaid.people[unpaid.activePersonId];
  mover.city = countries[mover.country].cities.find(item => item !== mover.city)!; refreshWorkplaces(unpaid);
  expect(financialActors(unpaid).some(item => unpaidIds.includes(item.id))).toBe(false);
});

test('absence cannot create a team, and feedback remains annual after a real supervisor replacement with bounded performance', () => {
  const absent = decodeWorld(encodeWorld(worker())), person = absent.people[absent.activePersonId]; person.health.hospitalizedUntil = absent.date.year * 12 + absent.date.month + 1;
  const before = encodeWorld(absent); expect(() => resolveCommand(absent, { type: 'meet-coworkers' })).toThrow(/routine/); expect(encodeWorld(absent)).toBe(before);
  let world = paidMonths(introduced()), place = currentWorkplace(world)!; world.people[world.activePersonId].employment!.performance = 100;
  const boss = bossId(world), chance = Math.min(95, 50 + Math.floor(relationFor(world, world.activePersonId, boss)!.trust / 2));
  world.random.outcomes = Array.from({ length: 1000 }, (_, i) => i + 1).find(seed => randomInteger(seed, 1, 100).value <= chance)!;
  world = decodeWorld(encodeWorld(ack(resolveCommand(world, { type: 'work-feedback', workplaceId: place.id, supervisorId: boss }, true))));
  expect(world.workplaces[0].feedback[0]).toMatchObject({ accepted: true, performanceBefore: 100, performanceGain: 0 });
  endEmployment(world, boss); workplaceMonth(world); place = currentWorkplace(world)!;
  expect(bossId(world)).not.toBe(boss); expect(workFeedbackReason(world, place, bossId(world))).toMatch(/already asked/); validateWorld(world);
});

test.each(['member', 'employment', 'qualification', 'location', 'feedback roll', 'feedback gain', 'feedback duplicate'] as const)('full imports reject contradictory workplace %s', field => {
  const initial = paidMonths(introduced()), supervisorId = bossId(initial), place = currentWorkplace(initial)!;
  initial.random.outcomes = Array.from({ length: 10000 }, (_, i) => i + 1).find(seed => randomInteger(seed, 1, 100).value <= 67)!;
  const world = decodeWorld(encodeWorld(ack(resolveCommand(initial, { type: 'work-feedback', workplaceId: place.id, supervisorId })))); const saved = world.workplaces[0];
  if (field === 'member') saved.members[1].personId = 'person_missing';
  if (field === 'employment') saved.members[0].employmentId = world.people[world.activePersonId].employment!.id;
  if (field === 'qualification') { const member = saved.members[0], person = world.people[member.personId]; person.employment!.roleId = 'doctor'; world.workHistory.find(item => item.id === member.employmentId)!.roleId = 'doctor'; person.education.qualifications = []; }
  if (field === 'location') saved.city = 'Missing City';
  if (field === 'feedback roll') saved.feedback[0].roll = saved.feedback[0].accepted ? 100 : 1;
  if (field === 'feedback gain') saved.feedback[0].performanceGain = 0;
  if (field === 'feedback duplicate') saved.feedback.push({ ...saved.feedback[0] });
  expect(() => decodeWorld(JSON.stringify(world, (_key, value) => typeof value === 'bigint' ? { $dreamsBigInt: value.toString() } : value))).toThrow();
});
