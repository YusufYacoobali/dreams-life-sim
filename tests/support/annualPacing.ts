import { monthFrom } from '../../src/game/calendar';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { validateWorld, type World } from '../../src/game/model';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import { annualCommand } from './npcRelationships';
import archive from '../fixtures/v27-leisure-archive.json';

/** Genuine saved callback/school/financial context. Only the life ID and initial
 * events stream are declared unit inputs; this is not a natural-birth policy. */
export function projectPacingStart(legacy = false): World {
  const world = unpackCheckpoint(archive.snapshots.at(-1)!.payload);
  if (world.pending || world.annual) throw new Error('Expected genuine before-year project checkpoint');
  world.id = 'life_busy_year_project_unit';
  // Fixed Mulberry32 unit input: first offer draw is 63, between 50 and 78.
  // No search or post-setup RNG/calendar/money/stat changes occur.
  world.random.events = 1;
  if (legacy) world.annual = { id: 'year_' + world.revision, startDate: { ...world.date }, targetDate: monthFrom(world.date, 12, world.calendarAnchorDay), monthsProcessed: 0, stage: 'months', pausedForPlanning: false };
  return validateWorld(world);
}

export function projectPacingOffer(legacy = false): World {
  const world = resolveCommand(projectPacingStart(legacy), { type: legacy ? 'resume' : 'advance' });
  if (world.pending?.kind !== 'decision' || world.pending.templateId !== 'story-project-promise' || world.annual?.monthsProcessed !== 2) throw new Error('Expected the actual month-two saved project callback');
  return world;
}

export function projectPacingCommand(world: World): Extract<GameCommand, { type: 'choose' }> {
  if (world.pending?.kind !== 'decision' || world.pending.templateId !== 'story-project-promise') throw new Error('Expected the actual project callback');
  return { type: 'choose', eventId: world.pending.id, choiceId: 'complete' };
}

/** Stops before the ordinary year-end decision/result is answered. */
export function reachPacingYearEnd(input: World): World {
  let world = input, guard = 0;
  while (world.annual?.stage === 'months' && guard++ < 100) world = resolveCommand(world, annualCommand(world));
  if (guard >= 100 || world.annual?.stage !== 'complete') throw new Error('Unfinished pacing year');
  return world;
}
