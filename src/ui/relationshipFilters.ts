import type { World } from '../game/model';
import { compareDates, fullName } from '../game/personHelpers';

export const relationshipFilters = [
  { id: 'all', label: 'All' },
  { id: 'family', label: 'Family' },
  { id: 'friends', label: 'Friends' },
  { id: 'romance', label: 'Romance' },
  { id: 'dead', label: 'Deceased' },
] as const;
export type RelationshipFilter = typeof relationshipFilters[number]['id'];

/** A view of the original edges; filtering never changes people or their history. */
export function relationshipContacts(
  world: Pick<World, 'relationships' | 'people' | 'activePersonId'>,
  filter: RelationshipFilter,
  query = '',
): World['relationships'] {
  const search = query.trim().toLocaleLowerCase();
  const contacts = world.relationships.filter(edge => {
    if (edge.from !== world.activePersonId && edge.to !== world.activePersonId) return false;
    const person = world.people[edge.from === world.activePersonId ? edge.to : edge.from];
    if (!person || !!person.died !== (filter === 'dead')) return false;
    if (filter === 'family' && !edge.roles.some(role => role === 'parent' || role === 'guardian' || role === 'sibling') && edge.romance !== 'married' && edge.romance !== 'widowed') return false;
    if (filter === 'friends' && !edge.roles.includes('friend')) return false;
    if (filter === 'romance' && edge.romance === 'none') return false;
    return !search || fullName(person).toLocaleLowerCase().includes(search);
  });
  // This array is new. Stable sorting retains the existing order for deaths on
  // the same date, without sorting the saved relationship array itself.
  if (filter === 'dead') contacts.sort((a, b) => compareDates(
    world.people[b.from === world.activePersonId ? b.to : b.from].died!,
    world.people[a.from === world.activePersonId ? a.to : a.from].died!,
  ));
  return contacts;
}
