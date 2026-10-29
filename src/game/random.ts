/** Versioned Mulberry32 stream. State lives in the save, never in a UI module. */
export const RANDOM_VERSION = 1;
export type Draw = { state: number; value: number };

export function nextRandom(state: number): Draw {
  if (!Number.isInteger(state) || state < 0 || state > 0xFFFFFFFF) throw new Error('Invalid random state');
  const next = (state + 0x6D2B79F5) >>> 0;
  let t = Math.imul(next ^ (next >>> 15), next | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return { state: next, value: ((t ^ (t >>> 14)) >>> 0) / 4294967296 };
}

export function randomInteger(state: number, minimum: number, maximum: number): Draw {
  if (!Number.isSafeInteger(minimum) || !Number.isSafeInteger(maximum) || maximum < minimum || maximum - minimum > 0xFFFFFFFF) {
    throw new Error('Invalid random bounds');
  }
  const draw = nextRandom(state);
  return { state: draw.state, value: minimum + Math.floor(draw.value * (maximum - minimum + 1)) };
}

/** Separate streams mean opening an event cannot reroll the investment market. */
export function forkRandom(seed: number, name: string): number {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xFFFFFFFF) throw new Error('Invalid random state');
  let hash = seed >>> 0;
  for (let i = 0; i < name.length; i++) hash = Math.imul(hash ^ name.charCodeAt(i), 0x01000193) >>> 0;
  return hash;
}
