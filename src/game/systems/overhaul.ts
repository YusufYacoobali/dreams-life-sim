import type { World } from '../model';

/** Prospective capability: legacy bound choices and records stay byte-for-byte literal. */
export function enableOverhaul(world: World) {
  world.overhaulVersion = 1;
  world.prisonLives ??= [];
  world.affairs ??= [];
  world.romanceOffers ??= [];
}
