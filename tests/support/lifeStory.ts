import type { CountryCode } from '../../src/game/countries';
import { decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { employee } from './employee';
import { accountFor, post } from '../../src/game/systems/common';
import { addChild } from '../../src/game/systems/family';
import { assetCatalog } from '../../src/game/content/assets';
import { assetPrice } from '../../src/game/systems/assets';
import { petAdoptionFee } from '../../src/game/systems/pets';
import { petMonth } from '../../src/game/systems/pets';
import { hobbyFee } from '../../src/game/systems/leisure';
import { leisureMonth } from '../../src/game/systems/leisure';
import type { HobbyKind } from '../../src/game/content/leisure';
import { tripQuote, travelMonth } from '../../src/game/systems/travel';
import { monthFrom } from '../../src/game/calendar';
import { addCondition } from '../../src/game/systems/health';
import { currentWorkplace } from '../../src/game/systems/workplaceSchemas';
import { refreshFriendship, relationFor } from '../../src/game/systems/relationships';

export function drainStorySetup(input: World) {
  let world = input, guard = 0;
  while (world.pending && guard++ < 150) {
    if (world.pending.kind === 'result') world = resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
    else { const choice = world.pending.choices.find(item => !choiceUnavailable(world, item))!; world = resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: choice.id }); }
  }
  if (guard >= 150) throw new Error('Unfinished story fixture'); return world;
}
const act = (world: World, command: GameCommand) => drainStorySetup(resolveCommand(world, command));
const bases = new Map<CountryCode, string>();
/** Isolated domain setup with fixture age/funds/condition and factory children.
 * Real job, team, purchase, pet adoption, trip payments/month and hobby billing.
 * Not a natural life journey, native evidence or a national adoption-rule check. */
export function lifeStoryWorld(country: CountryCode = 'US', kind: HobbyKind = 'guitar', attend = true) {
  if (!bases.has(country)) {
    let world = employee(country, true, 55); post(world, 1_000_000_000_000n, 0n, 'fixture-funding', 'Story domain fixture funds');
    const home = assetCatalog.find(item => item.kind === 'property')!;
    world = act(world, { type: 'buy-asset', catalogId: home.id, financing: 'cash', depositBps: 10000, termMonths: 120, quotedPrice: assetPrice(world, home) });
    for (const [offerId, name] of [['buddy', 'Juno'], ['luna', 'Miso'], ['pip', 'Pipette'], ['olive', 'Pesto']] as const) world = act(world, { type: 'adopt-pet', offerId, name, reviewedOwnerId: world.activePersonId, quotedFee: petAdoptionFee(world, offerId) });
    const place = currentWorkplace(world)!, friendId = place.members.find(item => item.role === 'coworker')!.personId, edge = relationFor(world, world.activePersonId, friendId)!; edge.strength = 65; refreshFriendship(edge);
    const destinationId = country === 'FR' ? 'london' : 'paris';
    world = act(world, { type: 'book-trip', destinationId, duration: 1, companionIds: [], focus: 'sightseeing', quotedTotal: tripQuote(world, destinationId, 1, []).total });
    world.date = monthFrom(world.date, 1); petMonth(world); travelMonth(world); world = drainStorySetup(validateWorld(world));
    for (const age of [1, 7, 15, 22]) addChild(world, [world.people[world.activePersonId]], 'adoptive', age);
    const condition = addCondition(world, world.people[world.activePersonId], 'asthma', 25); condition.onset = { ...world.date, year: world.date.year - 1 }; condition.diagnosed = { ...condition.onset }; condition.months = 12;
    bases.set(country, encodeWorld(world));
  }
  let world = decodeWorld(bases.get(country)!);
  world = act(world, { type: 'hobby-plan', kind, mode: 'community', reviewedPayerId: world.activePersonId, quotedMonthlyFee: hobbyFee(country, kind, 'community') });
  if (!attend) return validateWorld(world);
  world.date = monthFrom(world.date, 1); petMonth(world); leisureMonth(world); world = drainStorySetup(validateWorld(world));
  if (!world.hobbies[0].practices.some(item => item.attended)) throw new Error('Story fixture needs actual attended practice');
  if (accountFor(world).cash <= 0n) throw new Error('Story fixture funding exhausted');
  return world;
}
