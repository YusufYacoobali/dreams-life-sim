import { compareDates, decodeWorld, encodeWorld, fullName, validateWorld, type World } from '../../src/game/model';
import { monthFrom } from '../../src/game/calendar';
import { recordDeath, resolveCommand } from '../../src/game/engine';
import { accountFor, post } from '../../src/game/systems/common';
import * as common from '../../src/game/systems/common';
import { npcCourtshipsYear, npcCourtshipLimits, npcWeddingQuote } from '../../src/game/systems/npcCourtships';
import { npcWeddingChance } from '../../src/game/systems/npcCourtshipSchemas';
import { connectPerson, relationFor, weddingBudgets } from '../../src/game/systems/relationships';
import { familyMonth, familyYear, addChild, childrenOf } from '../../src/game/systems/family';
import { settleEstate } from '../../src/game/systems/estates';
import { settleBackground } from '../../src/game/systems/npcBudget';
import { netWorth } from '../../src/game/valuation';
import { randomInteger } from '../../src/game/random';
import { createContact } from '../../src/game/systems/npcs';
import { npcFamilyCircle, npcWeddingJourney } from '../support/npcCourtships';
import legacyMarriage from '../fixtures/v5-marriage-result.json';

function accepted(world: World) { return world.npcCourtships.find(row => row.marriageId)!; }
/** Controlled helper-boundary setups below explicitly change calendar/RNG, unlike the annual journey. */
function ready() {
  const world = npcWeddingJourney().before, row = world.npcCourtships.find(row => !row.ended && !row.marriageId)!;
  const maturity = monthFrom(row.observedSince, 24, row.observedSince.day); if (compareDates(maturity, world.date) > 0) world.date = maturity;
  // Use a new helper-test year, so naturally recorded earlier declines remain
  // truthful and their existing once-year guard is never erased.
  world.date = monthFrom(world.date, 12, world.date.day);
  world.annual = null; world.pending = null; world.deferred = [];
  delete world.actionCounts['npc-courtships:' + world.date.year];
  for (const id of [row.a, row.b]) { const person = world.people[id]; settleBackground(world, person, world.date.year * 12 + world.date.month - 1); }
  for (let seed = 1; seed < 10000; seed++) { const a = randomInteger(seed, 1, 100), b = randomInteger(a.state, 1, 100); if (a.value <= npcWeddingChance(relationFor(world, row.a, row.b)!.trust) && b.value <= npcWeddingChance(relationFor(world, row.a, row.b)!.trust)) { world.random.npcs = seed; break; } }
  return { world, row, a: world.people[row.a], b: world.people[row.b] };
}

test('ordinary annual dating waits for its exact recorded clock, then a mutual paid wedding retains identities, ownership and after-fee baselines', () => {
  const { before, command, after } = npcWeddingJourney(), row = accepted(after), proposal = row.proposals.at(-1)!, marriage = after.marriages.find(item => item.id === row.marriageId)!;
  expect(row.observedSince.year).toBeGreaterThanOrEqual(npcFamilyCircle().date.year);
  expect(proposal.date.year * 12 + proposal.date.month - row.observedSince.year * 12 - row.observedSince.month).toBeGreaterThanOrEqual(24);
  expect(proposal.accepted).toBe(true); expect(proposal.rollA <= proposal.chance && proposal.rollB <= proposal.chance).toBe(true);
  expect(after.people[row.a].householdId).toBe(after.people[row.b].householdId);
  expect(after.activePersonId).toBe(before.activePersonId); expect(Object.keys(after.people)).toEqual(Object.keys(before.people));
  expect(after.assets.map(asset => [asset.id, asset.ownerId])).toEqual(before.assets.map(asset => [asset.id, asset.ownerId]));
  expect(marriage.baselineA.minor).toBe(proposal.wealthA.minor - proposal.shareA); expect(marriage.baselineB.minor).toBe(proposal.wealthB.minor - proposal.shareB);
  expect(proposal.shareA + proposal.shareB).toBe(proposal.fee);
  expect(after.ledger.filter(txn => [proposal.paymentAId, proposal.paymentBId].includes(txn.id)).map(txn => [txn.personId, txn.cashDelta, txn.debtDelta])).toEqual([[row.a, -proposal.shareA, 0n], [row.b, -proposal.shareB, 0n]]);
  expect(after.journal.filter(item => item.text === fullName(after.people[row.a]) + ' and ' + fullName(after.people[row.b]) + ' married after paying for their ceremony together.')).toHaveLength(1);
  expect(after.pregnancies.filter(item => [row.a, row.b].includes(item.carrierId) && item.conceived.year === proposal.date.year)).toHaveLength(0);
  expect(resolveCommand(before, command, true)).toEqual(after); expect(decodeWorld(encodeWorld(after))).toEqual(after); validateWorld(after);
}, 30000);

