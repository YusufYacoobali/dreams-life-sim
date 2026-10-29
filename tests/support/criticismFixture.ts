import { copyWorld, decodeWorld, immutableWorld, type World } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { randomInteger } from '../../src/game/random';
import { decodeSave } from '../../src/persistence/archive';
import type { PlatformId } from '../../src/game/content/social';
import teenArchive from '../fixtures/v28-native-teen-archive.json';
import graduate from '../fixtures/v3-employed-graduate.json';

export const legacyCriticism = { title: 'Your post has drawn criticism', body: 'An audience that laughed at part of your post is arguing about the rest. People are asking what you meant.' };
let teen: World | undefined, adult: World | undefined;
export function finishCriticismScene(input: World): World {
  let world = input, guard = 0;
  while ((world.pending || world.annual && !world.annual.pausedForPlanning) && guard++ < 100) {
    const command: GameCommand = world.pending?.kind === 'decision' ? { type: 'choose', eventId: world.pending.id, choiceId: world.pending.choices.find(choice => !choiceUnavailable(world, choice))!.id } : world.pending ? { type: 'acknowledge', resultId: world.pending.id } : { type: 'resume' };
    world = resolveCommand(world, command, true);
  }
  if (guard >= 100) throw new Error('Fixture scene did not close'); return world;
}
export function criticismProfile(platform: PlatformId = 'photogram', grownUp = false) {
  const initial = grownUp ? adult ??= finishCriticismScene(decodeWorld(JSON.stringify(graduate))) : teen ??= finishCriticismScene(decodeSave(JSON.stringify(teenArchive)).world);
  return finishCriticismScene(resolveCommand(initial, { type: 'create-social', platform, handle: 'criticism_daily', bio: 'An ordinary life.' }, true));
}
// Deliberately arranged unit-test response, not a new natural-policy observation.
const responseSeed = (() => {
  for (let state = 0; state < 10000; state++) { const reach = randomInteger(state, 20, 120); if (randomInteger(reach.state, 1, 1000).value <= 8) return state; }
  throw new Error('No arranged criticism response');
})();
export function arrangedCriticismRoll(input: World) { const world = copyWorld(input); world.random.outcomes = responseSeed; return immutableWorld(world); }
export const criticismPost = (world: World, kind: 'photo' | 'message' | 'video' | 'gaming' = 'photo'): GameCommand => ({ type: 'publish-post', accountId: world.socialAccounts[0].id, kind, intent: 'authentic', sponsored: false, caption: 'An original moment.' });
