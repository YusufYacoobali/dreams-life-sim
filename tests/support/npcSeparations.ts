import { createLife, randomCreation } from '../../src/game/createLife';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { decodeWorld, encodeWorld, type World } from '../../src/game/model';
import { monthFrom } from '../../src/game/calendar';
import { createContact } from '../../src/game/systems/npcs';
import { connectPerson, relationFor } from '../../src/game/systems/relationships';
import { npcCourtshipsYear } from '../../src/game/systems/npcCourtships';
import { annualCommand } from './npcRelationships';

/** Declared adult dating/country/calendar/RNG unit setup, not natural consent.
 * The clock itself is opened by the actual existing courtship observer. */
export function npcSeparationFixture(couples = 1, state = 7) {
  const world = createLife('life_npc_separations', 42, { ...randomCreation(42), country: 'US', city: 'New York' }, { year: 2000, month: 1, day: 1 });
  world.birthAcknowledged = true; world.date = { year: 2025, month: 1, day: 1 };
  const ids: string[] = [];
  for (let index = 0; index < couples; index++) {
    const a = createContact(world, { age: 24, gender: 'female' }), b = createContact(world, { age: 24, gender: 'male' });
    connectPerson(world, a.id); connectPerson(world, b.id); connectPerson(world, b.id, a.id);
    const relation = relationFor(world, a.id, b.id)!;
    relation.romance = 'dating'; relation.roles = ['classmate', 'coworker', 'friend', 'partner']; relation.kind = 'partner';
    relation.strength = 35; relation.trust = 35; ids.push(relation.id);
  }
  npcCourtshipsYear(world); world.date = monthFrom(world.date, 12, world.date.day);
  // For13+ window cases all supplied genuine pairs need actual observations.
  // A second real observation year picks up the rotating remainder; no old
  // friendship dates or manually invented courtship records supply their clock.
  if (couples > 12) { npcCourtshipsYear(world); world.date = monthFrom(world.date, 12, world.date.day); }
  world.random.npcs = state;
  return { world, ids };
}

let annual: { before: string; command: GameCommand; after: string } | null = null;
/** Fixed predeclared adult unit setup, then only ordinary annual commands.
 * No post-setup roll peeks, RNG/date/stat/balance changes or alternative seeds. */
export function npcSeparationJourney() {
  if (!annual) {
    // Exercise the authored bounded12-pair population, not alternative seeds
    // or rerolls. The original3-pair run is retained separately as continued
    // courtship/wedding coverage rather than falsely claiming a breakup.
    let world = npcSeparationFixture(12).world;
    for (let step = 0; step < 120; step++) {
      const command = annualCommand(world), next = resolveCommand(world, command, true);
      if (next.npcSeparations.some(row => row.outcome === 'separated')) { annual = { before: encodeWorld(world), command, after: encodeWorld(next) }; break; }
      world = next;
      if (world.people[world.activePersonId].died) break;
    }
    if (!annual) throw new Error('Fixed unit annual journey did not produce a separation');
  }
  return { before: decodeWorld(annual.before), command: structuredClone(annual.command), after: decodeWorld(annual.after) };
}

export function npcContinuedCourtshipJourney() {
  let world = npcSeparationFixture(3).world;
  const clocks = world.npcCourtships.map(row => row.id);
  for (let step = 0; step < 50; step++) {
    world = resolveCommand(world, annualCommand(world), true);
    if (clocks.every(id => world.npcCourtships.find(row => row.id === id)?.marriageId)) return world;
    if (world.people[world.activePersonId].died) break;
  }
  throw new Error('Original fixed3-pair ordinary journey did not complete its actual weddings');
}
