import { z } from 'zod';
import { ageOn, fullName, type World } from '../model';
import { rules } from '../rules';
import { countryCodes } from '../countries';
import { IneligibleAction } from '../errors';
import { active, draw, fact, result } from './common';
import { closeFamily, partnerRelation, relationFor } from './relationships';
import { isConfined } from './legalSchemas';
import { hospitalized } from './healthSchemas';
import { activeTrip, samePhysicalPlace } from './travelSchemas';
import { serviceAway } from './serviceSchemas';
import { currentWorkplace } from './workplaceSchemas';
import { currentTeenRelationship, teenAttemptKey, teenConsentChanceV1, teenRelationshipIndex, teenRelationshipRulesV1, withinTeenAgeGap, type TeenRelationship } from './teenRelationshipSchemas';

export const teenRelationshipCommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('ask-teen-date'), lifeId: z.string(), actorId: z.string(), personId: z.string(), relationshipId: z.string(), country: z.enum(countryCodes), city: z.string() }),
  z.object({ type: z.literal('end-teen-relationship'), lifeId: z.string(), actorId: z.string(), personId: z.string(), relationshipId: z.string(), teenRelationshipId: z.string() }),
]);
export type TeenRelationshipCommand = z.infer<typeof teenRelationshipCommandSchema>;
export function teenDateReason(world: World, personId: string): string | undefined {
  const person = active(world), peer = world.people[personId], relation = peer && relationFor(world, person.id, peer.id);
  if (!peer || peer.id === person.id || !relation) return 'Choose an actual peer you know';
  if (person.died || peer.died) return 'Both people must be living';
  const age = ageOn(person, world.date), peerAge = ageOn(peer, world.date);
  if (age < 13 || age > 17 || peerAge < 13 || peerAge > 17 || age >= rules[person.country].adultAge || peerAge >= rules[peer.country].adultAge) return 'First teenage dates are for two people aged thirteen to seventeen';
  if (!withinTeenAgeGap(person.born, peer.born)) return 'Choose a peer no more than two years apart in age';
  if (closeFamily(world, person.id, peer.id)) return 'Choose someone outside your family or guardians';
  const supervises = (a: string, b: string) => currentWorkplace(world, a)?.members.some(member => member.personId === b && member.role === 'supervisor' && !member.left);
  if (relation.roles.includes('teacher') || supervises(person.id, peer.id) || supervises(peer.id, person.id)) return 'Keep teachers and supervisors separate from dating';
  if (!person.attractedTo.includes(peer.gender) || !peer.attractedTo.includes(person.gender)) return 'Your dating preferences do not match';
  const mine = partnerRelation(world, person.id), theirs = partnerRelation(world, peer.id);
  if (mine) return mine.id === relation.id ? 'You are already seeing each other' : 'End your current relationship first';
  if (theirs) return 'They are already in a relationship';
  if (isConfined(world, person) || isConfined(world, peer) || person.legal.wanted || peer.legal.wanted || hospitalized(world, person) || hospitalized(world, peer) || activeTrip(world, person.id) || activeTrip(world, peer.id) || serviceAway(world, person.id) || serviceAway(world, peer.id)) return 'Wait until both people return to their ordinary routine';
  if (person.country !== peer.country || person.city !== peer.city || !samePhysicalPlace(world, person.id, peer.id)) return 'Meet in the same home city before asking';
  if (relation.strength < 50 || relation.trust < 40) return 'Build at least 50% bond and 40% trust first';
  if (person.stats.energy < teenRelationshipRulesV1.energy) return 'You need at least four energy for the date';
  if (world.actionCounts[teenAttemptKey(person.id, peer.id, world.date.year)]) return 'You already asked this peer this year';
}
function closeTeenRelationship(world: World, row: TeenRelationship, reason: 'choice' | 'death' | 'adulthood', by: string | null) {
  row.status = reason === 'adulthood' ? 'continued-as-adults' : 'ended'; row.endReason = reason; row.endedById = by; row.ended = { ...world.date };
}
export function resolveTeenRelationship(world: World, command: TeenRelationshipCommand) {
  if (command.lifeId !== world.id || command.actorId !== world.activePersonId) throw new IneligibleAction('Review this relationship from the current life and person');
  const person = active(world), peer = world.people[command.personId], relation = peer && relationFor(world, person.id, peer.id);
  if (!relation || relation.id !== command.relationshipId) throw new IneligibleAction('Review this actual peer relationship');
  if (command.type === 'ask-teen-date') {
    const reason = teenDateReason(world, peer.id); if (reason) throw new IneligibleAction(reason);
    if (person.country !== command.country || person.city !== command.city) throw new IneligibleAction('Review this date in your current location');
    const chance = teenConsentChanceV1(relation.strength, relation.trust), roll = draw(world, 'npcs', 1, 100), accepted = roll <= chance;
    const row: TeenRelationship = { id: 'teen_relationship_' + world.revision, ruleVersion: 1, relationshipId: relation.id, proposerId: person.id, peerId: peer.id, proposed: { ...world.date }, country: person.country, city: person.city,
      knownRoles: [...relation.roles], actorGender: person.gender, peerGender: peer.gender, actorPreferences: [...person.attractedTo], peerPreferences: [...peer.attractedTo], bond: relation.strength, trust: relation.trust, chance, roll,
      status: accepted ? 'active' : 'declined', ended: null, endReason: null, endedById: null };
    world.teenRelationships.push(row); world.actionCounts[teenAttemptKey(person.id, peer.id, world.date.year)] = 1;
    if (accepted) {
      relation.romance = 'teen-dating'; if (!relation.roles.includes('partner')) relation.roles.push('partner'); relation.kind = 'partner';
      relation.lastInteractionYear = world.date.year; relation.memories.push('teen-date:' + world.date.year); person.stats.energy -= teenRelationshipRulesV1.energy;
    }
    const again = relation.memories.some(memory => memory.startsWith('teen-breakup:'));
    fact(world, accepted ? fullName(peer) + ' and I agreed to ' + (again ? 'see each other again' : 'go on a first date') + '. We spent a local afternoon together.' : 'I asked ' + fullName(peer) + ' on a date. They declined, and I respected their answer.', 'relationships');
    result(world, accepted ? again ? 'Seeing each other again' : 'Your first date' : 'They declined the date', accepted ? 'You and ' + peer.firstName + ' spent an afternoon walking and talking. You agreed that you are seeing each other' + (again ? ' again' : '') + '. Nobody needed to buy a meal.' : peer.firstName + ' did not want to go on a date. Your existing connection and trust remain as they were.', 'conversation', [{ id: row.id, label: fullName(peer), value: accepted ? 'Seeing each other' : 'Invitation declined', tone: accepted ? 'positive' : 'neutral' }, ...(accepted ? [{ id: 'energy', label: 'Energy', value: '-4%', tone: 'negative' as const }] : [])]);
    return;
  }
  const row = teenRelationshipIndex(world).byId.get(command.teenRelationshipId);
  if (!row || row.status !== 'active' || row.relationshipId !== relation.id || ![row.proposerId, row.peerId].includes(person.id) || ![row.proposerId, row.peerId].includes(peer.id) || currentTeenRelationship(world)?.id !== row.id) throw new IneligibleAction('Review your current teenage relationship');
  closeTeenRelationship(world, row, 'choice', person.id);
  relation.romance = 'ex'; relation.roles = relation.roles.filter(role => role !== 'partner'); if (!relation.roles.length) relation.roles.push('acquaintance'); relation.kind = relation.roles.includes('friend') ? 'friend' : relation.roles.includes('coworker') ? 'coworker' : relation.roles.includes('classmate') ? 'classmate' : 'acquaintance'; relation.memories.push('teen-breakup:' + world.date.year);
  fact(world, 'I ended my first relationship with ' + fullName(peer) + '. Our shared history remains.', 'relationships');
  result(world, 'Going separate ways', 'Your relationship with ' + peer.firstName + ' has ended. Your existing bond, trust and ordinary connection remain recorded.', 'conversation', [{ id: row.id, label: fullName(peer), value: 'Relationship ended', tone: 'neutral' }]);
}
/** Birthdays and actual death close only an already recorded teen phase. */
export function refreshTeenRelationships(world: World) {
  if (!world.teenRelationships.length) return;
  const rows = new Set(teenRelationshipIndex(world).byPerson.values()); if (!rows.size) return;
  const relations = new Map(world.relationships.map(row => [row.id, row]));
  for (const row of rows) {
    const a = world.people[row.proposerId], b = world.people[row.peerId], relation = relations.get(row.relationshipId)!;
    const deceased = a.died ? a : b.died ? b : null;
    if (deceased) { closeTeenRelationship(world, row, 'death', deceased.id); row.ended = { ...deceased.died! }; }
    else if (ageOn(a, world.date) >= rules[a.country].adultAge && ageOn(b, world.date) >= rules[b.country].adultAge) {
      closeTeenRelationship(world, row, 'adulthood', null); relation.romance = 'dating';
      if ([a.id, b.id].includes(world.activePersonId)) fact(world, 'My relationship with ' + fullName(world.people[a.id === world.activePersonId ? b.id : a.id]) + ' continued as we both reached adulthood.', 'relationships');
    }
  }
}
