import { ageOn, decodeWorld, encodeWorld, validateWorld, World } from '../../src/game/model';
import { recordDeath, resolveCommand } from '../../src/game/engine';
import { accountFor, availableCash, post } from '../../src/game/systems/common';
import { addChild, childrenOf, divorceQuote, oweFamily } from '../../src/game/systems/family';
import { apportion, estateShares, settleEstate } from '../../src/game/systems/estates';
import { connectPerson } from '../../src/game/systems/relationships';
import { createContact } from '../../src/game/systems/npcs';
import { householdMonth } from '../../src/game/systems/npcBudget';
import { assetCatalog } from '../../src/game/content/assets';
import { assetPrice, assetsMonth, monthlyUpkeep } from '../../src/game/systems/assets';
import { netWorth } from '../../src/game/valuation';
import marriageFixture from '../fixtures/v5-marriage-result.json';
import birthFixture from '../fixtures/v6-birth-result.json';
import { countryCodes, countries } from '../../src/game/countries';
import { createLife, randomCreation } from '../../src/game/createLife';
function ack(world: World) { if (world.pending?.kind !== 'result') throw new Error('Expected result'); return resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id }); }
function family() {
  let world = ack(decodeWorld(JSON.stringify(marriageFixture))); const player = world.people[world.activePersonId], spouseId = world.marriages.at(-1)!.b;
  const first = addChild(world, [player, world.people[spouseId]], 'biological'), second = addChild(world, [player, world.people[spouseId]], 'adoptive', 3);
  return { world, spouseId, firstId: first.id, secondId: second.id };
}
test('largest-remainder allocation conserves every unit even for huge fortunes and stable ties', () => {
  const total = 10n ** 90n + 2n, shares = [{ personId: 'b', weight: 1n }, { personId: 'a', weight: 1n }, { personId: 'c', weight: 1n }];
  const values = apportion(total, shares); expect([...values.values()].reduce((a, b) => a + b, 0n)).toBe(total); expect(values.get('a')! >= values.get('c')!).toBe(true);
});
test('default succession divides one estate between spouse and existing children and settles exactly once', () => {
  const { world, spouseId, firstId, secondId } = family(), playerId = world.activePersonId;
  const before = netWorth(world).minor, beneficiaries = [spouseId, firstId, secondId], balances = new Map(beneficiaries.map(id => [id, accountFor(world, world.people[id]).cash]));
  recordDeath(world, playerId, 'test fixture'); const estate = world.estates.find(item => item.personId === playerId)!;
  const distributed = estate.distributions.reduce((sum, item) => sum + item.cash.minor + item.assetValue.minor, 0n);
  expect(distributed + estate.tax.minor + estate.fees.minor).toBe(before);
  expect(estate.distributions.map(item => item.personId).sort()).toEqual(beneficiaries.sort());
  expect(accountFor(world, world.people[firstId]).cash - balances.get(firstId)!).toBeGreaterThan(0n);
  expect(accountFor(world, world.people[firstId]).lockedCash).toBe(accountFor(world, world.people[firstId]).cash);
  const encoded = encodeWorld(world); settleEstate(world, playerId); recordDeath(world, playerId, 'again'); expect(encodeWorld(world)).toBe(encoded);
});
test('protected family minima survive an outside-beneficiary will and specific owned bequests remain real assets', () => {
  let { world, spouseId, firstId } = family(); const outsider = createContact(world, { age: 30 }); connectPerson(world, outsider.id);
  const offer = assetCatalog.find(item => item.id === 'rare-book')!;
  world = ack(resolveCommand(world, { type: 'buy-asset', catalogId: offer.id, financing: 'cash', depositBps: 10000, termMonths: 120, quotedPrice: assetPrice(world, offer) })); const bookId = world.assets.at(-1)!.id;
  world = ack(resolveCommand(world, { type: 'save-will', executorId: spouseId, shares: [{ personId: outsider.id, bps: 9000 }, { personId: firstId, bps: 1000 }], bequests: [{ assetId: bookId, personId: firstId }] }));
  const shares = estateShares(world, world.activePersonId); expect(shares.find(item => item.personId === spouseId)!.bps).toBe(2500);
  recordDeath(world, world.activePersonId, 'test fixture'); const estate = world.estates.at(-1)!;
  expect(estate.distributions.find(item => item.personId === firstId)!.assets).toContain(bookId);
  expect(world.assets.find(item => item.id === bookId)!.ownerId).toBe(firstId); expect(world.assets.find(item => item.id === bookId)!.ownershipSource).toBe('inheritance'); validateWorld(world);
});
test('debt and estate tax precede inheritance and insolvent debt is never charged to a child', () => {
  const { world, spouseId } = family(); const playerId = world.activePersonId;
  oweFamily(world, playerId, spouseId, accountFor(world).cash + 500000n, 'USD', 'settlement');
  recordDeath(world, playerId, 'test fixture'); const estate = world.estates.at(-1)!;
  expect(estate.distributions.every(item => item.cash.minor === 0n)).toBe(true); expect(estate.debtWrittenOff.minor).toBeGreaterThan(0n);
  expect(world.liabilities.filter(item => item.ownerId !== playerId && item.kind === 'settlement')).toHaveLength(0); validateWorld(world);
});
test('minor trust prevents a direct cash transfer and releases once on actual adulthood', () => {
  let { world, firstId, spouseId } = family(); recordDeath(world, world.activePersonId, 'test fixture');
  world = ack(resolveCommand(world, { type: 'continue-child', personId: firstId }));
  const account = accountFor(world); expect(availableCash(account)).toBe(0n);
  expect(() => post(world, -1n, 0n, 'gift', 'Attempted trust withdrawal')).toThrow(/trust/);
  world.date.year += 18;
  // Direct helper isolates the trust birthday boundary; no fabricated years of wages are involved.
  householdMonth(world); expect(accountFor(world).lockedCash).toBe(0n); const facts = world.journal.length; householdMonth(world); expect(world.journal.length).toBe(facts);
  expect(world.people[spouseId].died).toBeNull();
  validateWorld(world);
});
test('legacy preserves the existing child and the exact interrupted-year cursor without automatically advancing time', () => {
  let { world, firstId } = family(); const from = world.activePersonId, start = { ...world.date };
  world.annual = { id: 'year_partial', startDate: start, targetDate: { ...start, year: start.year + 1 }, monthsProcessed: 4, stage: 'months', pausedForPlanning: false };
  world.date = { ...start, month: start.month + 4 }; // v5 fixture observation is January.
  recordDeath(world, from, 'test fixture'); const atDeath = { ...world.date }, child = world.people[firstId], recorded = { ...child, stats: { ...child.stats } };
  world = resolveCommand(decodeWorld(encodeWorld(world)), { type: 'continue-child', personId: firstId });
  expect(world.date).toEqual(atDeath); expect(world.people[firstId]).toEqual(recorded); expect(world.annual?.monthsProcessed).toBe(4); expect(world.annual?.pausedForPlanning).toBe(true);
  world = ack(world); expect(world.date).toEqual(atDeath); expect(world.annual?.monthsProcessed).toBe(4);
  expect(() => resolveCommand(world, { type: 'advance' })).toThrow(/Finish/);
  world = resolveCommand(world, { type: 'resume' }); while (world.pending) { if (world.pending.kind === 'decision') world = resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: world.pending.choices[0].id }); else world = ack(world); }
  expect(world.date).toEqual({ ...start, year: start.year + 1 }); expect(world.generation).toBe(2); expect(world.legacies[0].toId).toBe(firstId); validateWorld(world);
});
test('an inheritance received during marriage is excluded from a later marital-gain settlement', () => {
  const { world, spouseId } = family(); const parent = world.relationships.find(item => item.roles.includes('parent') && item.to === world.activePersonId)!;
  const baseline = divorceQuote(world, spouseId).signed; recordDeath(world, parent.from, 'test fixture');
  expect(divorceQuote(world, spouseId).signed).toBe(baseline); expect(world.marriages.at(-1)!.excludedA).toBeGreaterThan(0n);
});
test('a fabricated or deceased child cannot be used to continue a life', () => {
  const { world, firstId } = family(); expect(() => resolveCommand(world, { type: 'continue-child', personId: firstId })).toThrow(/not ended/);
  recordDeath(world, world.activePersonId, 'test fixture'); expect(() => resolveCommand(world, { type: 'continue-child', personId: 'person_fake' })).toThrow(/existing living child/);
});
test('the genuine v6 interrupted birth save migrates and resumes without regenerating its child or pregnancy', () => {
  let world = decodeWorld(JSON.stringify(birthFixture)); expect(world.schemaVersion).toBe(48); expect(world.random).toEqual(birthFixture.random);
  const child = childrenOf(world)[0]; expect(world.annual?.monthsProcessed).toBe(9); expect(world.pending?.id).toBe(birthFixture.pending.id);
  world = ack(world); while (world.pending) { if (world.pending.kind === 'decision') world = resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: world.pending.choices[0].id }); else world = ack(world); }
  expect(childrenOf(world).map(item => item.id)).toEqual([child.id]); expect(world.pregnancies[0].childId).toBe(child.id); expect(world.annual).toBeNull();
});
test('a specific bequest that exceeds protected shares is liquidated and all heirs receive only their actual allocation', () => {
  let { world, spouseId, firstId } = family();
  const offer = assetCatalog.find(item => item.id === 'family-house') ?? assetCatalog.find(item => item.kind === 'property')!;
  world = ack(resolveCommand(world, { type: 'buy-asset', catalogId: offer.id, financing: 'cash', depositBps: 10000, termMonths: 120, quotedPrice: assetPrice(world, offer) })); const asset = world.assets.at(-1)!;
  const outsider = createContact(world, { age: 40 }); connectPerson(world, outsider.id);
  world = ack(resolveCommand(world, { type: 'save-will', executorId: spouseId, shares: [{ personId: outsider.id, bps: 9999 }, { personId: firstId, bps: 1 }], bequests: [{ assetId: asset.id, personId: firstId }] }));
  // Restrict the liquid estate while preserving a fully reconciled ledger.
  post(world, -accountFor(world).cash, 0n, 'fixture-spending', 'Test estate without liquid reserves');
  recordDeath(world, world.activePersonId, 'test fixture');
  expect(world.assets.find(item => item.id === asset.id)!.ownerId).toBeNull(); expect(world.estates.at(-1)!.notes.some(note => note.includes('liquidation'))).toBe(true); validateWorld(world);
});
test('a three-generation journey keeps the same people, school history, calendar and estate identities', () => {
  let world = decodeWorld(JSON.stringify(birthFixture)); const parentId = world.activePersonId, firstId = childrenOf(world)[0].id;
  recordDeath(world, parentId, 'test fixture'); world = ack(resolveCommand(world, { type: 'continue-child', personId: firstId }));
  const finish = () => { let guard = 0; while ((world.pending || world.annual) && guard++ < 100) { if (world.pending?.kind === 'decision') world = resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: world.pending.choices[0].id }); else if (world.pending) world = ack(world); else world = resolveCommand(world, { type: 'resume' }); } };
  finish(); while (ageOn(world.people[firstId], world.date) < 23) { world = resolveCommand(world, { type: 'advance' }); finish(); }
  expect(world.people[firstId].education.qualifications.some(item => item.level === 'secondary')).toBe(true);
  // A new generation is born to actual existing parents; the earlier courtship journey is tested separately.
  const other = createContact(world, { age: 25 }); const grandchild = addChild(world, [world.people[firstId], other], 'biological'), born = { ...grandchild.born };
  const recordedSchool = { ...world.people[firstId].education }; recordDeath(world, firstId, 'test fixture'); const date = { ...world.date };
  world = ack(resolveCommand(decodeWorld(encodeWorld(world)), { type: 'continue-child', personId: grandchild.id }));
  expect(world.generation).toBe(3); expect(world.date).toEqual(date); expect(world.people[grandchild.id].born).toEqual(born); expect(world.people[firstId].education).toEqual(recordedSchool);
  expect(world.legacies.map(item => item.fromId)).toEqual([parentId, firstId]); expect(world.estates.filter(item => item.personId === parentId || item.personId === firstId)).toHaveLength(2); validateWorld(world);
}, 30000);
test.each(countryCodes)('%s settles actual NPC family savings once in the local currency', code => {
  const world = createLife('life_estate_' + code, 12, { ...randomCreation(12), country: code, city: countries[code].cities[0] }, { year: 2026, month: 10, day: 18 });
  const parentId = world.relationships.find(item => item.roles.includes('parent') && item.to === world.activePersonId)!.from;
  const before = netWorth(world, parentId).minor; recordDeath(world, parentId, 'test fixture'); const estate = world.estates.find(item => item.personId === parentId)!;
  expect(estate.distributions.reduce((sum, item) => sum + item.cash.minor + item.assetValue.minor, 0n) + estate.tax.minor).toBe(before);
  expect(accountFor(world, world.people[parentId]).cash).toBe(0n); expect(accountFor(world).lockedCash).toBeGreaterThan(0n); validateWorld(world);
});
test('an estate assigns an unpaid receivable to an external buyer without cloning cash or forgiving its debtor', () => {
  const { world, spouseId } = family(), playerId = world.activePersonId, spouse = world.people[spouseId];
  post(world, -accountFor(world, spouse).cash, 0n, 'fixture-spending', 'Test debtor without cash', null, spouse);
  oweFamily(world, spouseId, playerId, 100000n, 'USD', 'settlement'); const before = netWorth(world).minor;
  recordDeath(world, playerId, 'test fixture'); const claim = world.liabilities.find(item => item.ownerId === spouseId && item.kind === 'personal')!;
  expect(claim.principal).toBe(100000n); expect(claim.creditorId).toBeNull();
  const estate = world.estates.at(-1)!; expect(estate.fees.minor).toBe(5000n);
  expect(estate.distributions.reduce((sum, item) => sum + item.cash.minor, 0n) + estate.tax.minor + estate.fees.minor).toBe(before); validateWorld(world);
});
test('a mortgage is settled before a minor inherits the family home and its trust can cover necessary upkeep', () => {
  let { world, spouseId, firstId } = family(); const offer = assetCatalog.find(item => item.id === 'studio')!;
  world = ack(resolveCommand(world, { type: 'buy-asset', catalogId: offer.id, financing: 'mortgage', depositBps: 2000, termMonths: 360, quotedPrice: assetPrice(world, offer) })); const assetId = world.assets.at(-1)!.id;
  world = ack(resolveCommand(world, { type: 'save-will', executorId: spouseId, shares: [{ personId: firstId, bps: 10000 }], bequests: [{ assetId, personId: firstId }] }));
  recordDeath(world, world.activePersonId, 'test fixture'); const estate = world.estates.at(-1)!, home = world.assets.find(item => item.id === assetId)!;
  expect(home.ownerId).toBe(firstId); expect(home.mortgageId).toBeNull(); expect(estate.debtPaid.minor).toBeGreaterThan(0n); expect(home.primaryHome).toBe(true);
  const child = world.people[firstId], account = accountFor(world, child), before = account.cash, locked = account.lockedCash, cost = monthlyUpkeep(home);
  expect(cost).toBeGreaterThan(0n); assetsMonth(world, child, 0); expect(account.cash).toBe(before - cost); expect(account.lockedCash).toBe(locked - cost); validateWorld(world);
});
