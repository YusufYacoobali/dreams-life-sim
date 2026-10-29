import { copyWorld, decodeWorld, encodeWorld, immutableWorld, validateWorld, type World } from '../../src/game/model';
import { recordDeath, resolveCommand } from '../../src/game/engine';
import { randomInteger } from '../../src/game/random';
import { monthFrom } from '../../src/game/calendar';
import { socialMonth } from '../../src/game/systems/social';
import { addChild } from '../../src/game/systems/family';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { arrangedCriticismRoll, criticismPost, criticismProfile, finishCriticismScene } from '../support/criticismFixture';

function year(input: World, value: number, month = 1) {
  const world = copyWorld(input); world.date = { year: value, month, day: 1 };
  world.people[world.activePersonId].stats.energy = 100;
  return world;
}
function post(input: World, accountId = input.socialAccounts[0].id) {
  const before = arrangedCriticismRoll(input);
  return resolveCommand(before, { type: 'publish-post', accountId, kind: 'photo', intent: 'authentic', sponsored: false, caption: 'An original moment.' }, true);
}
function noCriticismPenalty(before: World, after: World, accountId = before.socialAccounts[0].id) {
  const account = after.socialAccounts.find(item => item.id === accountId)!;
  expect(account.posts.at(-1)!.response).not.toBe('controversial');
  expect(account.posts.at(-1)!.followerDelta).toBeGreaterThanOrEqual(0);
  expect(account.strikes).toBe(before.socialAccounts.find(item => item.id === accountId)!.strikes);
  expect(after.people[after.activePersonId].publicLife.image).toBe(before.people[before.activePersonId].publicLife.image);
  expect(after.relationships).toEqual(before.relationships);
  expect(after.controversies).toEqual(before.controversies);
  expect([after.pending, ...after.deferred.map(row => row.event)].some(event => event?.kind === 'decision' && event.templateId === 'public-controversy')).toBe(false);
}
function nonCriticismRoll(input: World) {
  const world = copyWorld(input);
  for (let state = 0; state < 10000; state++) {
    const reach = randomInteger(state, 20, 120), roll = randomInteger(reach.state, 1, 1000).value;
    if (roll > 300 && roll < 800) { world.random.outcomes = state; return immutableWorld(world); }
  }
  throw new Error('No ordinary response seed');
}

test.each([
  ['authentic', 80, true], ['authentic', 81, false],
  ['provocative', 250, true], ['provocative', 251, false],
] as const)('the annual %s response threshold at %i is %s, reusing the existing response draw', (intent, response, expected) => {
  const world = copyWorld(criticismProfile('photogram', true));
  let seed: number | undefined;
  for (let state = 0; state < 100000; state++) {
    const reach = randomInteger(state, 20, 120);
    if (randomInteger(reach.state, 1, 1000).value === response) { seed = state; break; }
  }
  if (seed === undefined) throw new Error('Missing exact response seed');
  world.random.outcomes = seed;
  const before = { ...world.random };
  const next = resolveCommand(world, { type: 'publish-post', accountId: world.socialAccounts[0].id, kind: 'photo', intent, sponsored: false, caption: 'An original moment.' }, true);
  expect(next.socialAccounts[0].posts[0].response === 'controversial').toBe(expected);
  let state = seed;
  for (const [minimum, maximum] of [[20, 120], [1, 1000], [0, 250], [2, 12], ...(expected ? [[5, 15], [1, 100]] : [])]) state = randomInteger(state, minimum, maximum).state;
  expect(next.random).toEqual({ ...before, outcomes: state });
});

test('2030 criticism blocks penalties through 2036 across cold saves and snapshots; 2037 can draw again', () => {
  let world = year(criticismProfile('photogram', true), 2030, 12);
  world = post(world);
  expect(world.controversies).toHaveLength(1); expect(world.controversies[0].date.year).toBe(2030);
  world = finishCriticismScene(world);
  const oldHistory = encodeWorld(world);
  for (const value of [2030, 2031, 2036]) {
    const candidate = year(unpackCheckpoint(packCheckpoint(world), true), value, 12);
    const next = post(candidate); noCriticismPenalty(candidate, next);
    expect(decodeWorld(encodeWorld(next))).toEqual(next);
  }
  const eligible = year(decodeWorld(oldHistory), 2037), next = post(eligible);
  expect(next.controversies).toHaveLength(2);
  expect(next.controversies.map(item => item.date.year)).toEqual([2030, 2037]);
  expect(next.controversies[0]).toEqual(world.controversies[0]);
  expect(decodeWorld(encodeWorld(next))).toEqual(next);
});

test('the most recent relevant incident controls the boundary even if history order differs', () => {
  let world = finishCriticismScene(post(year(criticismProfile('photogram', true), 2030)));
  world = finishCriticismScene(post(year(world, 2037)));
  world = copyWorld(world); world.controversies.reverse();
  const blocked = year(world, 2043); noCriticismPenalty(blocked, post(blocked));
  const next = post(year(world, 2044));
  expect(next.controversies).toHaveLength(3);
  expect(next.controversies.at(-1)!.date.year).toBe(2044);
});

test('a resolved public incident without a source post does not consume the audience-criticism cooldown', () => {
  const world = year(criticismProfile('photogram', true), 2030);
  world.controversies.push({ id: 'arranged_non_post_incident', personId: world.activePersonId, accountId: null, postId: null, date: { ...world.date }, title: 'Recorded public incident', body: 'A public incident unrelated to a delivered post.', impact: 0, responseRoll: 50, response: 'clarify', resolved: { ...world.date } });
  validateWorld(world);
  const next = post(world);
  expect(next.controversies).toHaveLength(2);
  expect(next.controversies[0]).toEqual(world.controversies[0]);
  expect(next.controversies[1].postId).not.toBeNull();
});

