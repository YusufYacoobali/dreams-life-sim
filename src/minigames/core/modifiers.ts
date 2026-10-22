import type { World } from '../../game/model';
import { performanceModifier } from './scoring';
/** Only an attended, eligible period consumes a modifier. It changes the normal
 * recorded score, so existing victories/output/awards resolve in their own system. */
export function consumeMiniGameModifier(
  world: World,
  kind: 'sports' | 'astronaut',
  personId: string,
  contextId: string,
  month: number,
) {
  const session = world.miniGames.find(
    (row) =>
      row.kind === kind &&
      row.personId === personId &&
      row.contextId === contextId &&
      row.status !== 'active' &&
      row.appliedMonth === null,
  );
  if (!session) return 0;
  session.appliedMonth = month;
  return performanceModifier(session.score!);
}
