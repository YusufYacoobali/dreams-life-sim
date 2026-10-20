import type { EventRarity, EventTemplate } from './eventTypes';

/** Authored relative weights, not absolute annual probabilities. Omitted means common. */
export const EVENT_RARITY_VERSION = 1;
export const EVENT_RARITY_WEIGHTS: Readonly<Record<EventRarity, number>> = Object.freeze({
  common: 100, uncommon: 25, rare: 5, 'extremely-rare': 1,
});

export const eventWeight = (template: Pick<EventTemplate, 'rarity'>) => EVENT_RARITY_WEIGHTS[template.rarity ?? 'common'];

/** Select only from the caller's already eligible pool, using exactly one saved draw. */
export function weightedEvent(templates: readonly EventTemplate[], draw: (totalWeight: number) => number): EventTemplate {
  if (!templates.length) throw new Error('An event pool must not be empty');
  const weights = templates.map(eventWeight), total = weights.reduce((sum, weight) => sum + weight, 0);
  if (!Number.isSafeInteger(total) || weights.some(weight => !Number.isSafeInteger(weight) || weight <= 0)) throw new Error('Invalid authored event weights');
  let ticket = draw(total);
  if (!Number.isSafeInteger(ticket) || ticket < 0 || ticket >= total) throw new Error('Invalid event selection draw');
  for (let index = 0; index < templates.length; index++) {
    if (ticket < weights[index]) return templates[index];
    ticket -= weights[index];
  }
  throw new Error('The event selection draw did not match its pool');
}
