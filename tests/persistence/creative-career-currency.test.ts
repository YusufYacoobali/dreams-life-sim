import { decodeWorld, encodeWorld, validateWorld } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { monthFrom } from '../../src/game/calendar';
import { countries } from '../../src/game/countries';
import { convertMoney } from '../../src/game/money';
import { endEmployment, workMonth } from '../../src/game/systems/work';
import { settleTax } from '../../src/game/systems/finance';
import { actorMonth } from '../../src/game/systems/actor';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import graduate from '../fixtures/v3-employed-graduate.json';

function acknowledge(input: ReturnType<typeof decodeWorld>) {
  let world = input;
  while (world.pending) {
    if (world.pending.kind !== 'result') throw new Error('Unexpected story while arranging a financial fixture');
    world = resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
  }
  return world;
}
test('foreign creative wages and agency fees retain original FX receipts and a single lifetime-reference total after rates change', () => {
  let world = decodeWorld(JSON.stringify(graduate));
  const person = world.people[world.activePersonId]; endEmployment(world); settleTax(world, person);
  person.country = 'GB'; person.city = countries.GB.cities[0]; person.skills.acting = 100; person.stats.health = person.stats.smarts = person.stats.energy = person.stats.discipline = 100;
  world.accounts.push({ id: 'account_creative_GBP', ownerId: person.id, currency: 'GBP', cash: 100000000n, openingCash: 100000000n, lockedCash: 0n });
  expect(person.finance.earningsCurrency).toBe('USD');
  world = acknowledge(resolveCommand(world, { type: 'actor-enter' }));
  world = acknowledge(resolveCommand(world, { type: 'actor-agency', tier: 'boutique', negotiate: false }));
  world = decodeWorld(encodeWorld(world));
  const offer = world.careers.find(item => item.kind === 'actor')!.actor!.industry.board.find(item => item.minAgency === 0 && item.minReputation <= 40)!;
  offer.auditionRoll = 1; // Saved-success financial fixture, independent of ordinary casting probabilities.
  world = acknowledge(resolveCommand(world, { type: 'actor-audition', offerId: offer.id, quotedAnnualPay: offer.annualPay, negotiate: false }));
  world = decodeWorld(encodeWorld(world));
  let career = world.careers.find(item => item.kind === 'actor')!, project = career.projects.at(-1)!, metadata = project.creative!;
  expect(project.currency).toBe('GBP'); expect(metadata.referenceCurrency).toBe('USD'); expect(metadata.commissionBps).toBe(1200);
  world.date = monthFrom(world.date, 1); workMonth(world); actorMonth(world); world.people[world.activePersonId].lastEconomicMonth = world.date.year * 12 + world.date.month - 1; validateWorld(world);
  const firstReferenceGross = metadata.normalizedGross, firstFeeReceipt = { ...metadata.commissionConversions[0] }, firstWageReceipt = { ...world.workHistory.find(item => item.id === project.employmentId)!.conversions[0] };
  expect(firstReferenceGross).toBeGreaterThan(0n); expect(metadata.normalizedCommission).toBeGreaterThan(0n);
  world.market.fx.GBP.numerator *= 2n; validateWorld(world);
  expect(metadata.commissionConversions[0]).toEqual(firstFeeReceipt); expect(world.workHistory.find(item => item.id === project.employmentId)!.conversions[0]).toEqual(firstWageReceipt);
  expect(metadata.normalizedGross).toBe(firstReferenceGross);
  world.date = monthFrom(world.date, 1); workMonth(world); actorMonth(world); world.people[world.activePersonId].lastEconomicMonth = world.date.year * 12 + world.date.month - 1; validateWorld(world);
  career = world.careers.find(item => item.kind === 'actor')!; project = career.projects.at(-1)!; metadata = project.creative!;
  const history = world.workHistory.find(item => item.id === project.employmentId)!, transactions = new Map(world.ledger.map(item => [item.id, item]));
  const feesInReferenceCurrency = metadata.commissionConversions.reduce((total, receipt) => total + convertMoney({ minor: -transactions.get(receipt.transactionId)!.cashDelta, currency: 'GBP' }, 'USD', receipt.numerator, receipt.denominator).minor, 0n);
  expect(metadata.commissionConversions).toHaveLength(2); expect(history.conversions).toHaveLength(2);
  expect(metadata.normalizedGross).toBe(history.normalizedGross); expect(metadata.normalizedGross).not.toBe(project.grossEarned);
  expect(metadata.normalizedCommission).toBe(feesInReferenceCurrency);
  expect(career.actor!.industry.totalGross).toBe(history.normalizedGross); expect(career.actor!.industry.totalCommission).toBe(feesInReferenceCurrency);
  expect(metadata.commissionConversions[0]).toEqual(firstFeeReceipt);
  expect(unpackCheckpoint(packCheckpoint(world))).toEqual(world);
});
