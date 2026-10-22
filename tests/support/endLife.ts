import { resolveCommand, type EndLifeCommand, type GameCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import type { World } from '../../src/game/model';

export function endLifeCommand(world: World): EndLifeCommand {
  return { type: 'end-life', lifeId: world.id, personId: world.activePersonId, expectedRevision: world.revision };
}

/** Resolve retained scenes by ordinary choices before opening an activity. */
export function readyForActivity(input: World): World {
  let world = input;
  for (let steps = 0; steps < 200; steps++) {
    if (!world.pending && (!world.annual || world.annual.pausedForPlanning)) return world;
    const event = world.pending, choice = event?.kind === 'decision' ? event.choices.find(item => !choiceUnavailable(world, item)) : undefined;
    if (event?.kind === 'decision' && !choice) throw new Error('No ordinary choice available');
    const command: GameCommand = event?.kind === 'decision' ? { type: 'choose', eventId: event.id, choiceId: choice!.id } : event ? { type: 'acknowledge', resultId: event.id } : { type: 'resume' };
    world = resolveCommand(world, command, true);
  }
  throw new Error('Retained scenes did not finish');
}
