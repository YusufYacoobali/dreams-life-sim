import type { GameCommand } from '../game/engine';
import type { World } from '../game/model';
import type { PremiumFeature } from './catalog';
import { activeCult } from '../game/systems/cultSchemas';

export type PremiumCareerFeature = Exclude<PremiumFeature, 'god_mode' | 'time_machine'>;

/** Paid access comes only from the purchase service's verified ownership. */
export function hasPremiumAccess(owned: boolean): boolean {
  return owned === true;
}

/** Discovery respects existing careers without granting ownership or new entry. */
export function requiredCareerFeature(world: World, feature: PremiumCareerFeature): PremiumCareerFeature | null {
  if (feature === 'cult') return activeCult(world) ? null : feature;
  const careers = feature === 'athlete' ? world.careers : world.serviceCareers;
  return careers.some(career => career.personId === world.activePersonId && career.kind === feature && ['active', 'between'].includes(career.status)) ? null : feature;
}

/** Restrict only new entry; an existing career, assignment and history remain usable. */
export function requiredFeature(world: World, command: GameCommand): PremiumFeature | null {
  if (command.type === 'select-career' && command.kind === 'athlete') {
    return requiredCareerFeature(world, 'athlete');
  }
  if (command.type === 'apply-service') {
    return requiredCareerFeature(world, command.kind);
  }
  return command.type === 'found-cult' ? 'cult' : null;
}
