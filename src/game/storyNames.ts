import { fullName, type World } from './model';

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
