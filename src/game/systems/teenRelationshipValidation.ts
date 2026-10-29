import { ageOn, compareDates } from '../personHelpers';
import type { World } from '../model';
import { teenAttemptKey, teenConsentChanceV1, withinTeenAgeGap } from './teenRelationshipSchemas';

/** Index once; historical consent uses its saved date/preferences, never today's. */
export function validateTeenRelationships(world: World): ReadonlySet<string> {
  const activeRelations = new Set<string>(); if (!world.teenRelationships.length) return activeRelations;
  const relations = new Map(world.relationships.map(row => [row.id, row])), parents = new Map<string, string[]>();
  for (const relation of world.relationships) if (relation.roles.includes('parent')) { const ids = parents.get(relation.to) ?? []; ids.push(relation.from); parents.set(relation.to, ids); }
  const ancestry = new Map<string, Set<string>>();
  const ancestors = (id: string) => {
    const saved = ancestry.get(id); if (saved) return saved;
    const ids = new Set([id]); let frontier = [id];
    for (let depth = 0; depth < 4; depth++) { const next: string[] = []; for (const child of frontier) for (const parent of parents.get(child) ?? []) if (!ids.has(parent)) { ids.add(parent); next.push(parent); } frontier = next; }
    ancestry.set(id, ids); return ids;
  };
  const ids = new Set<string>(), attempts = new Set<string>(), prior = new Map<string, World['teenRelationships'][number]>();
  let previous = world.teenRelationships[0].proposed;
  for (const row of world.teenRelationships) {
    const a = world.people[row.proposerId], b = world.people[row.peerId], relation = relations.get(row.relationshipId);
    if (!a || !b || a.id === b.id || !relation || ![relation.from, relation.to].includes(a.id) || ![relation.from, relation.to].includes(b.id) || ids.has(row.id) || !/^teen_relationship_\d+$/.test(row.id) || compareDates(row.proposed, previous) < 0 || compareDates(row.proposed, relation.since) < 0 || compareDates(row.proposed, world.date) > 0) throw new Error('Invalid teenage relationship identity or chronology');
    ids.add(row.id); previous = row.proposed;
    const ageA = ageOn({ ...a, died: null }, row.proposed), ageB = ageOn({ ...b, died: null }, row.proposed);
    if (ageA < 13 || ageA > 17 || ageB < 13 || ageB > 17 || !withinTeenAgeGap(a.born, b.born) || a.died && compareDates(row.proposed, a.died) > 0 || b.died && compareDates(row.proposed, b.died) > 0 || [...ancestors(a.id)].some(id => ancestors(b.id).has(id))) throw new Error('Invalid original teenage ages or kinship');
    if (a.gender !== row.actorGender || b.gender !== row.peerGender || new Set(row.knownRoles).size !== row.knownRoles.length || row.knownRoles.some(role => ['parent', 'guardian', 'sibling', 'teacher', 'partner', 'spouse'].includes(role)) || !row.knownRoles.some(role => ['friend', 'classmate', 'coworker', 'acquaintance'].includes(role)) || new Set(row.actorPreferences).size !== row.actorPreferences.length || new Set(row.peerPreferences).size !== row.peerPreferences.length || !row.actorPreferences.includes(row.peerGender) || !row.peerPreferences.includes(row.actorGender)) throw new Error('Invalid original teenage peer or preference context');
    if (row.chance !== teenConsentChanceV1(row.bond, row.trust) || (row.status !== 'declined') !== (row.roll <= row.chance)) throw new Error('Invalid teenage consent outcome');
    const attempt = teenAttemptKey(a.id, b.id, row.proposed.year);
    if (attempts.has(attempt) || world.actionCounts[attempt] !== 1) throw new Error('Invalid repeated teenage request'); attempts.add(attempt);
    for (const personId of [a.id, b.id]) { const before = prior.get(personId); if (before && (!before.ended || compareDates(before.ended, row.proposed) > 0)) throw new Error('Overlapping teenage relationship'); }
    if (row.status === 'declined') { if (row.ended || row.endReason || row.endedById) throw new Error('Declining does not end a teenage relationship'); continue; }
    for (const personId of [a.id, b.id]) prior.set(personId, row);
    if (row.status === 'active') {
      if (row.ended || row.endReason || row.endedById || a.died || b.died || relation.romance !== 'teen-dating' || !relation.roles.includes('partner') || ageOn(a, world.date) >= 18 && ageOn(b, world.date) >= 18 || activeRelations.has(relation.id)) throw new Error('Invalid current teenage relationship');
      activeRelations.add(relation.id); continue;
    }
    if (!row.ended || !row.endReason || compareDates(row.ended, row.proposed) < 0 || compareDates(row.ended, world.date) > 0 || row.endedById && ![a.id, b.id].includes(row.endedById)) throw new Error('Invalid teenage relationship ending');
    if (row.status === 'continued-as-adults') {
      if (row.endReason !== 'adulthood' || row.endedById || ageOn({ ...a, died: null }, row.ended) < 18 || ageOn({ ...b, died: null }, row.ended) < 18) throw new Error('Invalid adult relationship transition');
    } else if (row.endReason === 'adulthood' || !row.endedById) throw new Error('Invalid explicit teenage relationship ending');
    if (row.endReason === 'death') { const person = row.endedById && world.people[row.endedById]; if (!person || !person.died || compareDates(person.died, row.ended) !== 0) throw new Error('Teenage death history must retain the real person and date'); }
    for (const person of [a, b]) if (person.died && compareDates(row.ended, person.died) > 0) throw new Error('Teenage relationship continued after death');
  }
  return activeRelations;
}
