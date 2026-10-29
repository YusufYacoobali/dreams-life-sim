import { ageOn, compareDates, fullName, type World } from '../model';
import { monthFrom } from '../calendar';
import { rules } from '../rules';
import { draw, fact } from './common';
import { activeRomance, type Relationship } from './relationships';
import { activeTrip } from './travelSchemas';
import { hospitalized } from './healthSchemas';
import { isConfined } from './legalSchemas';
import { serviceAway } from './serviceSchemas';
import { npcSeparationAtRiskV1, npcSeparationAttemptKey, npcSeparationChanceV1 } from './npcSeparationSchemas';

export const npcSeparationLimits = { couples: 12, waitingMonths: 12, attempts: 1 } as const;
const pairKey = (a: string, b: string) => JSON.stringify([a, b].sort());

/** Existing observed dating only; no player impersonation, new people or settlements. */
export function npcSeparationsYear(world: World): void {
  const key = npcSeparationAttemptKey(world.date.year);
  if (world.actionCounts[key] || !world.npcCourtships.length) return;
  const known = new Set<string>(), partners = new Map<string, Relationship>(), dependents = new Set<string>(), unavailable = new Set<string>(), married = new Set<string>(), financial = new Set<string>();
  const relations = new Map<string, Relationship>();
  for (const relation of world.relationships) {
    relations.set(relation.id, relation);
    if (relation.from === world.activePersonId) known.add(relation.to); else if (relation.to === world.activePersonId) known.add(relation.from);
    if (activeRomance(relation)) { partners.set(relation.from, relation); partners.set(relation.to, relation); }
    if (relation.roles.some(role => role === 'parent' || role === 'guardian')) {
      const child = world.people[relation.to];
      if (!child.died && ageOn(child, world.date) < rules[child.country].adultAge) dependents.add(relation.from);
    }
  }
  for (const row of world.custody) if (!row.ended) { dependents.add(row.a); dependents.add(row.b); }
  for (const row of world.pregnancies) if (row.status === 'pregnant') { unavailable.add(row.carrierId); unavailable.add(row.otherParentId); }
  for (const row of world.marriages) if (!row.ended) { married.add(row.a); married.add(row.b); }
  // Existing direct financial obligations stay outside this first independent-
  // household slice. Ordinary separately held bank debt/property is untouched.
  for (const row of world.liabilities) if (row.principal > 0n && row.creditorId) financial.add(pairKey(row.ownerId, row.creditorId));
  const businesses = new Map(world.businesses.map(row => [row.id, row]));
  for (const row of world.businessPayables) {
    const ownerId = businesses.get(row.businessId)?.ownerId;
    if (row.principal > 0n && ownerId && row.creditorId) financial.add(pairKey(ownerId, row.creditorId));
  }
  for (const row of world.businesses) if (row.ownerId && row.status === 'active') for (const member of row.staff) if (!member.ended) financial.add(pairKey(row.ownerId, member.personId));
  for (const row of world.hobbies) for (const plan of row.plans) if (plan.status === 'active' && plan.payerId !== row.personId) financial.add(pairKey(row.personId, plan.payerId));
  const playerPartner = partners.get(world.activePersonId), observerPartnerId = playerPartner ? playerPartner.from === world.activePersonId ? playerPartner.to : playerPartner.from : null;
  const candidates = world.npcCourtships.filter(row => !row.ended && !row.marriageId).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const offset = candidates.length ? ((world.date.year % candidates.length) + candidates.length) % candidates.length : 0;
  for (let index = 0; index < Math.min(candidates.length, npcSeparationLimits.couples); index++) {
    const courtship = candidates[(offset + index) % candidates.length], relation = relations.get(courtship.relationshipId), a = world.people[courtship.a], b = world.people[courtship.b];
    if (!relation || relation.romance !== 'dating' || relation.from !== a.id || relation.to !== b.id || partners.get(a.id)?.id !== relation.id || partners.get(b.id)?.id !== relation.id || !known.has(a.id) || !known.has(b.id) || [a.id, b.id].includes(world.activePersonId) || observerPartnerId && [a.id, b.id].includes(observerPartnerId)) continue;
    if (compareDates(monthFrom(courtship.observedSince, npcSeparationLimits.waitingMonths, courtship.observedSince.day), world.date) > 0 || !npcSeparationAtRiskV1(relation.strength, relation.trust) || a.country !== b.country || a.city !== b.city || a.householdId && a.householdId === b.householdId || financial.has(pairKey(a.id, b.id))) continue;
    if ([a, b].some(person => person.died || ageOn(person, world.date) < rules[person.country].adultAge || married.has(person.id) || dependents.has(person.id) || unavailable.has(person.id) || person.legal.wanted || person.stats.health < 25 || activeTrip(world, person.id) || hospitalized(world, person) || isConfined(world, person) || serviceAway(world, person.id))) continue;
    const chance = npcSeparationChanceV1(relation.strength, relation.trust), roll = draw(world, 'npcs', 1, 100), separated = roll <= chance;
    world.npcSeparations.push({ id: 'npc_separation_' + world.revision + '_' + world.npcSeparations.length, ruleVersion: 1, courtshipId: courtship.id, relationshipId: relation.id, a: a.id, b: b.id, observerId: world.activePersonId, observerPartnerId, date: { ...world.date }, countryA: a.country, countryB: b.country, city: a.city, strength: relation.strength, trust: relation.trust, chance, roll, outcome: separated ? 'separated' : 'continued' });
    world.actionCounts[key] = 1;
    // This actual check observes the current dating pair itself. The wedding
    // observer has a different bounded window and may not visit this pair.
    courtship.lastChecked = { ...world.date };
    if (separated) {
      relation.romance = 'ex'; relation.roles = relation.roles.filter(role => role !== 'partner');
      if (!relation.roles.length) relation.roles.push('acquaintance');
      relation.kind = relation.roles.includes('friend') ? 'friend' : relation.roles.includes('coworker') ? 'coworker' : relation.roles.includes('classmate') ? 'classmate' : relation.roles.includes('teacher') ? 'teacher' : 'acquaintance';
      courtship.ended = { ...world.date }; courtship.endReason = 'separated';
      fact(world, fullName(a) + ' and ' + fullName(b) + ' stopped dating.', 'relationships');
    }
    return;
  }
}
