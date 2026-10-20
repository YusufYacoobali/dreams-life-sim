import { gunzipSync, strFromU8 } from 'fflate';
import { pupil } from '../support/pupil';
import { countries, countryCodes } from '../../src/game/countries';
import { monthFrom } from '../../src/game/calendar';
import { decodeWorld, encodeWorld, validateWorld, World } from '../../src/game/model';
import { GameCommand, recordDeath, resolveCommand } from '../../src/game/engine';
import { educationMonth } from '../../src/game/systems/education';
import { currentSchool } from '../../src/game/systems/schoolSchemas';
import { refreshSchools, schoolHelpReason, schoolMonth } from '../../src/game/systems/school';
import { relationFor } from '../../src/game/systems/relationships';
import { financialActors } from '../../src/game/systems/households';
import { accountFor } from '../../src/game/systems/common';
import { endEmployment, workMonth } from '../../src/game/systems/work';
import { decodeSave } from '../../src/persistence/archive';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import relocationArchive from '../fixtures/v20-relocation-archive.json';


function act(world: World, command: GameCommand) {
  let next = resolveCommand(world, command);
  if (next.pending?.kind === 'result') next = resolveCommand(next, { type: 'acknowledge', resultId: next.pending.id });
  return next;
}
function attend(world: World) {
  world.date = monthFrom(world.date, 1);
  for (const person of Object.values(world.people)) if (!person.died) educationMonth(world, person);
  schoolMonth(world);
}
test.each(countryCodes)('%s creates a local school with real qualified teachers, peers and parents only during attendance', country => {
  const world = pupil(country), school = currentSchool(world)!;
  expect(school.classmateIds).toHaveLength(3); expect(school.periods).toHaveLength(1);
  const teacher = world.people[school.currentTeacherId];
  expect(teacher.employment?.roleId).toBe('teacher'); expect(teacher.education.qualifications.some(item => item.level === 'degree')).toBe(true);
  expect(relationFor(world, world.activePersonId, teacher.id)?.roles).toContain('teacher');
  for (const id of school.classmateIds) {
    const peer = world.people[id], parent = world.relationships.find(item => item.to === id && item.kind === 'parent')!;
    expect(peer.country).toBe(country); expect(peer.education.school).toBe(school.school); expect(peer.employment).toBeNull(); expect(peer.education.qualifications).toEqual([]);
    expect(parent).toBeDefined(); expect(peer.householdId).toBe(world.people[parent.from].householdId); expect(world.people[parent.from].employment).toBeTruthy();
    expect(financialActors(world).map(item => item.id)).toContain(parent.from);
  }
  const before = encodeWorld(world); currentSchool(world); schoolHelpReason(world, school, teacher.id);
  expect(encodeWorld(world)).toBe(before); expect(decodeWorld(before)).toEqual(world);
  const paidBefore = world.workHistory.find(item => item.personId === teacher.id)!.monthsWorked;
  workMonth(world, teacher); expect(world.workHistory.find(item => item.personId === teacher.id)?.monthsWorked).toBe(paidBefore + 1); validateWorld(world);
});
test('an eighteen-year-old Italian pupil has no invented adult job, degree, salary or cash', () => {
  const world = pupil('IT', 18), school = currentSchool(world)!;
  expect(school.stage).toBe('secondary'); expect(school.classmateIds).toHaveLength(4);
  for (const id of school.classmateIds) { expect(world.people[id].employment).toBeNull(); expect(world.people[id].education.qualifications).toEqual([]); expect(accountFor(world, world.people[id]).cash).toBe(0n); }
  expect(validateWorld(world)).toEqual(world);
});
test('club selection grants no instant skill or money; attendance and weighted classroom behaviour determine actual progress and reports', () => {
  let world = pupil(), school = currentSchool(world)!, before = world.people[world.activePersonId].skills.sport, random = { ...world.random }, balance = accountFor(world).cash;
  world = act(world, { type: 'school-club', communityId: school.id, club: 'sport' });
  world = act(world, { type: 'school-conduct', communityId: school.id, conduct: 'disruptive' });
  expect(world.people[world.activePersonId].skills.sport).toBe(before); expect(accountFor(world).cash).toBe(balance); expect(world.random).toEqual(random);
  const initialTrust = relationFor(world, world.activePersonId, currentSchool(world)!.currentTeacherId)!.trust;
  for (let i = 0; i < 10; i++) attend(world);
  world = act(world, { type: 'school-conduct', communityId: school.id, conduct: 'helpful' });
  const priorGrade = world.people[world.activePersonId].education.grades;
  // The final helpful month cannot erase ten disruptive months.
  school = currentSchool(world)!; const recorded = school.periods.map(item => item.conduct); expect(recorded.filter(item => item === 'disruptive')).toHaveLength(10);
  // Isolate the classroom contribution from the existing annual study-routine roll.
  world.date = monthFrom(world.date, 1); schoolMonth(world);
  school = currentSchool(world)!;
  expect(school.exams).toEqual([{ month: world.date.year * 12 + world.date.month - 1, term: 1, grade: priorGrade - 4 }]);
  expect(relationFor(world, world.activePersonId, school.currentTeacherId)!.trust).toBe(initialTrust - 10);
  expect(world.people[world.activePersonId].skills.sport).toBe(before + 11);
  world = act(world, { type: 'school-club', communityId: school.id, club: 'music' }); attend(world);
  expect(world.people[world.activePersonId].skills.sport).toBe(before + 11); expect(world.people[world.activePersonId].skills.music).toBe(1);
  expect(decodeWorld(encodeWorld(world)).schoolCommunities).toEqual(world.schoolCommunities);
});
test('academic help saves its actual draw and effect, is limited to one attended school year and rejects stale or unrelated teachers', () => {
  let world = pupil(), school = currentSchool(world)!, teacher = school.currentTeacherId;
  world = act(world, { type: 'school-help', communityId: school.id, teacherId: teacher }); school = currentSchool(world)!;
  const help = school.help[0]; expect(help.accepted).toBe(help.roll <= help.chance); expect(world.people[world.activePersonId].education.grades).toBe(help.gradeBefore + help.gradeGain);
  const before = encodeWorld(world);
  expect(() => resolveCommand(world, { type: 'school-help', communityId: school.id, teacherId: teacher })).toThrow(/already asked/);
  expect(() => resolveCommand(world, { type: 'school-help', communityId: school.id, teacherId: school.classmateIds[0] })).toThrow(/unavailable/);
  expect(() => resolveCommand(world, { type: 'school-club', communityId: 'old_school', club: 'music' })).toThrow(/current school/);
  expect(encodeWorld(world)).toBe(before);
  for (let i = 0; i < 11; i++) attend(world);
  expect(schoolHelpReason(world, currentSchool(world), teacher)).toBeUndefined();
  world = act(world, { type: 'school-help', communityId: school.id, teacherId: teacher }); expect(currentSchool(world)!.help.map(item => item.term)).toEqual([0, 1]);
  const damaged = decodeWorld(encodeWorld(world)); damaged.schoolCommunities[0].help[0].accepted = !help.accepted;
  expect(() => validateWorld(damaged)).toThrow(/academic help/);
});
test('hospitalisation and absence pause clubs and reports; a temporarily absent teacher is preserved and a genuine departure is replaced', () => {
  let world = pupil(); const schoolId = currentSchool(world)!.id, teacherId = currentSchool(world)!.currentTeacherId;
  world = act(world, { type: 'school-club', communityId: schoolId, club: 'science' });
  const person = world.people[world.activePersonId]; person.health.hospitalizedUntil = world.date.year * 12 + world.date.month + 4;
  const before = encodeWorld(world); expect(schoolHelpReason(world, currentSchool(world), teacherId)).toMatch(/normal school/);
  expect(() => resolveCommand(world, { type: 'school-help', communityId: schoolId, teacherId })).toThrow(/normal school/); expect(encodeWorld(world)).toBe(before);
  attend(world); expect(currentSchool(world)!.periods).toHaveLength(1); expect(person.skills.science).toBe(0);
  person.health.hospitalizedUntil = null; world.people[teacherId].health.hospitalizedUntil = world.date.year * 12 + world.date.month + 4;
  attend(world); expect(currentSchool(world)!.teacherIds).toEqual([teacherId]); expect(schoolHelpReason(world, currentSchool(world), teacherId)).toMatch(/unavailable/);
  world.people[teacherId].health.hospitalizedUntil = null; endEmployment(world, teacherId); attend(world);
  expect(currentSchool(world)!.teacherIds).toHaveLength(2); expect(currentSchool(world)!.currentTeacherId).not.toBe(teacherId); expect(world.people[teacherId]).toBeDefined(); validateWorld(world);
});
test('graduation, permanent moves and death close school history without teleporting old contacts or inventing missed attendance', () => {
  const world = pupil(), school = currentSchool(world)!, peers = school.classmateIds.map(id => ({ ...world.people[id] }));
  const player = world.people[world.activePersonId]; player.country = 'GB'; player.city = countries.GB.cities[0]; player.education.school = player.city + ' Primary School'; refreshSchools(world);
  expect(school.endReason).toBe('changed-school'); expect(currentSchool(world)).toBeUndefined(); expect(school.periods).toHaveLength(1);
  world.date = monthFrom(world.date, 1); schoolMonth(world); expect(currentSchool(world)!.country).toBe('GB'); expect(currentSchool(world)!.classmateIds.some(id => peers.some(peer => peer.id === id))).toBe(false);
  for (const peer of peers) expect(world.people[peer.id].city).toBe(peer.city);
  recordDeath(world, player.id, 'test fixture'); expect(currentSchool(world)).toBeUndefined(); expect(world.schoolCommunities.at(-1)?.endReason).toBe('died'); validateWorld(world);
  const graduated = pupil(), original = currentSchool(graduated)!; for (let i = 0; i < 11; i++) attend(graduated); graduated.date.year = 2018; educationMonth(graduated, graduated.people[graduated.activePersonId]); refreshSchools(graduated);
  expect(original.endReason).toBe('graduated'); expect(original.periods).toHaveLength(12); expect(graduated.people[graduated.activePersonId].education.qualifications.some(item => item.level === 'secondary')).toBe(true); validateWorld(graduated);
});
test('real v20 foreign employment and its approved-move checkpoint migrate with empty school history and no changes to people, FX, money or RNG', () => {
  const archive = decodeSave(JSON.stringify(relocationArchive)), world = archive.world, raw = JSON.parse(strFromU8(gunzipSync(Buffer.from(JSON.parse(relocationArchive.checkpoint).data, 'base64')))), encoded = JSON.parse(encodeWorld(world));
  expect(world.schemaVersion).toBe(32); expect(world.engineVersion).toBe(33); expect(world.schoolCommunities).toEqual([]);
  for (const key of ['people', 'relationships', 'relocations', 'trips', 'ledger', 'workHistory', 'random', 'annual']) expect(encoded[key]).toEqual(raw[key]);
  const history = world.workHistory.find(item => item.personId === world.activePersonId && !item.ended)!; expect(history.monthsWorked).toBe(12); expect(history.currency).toBe('JPY'); expect(history.grossEarned).toBe(3200000n); expect(history.conversions).toHaveLength(12);
  const prior = unpackCheckpoint(archive.snapshots[0].payload); expect(prior.schoolCommunities).toEqual([]); expect(prior.people[prior.activePersonId].country).toBe('US'); expect(prior.relocations[0].status).toBe('approved');
  expect(decodeWorld(encodeWorld(world))).toEqual(world);
});
