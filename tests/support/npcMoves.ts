import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { decodeWorld, encodeWorld, type World } from '../../src/game/model';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import { createContact } from '../../src/game/systems/npcs';
import { connectPerson, relationFor } from '../../src/game/systems/relationships';
import { annualCommand } from './npcRelationships';
import { monthFrom } from '../../src/game/calendar';
import { workMonth } from '../../src/game/systems/work';
import { financeMonth } from '../../src/game/systems/finance';
import pensionArchive from '../fixtures/v18-foreign-pension-archive.json';

/** Genuine producer v18 retiree/paid receipts/cash/rights, with a DECLARED adult
 * child observer unit context. No pension/service/pay/cash fact is invented.
 * This observer/kinship/RNG setup is not a natural-birth policy. */
export function npcMoveFixture(state = 7) {
  const world = unpackCheckpoint(pensionArchive.checkpoint), retireeId = world.activePersonId;
  world.id = 'life_npc_retirement_move';
  const observer = createContact(world, { age: 35, country: 'JP', city: 'Tokyo', qualifiedRole: 'administrator' });
  world.activePersonId = observer.id; connectPerson(world, retireeId);
  const relation = relationFor(world, observer.id, retireeId)!;
  relation.from = retireeId; relation.to = observer.id; relation.kind = 'parent'; relation.roles = ['parent']; relation.parentType = 'biological';
  // Explicit unit calendar boundary, then actual next-period pension and living
  // helpers. Old paid12 receipts/rights are untouched; the13th is really paid.
  world.date = monthFrom(world.date, 1); const retiree = world.people[retireeId];
  workMonth(world, retiree); financeMonth(world, retiree); retiree.lastEconomicMonth = world.date.year * 12 + world.date.month - 1;
  world.random.npcs = state;
  return { world, retireeId, observerId: observer.id };
}

let journey: { before: string; command: GameCommand; after: string; retireeId: string } | null = null;
/** One fixed genuine-pension/declared-observer context, then ordinary commands
 * only: no post-setup date, funds, health, RNG, outcome or alternative seeds. */
export function npcMoveJourney() {
  if (!journey) {
    const initial = npcMoveFixture(); let world = initial.world;
    for (let step = 0; step < 120; step++) {
      const command = annualCommand(world), next = resolveCommand(world, command, true);
      if (next.npcMoves.some(row => row.outcome === 'moved')) { journey = { before: encodeWorld(world), command, after: encodeWorld(next), retireeId: initial.retireeId }; break; }
      world = next; if (world.people[initial.retireeId].died || world.people[world.activePersonId].died) break;
    }
    if (!journey) throw new Error('Fixed genuine-pension journey did not produce an autonomous move; preserve this missing outcome rather than searching another seed');
  }
  return { before: decodeWorld(journey.before), command: structuredClone(journey.command), after: decodeWorld(journey.after), retireeId: journey.retireeId };
}
