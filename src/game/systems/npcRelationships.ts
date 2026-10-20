import { ageOn, fullName, type Person, type World } from '../model';
import { rules } from '../rules';
import { draw, fact } from './common';
import { activeTrip } from './travelSchemas';
import { hospitalized } from './healthSchemas';
import { isConfined } from './legalSchemas';
import { serviceAway } from './serviceSchemas';
import { activeRomance, connectPerson, romanceReason, type Relationship, type RomanceLookups } from './relationships';

export const npcRelationshipLimits = { contacts: 24, formations: 2, ageGap: 12 } as const;

/** Existing relevant people only: no partner generation, wedding, pregnancy or payment. */
export function npcRelationshipsYear(world: World): void {
  const key = 'npc-relationships:' + world.date.year;
  if (world.actionCounts[key]) return;
  world.actionCounts[key] = 1;

  const pairs = new Map<string, Map<string, Relationship>>(), parents = new Map<string, string[]>(), partners = new Map<string, Relationship>(), known = new Set<string>();
  const link = (a: string, b: string, relation: Relationship) => {
    let rows = pairs.get(a); if (!rows) { rows = new Map(); pairs.set(a, rows); } rows.set(b, relation);
  };
  for (const relation of world.relationships) {
    link(relation.from, relation.to, relation); link(relation.to, relation.from, relation);
    if (relation.roles.includes('parent')) { const ids = parents.get(relation.to) ?? []; ids.push(relation.from); parents.set(relation.to, ids); }
    if (activeRomance(relation)) { partners.set(relation.from, relation); partners.set(relation.to, relation); }
    if (relation.from === world.activePersonId) known.add(relation.to);
    else if (relation.to === world.activePersonId) known.add(relation.from);
  }
  const ancestry = new Map<string, Set<string>>();
  const ancestors = (id: string) => {
    const cached = ancestry.get(id); if (cached) return cached;
    const ids = new Set([id]); let frontier = [id];
    for (let depth = 0; depth < 4; depth++) { const next: string[] = []; for (const child of frontier) for (const parent of parents.get(child) ?? []) if (!ids.has(parent)) { ids.add(parent); next.push(parent); } frontier = next; }
    ancestry.set(id, ids); return ids;
  };
  const lookups: RomanceLookups = {
    partner: id => partners.get(id),
    closeFamily: (a, b) => !!pairs.get(a)?.get(b)?.roles.some(role => role === 'parent' || role === 'sibling' || role === 'guardian') || [...ancestors(a)].some(id => ancestors(b).has(id)),
  };
  const relevant = [...known].map(id => world.people[id]).filter(person => person && !person.died && !partners.has(person.id) && ageOn(person, world.date) >= rules[person.country].adultAge).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  if (relevant.length < 2) return;
  // Rotate the bounded window without a draw; older contacts cannot monopolise it.
  const offset = ((world.date.year % relevant.length) + relevant.length) % relevant.length;
  const pool: Person[] = [];
  for (let index = 0; index < Math.min(relevant.length, npcRelationshipLimits.contacts); index++) {
    const person = relevant[(offset + index) % relevant.length];
    if (!person.legal.wanted && person.stats.health >= 25 && !activeTrip(world, person.id) && !hospitalized(world, person) && !isConfined(world, person) && !serviceAway(world, person.id)) pool.push(person);
  }
  const local = new Map<string, Person[]>();
  for (const person of pool) { const place = JSON.stringify([person.country, person.city]), rows = local.get(place) ?? []; rows.push(person); local.set(place, rows); }
  const attempted = new Set<string>(); let formed = 0;
  for (const person of pool) {
    if (formed >= npcRelationshipLimits.formations) break;
    if (attempted.has(person.id) || partners.has(person.id)) continue;
    const candidates = (local.get(JSON.stringify([person.country, person.city])) ?? []).filter(other => {
      const prior = pairs.get(person.id)?.get(other.id);
      return other.id !== person.id && !attempted.has(other.id) && !partners.has(other.id) && Math.abs(ageOn(person, world.date) - ageOn(other, world.date)) <= npcRelationshipLimits.ageGap && (!prior || prior.romance === 'none') && !romanceReason(world, other, person.id, lookups);
    });
    if (!candidates.length) continue;
    const other = candidates[draw(world, 'npcs', 0, candidates.length - 1)], prior = pairs.get(person.id)?.get(other.id);
    attempted.add(person.id); attempted.add(other.id);
    // Both people independently choose whether to begin dating. Existing trust
    // makes this likelier, without guaranteeing a match or charging either person.
    const chance = Math.min(75, 30 + Math.floor((prior?.trust ?? 35) / 2));
    const firstAgrees = draw(world, 'npcs', 1, 100) <= chance, secondAgrees = draw(world, 'npcs', 1, 100) <= chance;
    if (!firstAgrees || !secondAgrees) continue;
    if (!prior) connectPerson(world, other.id, person.id);
    const relation = prior ?? world.relationships.at(-1)!;
    relation.romance = 'dating'; relation.kind = 'partner';
    if (!relation.roles.includes('partner')) relation.roles.push('partner');
    relation.lastInteractionYear = world.date.year; relation.memories.push('npc-dating:' + world.date.year);
    link(person.id, other.id, relation); link(other.id, person.id, relation);
    partners.set(person.id, relation); partners.set(other.id, relation); formed++;
    fact(world, fullName(person) + ' and ' + fullName(other) + ' started dating.', 'relationships');
  }
}
