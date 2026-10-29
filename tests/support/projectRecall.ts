import { decodeSave } from '../../src/persistence/archive';
import { bindEvent, eventTemplates } from '../../src/game/content/events';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { validateWorld, type World } from '../../src/game/model';
import { offerPending } from '../../src/game/pendingQueue';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import original from '../fixtures/v21-school-archive.json';

/** Genuine saved classroom; only template selection is explicitly arranged, never RNG or people. */
export function arrangedProject() {
  const world = decodeSave(JSON.stringify(original)).world;
  if (world.pending || world.annual) throw new Error('The original classroom is not idle');
  const event = bindEvent(world, eventTemplates.find(template => template.id === 'school-project-promise')!);
  offerPending(world, event); return validateWorld(world);
}
export function ordinaryStoryCommand(world: World): GameCommand {
  if (world.people[world.activePersonId].died) throw new Error('Actual death interrupted the project continuation');
  const event = world.pending;
  if (event?.kind === 'result') return { type: 'acknowledge', resultId: event.id };
  if (event?.kind === 'decision') {
    const choice = event.choices.find(item => !choiceUnavailable(world, item));
    if (!choice) throw new Error('No eligible actual decision');
    return { type: 'choose', eventId: event.id, choiceId: choice.id };
  }
  return { type: world.annual ? 'resume' : 'advance' };
}
export function realProjectRecall(resolution: 'complete' | 'ask-help' | 'leave-to-peer' = 'complete') {
  let world = arrangedProject();
  world = resolveCommand(world, { type: 'choose', eventId: world.pending!.id, choiceId: 'promise' });
  const threadId = world.storyThreads[0].id;
  for (let commands = 0; commands < 150; commands++) {
    if (world.pending?.kind === 'decision' && world.pending.id === threadId + '_due') {
      world = resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: resolution }); break;
    }
    world = resolveCommand(world, ordinaryStoryCommand(world));
  }
  if (!world.storyThreads[0].projectRecall) throw new Error('The actual first project did not resolve');
  for (let commands = 0; commands < 250; commands++) {
    if (world.pending?.kind === 'decision' && world.pending.id === threadId + '_project_recall') return world;
    world = resolveCommand(world, ordinaryStoryCommand(world));
  }
  throw new Error('The real two-year continuation did not become available');
}
