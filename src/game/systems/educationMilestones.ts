import type { Person, World } from '../model';
import type { RuntimeEffectRow } from '../runtime';
import { offerPending } from '../pendingQueue';

/** Bound to an actual transition, then persisted through the ordinary queue. */
export function educationMilestone(world: World, person: Person, milestone: string, title: string, body: string, effects: RuntimeEffectRow[] = []) {
  if (person.id !== world.activePersonId) return;
  const id = 'school_' + person.id + '_' + milestone + '_' + world.date.year + '_' + world.date.month;
  if (world.pending?.id === id || world.deferred.some(row => row.event.id === id)) return;
  offerPending(world, { kind: 'result', id, title, body, illustration: 'education', effects });
}
