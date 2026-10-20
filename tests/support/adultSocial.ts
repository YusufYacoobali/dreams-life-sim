import { CountryCode } from '../../src/game/countries';
import { validateWorld } from '../../src/game/model';
import { currentWorkplace } from '../../src/game/systems/workplaceSchemas';
import { refreshFriendship, relationFor } from '../../src/game/systems/relationships';
import { employee } from './employee';

/** Isolate existing adult friendship/courtship state, not a natural life journey. */
export function adultSocial(country: CountryCode = 'US') {
  const world = employee(country), colleagues = currentWorkplace(world)!.members.filter(item => item.role === 'coworker');
  const friendId = colleagues[0].personId, partnerId = colleagues[1].personId;
  for (const id of [friendId, partnerId]) { const edge = relationFor(world, world.activePersonId, id)!; edge.strength = 65; refreshFriendship(edge); }
  const partner = relationFor(world, world.activePersonId, partnerId)!; partner.romance = 'dating'; partner.kind = 'partner'; partner.roles.push('partner');
  validateWorld(world); return { world, friendId, partnerId };
}
