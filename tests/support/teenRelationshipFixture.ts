import { createLife, randomCreation } from '../../src/game/createLife';
import { resolveCommand } from '../../src/game/engine';
import { copyWorld, validateWorld, type World } from '../../src/game/model';
import { createContact } from '../../src/game/systems/npcs';
import { connectPerson, relationFor } from '../../src/game/systems/relationships';
import { currentTeenRelationship } from '../../src/game/systems/teenRelationshipSchemas';
import { countries, type CountryCode } from '../../src/game/countries';
import type { TeenRelationshipCommand } from '../../src/game/systems/teenRelationships';

/** Explicit bounded unit/component setup, not a natural birth-to-teen or consent claim. */
export function teenRelationshipFixture(age = 14, peerAge = age, consentState = 1, country?: CountryCode) {
  const input = randomCreation(42); if (country) { input.country = country; input.city = countries[country].cities[0]; }
  const world = createLife('life_teen_unit', 42, input, { year: 2010, month: 10, day: 20 });
  world.birthAcknowledged = true; world.date = { year: 2010 + age, month: 10, day: 20 };
  const actor = world.people[world.activePersonId], peer = createContact(world, { age: peerAge, schoolStudent: peerAge >= 6 && peerAge < 18 });
  connectPerson(world, peer.id); const relation = relationFor(world, actor.id, peer.id)!;
  actor.attractedTo = [peer.gender]; peer.attractedTo = [actor.gender]; actor.stats.energy = 80;
  relation.strength = 85; relation.trust = 80; relation.roles = ['classmate', 'friend']; relation.kind = 'friend';
  // Fixed declared branch states: state1 accepts, state4 declines at chance90.
  // No search for an outcome, seed or alternate person is performed.
  world.random.npcs = consentState;
  return { world: validateWorld(world, true), peerId: peer.id, relationshipId: relation.id };
}
export function acknowledgeTeen(world: World): World {
  if (world.pending?.kind !== 'result') throw new Error('Expected a real saved result');
  return resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id }, true);
}
export const teenProposal = (world: World, peerId: string): Extract<TeenRelationshipCommand, { type: 'ask-teen-date' }> => ({ type: 'ask-teen-date', lifeId: world.id, actorId: world.activePersonId, personId: peerId, relationshipId: relationFor(world, world.activePersonId, peerId)!.id, country: world.people[world.activePersonId].country, city: world.people[world.activePersonId].city });
export const teenEnd = (world: World, peerId: string): Extract<TeenRelationshipCommand, { type: 'end-teen-relationship' }> => ({ type: 'end-teen-relationship', lifeId: world.id, actorId: world.activePersonId, personId: peerId, relationshipId: relationFor(world, world.activePersonId, peerId)!.id, teenRelationshipId: currentTeenRelationship(world)!.id });
export function withTeenConsent(world: World, state: number) {
  const next = copyWorld(world); next.random.npcs = state; return validateWorld(next, true);
}
