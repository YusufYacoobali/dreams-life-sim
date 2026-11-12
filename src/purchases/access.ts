import type { GameCommand } from '../game/engine';
import type { World } from '../game/model';
import type { PremiumFeature } from './catalog';
import { isUnlockAllTestingEnabled } from '../access/buildAccess';

/** Testing access is evaluated on demand and never becomes purchase ownership. */
export function hasPremiumAccess(owned: boolean): boolean {
  return isUnlockAllTestingEnabled() || owned;
}

/** Restrict only new entry; an existing career, assignment and history remain usable. */
export function requiredFeature(world: World, command: GameCommand): PremiumFeature | null {
  if (command.type === 'select-career' && command.kind === 'athlete') {
    return world.careers.some(career => career.personId === world.activePersonId && career.kind === 'athlete' && ['active', 'between'].includes(career.status)) ? null : 'athlete';
  }
  if (command.type === 'apply-service') {
    return world.serviceCareers.some(career => career.personId === world.activePersonId && career.kind === command.kind && ['active', 'between'].includes(career.status)) ? null : command.kind;
  }
  return command.type === 'found-cult' ? 'cult' : null;
}
