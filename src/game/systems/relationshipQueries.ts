import { ageOn, type Person, type World } from '../model';
import { rules } from '../rules';
import { roundRatio } from '../money';
import { serviceAway } from './serviceSchemas';
import { isConfined } from './legalSchemas';
import { samePhysicalPlace } from './travelSchemas';
import { active } from './common';

export type Relationship = World['relationships'][number];
export const activeRomance = (relation: Relationship) => relation.romance === 'teen-dating' || relation.romance === 'dating' || relation.romance === 'engaged' || relation.romance === 'married';
export function relationFor(world: World, a: string, b: string) { return world.relationships.find(relation => relation.from === a && relation.to === b || relation.from === b && relation.to === a); }
export function partnerRelation(world: World, personId = world.activePersonId) { return world.relationships.find(relation => activeRomance(relation) && (relation.from === personId || relation.to === personId)); }
export function otherPerson(world: World, relation: Relationship, personId = world.activePersonId): Person { return world.people[relation.from === personId ? relation.to : relation.from]; }
function ancestors(world: World, id: string): Set<string> {
  const result = new Set([id]); let frontier = [id];
  for (let depth = 0; depth < 4; depth++) { const next: string[] = []; for (const personId of frontier) for (const relation of world.relationships) if (relation.kind === 'parent' && relation.to === personId && !result.has(relation.from)) { result.add(relation.from); next.push(relation.from); } frontier = next; }
  return result;
}
export function closeFamily(world: World, a: string, b: string): boolean {
  const direct = relationFor(world, a, b); if (direct && direct.roles.some(role => role === 'parent' || role === 'sibling' || role === 'guardian')) return true;
  const first = ancestors(world, a), second = ancestors(world, b);
  return [...first].some(id => second.has(id));
}
/** Optional indexed lookups let bounded NPC decisions share the same romance rules. */
export type RomanceLookups = { closeFamily: (a: string, b: string) => boolean; partner: (personId: string) => Relationship | undefined };
export function romanceReason(world: World, target: Person, fromId = world.activePersonId, lookups?: RomanceLookups): string | undefined {
  const player = world.people[fromId];
  if(serviceAway(world,fromId)||serviceAway(world,target.id))return 'Arrange in-person time after both people return from their assignments';
  if (isConfined(world, player) || isConfined(world, target)) return 'Romantic outings are unavailable in custody';
  if (target.died) return 'This person has died';
  if (ageOn(player, world.date) < rules[player.country].adultAge || ageOn(target, world.date) < rules[target.country].adultAge) return 'Both people must be adults';
  if (lookups ? lookups.closeFamily(player.id, target.id) : closeFamily(world, player.id, target.id)) return 'You cannot date a close relative or guardian';
  if (!player.attractedTo.includes(target.gender) || !target.attractedTo.includes(player.gender)) return 'Your dating preferences do not match';
  const existing = lookups ? lookups.partner(fromId) : partnerRelation(world, fromId), theirs = lookups ? lookups.partner(target.id) : partnerRelation(world, target.id);
  if (existing && otherPerson(world, existing, fromId).id !== target.id) return 'End your current relationship first';
  if (theirs && otherPerson(world, theirs, target.id).id !== player.id) return 'They are already in a relationship';
  if (!samePhysicalPlace(world, player.id, target.id)) return 'Meet in the same city before arranging a date';
}
export const dateBudget = (world: World) => roundRatio(rules[active(world).country].baseWage, 1000n);
export function socialActionUsed(world: World, personId: string, action: string) { return !!world.actionCounts[world.activePersonId + ':social:' + world.date.year + ':' + personId + ':' + action]; }