test('old dating memories and friendship dates never backdate the new clock; 23 actual months cannot marry', () => {
  const { world, row } = ready(); world.npcCourtships = []; const relation = relationFor(world, row.a, row.b)!; relation.memories.push('npc-dating:1900');
  const start = { ...world.date }, random = { ...world.random }, money = world.ledger.length;
  npcCourtshipsYear(world); const observed = world.npcCourtships.find(item => item.relationshipId === relation.id)!;
  expect(observed.observedSince).toEqual(start); expect(observed.proposals).toHaveLength(0); expect(world.ledger).toHaveLength(money); expect(world.random).toEqual(random);
  world.date = monthFrom(start, 23, start.day); delete world.actionCounts['npc-courtships:' + world.date.year]; npcCourtshipsYear(world);
  expect(observed.proposals).toHaveLength(0); expect(observed.marriageId).toBeNull();
});

test('quotes are read-only and wedding price is the same actual country minimum without touching the active account', () => {
  const { world, a, b } = ready(), snapshot = encodeWorld(world), player = accountFor(world).cash;
  const quote = npcWeddingQuote(world, a, b); expect(quote.fee).toBe(weddingBudgets(world, a)[0].amount); expect(encodeWorld(world)).toBe(snapshot);
  const draw = jest.spyOn(common, 'draw'); try { npcCourtshipsYear(world); expect(draw.mock.calls.every(call => call[1] === 'npcs')).toBe(true); expect(draw.mock.calls).toHaveLength(2); } finally { draw.mockRestore(); }
  expect(accountFor(world).cash).toBe(player); validateWorld(world);
});

test.each(['insufficient', 'locked'] as const)('%s own cash cannot be replaced with player money or debt, and takes no consent draws', mode => {
  const { world, row, a } = ready(), account = accountFor(world, a), quote = npcWeddingQuote(world, a, world.people[row.b]);
  if (mode === 'insufficient') post(world, -(account.cash - quote.shareA + 1n), 0n, 'test-spending', 'Explicit insufficient funds setup', null, a); else account.lockedCash = account.cash;
  const random = { ...world.random }, ledger = world.ledger.length, liabilities = structuredClone(world.liabilities), player = accountFor(world).cash;
  npcCourtshipsYear(world); expect(row.marriageId).toBeNull(); expect(world.random).toEqual(random); expect(world.ledger).toHaveLength(ledger); expect(world.liabilities).toEqual(liabilities); expect(accountFor(world).cash).toBe(player);
});

test('one partner declining records the real two rolls without charges and cannot reroll in the same year', () => {
  const { world, row } = ready(), chance = npcWeddingChance(relationFor(world, row.a, row.b)!.trust);
  for (let seed = 1; seed < 10000; seed++) { const a = randomInteger(seed, 1, 100), b = randomInteger(a.state, 1, 100); if (a.value <= chance && b.value > chance) { world.random.npcs = seed; break; } }
  const ledger = world.ledger.length; npcCourtshipsYear(world); const proposal = row.proposals.at(-1)!;
  expect(proposal.rollA).toBeLessThanOrEqual(chance); expect(proposal.rollB).toBeGreaterThan(chance); expect(proposal.accepted).toBe(false); expect(proposal.paymentAId).toBeNull(); expect(world.ledger).toHaveLength(ledger);
  const saved = encodeWorld(world); npcCourtshipsYear(world); expect(encodeWorld(world)).toBe(saved); validateWorld(world);
});

