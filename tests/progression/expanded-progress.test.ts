import { decodeSave } from '../../src/persistence/archive';
import { copyWorld, decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { recordDeath, resolveCommand, type GameCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { lifeProgress, progressFacts } from '../../src/progression/progress';
import { achievementDefinitions, challengeDefinitions } from '../../src/progression/catalog';
import { everydayLifeTemplates } from '../../src/game/content/everydayLifeStories';
import { specialStoryWorld } from '../support/specialStory';
import { lifeStoryWorld } from '../support/lifeStory';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import graduate from '../fixtures/v3-employed-graduate.json';
import business from '../fixtures/v11-business-archive.json';
import actor from '../fixtures/v12-career-archive.json';
import election from '../fixtures/v14-election-archive.json';
import creator from '../fixtures/v15-studio-archive.json';
import service from '../fixtures/v16-service-archive.json';
import royal from '../fixtures/v17-royal-archive.json';
import scholarship from '../fixtures/v25-scholarship-archive.json';
import raise from '../fixtures/v30-native-raise-archive.json';

const load = (archive: unknown) => decodeSave(JSON.stringify(archive)).world;
function finish(input: World, observe?: (world: World) => void) {
  let world = input, guard = 0; observe?.(world);
  while ((world.pending || world.annual) && !world.people[world.activePersonId].died && guard++ < 200) {
    const command: GameCommand = world.pending?.kind === 'decision'
      ? { type: 'choose', eventId: world.pending.id, choiceId: world.pending.choices.find(choice => !choiceUnavailable(world, choice))!.id }
      : world.pending ? { type: 'acknowledge', resultId: world.pending.id } : { type: 'resume' };
    world = resolveCommand(world, command, true); observe?.(world);
  }
  expect(guard).toBeLessThan(200); return world;
}
const act = (world: World, command: GameCommand, observe?: (world: World) => void) => finish(resolveCommand(world, command, true), observe);

const examples = [
  ['business', business, { foundedBusinesses: 1, profitMonths: 12, profitableBusinesses: 1 }, 'first-business'],
  ['acting', actor, { actorProjects: 1, completedProjects: 1, awardedProjects: 1 }, 'actor-project'],
  ['election still awaiting office work', election, { musicianProjects: 1, politicianProjects: 0 }, 'musician-project'],
  ['retained and archived live work', creator, { streamerBroadcasts: 102, creatorPosts: 102, liveMinutes: 6120, youtuberPosts: 0 }, 'streamer-work'],
  ['completed military duty', service, { militaryAssignments: 1, spaceAssignments: 0 }, 'military-assignment'],
  ['personal royal duty', royal, { royalEngagements: 24 }, 'royal-service'],
  ['billed scholarship support before completion', scholarship, { tuitionWaivers: 2, completedScholarships: 0 }, 'tuition-support'],
  ['actual native accepted raise', raise, { acceptedRaises: 1 }, 'first-raise'],
] as const;
test.each(examples)('%s uses the original person’s actual records without awarding or writing anything', (_label, archive, expected, earned) => {
  const world = load(archive), before = encodeWorld(world), progress = lifeProgress(world)!;
  expect(progress.facts).toMatchObject(expected); expect(progress.achievements.find(item => item.id === earned)?.complete).toBe(true);
  for (const value of Object.values(progress.facts)) { expect(Number.isFinite(value)).toBe(true); expect(value).toBeGreaterThanOrEqual(0); }
  for (const challenge of progress.challenges) { expect(challenge.percent).toBeGreaterThanOrEqual(0); expect(challenge.percent).toBeLessThanOrEqual(100); }
  expect(lifeProgress(world)).toEqual(progress); expect(encodeWorld(world)).toBe(before); expect(lifeProgress(decodeWorld(before))).toEqual(progress);
});

test('all forty-five achievements and fourteen challenges have unique stable IDs and real positive goals', () => {
  expect(achievementDefinitions).toHaveLength(45); expect(challengeDefinitions).toHaveLength(14);
  for (const entries of [achievementDefinitions, challengeDefinitions]) expect(new Set(entries.map(item => item.id)).size).toBe(entries.length);
  for (const goal of [...achievementDefinitions.map(item => item.goal), ...challengeDefinitions.flatMap(item => item.goals)]) {
    expect(goal.target).toBeGreaterThan(0); expect(Number.isInteger(goal.target)).toBe(true); expect(goal.label.trim()).not.toBe('');
  }
});

test('a real personal payoff stays earned when the same credit line is drawn again; partial payments and estate settlement do not fake it', () => {
  let world = decodeWorld(JSON.stringify(graduate));
  world = act(world, { type: 'borrow', amount: 10000n }); const loan = world.liabilities.find(item => item.kind === 'personal' && item.ownerId === world.activePersonId)!;
  world = act(world, { type: 'repay', liabilityId: loan.id, amount: 1000n });
  expect(progressFacts(world)?.repaidPersonalLoans).toBe(0);
  const partial = encodeWorld(world); world = act(world, { type: 'repay', liabilityId: loan.id, amount: 9000n });
  expect(progressFacts(world)?.repaidPersonalLoans).toBe(1); expect(lifeProgress(world)?.achievements.find(item => item.id === 'loan-repaid')?.complete).toBe(true);
  world = act(world, { type: 'borrow', amount: 500n }); expect(world.liabilities.find(item => item.id === loan.id)?.principal).toBe(500n);
  expect(progressFacts(world)?.repaidPersonalLoans).toBe(1); expect(progressFacts(decodeWorld(encodeWorld(world)))?.repaidPersonalLoans).toBe(1);
  const estate = decodeWorld(partial); recordDeath(estate, estate.activePersonId, 'explicit terminal test scenario'); validateWorld(estate);
  expect(estate.liabilities.find(item => item.id === loan.id)?.principal).toBe(0n); expect(progressFacts(estate)?.repaidPersonalLoans).toBe(0);
});

test('a real scholarship course finishes its goal only after the remaining study, while the earlier timeline stays incomplete', () => {
  const original = load(scholarship); let world = finish(original);
  for (let year = 0; year < 3 && !world.scholarships.some(item => item.status === 'completed'); year++) {
    if (world.people[world.activePersonId].education.lastStudyYear !== world.date.year) world = act(world, { type: 'study' });
    world = act(world, { type: 'advance' });
  }
  expect(progressFacts(world)?.completedScholarships).toBe(1);
  expect(lifeProgress(world)?.challenges.find(item => item.id === 'supported-study')).toMatchObject({ complete: true, percent: 100 });
  expect(progressFacts(original)?.completedScholarships).toBe(0);
});

test('actual additional live production rolls old posts into archives without losing or doubling progress', () => {
  let world = load(creator); const id = world.socialAccounts.find(item => item.ownerId === world.activePersonId)!.id;
  expect(progressFacts(world)).toMatchObject({ streamerBroadcasts: 102, liveMinutes: 6120 });
  world = act(world, { type: 'advance' }); const account = world.socialAccounts.find(item => item.id === id)!;
  expect(account.totalPosts).toBeGreaterThan(102); expect(account.posts).toHaveLength(60);
  expect(progressFacts(world)).toMatchObject({ creatorPosts: account.totalPosts, streamerBroadcasts: account.totalPosts, liveMinutes: account.totalPosts * 60 });
  const outsider = Object.keys(world.people).find(personId => personId !== world.activePersonId)!;
  expect(progressFacts(world, outsider)).toMatchObject({ creatorPosts: 0, youtuberPosts: 0, streamerBroadcasts: 0, liveMinutes: 0 });
  expect(lifeProgress(decodeWorld(encodeWorld(world)))).toEqual(lifeProgress(world));
});

test('royal progress survives the real five-year record rollover without borrowing another member’s engagements', () => {
  let world = load(royal); const id = world.activePersonId, observed = new Map<string, number>();
  const collect = (current: World) => { for (const house of current.royalHouses) for (const record of house.records) if (record.personId === id) observed.set(house.id + ':' + record.year + ':' + record.month, record.engagements); };
  collect(world);
  for (let year = 0; year < 6; year++) { world = act(world, { type: 'advance' }, collect); expect(world.people[id].died).toBeNull(); }
  expect(world.royalHouses.some(house => house.archives.some(item => item.personId === id && item.engagements > 0))).toBe(true);
  expect(progressFacts(world, id)?.royalEngagements).toBe([...observed.values()].reduce((sum, n) => sum + n, 0));
  expect(progressFacts(world, id)!.royalEngagements).toBeGreaterThan(24);
  const outsider = Object.keys(world.people).find(personId => !world.royalHouses.some(house => house.members.some(member => member.personId === personId)))!;
  expect(progressFacts(world, outsider)?.royalEngagements).toBe(0);
});

test('an uncompleted new assignment and a real early return do not add another military completion', () => {
  let world = finish(load(service)); const career = world.serviceCareers.find(item => item.personId === world.activePersonId)!;
  world = act(world, { type: 'start-assignment', serviceId: career.id, kind: 'disaster-relief' });
  expect(progressFacts(world)?.militaryAssignments).toBe(1);
  world = act(world, { type: 'return-assignment', serviceId: career.id });
  expect(progressFacts(world)?.militaryAssignments).toBe(1); expect(world.serviceCareers[0].assignments.at(-1)?.status).toBe('returned');
});

test('a fixture-qualified actual space programme must finish real training and an assignment before its goal completes', () => {
  // Explicit qualified domain setup, not a natural/native birth-to-career journey.
  let world = specialStoryWorld(everydayLifeTemplates.find(item => item.specialCareer === 'astronaut')!);
  world = act(world, { type: 'health-routine', routine: { exercise: 'walking', diet: 'balanced', sleep: 'restful', mindfulness: true, smoking: false, drinking: 'none' } });
  expect(progressFacts(world)?.spaceAssignments).toBe(0);
  for (let year = 0; year < 2; year++) world = act(world, { type: 'advance' });
  for (let attempt = 0; attempt < 4 && !progressFacts(world)!.spaceAssignments; attempt++) {
    const career = world.serviceCareers.find(item => item.personId === world.activePersonId && item.kind === 'astronaut')!;
    world = act(world, { type: 'start-assignment', serviceId: career.id, kind: 'orbital-research' }); world = act(world, { type: 'advance' });
  }
  expect(progressFacts(world)).toMatchObject({ spaceAssignments: 1, militaryAssignments: 0 });
  expect(lifeProgress(world)?.achievements.find(item => item.id === 'space-assignment')?.complete).toBe(true);
});

test('recorded pension payments belong to the original retiree, not the child who later continues the same natural family', () => {
  const world = unpackCheckpoint(readFileSync(join(__dirname, '../fixtures/v30-family-year91-checkpoint.json'), 'utf8'), true);
  expect(world.activePersonId).not.toBe('person_player');
  expect(progressFacts(world, 'person_player')?.pensionPeriods).toBe(239);
  expect(lifeProgress(world, 'person_player')?.achievements.find(item => item.id === 'pension-year')?.complete).toBe(true);
  expect(progressFacts(world)?.pensionPeriods).toBe(0);
  expect(lifeProgress(world)?.achievements.find(item => item.id === 'first-pension')?.complete).toBe(false);
});

test('a separate YouTuber studio needs actual production, while earlier Streamer broadcasts remain attributed to their original work', () => {
  let world = load(creator); const streamer = world.creatorStudios[0];
  world = act(world, { type: 'leave-creator', studioId: streamer.id });
  world = act(world, { type: 'create-social', platform: 'videowave', handle: 'a_new_original', bio: '' });
  const accountId = world.socialAccounts.find(item => item.ownerId === world.activePersonId && item.platform === 'videowave')!.id;
  world = act(world, { type: 'start-creator', kind: 'youtuber', accountId });
  expect(progressFacts(world)).toMatchObject({ youtuberPosts: 0, streamerBroadcasts: 102 });
  world = act(world, { type: 'social-routine', accountId, cadence: 'twice-monthly', topic: 'video', intent: 'authentic' });
  world = act(world, { type: 'advance' });
  expect(progressFacts(world)!.youtuberPosts).toBeGreaterThanOrEqual(12);
  expect(progressFacts(world)?.streamerBroadcasts).toBe(102);
  expect(lifeProgress(world)?.achievements.find(item => item.id === 'youtuber-work')?.complete).toBe(true);
});

test('actual care after an adopter dies cannot keep increasing that person’s lifetime pet milestone', () => {
  // Qualified family fixture; the death and legacy continuation use actual settlement.
  const initial = lifeStoryWorld(), oldId = initial.activePersonId, before = progressFacts(initial)!.petCareMonths;
  const dead = copyWorld(initial); recordDeath(dead, oldId, 'explicit terminal test scenario'); validateWorld(dead);
  const childId = dead.relationships.find(edge => edge.from === oldId && edge.roles.includes('parent') && dead.people[edge.to].born.year <= dead.date.year - 18)!.to;
  let world = finish(resolveCommand(dead, { type: 'continue-child', personId: childId }, true));
  world = act(world, { type: 'advance' });
  expect(world.pets.some(pet => pet.adoptedById === oldId && pet.periods.length > initial.pets.find(item => item.id === pet.id)!.periods.length)).toBe(true);
  expect(progressFacts(world, oldId)?.petCareMonths).toBe(before);
  expect(progressFacts(world)?.petCareMonths).toBe(0);
});
