import { gunzipSync, strFromU8 } from 'fflate';
import { bindEvent, eligibleTemplates } from '../../src/game/content/events';
import { schoolDayTemplates } from '../../src/game/content/schoolDayStories';
import { countries, countryCodes } from '../../src/game/countries';
import { decodeWorld, encodeWorld, validateWorld, World } from '../../src/game/model';
import { recordDeath, resolveCommand } from '../../src/game/engine';
import { decodeSave } from '../../src/persistence/archive';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import { pupil } from '../support/pupil';
import { ownHousehold } from '../../src/game/systems/households';
import { endEmployment } from '../../src/game/systems/work';
import { refreshSchools } from '../../src/game/systems/school';
import archive from '../fixtures/v23-school-plans-archive.json';

const originalWorld = (payload: string) => JSON.parse(strFromU8(gunzipSync(Buffer.from(JSON.parse(payload).data, 'base64'))));
function scheduled() {
  return decodeSave(JSON.stringify(archive)).snapshots.map(record => unpackCheckpoint(record.payload)).find(world => world.storyThreads.every(item => item.status === 'scheduled'))!;
}
test.each([
  ['parent household', (world: World) => ownHousehold(world, world.people[world.storyThreads[1].parentId!])],
  ['teacher contract', (world: World) => endEmployment(world, world.storyThreads[0].teacherId!)],
  ['peer school', (world: World) => { world.people[world.storyThreads[0].peerId].education.stage = 'none'; }],
  ['player school', (world: World) => { world.people[world.activePersonId].education.school = 'Different school'; refreshSchools(world); }],
  ['active identity', (world: World) => { world.activePersonId = world.storyThreads[1].parentId!; }],
] as const)('a contradictory scheduled save with changed %s is rejected without silently cancelling or rebinding it', (_name, change) => {
  const world = scheduled(); change(world);
  expect(() => validateWorld(world)).toThrow('Invalid scheduled story');
  expect(world.storyThreads.every(item => item.status === 'scheduled')).toBe(true);
  expect(world.storyThreads.every(item => item.ended === null)).toBe(true);
});
test.each(['parent', 'teacher', 'player'] as const)('a tampered save cannot revive a scheduled plan after actual %s death and estate settlement', who => {
  const world = scheduled(), before = structuredClone(world.storyThreads), id = who === 'parent' ? before[1].parentId! : who === 'teacher' ? before[0].teacherId! : world.activePersonId;
  recordDeath(world, id, 'test illness'); expect(world.storyThreads.some(item => item.status === 'cancelled')).toBe(true);
  world.storyThreads = before;
  expect(() => validateWorld(world)).toThrow('Invalid scheduled story'); expect(world.people[id].died).not.toBeNull();
});
test.each(['parent', 'teacher', 'peer', 'player'] as const)('a scheduled plan may still be loaded during temporary %s hospitalization before its deadline', who => {
  const world = scheduled(), id = who === 'parent' ? world.storyThreads[1].parentId! : who === 'teacher' ? world.storyThreads[0].teacherId! : who === 'peer' ? world.storyThreads[0].peerId : world.activePersonId;
  world.people[id].health.hospitalizedUntil = world.date.year * 12 + world.date.month + 3;
  expect(decodeWorld(encodeWorld(world))).toEqual(world); expect(world.storyThreads.every(item => item.status === 'scheduled')).toBe(true);
});
test('the genuine content-two SQLite archive migrates current and prior choices without changing bound choices, money or random streams', () => {
  const original = originalWorld(archive.checkpoint), save = decodeSave(JSON.stringify(archive));
  expect(original.schemaVersion).toBe(23); expect(original.engineVersion).toBe(22); expect(original.contentVersion).toBe(2);
  expect(save.world.contentVersion).toBe(26); expect(save.snapshots).toHaveLength(2); expect(save.world.schoolCompletions).toEqual([]); expect(save.world.recoveryCourses).toEqual([]);
  const encoded = JSON.parse(encodeWorld(save.world));
  for (const key of Object.keys(original).filter(key => !['schemaVersion', 'engineVersion', 'contentVersion'].includes(key))) expect(encoded[key]).toEqual(original[key]);
  for (const record of save.snapshots) {
    const prior = originalWorld(record.payload), migrated = JSON.parse(encodeWorld(unpackCheckpoint(record.payload)));
    expect(prior.contentVersion).toBe(2); expect(migrated.contentVersion).toBe(26);
    for (const key of Object.keys(prior).filter(key => !['schemaVersion', 'engineVersion', 'contentVersion'].includes(key))) expect(migrated[key]).toEqual(prior[key]);
  }
  expect(save.world.storyThreads.map(item => item.status)).toEqual(['scheduled', 'resolved']);
  const paymentId = save.world.storyThreads[1].paidTransactionId;
  expect(paymentId).toBe('txn_5_30'); expect(save.world.ledger.find(item => item.id === paymentId)?.cashDelta).toBe(-2000n);
  expect(save.world.pending?.kind === 'result' && save.world.pending.title).toBe('High score, low dignity');
  const oldDecision = save.snapshots.map(record => unpackCheckpoint(record.payload)).find(world => world.pending?.kind === 'decision')!;
  expect(oldDecision.pending?.kind === 'decision' && oldDecision.pending.templateId).toBe('story-arcade-invitation');
  if (save.world.pending?.kind !== 'result') throw new Error('Missing paid result');
  const due = resolveCommand(save.world, { type: 'acknowledge', resultId: save.world.pending.id });
  expect(due.pending?.kind === 'decision' && due.pending.templateId).toBe('story-project-promise');
  expect(due.annual?.monthsProcessed).toBe(2); expect(due.storyThreads[1]).toEqual(save.world.storyThreads[1]);
  expect(due.ledger.filter(item => item.category === 'story-outing')).toEqual(save.world.ledger.filter(item => item.category === 'story-outing'));
  expect(decodeWorld(encodeWorld(due))).toEqual(due);
});

test.each(countryCodes)('%s parentless preschool stories remain available without inventing family or consuming RNG while browsing', country => {
  const world = pupil(country, 3), personId = world.activePersonId;
  for (const id of world.relationships.filter(item => item.to === personId && item.roles.includes('parent')).map(item => item.from)) recordDeath(world, id, 'test illness');
  const before = encodeWorld(world), eligible = eligibleTemplates(world), preschool = schoolDayTemplates.filter(item => !item.school);
  expect(preschool).toHaveLength(5);
  for (const template of preschool) {
    expect(eligible).toContain(template);
    const event = bindEvent(world, template); expect(event.personIds).toEqual([personId]);
    expect(event.body).not.toMatch(/\b(parent|mother|father|mum|dad|guardian)\b/i);
    expect(event.choices.flatMap(item => item.effects).every(effect => effect.kind === 'stat')).toBe(true);
  }
  expect(world.people[personId].country).toBe(country); expect(world.people[personId].city).toBe(countries[country].cities[0]);
  expect(encodeWorld(world)).toBe(before);
});
