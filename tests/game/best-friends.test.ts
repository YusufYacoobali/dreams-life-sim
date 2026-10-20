import { ageOn, copyWorld, decodeWorld, encodeWorld, validateWorld } from '../../src/game/model';
import { recordDeath, resolveCommand } from '../../src/game/engine';
import { randomInteger } from '../../src/game/random';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { bestFriendshipReason } from '../../src/game/systems/friendships';
import { bestFriendshipChanceV1, bestFriendshipHistory, bestFriendshipIndex, currentBestFriendship } from '../../src/game/systems/friendshipSchemas';
import { connectPerson, relationFor, relationLabel } from '../../src/game/systems/relationships';
import { acknowledgeFriendship, bestFriendsFixture, friendshipEnd, friendshipProposal } from '../support/bestFriendsFixture';
import graduate from '../fixtures/v3-employed-graduate.json';

const outcome = (accepted: boolean) => {
  const fixture = bestFriendsFixture(), world = copyWorld(fixture.world), relation = relationFor(world, world.activePersonId, fixture.friendId)!, chance = bestFriendshipChanceV1(relation.strength, relation.trust);
  // Explicit chosen-response unit setup, not a natural consent-rate observation.
  for (let seed = 1; seed < 10000; seed++) if ((randomInteger(seed, 1, 100).value <= chance) === accepted) { world.random.npcs = seed; return { ...fixture, world: validateWorld(world, true) }; }
  throw new Error('No selected consent fixture');
};

test.each([true, false])('a real proposal records accepted=%s once, consumes only one NPC draw and grants no bond, trust, role, stat or money', accepted => {
  const { world, friendId } = outcome(accepted), before = encodeWorld(world), nextRandom = randomInteger(world.random.npcs, 1, 100), command = friendshipProposal(world, friendId), next = resolveCommand(world, command, true), row = next.bestFriendships[0];
  expect(encodeWorld(world)).toBe(before); expect(next.random).toEqual({ ...world.random, npcs: nextRandom.state });
  for (const field of ['people', 'relationships', 'accounts', 'ledger', 'liabilities', 'workHistory', 'schoolCommunities', 'storyThreads'] as const) expect(next[field]).toEqual(world[field]);
  expect(row).toMatchObject({ relationshipId: command.relationshipId, proposerId: world.activePersonId, friendId, proposed: world.date, country: command.country, city: command.city, strength: 85, trust: 80, chance: 95, roll: nextRandom.value, status: accepted ? 'active' : 'declined', ended: null, endReason: null });
  expect(next.pending).toMatchObject({ kind: 'result', title: accepted ? 'Your best friend' : 'Still friends' });
  expect(currentBestFriendship(next)?.id).toBe(accepted ? row.id : undefined); expect(relationLabel(next, relationFor(next, world.activePersonId, friendId)!)).toBe(accepted ? 'Best friend' : 'Friend');
  expect(unpackCheckpoint(packCheckpoint(next), true)).toEqual(next); expect(decodeWorld(encodeWorld(next), true)).toEqual(next);
  const done = acknowledgeFriendship(next), unchanged = encodeWorld(done); expect(() => resolveCommand(done, command, true)).toThrow(accepted ? /already best/ : /already asked/); expect(encodeWorld(done)).toBe(unchanged);
});

test('explicit ending keeps ordinary friendship/consent/history exactly and cannot be repeated or bypass the same-year guard', () => {
  const setup = outcome(true), active = acknowledgeFriendship(resolveCommand(setup.world, friendshipProposal(setup.world, setup.friendId), true)), command = friendshipEnd(active, setup.friendId), ended = resolveCommand(active, command, true);
  expect(ended.bestFriendships[0]).toEqual({ ...active.bestFriendships[0], status: 'ended', ended: active.date, endReason: 'choice', endedById: active.activePersonId }); expect(ended.random).toEqual(active.random);
  expect(ended.people).toEqual(active.people); expect(ended.relationships).toEqual(active.relationships); expect(ended.accounts).toEqual(active.accounts); expect(ended.ledger).toEqual(active.ledger);
  expect(currentBestFriendship(ended)).toBeUndefined(); expect(relationLabel(ended, relationFor(ended, ended.activePersonId, setup.friendId)!)).toBe('Friend');
  const done = acknowledgeFriendship(ended), before = encodeWorld(done); expect(() => resolveCommand(done, command, true)).toThrow(/current best/); expect(() => resolveCommand(done, friendshipProposal(done, setup.friendId), true)).toThrow(/already asked/); expect(encodeWorld(done)).toBe(before);
});

test.each(['life', 'actor', 'relationship', 'country', 'city'] as const)('%s-stale proposals reject before any state or RNG change', field => {
  const { world, friendId } = outcome(true), command = friendshipProposal(world, friendId), before = encodeWorld(world);
  const changed = field === 'life' ? { ...command, lifeId: 'life_other' } : field === 'actor' ? { ...command, actorId: friendId } : field === 'relationship' ? { ...command, relationshipId: 'relation_other' } : field === 'country' ? { ...command, country: 'JP' as const } : { ...command, city: 'Another city' };
  expect(() => resolveCommand(world, changed, true)).toThrow(/Review/); expect(encodeWorld(world)).toBe(before);
});

