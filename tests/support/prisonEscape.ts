import { decodeWorld, validateWorld, type World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { legalMonth } from '../../src/game/systems/legal';
import { monthFrom } from '../../src/game/calendar';
import { accountFor } from '../../src/game/systems/common';
import graduate from '../fixtures/v3-employed-graduate.json';

export function escapePrisoner(): World {
  let world = decodeWorld(JSON.stringify(graduate));
  const account = accountFor(world);
  account.cash += 100000000n;
  account.openingCash += 100000000n;
  world.people[world.activePersonId].stats.energy = 100;
  for (let seed = 1; seed < 100; seed++) {
    world.random.outcomes = seed;
    const candidate = resolveCommand(world, { type: 'crime', offence: 'vandalism' });
    if (candidate.pending?.kind === 'decision') { world = candidate; break; }
  }
  const choose = (choiceId: string) => {
    if (world.pending?.kind !== 'decision') throw Error('Expected legal decision');
    world = resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId });
    if (world.pending?.kind !== 'result') throw Error('Expected legal result');
    world = resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
  };
  choose('remand');
  world.date = monthFrom(world.date, 1);
  legalMonth(world);
  choose('guilty');
  world.people[world.activePersonId].stats.energy = 100;
  return validateWorld(world);
}
