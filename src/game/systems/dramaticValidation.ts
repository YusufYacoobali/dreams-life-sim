import type { World } from '../model';
import type { Pending } from '../runtime';
import { dramaticTemplates } from '../content/dramaticEvents';

/** Historical identities remain valid after an intervening priority decision.
 * Resolution separately checks that the originally bound situation still exists. */
export function validateDramaticEvent(world: World, event: Extract<Pending, { kind: 'decision' }>) {
  const actions = event.choices.flatMap(choice => choice.effects.filter(effect => effect.kind === 'dramatic-choice'));
  const template = dramaticTemplates.find(row => row.id === event.templateId);
  if (!actions.length && !template) return;
  if (!template || event.choices.length !== template.choices.length || actions.length !== event.choices.length || !event.personIds.includes(world.activePersonId)) throw new Error('Invalid dramatic decision');
  const first = actions[0], player = world.activePersonId;
  const person = (id?: string) => !!id && !!world.people[id] && event.personIds.includes(id);
  const relationship = (id?: string, other?: string) => world.relationships.some(row => row.id === id && (row.from === player && row.to === other || row.to === player && row.from === other));
  const job = (id?: string) => world.people[player].employment?.id === id || world.workHistory.some(row => row.id === id && row.personId === player);
  for (const [index, choice] of event.choices.entries()) {
    const effect = actions[index];
    if (choice.effects.length !== 1 || effect.eventId !== event.templateId || effect.choiceId !== choice.id || !template.choices.some(row => row.id === choice.id) || effect.ruleVersion !== first.ruleVersion || effect.ruleVersion === 2 && !['dramatic-double-fiance', 'dramatic-athlete-doping'].includes(event.templateId) || effect.subjectId !== first.subjectId || effect.contextId !== first.contextId || effect.relatedId !== first.relatedId || effect.otherId !== first.otherId || effect.quote !== first.quote) throw new Error('Invalid dramatic action binding');
  }
  const e = first;
  let valid = false;
  switch (e.eventId) {
    case 'dramatic-boss-criminal': valid = person(e.subjectId) && job(e.contextId) && !!e.quote && world.workplaces.some(row => row.personId === player && row.employmentId === e.contextId && row.members.some(member => member.personId === e.subjectId && member.role === 'supervisor')); break;
    case 'dramatic-double-fiance': case 'dramatic-dating-profile': valid = person(e.contextId) && relationship(e.subjectId, e.contextId); break;
    case 'dramatic-best-friend-secrets': valid = person(e.relatedId) && relationship(e.contextId, e.relatedId) && world.bestFriendships.some(row => row.id === e.subjectId && row.relationshipId === e.contextId && [row.proposerId, row.friendId].includes(player) && [row.proposerId, row.friendId].includes(e.relatedId!)); break;
    case 'dramatic-child-exam-scam': valid = person(e.subjectId) && world.relationships.some(row => row.id === e.contextId && row.from === player && row.to === e.subjectId && row.roles.some(role => role === 'parent' || role === 'guardian')); break;
    case 'dramatic-courtroom-defence': valid = world.cases.some(row => row.id === e.subjectId && row.personId === player); break;
    case 'dramatic-cellmate-escape': valid = person(e.contextId) && relationship(e.relatedId, e.contextId) && world.sentences.some(row => row.id === e.subjectId && row.personId === player); break;
    case 'dramatic-accomplice-wire': valid = person(e.relatedId) && world.incidents.some(row => row.id === e.subjectId && row.personId === player && row.offence === 'robbery') && world.gangs.some(row => row.id === e.contextId && row.personId === player && row.contactIds.includes(e.relatedId!)); break;
    case 'dramatic-unpaid-employees': valid = person(e.contextId) && !!e.quote && world.businesses.some(row => row.id === e.subjectId && row.founderId && row.staff.some(s => s.personId === e.contextId && s.role === 'manager') && row.staff.some(s => s.employmentId === e.relatedId && s.role === 'worker')); break;
    case 'dramatic-suspicious-property': valid = !!e.quote && world.assets.some(row => row.id === e.subjectId && row.kind === 'property'); break;
    case 'dramatic-dishonest-sponsor': valid = world.sponsorships.some(row => row.id === e.subjectId && row.ownerId === player && row.accountId === e.contextId && row.monthlyPay.minor === e.quote); break;
    case 'dramatic-funeral-stream': valid = !!world.people[e.contextId!]?.died && person(e.relatedId) && person(e.otherId) && world.creatorStudios.some(row => row.id === e.subjectId && row.personId === player && row.crew.some(member => member.personId === e.relatedId && member.role === 'editor')); break;
    case 'dramatic-election-scandal': valid = world.elections.some(row => row.id === e.subjectId && row.candidates.some(candidate => candidate.personId === player)); break;
    case 'dramatic-athlete-doping': case 'dramatic-scandal-movie': valid = world.careers.some(row => row.id === e.subjectId && row.personId === player && row.projects.some(project => project.id === e.contextId) && (e.eventId === 'dramatic-athlete-doping' ? person(e.relatedId) && row.contacts.includes(e.relatedId!) : world.controversies.some(scandal => scandal.id === e.relatedId && scandal.personId === player))); break;
  }
  if (!valid) throw new Error('Invalid dramatic situation reference');
}
