import { createLife } from '../../src/game/createLife';
import { countries, type CountryCode } from '../../src/game/countries';
import {
  decodeWorld,
  encodeWorld,
  validateWorld,
  type World,
} from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { accountFor } from '../../src/game/systems/common';
import {
  cultFeeOptions,
  cultStartupQuote,
} from '../../src/game/systems/cultCore';
import { cultMonth } from '../../src/game/systems/cultMonth';
import { monthFrom } from '../../src/game/calendar';
export function cultFixture(country: CountryCode = 'US') {
  const world = createLife(
    'life_cult_' + country,
    941,
    {
      firstName: 'Alex',
      lastName: 'Vale',
      gender: 'nonbinary',
      country,
      city: countries[country].cities[0],
      appearance: { face: 0, skin: 2, hair: 2, hairColor: 0 },
    },
    { year: 2026, month: 1, day: 8 },
  );
  for (const person of Object.values(world.people)) person.born.year -= 30;
  world.birthAcknowledged = true;
  const person = world.people[world.activePersonId];
  person.stats.health = 95;
  person.stats.energy = 100;
  person.stats.respect = 70;
  person.skills.politics = 75;
  person.publicLife.image = 65;
  const account = accountFor(world);
  account.cash += 10000000000n;
  account.openingCash += 10000000000n;
  return validateWorld(world);
}
export function drainCult(input: World) {
  let world = input,
    guard = 0;
  while (world.pending && guard++ < 100) {
    const event = world.pending;
    world = resolveCommand(
      world,
      event.kind === 'result'
        ? { type: 'acknowledge', resultId: event.id }
        : {
            type: 'choose',
            eventId: event.id,
            choiceId:
              event.choices.find((row) => row.id === 'withdraw')?.id ??
              event.choices.find((row) => !row.disabledReason)!.id,
          },
    );
  }
  if (guard >= 100) throw Error('Cult fixture exceeded its scene guard');
  return world;
}
export function cultCommand(world: World, command: GameCommand) {
  return drainCult(resolveCommand(world, command));
}
export function foundCult(
  world = cultFixture(),
  changes: Partial<Extract<GameCommand, { type: 'found-cult' }>> = {},
) {
  const fee = cultFeeOptions(world.people[world.activePersonId].country)[2];
  const headquarters = changes.headquarters ?? 'meeting-room';
  return cultCommand(world, {
    type: 'found-cult',
    name: 'The Other Door',
    leaderTitle: 'Keeper of the Spare Key',
    philosophy: 'dream-archive',
    doctrines: ['borrowed-dreams', 'public-answers'],
    rules: ['family-day', 'open-books'],
    headquarters,
    method: 'gathering',
    joiningFee: fee.joining,
    recurringFee: fee.recurring,
    quotedCost: cultStartupQuote(world, headquarters).total,
    ...changes,
  });
}
export function cultPeriod(input: World, drain = true) {
  const world = decodeWorld(encodeWorld(input));
  world.date = monthFrom(world.date, 1);
  cultMonth(world);
  const valid = validateWorld(world);
  return drain ? drainCult(valid) : valid;
}
