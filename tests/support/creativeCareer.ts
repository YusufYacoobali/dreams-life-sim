import { copyWorld, decodeWorld, validateWorld, type World } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { endEmployment, workMonth } from '../../src/game/systems/work';
import { actorMonth } from '../../src/game/systems/actor';
import { modelCareerMonth } from '../../src/game/systems/modelCareer';
import { getIndustry } from '../../src/game/systems/creativeCore';
import { creativeMonthNumber, type CreativeKind } from '../../src/game/systems/creativeSchemas';
import { accountFor } from '../../src/game/systems/common';
import { financialActors } from '../../src/game/systems/households';
import { monthFrom } from '../../src/game/calendar';
import graduate from '../fixtures/v3-employed-graduate.json';

export const creativeCareer = (world: World, kind: CreativeKind) => world.careers.find(item => item.kind === kind && item.personId === world.activePersonId)!;
export const creativeIndustry = (world: World, kind: CreativeKind) => getIndustry(creativeCareer(world, kind))!;
export function drainCreative(input: World): World {
  let world = input;
  while (world.pending?.kind === 'result') world = resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
  return world;
}
export const creativeAct = (world: World, command: GameCommand) => drainCreative(resolveCommand(drainCreative(world), command));
export function creativeFixture(kind: CreativeKind): World {
  const world = decodeWorld(JSON.stringify(graduate)), person = world.people[world.activePersonId], bank = accountFor(world);
  endEmployment(world); person.born.year -= 5;
  person.skills.acting = person.skills.modeling = 100;
  person.stats.health = person.stats.energy = person.stats.smarts = person.stats.looks = person.stats.fitness = person.stats.discipline = 100;
  bank.cash += 100000000n; bank.openingCash += 100000000n;
  return creativeAct(world, { type: kind === 'actor' ? 'actor-enter' : 'model-enter' });
}
export function creativeBook(input: World, kind: CreativeKind, category = kind === 'actor' ? 'independent-film' : 'editorial') {
  let world = copyWorld(drainCreative(input));
  const state = creativeIndustry(world, kind);
  if (state.boardSeason !== Math.floor(creativeMonthNumber(world) / 3)) world = creativeAct(world, { type: kind === 'actor' ? 'actor-refresh-offers' : 'model-refresh-offers' });
  const offer = creativeIndustry(world, kind).board.find(item => item.category === category)!;
  offer.auditionRoll = 1; // Saved-success fixture: tests isolate work/choices, not casting luck.
  return creativeAct(world, kind === 'actor' ? { type: 'actor-audition', offerId: offer.id, quotedAnnualPay: offer.annualPay, negotiate: false } : { type: 'model-casting', offerId: offer.id, quotedAnnualPay: offer.annualPay });
}
export function creativePeriod(input: World) {
  const world = copyWorld(drainCreative(input)); world.date = monthFrom(world.date, 1);
  for (const person of financialActors(world)) { person.stats.energy = 100; workMonth(world, person); person.lastEconomicMonth = creativeMonthNumber(world); }
  actorMonth(world); modelCareerMonth(world);
  return validateWorld(world);
}
export function creativeFinish(input: World, kind: CreativeKind) {
  let world = input;
  for (let month = 0; creativeCareer(world, kind).status === 'active' && month < 12; month++) world = drainCreative(creativePeriod(world));
  expect(creativeCareer(world, kind).status).not.toBe('active');
  return world;
}
export function experiencedCreative(kind: CreativeKind) {
  let world = creativeFixture(kind);
  for (let job = 0; job < 2; job++) world = creativeFinish(creativeBook(world, kind, kind === 'actor' ? 'theatre' : 'editorial'), kind);
  world = copyWorld(world); world.date = monthFrom(world.date, (2 - creativeMonthNumber(world) % 6 + 6) % 6);
  const career = creativeCareer(world, kind); career.reputation = 75;
  if (career.modelCareer) { for (const key of Object.keys(career.modelCareer.portfolio) as (keyof typeof career.modelCareer.portfolio)[]) career.modelCareer.portfolio[key] = 50; }
  return creativeAct(world, { type: kind === 'actor' ? 'actor-agency' : 'model-agency', tier: 'major', negotiate: false });
}
