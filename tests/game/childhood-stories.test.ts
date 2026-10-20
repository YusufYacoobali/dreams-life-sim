import { gunzipSync, strFromU8 } from 'fflate';
import { childhoodTemplates } from '../../src/game/content/childhood';
import { bindEvent, eligibleTemplates, eventTemplates } from '../../src/game/content/events';
import { EventTemplate } from '../../src/game/content/eventTypes';
import { decodeWorld, encodeWorld, validateWorld } from '../../src/game/model';
import { recordDeath, resolveCommand } from '../../src/game/engine';
import { offerPending } from '../../src/game/pendingQueue';
import { currentSchool } from '../../src/game/systems/schoolSchemas';
import { refreshSchools, schoolMonth } from '../../src/game/systems/school';
import { educationMonth, enrollmentReason } from '../../src/game/systems/education';
import { relationFor } from '../../src/game/systems/relationships';
import { countryCodes } from '../../src/game/countries';
import { decodeSave } from '../../src/persistence/archive';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import { pupil } from '../support/pupil';
import schoolArchive from '../fixtures/v21-school-archive.json';
import { randomInteger } from '../../src/game/random';
import { monthFrom } from '../../src/game/calendar';

const scene = (id: string) => childhoodTemplates.find(item => item.id === id)!;
const ageFor = (template: EventTemplate) => Math.max(template.min, template.school === 'secondary' ? 12 : template.school === 'primary' ? 6 : template.min);
test('the distinct story catalogue has unique situations, bounded ages and explicit saved-person contexts', () => {
  expect(childhoodTemplates).toHaveLength(78); expect(eventTemplates).toHaveLength(250);
  for (const field of ['id', 'title', 'body'] as const) expect(new Set(eventTemplates.map(item => item[field])).size).toBe(eventTemplates.length);
  for (const template of childhoodTemplates) {
    expect(template.min).toBeLessThanOrEqual(template.max); expect(template.choices.length).toBeGreaterThanOrEqual(2); expect(template.choices.length).toBeLessThanOrEqual(4);
    expect(new Set(template.choices.map(item => item.id)).size).toBe(template.choices.length);
    const text = [template.title, template.body, ...template.choices.flatMap(item => [item.label, item.title, item.result, item.journal])].join(' ');
    if (text.includes('{parent}')) expect(template.parent).toBe(true);
    if (text.includes('{classmate}') || template.choices.some(item => item.peerBond)) expect(template.classmate).toBe(true);
    if (text.includes('{teacher}') || template.choices.some(item => item.teacherBond)) expect(template.teacher).toBe(true);
    if (template.choices.some(item => item.grades)) expect(template.school).toBeDefined();
  }
});
test.each(childhoodTemplates.map(item => [item.id, item] as const))('%s binds real people without RNG and every branch resolves, persists and acknowledges exactly once', (_id, template) => {
  const original = pupil('US', ageFor(template)), before = encodeWorld(original);
  expect(eligibleTemplates(original).some(item => item.id === template.id)).toBe(true);
  const event = bindEvent(original, template); expect(encodeWorld(original)).toBe(before);
  expect(JSON.stringify(event)).not.toMatch(/\{(?:parent|classmate|teacher|school|city)\}/);
  for (const id of event.personIds) expect(original.people[id]).toBeDefined();
  if (template.classmate) expect(event.personIds).toContain(currentSchool(original)!.classmateIds[0]);
  if (template.teacher) expect(event.personIds).toContain(currentSchool(original)!.currentTeacherId);
  for (const choice of event.choices) {
    const offered = decodeWorld(before); offerPending(offered, event);
    const selected = resolveCommand(offered, { type: 'choose', eventId: event.id, choiceId: choice.id });
    expect(selected.pending?.kind).toBe('result'); expect(selected.journal.at(-1)?.text).toBe(choice.journal);
    const permission = choice.effects.some(effect => effect.kind === 'schedule-story' && effect.storyKind === 'arcade-invitation');
    expect(selected.random).toEqual(permission ? { ...original.random, npcs: randomInteger(original.random.npcs, 1, 100).state } : original.random);
    expect(Object.keys(selected.people)).toEqual(Object.keys(original.people));
    expect(decodeWorld(encodeWorld(selected))).toEqual(selected);
    expect(() => resolveCommand(selected, { type: 'choose', eventId: event.id, choiceId: choice.id })).toThrow();
    if (selected.pending?.kind === 'result') { const done = resolveCommand(selected, { type: 'acknowledge', resultId: selected.pending.id }); expect(done.people).toEqual(selected.people); expect(done.schoolCommunities).toEqual(selected.schoolCommunities); }
  }
});
test.each(countryCodes)('%s school stories use the current local class and teacher, with no invented contacts or render-time changes', country => {
  for (const age of [8, 15]) {
    const world = pupil(country, age), before = encodeWorld(world), templates = eligibleTemplates(world).filter(item => item.school);
    expect(templates.length).toBeGreaterThan(0);
    for (const template of templates) { const bound = bindEvent(world, template); expect(bound.personIds.every(id => world.people[id].city === world.people[world.activePersonId].city)).toBe(true); }
    expect(encodeWorld(world)).toBe(before);
  }
});
test('school contexts exclude unavailable pupils/teachers, wrong stages, closed schools and hospitalised players; cooldown remains factual', () => {
  const world = pupil('US', 8), school = currentSchool(world)!, snapshot = encodeWorld(world), template = scene('school-volcano-breach');
  world.eventHistory.push({ templateId: template.id, year: world.date.year }); expect(eligibleTemplates(world)).not.toContainEqual(template); world.eventHistory = [];
  for (const id of school.classmateIds) world.people[id].health.hospitalizedUntil = world.date.year * 12 + world.date.month + 2;
  expect(eligibleTemplates(world).some(item => item.classmate)).toBe(false); expect(() => bindEvent(world, template)).toThrow(/current school/);
  const teacherAbsent = decodeWorld(snapshot); teacherAbsent.people[school.currentTeacherId].health.hospitalizedUntil = world.date.year * 12 + world.date.month + 2; expect(eligibleTemplates(teacherAbsent).some(item => item.teacher)).toBe(false);
  const playerAbsent = decodeWorld(snapshot); playerAbsent.people[playerAbsent.activePersonId].health.hospitalizedUntil = world.date.year * 12 + world.date.month + 2; expect(eligibleTemplates(playerAbsent).some(item => item.school)).toBe(false);
  expect(() => bindEvent(pupil('US', 15), template)).toThrow(/current school/); expect(() => bindEvent(pupil('US', 3), template)).toThrow(/current school/);
});
test('story grades and actual skills report bounded changes and can create a friendship while retaining the same classmate into secondary school', () => {
  let world = pupil('US', 8), school = currentSchool(world)!, player = world.people[world.activePersonId]; player.education.grades = 99;
  const redo = bindEvent(world, scene('school-homework-soap')); offerPending(world, redo); world = resolveCommand(world, { type: 'choose', eventId: redo.id, choiceId: 'redo' });
  expect(world.people[world.activePersonId].education.grades).toBe(100); expect(world.pending?.kind === 'result' && world.pending.effects.find(item => item.label === 'Grades')?.value).toBe('+1%');
  if (world.pending?.kind === 'result') world = resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
  player = world.people[world.activePersonId]; player.skills.music = 99; school = currentSchool(world)!; const peerId = school.classmateIds[0], relation = relationFor(world, player.id, peerId)!; relation.strength = 59;
  const practice = bindEvent(world, scene('school-recorder-solo')); offerPending(world, practice); world = resolveCommand(world, { type: 'choose', eventId: practice.id, choiceId: 'practice' });
  expect(world.people[player.id].skills.music).toBe(100); expect(relationFor(world, player.id, peerId)?.roles).toEqual(['classmate', 'friend']);
  if (world.pending?.kind === 'result') world = resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
  world.date.year = 2012; for (const person of Object.values(world.people)) educationMonth(world, person); schoolMonth(world);
  expect(currentSchool(world)!.stage).toBe('secondary'); expect(currentSchool(world)!.classmateIds).toContain(peerId); expect(relationFor(world, player.id, peerId)?.roles).toContain('friend'); expect(world.schoolCommunities[0].endReason).toBe('changed-school'); validateWorld(world);
});
test('the real world-21 school archive preserves attendance, exact grades, people, help draw, paid earnings and the earlier planning checkpoint', () => {
  const save = decodeSave(JSON.stringify(schoolArchive)), original = JSON.parse(strFromU8(gunzipSync(Buffer.from(JSON.parse(schoolArchive.checkpoint).data, 'base64')))), encoded = JSON.parse(encodeWorld(save.world));
  expect(original.schemaVersion).toBe(21); expect(save.world.schemaVersion).toBe(35); expect(save.world.engineVersion).toBe(36);
  for (const key of Object.keys(original).filter(key => key !== 'schemaVersion' && key !== 'engineVersion' && key !== 'contentVersion')) expect(encoded[key]).toEqual(original[key]);
  const school = currentSchool(save.world)!; expect(school.periods).toHaveLength(13); expect(school.exams).toEqual([{ month: 24083, term: 1, grade: 76 }]); expect(school.help[0]).toMatchObject({ chance: 80, roll: 68, accepted: true, gradeBefore: 71, gradeGain: 3 }); expect(save.world.people[save.world.activePersonId].skills.science).toBe(12);
  const prior = unpackCheckpoint(save.snapshots[0].payload), priorSchool = currentSchool(prior)!; expect(priorSchool.periods).toHaveLength(1); expect(priorSchool.exams).toEqual([]); expect(priorSchool.classmateIds).toEqual(school.classmateIds); expect(priorSchool.currentTeacherId).toBe(school.currentTeacherId); expect(prior.people[prior.activePersonId].skills.science).toBe(0); expect(priorSchool.help).toEqual(school.help);
});
test('a school choice changes later university eligibility using actual grades and still requires the earned secondary qualification', () => {
  let world = pupil('US', 17);
  for (let month = 0; month < 11; month++) { world.date = monthFrom(world.date, 1); educationMonth(world, world.people[world.activePersonId]); schoolMonth(world); }
  world.people[world.activePersonId].education.grades = 53;
  const event = bindEvent(world, scene('teen-exam-freeze')); offerPending(world, event); world = resolveCommand(world, { type: 'choose', eventId: event.id, choiceId: 'skip' });
  expect(world.people[world.activePersonId].education.grades).toBe(55); expect(world.people[world.activePersonId].education.qualifications).toEqual([]);
  if (world.pending?.kind === 'result') world = resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
  expect(enrollmentReason(world, 'university', 'computing')).toMatch(/Finish secondary/);
  world.date = monthFrom(world.date, 1); educationMonth(world, world.people[world.activePersonId]); refreshSchools(world);
  expect(world.people[world.activePersonId].education.qualifications).toEqual([{ level: 'secondary', field: 'general', year: 2018 }]); expect(enrollmentReason(world, 'university', 'computing')).toBeUndefined(); validateWorld(world);
});
test('the first year guarantees a real choice without inventing a parent after both parents die', () => {
  let world = pupil('US', 0); const playerId = world.activePersonId;
  const parents = world.relationships.filter(item => item.to === playerId && item.roles.includes('parent')).map(item => item.from);
  for (const id of parents) recordDeath(world, id, 'test fixture');
  const familyIds = Object.keys(world.people); expect(eligibleTemplates({ ...world, date: { ...world.date, year: 2001 } }).filter(item => item.min === 1 && !item.parent)).toHaveLength(5);
  world = resolveCommand(world, { type: 'advance' });
  expect(world.pending?.kind).toBe('decision');
  if (world.pending?.kind !== 'decision') throw new Error('Missing first-year choice');
  expect(['first-echo', 'first-sock-escape', 'first-mirror-guest', 'first-bubble-catch', 'first-tower-demolition']).toContain(world.pending.templateId); expect(world.pending.personIds).toEqual([playerId]); expect(Object.keys(world.people)).toEqual(familyIds);
  expect(world.pending.body).not.toMatch(/\b(?:parent|dad|mum|mom|mother|father)\b/i); expect(decodeWorld(encodeWorld(world)).pending).toEqual(world.pending); validateWorld(world);
});
