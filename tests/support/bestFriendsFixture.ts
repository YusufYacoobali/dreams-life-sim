import { copyWorld, validateWorld, type World } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { decodeSave } from '../../src/persistence/archive';
import { relationFor } from '../../src/game/systems/relationships';
import { currentBestFriendship } from '../../src/game/systems/friendshipSchemas';
import type { FriendshipCommand } from '../../src/game/systems/friendships';
import archive from '../fixtures/v23-school-plans-archive.json';

export function acknowledgeFriendship(world: World): World {
  return world.pending?.kind === 'result' ? resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id }, true) : world;
}
export function bestFriendsFixture() {
  let world = decodeSave(JSON.stringify(archive)).world, guard = 0;
  while ((world.pending || world.annual) && guard++ < 100) {
    const command: GameCommand = world.pending?.kind === 'decision' ? { type: 'choose', eventId: world.pending.id, choiceId: world.pending.choices.find(row => !choiceUnavailable(world, row))!.id } : world.pending ? { type: 'acknowledge', resultId: world.pending.id } : { type: 'resume' };
    world = resolveCommand(world, command, true);
  }
  if (guard >= 100) throw new Error('Historical school year did not finish');
  // Explicit component/domain eligibility setup on actual archived classmates.
  // The grade, age, school, people, accounts, ordinary actions and old history
  // remain real; this is not a natural friendship-grinding acceptance claim.
  const prepared = copyWorld(world), thread = prepared.storyThreads.find(row => row.kind === 'project-promise')!, friendId = thread.peerId;
  const relation = relationFor(prepared, prepared.activePersonId, friendId)!;
  relation.strength = 85; relation.trust = 80; if (!relation.roles.includes('friend')) relation.roles.push('friend'); relation.kind = 'friend';
  return { world: validateWorld(prepared, true), friendId, relationshipId: relation.id };
}
export const friendshipProposal = (world: World, friendId: string): Extract<FriendshipCommand, { type: 'propose-best-friendship' }> => ({ type: 'propose-best-friendship', lifeId: world.id, actorId: world.activePersonId, personId: friendId, relationshipId: relationFor(world, world.activePersonId, friendId)!.id, country: world.people[world.activePersonId].country, city: world.people[world.activePersonId].city });
export const friendshipEnd = (world: World, friendId: string): Extract<FriendshipCommand, { type: 'end-best-friendship' }> => ({ type: 'end-best-friendship', lifeId: world.id, actorId: world.activePersonId, personId: friendId, relationshipId: relationFor(world, world.activePersonId, friendId)!.id, friendshipId: currentBestFriendship(world)!.id });