test('actual known-peer, family, age, presence, bond, trust and current-friend restrictions stay explicit and refuse without draws', () => {
  const fixture = outcome(true), missing = friendshipProposal(fixture.world, fixture.friendId);
  for (const prepare of [
    (world: ReturnType<typeof copyWorld>) => { relationFor(world, world.activePersonId, fixture.friendId)!.strength = 74; },
    (world: ReturnType<typeof copyWorld>) => { relationFor(world, world.activePersonId, fixture.friendId)!.trust = 59; },
    (world: ReturnType<typeof copyWorld>) => { const edge = relationFor(world, world.activePersonId, fixture.friendId)!; edge.roles = ['classmate']; edge.kind = 'classmate'; },
    (world: ReturnType<typeof copyWorld>) => { world.people[fixture.friendId].city = 'Another city'; world.people[fixture.friendId].householdId = null; world.households.forEach(row => { row.members = row.members.filter(id => id !== fixture.friendId); }); },
    (world: ReturnType<typeof copyWorld>) => { world.people[fixture.friendId].health.hospitalizedUntil = world.date.year * 12 + world.date.month + 1; },
  ]) {
    const mutable = copyWorld(fixture.world); prepare(mutable); const world = validateWorld(mutable, true), before = encodeWorld(world); expect(bestFriendshipReason(world, fixture.friendId)).toBeDefined(); expect(() => resolveCommand(world, missing, true)).toThrow(); expect(encodeWorld(world)).toBe(before);
  }
  const parent = fixture.world.relationships.find(row => row.kind === 'parent' && row.to === fixture.world.activePersonId)!.from;
  expect(bestFriendshipReason(fixture.world, parent)).toMatch(/friend|family/); expect(bestFriendshipReason(fixture.world, 'person_missing')).toMatch(/actual friend/);
  expect(ageOn(fixture.world.people[fixture.friendId], fixture.world.date)).toBe(ageOn(fixture.world.people[fixture.world.activePersonId], fixture.world.date));
});

test('actual death closes the exact best-friend agreement without changing old consent or granting an heir that relationship', () => {
  const setup = outcome(true), before = acknowledgeFriendship(resolveCommand(setup.world, friendshipProposal(setup.world, setup.friendId), true)), next = copyWorld(before), row = before.bestFriendships[0];
  recordDeath(next, setup.friendId, 'Explicit mortality branch'); const ended = validateWorld(next, true);
  expect(ended.bestFriendships[0]).toEqual({ ...row, status: 'ended', ended: before.date, endReason: 'death', endedById: setup.friendId }); expect(currentBestFriendship(ended)).toBeUndefined(); expect(bestFriendshipHistory(ended, row.relationshipId)).toHaveLength(1); expect(unpackCheckpoint(packCheckpoint(ended), true)).toEqual(ended);
});

test.each(['roll', 'chance', 'missing-guard', 'duplicate', 'missing-person', 'false-ending', 'false-romance-ending', 'active-dead'] as const)('saved %s contradictions are rejected rather than silently granting or replacing a friend', mutation => {
  const setup = outcome(true), active = resolveCommand(setup.world, friendshipProposal(setup.world, setup.friendId), true), changed = copyWorld(active), row = changed.bestFriendships[0];
  if (mutation === 'roll') row.roll = 100;
  if (mutation === 'chance') row.chance--;
  if (mutation === 'missing-guard') changed.actionCounts = {};
  if (mutation === 'duplicate') changed.bestFriendships.push({ ...row, id: 'best_friendship_999' });
  if (mutation === 'missing-person') row.friendId = 'person_missing';
  if (mutation === 'false-ending') { row.status = 'ended'; row.ended = changed.date; row.endReason = 'death'; row.endedById = setup.friendId; }
  if (mutation === 'false-romance-ending') { row.status = 'ended'; row.ended = changed.date; row.endReason = 'romance'; row.endedById = null; }
  if (mutation === 'active-dead') { changed.people[setup.friendId].died = changed.date; changed.people[setup.friendId].causeOfDeath = 'Contradictory active record'; }
  expect(() => validateWorld(changed)).toThrow();
});

test('immutable label/history lookups reuse their index and mutable command copies never reuse a stale active map', () => {
  const setup = outcome(true), active = acknowledgeFriendship(resolveCommand(setup.world, friendshipProposal(setup.world, setup.friendId), true));
  expect(bestFriendshipIndex(active)).toBe(bestFriendshipIndex(active)); expect(Object.isFrozen(bestFriendshipHistory(active, active.bestFriendships[0].relationshipId))).toBe(true); const mutable = copyWorld(active); expect(bestFriendshipIndex(mutable)).not.toBe(bestFriendshipIndex(mutable));
  const ended = resolveCommand(active, friendshipEnd(active, setup.friendId), true); expect(currentBestFriendship(ended)).toBeUndefined(); expect(currentBestFriendship(active)?.friendId).toBe(setup.friendId);
});