test.each(['active', 'partner', 'relative', 'orientation', 'away', 'wanted', 'dependent'] as const)('%s cannot be bypassed by an old clock or enough wedding cash', trap => {
  const { world, row, a, b } = ready(), relation = relationFor(world, a.id, b.id)!;
  if (trap === 'active') world.activePersonId = a.id;
  if (trap === 'partner') { const playerBond = relationFor(world, world.activePersonId, a.id)!; playerBond.romance = 'dating'; playerBond.roles.push('partner'); }
  if (trap === 'relative') relation.roles.push('sibling');
  if (trap === 'orientation') a.attractedTo = [(['male', 'female', 'nonbinary'] as const).find(gender => gender !== b.gender)!];
  if (trap === 'away') b.city += ' elsewhere';
  if (trap === 'wanted') a.legal.wanted = true;
  if (trap === 'dependent') addChild(world, [a], 'adoptive', 3);
  const ledger = world.ledger.length, random = { ...world.random }; npcCourtshipsYear(world); expect(row.marriageId).toBeNull(); expect(world.ledger).toHaveLength(ledger); expect(world.random).toEqual(random);
});

test('separation ends the exact observed clock; a later reunion begins a new clock', () => {
  const { world, row } = ready(), relation = relationFor(world, row.a, row.b)!; relation.romance = 'ex';
  npcCourtshipsYear(world); expect(row.endReason).toBe('separated'); const first = row.id;
  world.date = monthFrom(world.date, 12, world.date.day); relation.romance = 'dating'; npcCourtshipsYear(world);
  const next = world.npcCourtships.find(item => item.relationshipId === relation.id && !item.ended)!;
  expect(next.id).not.toBe(first); expect(next.observedSince).toEqual(world.date); expect(next.proposals).toHaveLength(0); validateWorld(world);
});

test('a real NPC marriage participates in spouse inheritance and death settlement remains exactly once', () => {
  const { world, row, a, b } = ready(); npcCourtshipsYear(world); expect(row.marriageId).not.toBeNull();
  const before = accountFor(world, b).cash; recordDeath(world, a.id, 'Explicit estate boundary');
  const estate = world.estates.find(item => item.personId === a.id)!;
  expect(estate.distributions.some(item => item.personId === b.id && item.cash.minor > 0n)).toBe(true); expect(accountFor(world, b).cash).toBeGreaterThan(before);
  const saved = encodeWorld(world); settleEstate(world, a.id); recordDeath(world, a.id, 'Duplicate boundary'); expect(encodeWorld(world)).toBe(saved); validateWorld(world);
});

test('a later real family pregnancy respects the wedding year, exact nine-month due date and one actual child', () => {
  const { world, row, a, b } = ready(); npcCourtshipsYear(world); expect(row.marriageId).not.toBeNull();
  const pregnancyCount = world.pregnancies.length; familyYear(world); expect(world.pregnancies).toHaveLength(pregnancyCount);
  world.date = monthFrom(world.date, 12, world.date.day);
  for (let seed = 1; seed < 10000; seed++) if (randomInteger(seed, 1, 100).value <= 8) { world.random.npcs = seed; break; }
  familyYear(world); const pregnancy = world.pregnancies.find(item => [a.id, b.id].includes(item.carrierId) && [a.id, b.id].includes(item.otherParentId))!;
  expect(pregnancy).toBeDefined(); expect(pregnancy.due).toEqual(monthFrom(world.date, 9, world.date.day)); expect(pregnancy.childId).toBeNull();
  const count = Object.keys(world.people).length; familyYear(world); expect(world.pregnancies.filter(item => item.id === pregnancy.id)).toHaveLength(1);
  world.date = monthFrom(pregnancy.conceived, 8, pregnancy.conceived.day); familyMonth(world); expect(pregnancy.childId).toBeNull(); expect(Object.keys(world.people)).toHaveLength(count);
  world.date = { ...pregnancy.due }; familyMonth(world); const childId = pregnancy.childId!; expect(world.people[childId]).toBeDefined(); expect(childrenOf(world, a.id).map(child => child.id)).toContain(childId); expect(childrenOf(world, b.id).map(child => child.id)).toContain(childId);
  familyMonth(world); expect(Object.keys(world.people)).toHaveLength(count + 1); validateWorld(world);
});

