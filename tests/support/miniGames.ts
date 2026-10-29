import {
  decodeWorld,
  encodeWorld,
  validateWorld,
  type World,
} from '../../src/game/model';
import {
  recordDeath,
  resolveCommand,
  type GameCommand,
} from '../../src/game/engine';
import {
  startCareerContract,
  careerPayQuote,
  careerMonth,
} from '../../src/game/systems/careers';
import { serviceMonth, servicePayQuote } from '../../src/game/systems/services';
import { endEmployment, workMonth } from '../../src/game/systems/work';
import { financialActors } from '../../src/game/systems/households';
import { monthFrom } from '../../src/game/calendar';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { accountFor } from '../../src/game/systems/common';
import { burglaryContext } from '../../src/minigames/core/eligibility';
import type { MiniGameKind } from '../../src/minigames/core/types';
import graduate from '../fixtures/v3-employed-graduate.json';
export function miniGameFixture() {
  const world = decodeWorld(JSON.stringify(graduate)),
    person = world.people[world.activePersonId];
  endEmployment(world);
  person.born.year -= 5;
  person.skills.sport = 85;
  person.skills.science = 85;
  person.legal.crimeSkill = 50;
  for (const key of [
    'health',
    'fitness',
    'energy',
    'discipline',
    'smarts',
  ] as const)
    person.stats[key] = 95;
  const cash = accountFor(world);
  cash.cash += 100000000n;
  cash.openingCash += 100000000n;
  return validateWorld(world);
}
export function drainMiniGameEvents(input: World) {
  let world = input;
  let guard = 0;
  while (world.pending && guard++ < 100) {
    if (world.pending.kind === 'result')
      world = resolveCommand(world, {
        type: 'acknowledge',
        resultId: world.pending.id,
      });
    else {
      const choice = world.pending.choices.find(
        (row) => !choiceUnavailable(world, row),
      );
      if (!choice) throw Error('No eligible choice');
      world = resolveCommand(world, {
        type: 'choose',
        eventId: world.pending.id,
        choiceId: choice.id,
      });
    }
  }
  return world;
}
export function athleteFixture() {
  const world = miniGameFixture();
  startCareerContract(
    world,
    'athlete',
    careerPayQuote(world, 'athlete'),
    world.people[world.activePersonId],
    false,
  );
  return validateWorld(world);
}
export function missionFixture() {
  let world = miniGameFixture();
  for (let seed = 1; seed < 100; seed++) {
    world.random.outcomes = seed;
    const attempt = drainMiniGameEvents(
      resolveCommand(world, {
        type: 'apply-service',
        kind: 'astronaut',
        branch: 'space-program',
        quotedAnnualPay: servicePayQuote(world, 'astronaut'),
      }),
    );
    if (attempt.serviceCareers.length) {
      world = attempt;
      break;
    }
  }
  const career = world.serviceCareers[0];
  if (!career) throw Error('No astronaut selected');
  career.contracts[0].examRoll = 1;
  for (let i = 0; i < 24; i++) {
    world = nextServicePeriod(world);
    world.people[world.activePersonId].stats.energy = 100;
  }
  return drainMiniGameEvents(
    resolveCommand(world, {
      type: 'start-assignment',
      serviceId: world.serviceCareers[0].id,
      kind: 'orbital-research',
    }),
  );
}
export function nextServicePeriod(input: World) {
  const world = decodeWorld(encodeWorld(input));
  world.date = monthFrom(world.date, 1);
  world.people[world.activePersonId].stats.energy = 100;
  for (const person of financialActors(world)) {
    workMonth(world, person);
    person.lastEconomicMonth = world.date.year * 12 + world.date.month - 1;
  }
  for (const fatality of serviceMonth(world))
    recordDeath(world, fatality.personId, fatality.cause);
  return drainMiniGameEvents(validateWorld(world));
}
export function nextMatchPeriod(input: World) {
  const world = decodeWorld(encodeWorld(input));
  world.date = monthFrom(world.date, 1);
  workMonth(world);
  careerMonth(world);
  return validateWorld(world);
}
export function startMiniGame(
  world: World,
  kind: MiniGameKind,
  assisted = true,
) {
  const career = world.careers.find((row) => row.kind === 'athlete'),
    service = world.serviceCareers.find((row) => row.kind === 'astronaut');
  return resolveCommand(world, {
    type: 'mini-game-start',
    kind,
    assisted,
    ownerId:
      kind === 'sports'
        ? career!.id
        : kind === 'astronaut'
          ? service!.id
          : world.activePersonId,
    contextId:
      kind === 'sports'
        ? career!.projects.find((row) => row.status === 'active')!.id
        : kind === 'astronaut'
          ? service!.assignments.find((row) => row.status === 'active')!.id
          : burglaryContext(world),
  });
}
export function gameAct(world: World, command: GameCommand) {
  return resolveCommand(world, command, true);
}
