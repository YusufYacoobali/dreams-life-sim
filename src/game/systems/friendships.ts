import { z } from 'zod';
import { countryCodes } from '../countries';
import { ageOn, fullName, type World } from '../model';
import { IneligibleAction } from '../errors';
import { rules } from '../rules';
import { active, draw, fact, result } from './common';
import { activeRomance, closeFamily, relationFor } from './relationships';
import { isConfined } from './legalSchemas';
import { hospitalized } from './healthSchemas';
import { activeTrip, samePhysicalPlace } from './travelSchemas';
import { serviceAway } from './serviceSchemas';
import { bestFriendshipAttemptKey, bestFriendshipChanceV1, bestFriendshipIndex, currentBestFriendship, type BestFriendship } from './friendshipSchemas';

export const friendshipCommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('propose-best-friendship'), lifeId: z.string(), actorId: z.string(), personId: z.string(), relationshipId: z.string(), country: z.enum(countryCodes), city: z.string() }),
  z.object({ type: z.literal('end-best-friendship'), lifeId: z.string(), actorId: z.string(), personId: z.string(), relationshipId: z.string(), friendshipId: z.string() }),
]);
export type FriendshipCommand = z.infer<typeof friendshipCommandSchema>;

export function bestFriendshipReason(world: World, personId: string): string | undefined {
  const person = active(world), friend = world.people[personId], relation = friend && relationFor(world, person.id, personId);
  if (!friend || friend.id === person.id || !relation?.roles.includes('friend')) return 'Get to know an actual friend first';
  if (person.died || friend.died) return 'Both friends must be living';
  if (closeFamily(world, person.id, friend.id)) return 'Choose a friend outside your family';
  if (activeRomance(relation) || relation.romance === 'ex' || relation.romance === 'widowed') return 'Keep romantic relationships separate from this friendship';
  const age = ageOn(person, world.date), friendAge = ageOn(friend, world.date), minor = age < rules[person.country].adultAge, friendMinor = friendAge < rules[friend.country].adultAge;
  if (age < 6 || friendAge < 6) return 'Friendship proposals are available from age six';
  if ((minor || friendMinor) && (minor !== friendMinor || Math.abs(age - friendAge) > 2)) return 'Children can ask a friend close to their own age';
  if (isConfined(world, person) || isConfined(world, friend) || person.legal.wanted || friend.legal.wanted || hospitalized(world, person) || hospitalized(world, friend) || activeTrip(world, person.id) || activeTrip(world, friend.id) || serviceAway(world, person.id) || serviceAway(world, friend.id)) return 'Wait until both friends return to their normal routine';
  if (!samePhysicalPlace(world, person.id, friend.id)) return 'Meet in the same city before asking';
  const current = currentBestFriendship(world, person.id), theirs = currentBestFriendship(world, friend.id);
  if (current) return (current.proposerId === friend.id || current.friendId === friend.id) ? 'You are already best friends' : 'End your current best friendship before asking someone else';
  if (theirs) return 'They already have a best friend';
  if (relation.strength < 75 || relation.trust < 60) return 'Build at least 75% bond and 60% trust first';
  if (world.actionCounts[bestFriendshipAttemptKey(person.id, friend.id, world.date.year)]) return 'You already asked this friend this year';
}

export function endFriendship(world: World, row: BestFriendship, reason: NonNullable<BestFriendship['endReason']>, personId: string | null) {
  row.status = 'ended'; row.ended = { ...world.date }; row.endReason = reason; row.endedById = personId;
}
export function resolveFriendship(world: World, command: FriendshipCommand) {
  if (command.lifeId !== world.id || command.actorId !== world.activePersonId) throw new IneligibleAction('Review this friendship from the current life and person');
  const person = active(world), friend = world.people[command.personId], relation = friend && relationFor(world, person.id, friend.id);
  if (!relation || relation.id !== command.relationshipId) throw new IneligibleAction('Review this actual friendship before continuing');
  if (command.type === 'propose-best-friendship') {
    const reason = bestFriendshipReason(world, command.personId); if (reason) throw new IneligibleAction(reason);
    if (person.country !== command.country || person.city !== command.city) throw new IneligibleAction('Review the friendship in your current location');
    const chance = bestFriendshipChanceV1(relation.strength, relation.trust), roll = draw(world, 'npcs', 1, 100), accepted = roll <= chance;
    const row: BestFriendship = { id: 'best_friendship_' + world.revision, ruleVersion: 1, relationshipId: relation.id, proposerId: person.id, friendId: friend.id, proposed: { ...world.date }, country: person.country, city: person.city, strength: relation.strength, trust: relation.trust, chance, roll, status: accepted ? 'active' : 'declined', ended: null, endReason: null, endedById: null };
    world.bestFriendships.push(row); world.actionCounts[bestFriendshipAttemptKey(person.id, friend.id, world.date.year)] = 1;
    fact(world, accepted ? fullName(friend) + ' and I agreed to be best friends.' : 'I asked ' + fullName(friend) + ' about being best friends. They wanted to keep things as they were.', 'relationships');
    result(world, accepted ? 'Your best friend' : 'Still friends', accepted ? friend.firstName + ' agreed to be your best friend. Nobody had a certificate ready.' : friend.firstName + ' would rather leave things as they are. You accepted the answer.', 'person-action:become-best-friends', [{ id: row.id, label: fullName(friend), value: accepted ? 'Best friends' : 'Proposal declined', tone: accepted ? 'positive' : 'neutral' }]);
    return;
  }
  const row = bestFriendshipIndex(world).byId.get(command.friendshipId);
  if (!row || row.status !== 'active' || row.relationshipId !== relation.id || ![row.proposerId, row.friendId].includes(person.id) || ![row.proposerId, row.friendId].includes(friend.id)) throw new IneligibleAction('This is not your current best friendship');
  endFriendship(world, row, 'choice', person.id);
  fact(world, 'I stopped calling ' + fullName(friend) + ' my best friend. Our ordinary friendship and history remain.', 'relationships');
  result(world, 'Back to being friends', 'You and '+friend.firstName+' are back to being ordinary friends. Your bond and trust stay the same.', 'person-action:end-best-friendship', [{ id: row.id, label: fullName(friend), value: 'Best friendship ended', tone: 'neutral' }]);
}

/** Actual death and a new romance close the agreement without changing its original consent. */
export function refreshBestFriendships(world: World) {
  if (!world.bestFriendships.length) return;
  const current = new Set(bestFriendshipIndex(world).byPerson.values()); if (!current.size) return;
  const relationships = new Map(world.relationships.map(row => [row.id, row]));
  for (const row of current) {
    const a = world.people[row.proposerId], b = world.people[row.friendId];
    const deceased = a.died ? a : b.died ? b : null;
    if (deceased) {
      endFriendship(world, row, 'death', deceased.id); row.ended = { ...deceased.died! };
      if (world.activePersonId === (deceased.id === a.id ? b.id : a.id)) fact(world, fullName(deceased) + ', my best friend, died.', 'relationships');
    } else if (activeRomance(relationships.get(row.relationshipId)!)) {
      endFriendship(world, row, 'romance', null);
      if ([a.id, b.id].includes(world.activePersonId)) fact(world, 'My friendship with ' + fullName(world.people[a.id === world.activePersonId ? b.id : a.id]) + ' became a romantic relationship. Our best-friend agreement stays in our history.', 'relationships');
    }
  }
}
