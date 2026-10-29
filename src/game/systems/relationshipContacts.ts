import type { World } from '../model';
import type { RuntimeEffectRow } from '../runtime';
import { fullName } from '../personHelpers';
import { IneligibleAction } from '../errors';
import { relationFor } from './relationshipQueries';

export function connectPerson(world: World, id: string, fromId = world.activePersonId): RuntimeEffectRow[] {
  const person = world.people[id]; const player = world.people[fromId];
  if (!person || !player || player.died || person.died || person.id === player.id) throw new IneligibleAction('This person is unavailable');
  if (!relationFor(world, player.id, id)) {
    const classmate = player.education.school && player.education.school === person.education.school && person.education.stage !== 'none';
    const kind = classmate ? 'classmate' : 'acquaintance';
    world.relationships.push({ id: 'relation_' + player.id + '_' + id, from: player.id, to: id, kind, roles: [kind], romance: 'none', since: { ...world.date }, parentType: null, strength: 35, trust: 35, memories: ['met:' + world.date.year], lastInteractionYear: world.date.year });
  }
  return [{ id: 'contact', label: 'New acquaintance', value: fullName(person), tone: 'positive' }];
}
