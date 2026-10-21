import { monthFrom } from '../calendar';
import type { Person, World } from '../model';
import { ageOn, compareDates } from '../personHelpers';
import type { EventTemplate } from '../content/eventTypes';
import { hospitalized } from './healthSchemas';
import { isConfined } from './legalSchemas';
import { serviceAway } from './serviceSchemas';
import { activeTrip } from './travelSchemas';

/** Existing records only. Eligibility never creates a case, contact or draw. */
export function legalStoryContexts(world: World) {
  if (!world.cases.length && !world.sentences.length) return {};
  const person = world.people[world.activePersonId];
  const present = (target: Person) => !target.died && !target.legal.wanted && !hospitalized(world, target) && !activeTrip(world, target.id) && !serviceAway(world, target.id);
  if (!present(person) || ageOn(person, world.date) < 18) return {};
  const cases = world.cases.filter(item => item.personId === person.id);
  const adultCaseIds = new Set(cases.filter(item => !item.juvenile).map(item => item.id));
  const awaitingCase = cases.find(item => item.status === 'awaiting-trial' && !item.juvenile && item.country === person.country && item.city === person.city && compareDates(item.hearing, world.date) > 0);
  const sentence = world.sentences.find(item => item.personId === person.id && item.state === 'active' && item.servedMonths > 0 && item.country === person.country && item.city === person.city && item.caseIds.some(id => adultCaseIds.has(id)));
  let peer: { person: Person; relationshipId: string } | undefined;
  if (sentence) {
    const confined = new Map(world.sentences.filter(item => item.state === 'active' && item.facility === sentence.facility && item.country === sentence.country && item.city === sentence.city).map(item => [item.personId, item]));
    for (const relation of world.relationships) {
      const id = relation.from === person.id ? relation.to : relation.to === person.id ? relation.from : undefined;
      const target = id && world.people[id];
      if (!target || !confined.has(target.id) || !present(target) || ageOn(target, world.date) < 18 || target.country !== sentence.country || target.city !== sentence.city) continue;
      if (!relation.roles.some(role => role === 'friend' || role === 'acquaintance') || relation.roles.some(role => ['parent', 'guardian', 'sibling', 'teacher', 'partner', 'spouse'].includes(role)) || !['none', 'ex', 'widowed'].includes(relation.romance)) continue;
      peer = { person: target, relationshipId: relation.id }; break;
    }
  }
  // A second custody order still prevents a free-afternoon situation. Use the
  // latest actual release, never an escape or a reconstructed release date.
  const released = !isConfined(world, person) ? world.sentences.filter(item => item.personId === person.id && item.state === 'released' && item.ended && ['served', 'parole', 'appeal'].includes(item.releaseReason!) && compareDates(item.ended, world.date) <= 0 && compareDates(world.date, monthFrom(item.ended, 12)) <= 0).sort((a, b) => compareDates(b.ended!, a.ended!))[0] : undefined;
  return { awaitingCase, sentence, peer, released };
}

export function legalStoryAvailable(context: ReturnType<typeof legalStoryContexts>, template: EventTemplate) {
  return !template.legal || (template.legal === 'awaiting-trial' ? !!context.awaitingCase : template.legal === 'prison-peer' ? !!context.sentence && !!context.peer : !!context.released);
}
