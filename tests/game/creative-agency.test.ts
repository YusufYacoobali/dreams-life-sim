import { decodeWorld, encodeWorld, validateWorld } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { monthFrom } from '../../src/game/calendar';
import { randomInteger } from '../../src/game/random';
import { endEmployment } from '../../src/game/systems/work';
import graduate from '../fixtures/v3-employed-graduate.json';
function setup(rate: number) {
  let world = decodeWorld(JSON.stringify(graduate)); endEmployment(world); world.people[world.activePersonId].skills.acting = 100;
  for (const command of [{ type: 'actor-enter' }, { type: 'actor-agency', tier: 'boutique', negotiate: false }] as GameCommand[]) {
    world = resolveCommand(world, command); while (world.pending?.kind === 'result') world = resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
  }
  world.date = monthFrom(world.date, 3); world.careers[0].actor!.industry.representation.commissionBps = rate;
  return validateWorld(world);
}
test.each([1000, 1050])('failed same-agency negotiation retains the actual %ibps agreement and every past receipt', rate => {
  const world = setup(rate), before = world.ledger.map(row => ({ ...row })), rep = world.careers[0].actor!.industry.representation;
  let seed = 1; const chance = Math.min(90, 35 + Math.floor(world.careers[0].reputation / 2) + Math.floor(rep.rapport / 5)); while (randomInteger(seed, 1, 100).value <= chance) seed++; world.random.outcomes = seed;
  const next = resolveCommand(world, { type: 'actor-agency', tier: 'boutique', negotiate: true });
  expect(next.careers[0].actor!.industry.representation.commissionBps).toBe(rate); expect(next.ledger).toEqual(before);
});
test('successful same-agency negotiation lowers a fractional existing rate with a clear minimum', () => {
  const world = setup(650), rep = world.careers[0].actor!.industry.representation;
  let seed = 1; const chance = Math.min(90, 35 + Math.floor(world.careers[0].reputation / 2) + Math.floor(rep.rapport / 5)); while (randomInteger(seed, 1, 100).value > chance) seed++; world.random.outcomes = seed;
  const next = resolveCommand(world, { type: 'actor-agency', tier: 'boutique', negotiate: true }); expect(next.careers[0].actor!.industry.representation.commissionBps).toBe(500);
});
test('minimum-rate negotiations reject without changing a saved world', () => {
  const world = setup(500), before = encodeWorld(world); expect(() => resolveCommand(world, { type: 'actor-agency', tier: 'boutique', negotiate: true })).toThrow(/lowest/); expect(encodeWorld(world)).toBe(before);
});
test('the signed audition result retains a fractional commission instead of rounding the agreed charge', () => {
  let world = resolveCommand(setup(1050), { type: 'actor-refresh-offers' });
  while (world.pending?.kind === 'result') world = resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
  const offer = world.careers[0].actor!.industry.board.find(item => item.minAgency === 0 && item.minReputation <= world.careers[0].reputation)!;
  offer.auditionRoll = 1; // Saved-success fixture isolates the signed-rate disclosure.
  world = resolveCommand(world, { type: 'actor-audition', offerId: offer.id, quotedAnnualPay: offer.annualPay, negotiate: false });
  expect(world.careers[0].projects.find(project => project.status === 'active')!.creative!.commissionBps).toBe(1050);
  expect(world.pending?.kind).toBe('result');
  if (world.pending?.kind !== 'result') throw new Error('Missing signed audition result');
  expect(world.pending.effects.find(row => row.id === 'commission')?.value).toBe('1050 basis points (100 = 1%)');
});
