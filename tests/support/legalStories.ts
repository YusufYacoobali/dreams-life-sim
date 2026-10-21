import { monthFrom } from '../../src/game/calendar';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { validateWorld, type World } from '../../src/game/model';
import { activeSentence, hearCase, legalMonth } from '../../src/game/systems/legal';
import { decodeSave } from '../../src/persistence/archive';
import archive from '../fixtures/v9-court-archive.json';

export function storyCommand(world: World): GameCommand {
  const event = world.pending;
  return event?.kind === 'result' ? { type: 'acknowledge', resultId: event.id }
    : event ? { type: 'choose', eventId: event.id, choiceId: event.templateId === 'medical-emergency' ? 'care' : event.templateId === 'court-hearing' ? 'guilty' : event.choices[0].id }
      : { type: 'resume' };
}

/** Real saved v9 case followed only by ordinary care/hearing/continuation
 * commands. No date, funds, stats, case outcome or stream is substituted. */
export function actualReleasedStoryWorld(): World {
  let world = decodeSave(JSON.stringify(archive)).world;
  for (let count = 0; count < 100; count++) {
    if (!world.pending && world.sentences.some(item => item.personId === world.activePersonId && item.state === 'released') && !activeSentence(world)) return world;
    world = resolveCommand(world, storyCommand(world));
  }
  throw new Error('The genuine court fixture did not reach release');
}

/** Declared domain context: retain the genuine open case, put its hearing in
 * the future and remove the saved prompt queue/frame before binding a unit
 * situation. This is not a naturally selected scene or a medical-care journey. */
export function pendingCaseStoryWorld(): World {
  const world = decodeSave(JSON.stringify(archive)).world;
  world.pending = null; world.pendingPriority = 0; world.deferred = []; world.annual = null;
  world.cases[0].hearing = monthFrom(world.date, 1);
  return validateWorld(world);
}

/** Controlled context with the real sentencing and contact-creation helpers.
 * One declared calendar step invokes actual legalMonth service; the known
 * relationship is then earned by the real prison conversation command. */
export function prisonPeerStoryWorld(): World {
  let world = pendingCaseStoryWorld();
  hearCase(world, world.cases[0].id, 'guilty');
  const peerCase = world.cases.find(item => item.personId !== world.activePersonId)!;
  if (!peerCase) throw new Error('Sentencing did not create actual prison contacts');
  hearCase(world, peerCase.id, 'guilty');
  world.date = monthFrom(world.date, 1); legalMonth(world);
  world.pending = null; world.pendingPriority = 0; world.deferred = [];
  world = resolveCommand(validateWorld(world), { type: 'prison-interact', personId: peerCase.personId, action: 'befriend' });
  return resolveCommand(world, { type: 'acknowledge', resultId: world.pending!.id });
}