test.each(['consent', 'payer', 'amount', 'baseline', 'missing-proof', 'orphan-payment', 'early-clock'] as const)('validation rejects %s tampering without accepting another identity or phantom payment', trap => {
  const { after: world } = npcWeddingJourney(), row = accepted(world), proposal = row.proposals.at(-1)!, marriage = world.marriages.find(item => item.id === row.marriageId)!;
  if (trap === 'consent') proposal.rollB = 100;
  if (trap === 'payer') proposal.paymentBId = proposal.paymentAId;
  if (trap === 'amount') proposal.shareB += 1n;
  if (trap === 'baseline') marriage.baselineA.minor += 1n;
  if (trap === 'missing-proof') world.npcCourtships = [];
  if (trap === 'orphan-payment') proposal.paymentBId = world.ledger.find(txn => txn.category !== 'npc-wedding')!.id;
  if (trap === 'early-clock') row.observedSince = monthFrom(proposal.date, -23, proposal.date.day);
  expect(() => validateWorld(world)).toThrow();
});

test('a thousand actual existing couples inspect at most twelve clocks and never generate people or upfront cash', () => {
  const world = npcFamilyCircle();
  // Explicit synthetic scale setup; not a natural population claim.
  for (let index = 0; index < 1000; index++) { const a = createContact(world, { age: 30 }), b = createContact(world, { age: 30 }); connectPerson(world, a.id); connectPerson(world, b.id); connectPerson(world, b.id, a.id); const relation = relationFor(world, a.id, b.id)!; relation.romance = 'dating'; relation.roles.push('partner'); relation.kind = 'partner'; }
  delete world.actionCounts['npc-courtships:' + world.date.year]; const people = Object.keys(world.people), ledger = world.ledger.length, random = { ...world.random }; npcCourtshipsYear(world);
  expect(world.npcCourtships.length).toBeLessThanOrEqual(npcCourtshipLimits.couples); expect(Object.keys(world.people)).toEqual(people); expect(world.ledger).toHaveLength(ledger); expect(world.random).toEqual(random);
});

test('old genuine player marriage keeps its exact stored fee, baselines, IDs and bound result while only empty NPC history is added', () => {
  const world = decodeWorld(JSON.stringify(legacyMarriage)); expect(JSON.parse(encodeWorld(world)).marriages).toEqual(legacyMarriage.marriages.map(item => ({ ...item, excludedA: { $dreamsBigInt: '0' }, excludedB: { $dreamsBigInt: '0' } })));
  expect(world.pending).toEqual(legacyMarriage.pending); expect(world.npcCourtships).toEqual([]); expect(world.random).toEqual(legacyMarriage.random);
});

test('the existing player wedding command still charges only its reviewed budget and creates its original ID, baseline and result shape', () => {
  let world = decodeWorld(JSON.stringify(legacyMarriage)); world = resolveCommand(world, { type: 'acknowledge', resultId: world.pending!.id });
  // Explicit engaged-boundary setup using the same genuine people; no fixture changes.
  const previous = world.marriages.pop()!, target = world.people[previous.b], player = world.people[world.activePersonId], relation = relationFor(world, player.id, target.id)!;
  relation.romance = 'engaged'; relation.kind = 'partner'; relation.roles = relation.roles.filter(role => role !== 'spouse'); relation.roles.push('partner');
  const budget = weddingBudgets(world)[0].amount, balance = accountFor(world).cash, otherBalance = accountFor(world, target).cash, worthA = netWorth(world).minor, worthB = netWorth(world, target.id).minor, cursor = world.ledger.length, revision = world.revision;
  const result = resolveCommand(world, { type: 'marry', personId: target.id, budget }), marriage = result.marriages.at(-1)!;
  expect(accountFor(result).cash).toBe(balance - budget); expect(accountFor(result, result.people[target.id]).cash).toBe(otherBalance);
  expect(marriage.id).toBe('marriage_' + revision); expect(marriage.baselineA.minor).toBe(worthA - budget); expect(marriage.baselineB.minor).toBe(worthB); expect(marriage.ledgerStart).toBe(cursor + 1);
  expect(result.ledger.at(-1)).toMatchObject({ category: 'wedding', personId: player.id, cashDelta: -budget }); expect(result.npcCourtships).toEqual([]);
  expect(result.pending).toMatchObject({ kind: 'result', title: 'You’re married', illustration: 'rings', body: 'Your marriage and ceremony payment are recorded. You now share a household while retaining your own accounts and legal ownership.' }); validateWorld(result);
});
