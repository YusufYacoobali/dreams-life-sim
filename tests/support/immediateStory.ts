import { bindEvent } from '../../src/game/content/events';
import { storyOption, type EventTemplate, type StoryOptionExtras } from '../../src/game/content/eventTypes';
import { resolveCommand } from '../../src/game/engine';
import { copyWorld, validateWorld, type World } from '../../src/game/model';
import { offerPending } from '../../src/game/pendingQueue';
import type { StoryImmediateEffect } from '../../src/game/systems/storyImmediateSchemas';

/** Explicit domain unit scene. It is not encounter-rate or authored-copy evidence. */
export function immediateScene(extra: StoryOptionExtras, context: Partial<EventTemplate> = {}): EventTemplate {
  return { id: 'immediate-unit-scene', min: 0, max: 120, illustration: 'calendar', title: 'A decision', body: 'Make a choice.', ...context,
    choices: [storyOption('act', 'Choose {money}', {}, 'The result', 'The actual consequence: {money}.', 'I chose the consequence: {money}.', undefined, extra), storyOption('leave', 'Leave', {}, 'Finished', 'You leave.', 'I left.')] };
}
export function immediateDecision(input: World, extra: StoryOptionExtras, context: Partial<EventTemplate> = {}) {
  const world = copyWorld(input); world.pending = null; world.pendingPriority = 0; world.deferred = []; world.annual = null;
  const event = bindEvent(world, immediateScene(extra, context)); offerPending(world, event);
  return validateWorld(world);
}
export function immediateEffect(world: World): StoryImmediateEffect {
  if (world.pending?.kind !== 'decision') throw new Error('Expected immediate unit decision');
  const effect = world.pending.choices[0].effects.find(item => item.kind === 'story-immediate');
  if (!effect || effect.kind !== 'story-immediate') throw new Error('Missing immediate consequence'); return effect;
}
export function chooseImmediate(world: World) {
  if (world.pending?.kind !== 'decision') throw new Error('Expected immediate unit decision');
  return resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: world.pending.choices[0].id }, true);
}
