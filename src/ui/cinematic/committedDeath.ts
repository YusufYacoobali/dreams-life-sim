import type { GameState } from '../../state/gameStore';

/** Loading a deceased save and switching people/lives are not new deaths.
 * The store publishes a command's next revision only after repository.commit.
 */
export function isNewDeath(next: Pick<GameState, 'world' | 'ready'>, previous: Pick<GameState, 'world' | 'ready'>) {
  const before = previous.world, after = next.world;
  return !!(previous.ready && next.ready && before && after && before.id === after.id && before.activePersonId === after.activePersonId
    && after.revision === before.revision + 1 && !before.people[before.activePersonId].died && after.people[after.activePersonId].died);
}
