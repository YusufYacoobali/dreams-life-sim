import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { decodeWorld, encodeWorld, type World } from '../../src/game/model';
import { randomInteger } from '../../src/game/random';
import { employee } from './employee';

export function annualCommand(world: World): GameCommand {
  return world.pending?.kind === 'decision' ? { type: 'choose', eventId: world.pending.id, choiceId: world.pending.choices.find(choice => !choiceUnavailable(world, choice))!.id }
    : world.pending ? { type: 'acknowledge', resultId: world.pending.id } : world.annual ? { type: 'resume' } : { type: 'advance' };
}
export function finishNpcYear(input: World): World {
  let world = input, guard = 0;
  while ((world.pending || world.annual) && !world.people[world.activePersonId].died && guard++ < 200) world = resolveCommand(world, annualCommand(world), true);
  if (guard >= 200) throw new Error('Unfinished NPC relationship preparation'); return world;
}
let cached: { world: string; a: string; b: string } | null = null;
/** Existing qualified adult setup followed by two actual ordinary introductions.
 * Subsequent annual tests do not override time, money, stats or random streams. */
export function npcSocialCircle() {
  if (!cached) {
    let world = employee('US', false, 22); const gender = world.people[world.activePersonId].gender, ids: string[] = [];
    for (const purpose of ['friend', 'dating'] as const) {
      world = resolveCommand(world, { type: 'meet-people', purpose, gender: purpose === 'friend' ? gender : 'nonbinary' });
      if (world.pending?.kind !== 'decision') throw new Error('Missing actual introduction');
      const id = world.pending.choices[0].id; ids.push(id);
      world = finishNpcYear(resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: id }));
    }
    cached = { world: encodeWorld(world), a: ids[0], b: ids[1] };
  }
  return { world: decodeWorld(cached.world), a: cached.a, b: cached.b };
}
/** Deliberately controlled joint-consent unit case, not a natural random journey. */
export function npcConsentSeed(agree = true) {
  for (let seed = 1; seed < 10000; seed++) {
    const pick = randomInteger(seed, 0, 0), first = randomInteger(pick.state, 1, 100), second = randomInteger(first.state, 1, 100);
    if ((first.value <= 47 && second.value <= 47) === agree) return seed;
  }
  throw new Error('No NPC consent test seed');
}