test('age, family and romantic exclusions use actual peer identity and do not change any world or draw', () => {
  const { world, friendId } = outcome(true), before = encodeWorld(world), player = world.people[world.activePersonId];
  // Explicit boundary views for a pure eligibility selector, not valid saved
  // annual progression, a natural age observation or an engine-created person.
  for (const [age, friendAge, expected] of [[5, 5, /age six/], [12, 18, /close to their own age/], [12, 15, /close to their own age/], [18, 17, /close to their own age/]] as const) {
    const view = copyWorld(world); view.people[player.id].born = { ...world.date, year: world.date.year - age }; view.people[friendId].born = { ...world.date, year: world.date.year - friendAge };
    expect(bestFriendshipReason(view, friendId)).toMatch(expected);
  }
  const family = copyWorld(world), parentId = family.relationships.find(row => row.kind === 'parent' && row.to === player.id)!.from, parent = relationFor(family, player.id, parentId)!; parent.roles.push('friend'); parent.strength = 85; parent.trust = 80;
  expect(bestFriendshipReason(family, parentId)).toMatch(/outside your family/);
  const romantic = copyWorld(world); relationFor(romantic, player.id, friendId)!.romance = 'ex'; expect(bestFriendshipReason(romantic, friendId)).toMatch(/romantic relationships separate/);
  expect(encodeWorld(world)).toBe(before);
});

test('both people have one current agreement and cannot replace another person’s agreement', () => {
  const setup = outcome(true), active = acknowledgeFriendship(resolveCommand(setup.world, friendshipProposal(setup.world, setup.friendId), true)), view = copyWorld(active), original = encodeWorld(active);
  const actor = view.activePersonId, otherId = Object.values(view.people).find(person => person.id !== actor && person.id !== setup.friendId && !person.died && ageOn(person, view.date) === ageOn(view.people[actor], view.date))!.id;
  connectPerson(view, otherId); const edge = relationFor(view, actor, otherId)!; edge.roles.push('friend'); edge.kind = 'friend'; edge.strength = 85; edge.trust = 80;
  expect(bestFriendshipReason(view, otherId)).toMatch(/End your current/);
  connectPerson(view, setup.friendId, otherId); const theirs = relationFor(view, otherId, setup.friendId)!; theirs.roles.push('friend'); theirs.kind = 'friend'; theirs.strength = 85; theirs.trust = 80;
  view.activePersonId = otherId; expect(bestFriendshipReason(view, setup.friendId)).toMatch(/already have a best friend/);
  expect(encodeWorld(active)).toBe(original);
});


test('an actual adult date closes its prior best-friend agreement and otherwise exactly matches the existing dating command', () => {
  let world = decodeWorld(JSON.stringify(graduate), true);
  world = resolveCommand(world, { type: 'meet-people', purpose: 'dating', gender: 'female' }, true);
  if (world.pending?.kind !== 'decision') throw new Error('Expected ordinary introductions');
  const friendId = world.pending.choices[0].id; world = acknowledgeFriendship(resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: friendId }, true));
  const setup = copyWorld(world), relation = relationFor(setup, setup.activePersonId, friendId)!;
  // Explicit adult eligibility and consenting-response unit setup on the actual
  // ordinarily introduced NPC, not natural friendship or date-rate acceptance.
  relation.roles.push('friend'); relation.kind = 'friend'; relation.strength = 85; relation.trust = 80;
  for (let seed = 1; seed < 10000; seed++) if (randomInteger(seed, 1, 100).value <= 95) { setup.random.npcs = seed; break; }
  world = acknowledgeFriendship(resolveCommand(validateWorld(setup, true), friendshipProposal(setup, friendId), true));
  const dateSetup = copyWorld(world), chance = Math.min(95, 20 + Math.round(relation.strength * .6 + dateSetup.people[dateSetup.activePersonId].stats.looks * .15));
  for (let seed = 1; seed < 10000; seed++) if (randomInteger(seed, 1, 100).value <= chance) { dateSetup.random.outcomes = seed; break; }
  const prior = validateWorld(dateSetup, true), baselineSetup = copyWorld(prior); baselineSetup.bestFriendships = [];
  const baseline = resolveCommand(validateWorld(baselineSetup, true), { type: 'ask-date', personId: friendId }, true), next = resolveCommand(prior, { type: 'ask-date', personId: friendId }, true);
  expect(relationFor(next, next.activePersonId, friendId)!.romance).toBe('dating'); expect(next.bestFriendships[0]).toEqual({ ...prior.bestFriendships[0], status: 'ended', ended: prior.date, endReason: 'romance', endedById: null });
  expect(next.journal).toHaveLength(baseline.journal.length + 1); expect(next.journal.slice(0, -1)).toEqual(baseline.journal); expect({ ...next, bestFriendships: [], journal: baseline.journal }).toEqual(baseline);
  expect(unpackCheckpoint(packCheckpoint(next), true)).toEqual(next);
});