test('cooldown follows the player across platforms, including a closed and reopened source account', () => {
  let world = year(criticismProfile('photogram', true), 2030);
  world = finishCriticismScene(resolveCommand(world, { type: 'create-social', platform: 'lifelink', handle: 'other_platform', bio: '' }, true));
  world = finishCriticismScene(post(world));
  const sourceId = world.socialAccounts[0].id, otherId = world.socialAccounts[1].id;
  world = finishCriticismScene(resolveCommand(world, { type: 'delete-social', accountId: sourceId }, true));
  const next = post(world, otherId); noCriticismPenalty(world, next, otherId);
  world = finishCriticismScene(next);
  world = finishCriticismScene(resolveCommand(world, { type: 'reopen-social', accountId: sourceId }, true));
  const before = year(decodeWorld(encodeWorld(world)), 2036);
  noCriticismPenalty(before, post(before, sourceId));
});

test('continuing as an adult child retains the parent history without inheriting their criticism cooldown', () => {
  let world = year(criticismProfile('photogram', true), 2030);
  const parentId = world.activePersonId, child = addChild(world, [world.people[parentId]], 'adoptive', 2);
  world = finishCriticismScene(post(year(world, 2046)));
  const incident = world.controversies[0];
  world = copyWorld(world);
  recordDeath(world, parentId, 'arranged legacy transition');
  world = finishCriticismScene(resolveCommand(world, { type: 'continue-child', personId: child.id }, true));
  world = finishCriticismScene(resolveCommand(world, { type: 'create-social', platform: 'photogram', handle: 'next_generation', bio: '' }, true));
  const accountId = world.socialAccounts.find(account => account.ownerId === child.id)!.id;
  const next = post(world, accountId);
  expect(next.controversies).toHaveLength(2);
  expect(next.controversies[0]).toEqual(incident);
  expect(next.controversies.map(item => item.personId)).toEqual([parentId, child.id]);
  expect(next.controversies.every(item => item.date.year === 2046)).toBe(true);
  expect(decodeWorld(encodeWorld(next))).toEqual(next);
});

test('one ordinary first post consumes the annual chance across platforms; archiving and deleting cannot reroll it', () => {
  let world = year(criticismProfile('photogram', true), 2030);
  world = finishCriticismScene(resolveCommand(world, { type: 'create-social', platform: 'lifelink', handle: 'other_platform', bio: '' }, true));
  world = finishCriticismScene(resolveCommand(nonCriticismRoll(world), criticismPost(world), true));
  world = copyWorld(world);
  const account = world.socialAccounts[0], delivered = account.posts.shift()!;
  // An explicit history-storage arrangement: retain every measured field of
  // the actual delivered post in its existing annual archive representation.
  account.archived.push({ year: 2030, posts: 1, studioPosts: {}, livePosts: 0, liveMinutes: 0, virals: 0, views: delivered.views, likes: delivered.likes, comments: delivered.comments, followerDelta: delivered.followerDelta, income: delivered.income.minor });
  validateWorld(world);
  world = finishCriticismScene(resolveCommand(world, { type: 'delete-social', accountId: account.id }, true));
  world = unpackCheckpoint(packCheckpoint(world), true);
  const otherId = world.socialAccounts[1].id, next = post(world, otherId);
  noCriticismPenalty(world, next, otherId);
  const followingYear = post(year(finishCriticismScene(next), 2031), otherId);
  expect(followingYear.controversies).toHaveLength(1);
});

test('a failed annual chance remains ordinary for later manual posts and the next year is not guaranteed criticism', () => {
  const initial = year(criticismProfile('photogram', true), 2030);
  const first = finishCriticismScene(resolveCommand(nonCriticismRoll(initial), criticismPost(initial), true));
  for (let index = 0; index < 4; index++) {
    const next = post(first); noCriticismPenalty(first, next);
  }
  const followingYear = nonCriticismRoll(year(first, 2031));
  const next = resolveCommand(followingYear, criticismPost(followingYear), true);
  noCriticismPenalty(followingYear, next);
});

test('scheduled weekly posts cannot multiply the annual criticism chance, even across two accounts', () => {
  let world = year(criticismProfile('photogram', true), 2030);
  world = finishCriticismScene(resolveCommand(world, { type: 'create-social', platform: 'lifelink', handle: 'other_platform', bio: '' }, true));
  for (const account of world.socialAccounts) world = finishCriticismScene(resolveCommand(world, { type: 'social-routine', accountId: account.id, cadence: 'weekly', topic: 'photo', intent: 'authentic' }, true));
  // Consume the person's first annual opportunity with an ordinary manual post.
  world = finishCriticismScene(resolveCommand(nonCriticismRoll(world), criticismPost(world), true));
  const image = world.people[world.activePersonId].publicLife.image;
  for (let index = 0; index < 10; index++) {
    world = copyWorld(arrangedCriticismRoll(world));
    world.date = monthFrom(world.date, 1, 1); world.people[world.activePersonId].stats.energy = 100;
    socialMonth(world); world = finishCriticismScene(world);
  }
  expect(world.socialAccounts.every(account => account.totalPosts >= 40)).toBe(true);
  expect(world.controversies).toEqual([]);
  expect(world.socialAccounts.every(account => account.strikes === 0)).toBe(true);
  expect(world.people[world.activePersonId].publicLife.image).toBe(image);
  expect(decodeWorld(encodeWorld(world))).toEqual(world);
});
