import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { decodeWorld, encodeWorld, type World } from '../../src/game/model';
import { employee } from './employee';
import { annualCommand, finishNpcYear } from './npcRelationships';

let circle: string | null = null;
/** Qualified-adult setup, then actual introductions; all later years are real commands. */
export function npcFamilyCircle() {
  if (!circle) {
    let world = employee('US', false, 22);
    let firstId: string | null = null;
    for (const purpose of ['friend', 'dating'] as const) {
      const gender = purpose === 'friend' ? world.people[world.activePersonId].gender : world.people[firstId!].biology.role === 'carry' ? 'male' : 'female';
      world = resolveCommand(world, { type: 'meet-people', purpose, gender });
      if (world.pending?.kind !== 'decision') throw new Error('Missing actual NPC family introduction');
      const id = world.pending.choices[0].id; firstId ??= id;
      world = finishNpcYear(resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: id }));
    }
    circle = encodeWorld(world);
  }
  return decodeWorld(circle);
}
let wedding: { before: string; command: GameCommand; after: string } | null = null;
/** Finds the first ordinary annual wedding without overriding money, time or RNG. */
export function npcWeddingJourney() {
  if (!wedding) {
    let world: World = npcFamilyCircle();
    for (let step = 0; step < 500; step++) {
      const command = annualCommand(world), next = resolveCommand(world, command, true);
      if (next.npcCourtships.some(row => row.marriageId)) { wedding = { before: encodeWorld(world), command, after: encodeWorld(next) }; break; }
      world = next;
      if (world.people[world.activePersonId].died) break;
    }
    if (!wedding) throw new Error('Ordinary NPC family policy produced no wedding');
  }
  return { before: decodeWorld(wedding.before), command: structuredClone(wedding.command), after: decodeWorld(wedding.after) };
}
