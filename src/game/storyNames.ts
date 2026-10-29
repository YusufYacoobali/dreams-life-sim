import type { World } from './model';
import { fullName } from './personHelpers';
import type { StoryParticipant } from './runtime';

type Contact = { token: string; role: string; person: Pick<World['people'][string], 'id' | 'firstName' | 'lastName'>; display: string };

/** Only the few contacts actually bound to this scene participate in collisions. */
export function storyContactNames(contacts: readonly Contact[]) {
  const names = Object.fromEntries(contacts.map(contact => [contact.token,
    contacts.some(other => other.person.id !== contact.person.id && other.display === contact.display)
      ? fullName(contact.person) + ' (' + contact.role + ')' : contact.display,
  ]));
  const consequenceNames = new Map<string, string>();
  for (const contact of contacts) if (contacts.some(other => other.person.id !== contact.person.id && fullName(other.person) === fullName(contact.person))) {
    const roles = [...new Set(contacts.filter(other => other.person.id === contact.person.id).map(other => other.role))];
    consequenceNames.set(contact.person.id, fullName(contact.person) + ' (' + roles.join('/') + ')');
  }
  return { names, consequenceNames };
}

/** A frozen display label, not a new contact or an interpretation of prose. */
export function storyParticipants(world: World, personIds: readonly string[], roleOverrides: Readonly<Record<string,string>> = {}): StoryParticipant[] {
  return [...new Set(personIds)].filter(id => id !== world.activePersonId && !!world.people[id]).slice(0,12).map(personId => {
    const person = world.people[personId];
    const edge = world.relationships.find(row => (row.from === world.activePersonId && row.to === personId) || (row.from === personId && row.to === world.activePersonId));
    let role: string;
    if (edge?.roles.includes('parent')) {
      const parent = edge.from === personId;
      const noun = parent ? person.gender === 'female' ? 'mother' : person.gender === 'male' ? 'father' : 'parent' : person.gender === 'female' ? 'daughter' : person.gender === 'male' ? 'son' : 'child';
      role = edge.parentType === 'guardian' ? parent ? 'guardian' : 'child in your care'
        : (edge.parentType === 'adoptive' ? parent ? 'adoptive ' : 'adopted ' : '') + noun;
    } else if (edge?.roles.includes('guardian')) role = edge.from === personId ? 'guardian' : 'child in your care';
    else if (edge?.romance === 'widowed') role = 'late spouse';
    else if (edge?.romance === 'married') role = 'spouse';
    else if (edge?.romance === 'engaged') role = 'fiancé';
    else if (edge?.romance === 'dating' || edge?.romance === 'teen-dating') role = 'partner';
    else if (edge?.romance === 'ex') role = 'former partner';
    else role = edge?.kind ?? 'new acquaintance';
    const override = roleOverrides[personId];
    if (override && override !== role) role = edge?.roles.some(item => item === 'parent' || item === 'guardian') ? role + ' / ' + override : override;
    return { personId, name:fullName(person), role };
  });
}
