import { ageOn, compareDates, type World } from '../model';
import { rules } from '../rules';
import { bestFriendshipAttemptKey, bestFriendshipChanceV1 } from './friendshipSchemas';

export function validateBestFriendships(world: World) {
  if (!world.bestFriendships.length) return;
  const relationships = new Map(world.relationships.map(row => [row.id, row])), parents = new Map<string, string[]>();
  for (const relation of world.relationships) if (relation.roles.includes('parent')) { const list = parents.get(relation.to) ?? []; list.push(relation.from); parents.set(relation.to, list); }
  const ancestry = new Map<string, Set<string>>();
  const ancestors = (personId: string) => {
    const cached = ancestry.get(personId); if (cached) return cached;
    const seen = new Set([personId]); let frontier = [personId];
    for (let depth = 0; depth < 4; depth++) { const next: string[] = []; for (const id of frontier) for (const parent of parents.get(id) ?? []) if (!seen.has(parent)) { seen.add(parent); next.push(parent); } frontier = next; }
    ancestry.set(personId, seen); return seen;
  };
  const ids = new Set<string>(), attempts = new Set<string>(), prior = new Map<string, World['bestFriendships'][number]>();
  let previousDate = world.bestFriendships[0].proposed;
  for (const row of world.bestFriendships) {
    const a = world.people[row.proposerId], b = world.people[row.friendId], relation = relationships.get(row.relationshipId);
    if (!a || !b || a.id === b.id || !relation || ![relation.from, relation.to].includes(a.id) || ![relation.from, relation.to].includes(b.id) || !relation.roles.includes('friend') || relation.roles.some(role => ['parent', 'sibling', 'guardian'].includes(role)) || [...ancestors(a.id)].some(id => ancestors(b.id).has(id)) || ids.has(row.id) || !/^best_friendship_\d+$/.test(row.id) || compareDates(row.proposed, previousDate) < 0 || compareDates(row.proposed, world.date) > 0 || compareDates(row.proposed, relation.since) < 0) throw new Error('Invalid best-friend identity or history');
    ids.add(row.id); previousDate = row.proposed;
    const ageA = ageOn({ ...a, died: null }, row.proposed), ageB = ageOn({ ...b, died: null }, row.proposed), minorA = ageA < rules[row.country].adultAge, minorB = ageB < rules[row.country].adultAge;
    if (ageA < 6 || ageB < 6 || (minorA || minorB) && (minorA !== minorB || Math.abs(ageA - ageB) > 2) || a.died && compareDates(row.proposed, a.died) > 0 || b.died && compareDates(row.proposed, b.died) > 0 || row.chance !== bestFriendshipChanceV1(row.strength, row.trust) || (row.status !== 'declined') !== (row.roll <= row.chance)) throw new Error('Invalid best-friend eligibility or consent');
    const attempt = bestFriendshipAttemptKey(a.id, b.id, row.proposed.year);
    if (attempts.has(attempt) || world.actionCounts[attempt] !== 1) throw new Error('Invalid repeated best-friend proposal'); attempts.add(attempt);
    for (const personId of [a.id, b.id]) { const last = prior.get(personId); if (last && (!last.ended || compareDates(last.ended, row.proposed) > 0)) throw new Error('Overlapping best-friend proposal'); }
    if (row.status === 'declined') { if (row.ended || row.endReason || row.endedById) throw new Error('A declined proposal cannot end a best friendship'); continue; }
    for (const personId of [a.id, b.id]) prior.set(personId, row);
    if (row.status === 'active') {
      if (row.ended || row.endReason || row.endedById || a.died || b.died || ['dating', 'engaged', 'married', 'ex', 'widowed'].includes(relation.romance)) throw new Error('Invalid current best friendship');
    } else {
      if (!row.ended || !row.endReason || compareDates(row.ended, row.proposed) < 0 || compareDates(row.ended, world.date) > 0 || row.endedById && ![a.id, b.id].includes(row.endedById) || row.endReason === 'choice' && !row.endedById || row.endReason === 'romance' && (row.endedById || relation.romance === 'none')) throw new Error('Invalid best-friend ending');
      if (row.endReason === 'death') { const person = row.endedById && world.people[row.endedById]; if (!person || !person.died || compareDates(person.died, row.ended) !== 0) throw new Error('Best-friend death must retain the actual deceased person and date'); }
      for (const person of [a, b]) if (person.died && compareDates(row.ended, person.died) > 0) throw new Error('Best friendship continued after death');
    }
  }
}
