import { resolveCommand } from '../../src/game/engine';
import type { World } from '../../src/game/model';
/** Complete the real saved interview; callers still inspect the actual random outcome. */
export function interviewResult(world: World, answerId = 'careful') {
  if (world.pending?.kind !== 'decision' || world.pending.templateId !== 'job-interview') throw new Error('Expected an ordinary job interview');
  return resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: answerId });
}
