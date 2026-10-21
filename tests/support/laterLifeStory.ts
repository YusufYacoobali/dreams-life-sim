import { decodeWorld, validateWorld, type World } from '../../src/game/model';
import { recordDeath, resolveCommand } from '../../src/game/engine';
import { otherPerson, partnerRelation } from '../../src/game/systems/relationshipQueries';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import pension from '../fixtures/v18-foreign-pension-archive.json';
import marriage from '../fixtures/v5-marriage-result.json';

/** Existing explicit financial producer: paid background work and twelve real
 * pension periods, not a natural birth-to-retirement journey. */
export function retiredLife(): World { return unpackCheckpoint(pension.checkpoint); }

/** Explicit mortality boundary on the genuine existing paid marriage. No spouse,
 * marriage, dates, money, stats or rolls are substituted for production death. */
export function widowedLife(): World {
  let world = decodeWorld(JSON.stringify(marriage));
  if (world.pending?.kind !== 'result') throw new Error('Expected the genuine wedding result');
  world = resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
  recordDeath(world, otherPerson(world, partnerRelation(world)!).id, 'Explicit later-life story mortality boundary');
  return validateWorld(world);
}
