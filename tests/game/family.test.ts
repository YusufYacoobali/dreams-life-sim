import { decodeWorld, encodeWorld, validateWorld, World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { accountFor, post } from '../../src/game/systems/common';
import { addChild, careAfterDeath, childrenOf, conceptionReason, divorceQuote, familyFinanceMonth, oweFamily } from '../../src/game/systems/family';
import { connectPerson, recordFamilyDeath, relationFor, weddingBudgets } from '../../src/game/systems/relationships';
import { createContact } from '../../src/game/systems/npcs';
import { endEmployment } from '../../src/game/systems/work';
import { netWorth } from '../../src/game/valuation';
import graduateFixture from '../fixtures/v3-employed-graduate.json';
import marriageFixture from '../fixtures/v5-marriage-result.json';
import { createLife, randomCreation } from '../../src/game/createLife';
import { countries, countryCodes } from '../../src/game/countries';
import { hireNpc } from '../../src/game/systems/npcs';
import { rules } from '../../src/game/rules';

function acknowledge(world: World) {
  if (world.pending?.kind !== 'result') throw new Error('Expected a result');
  return resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
}
function married() {
  let world = decodeWorld(JSON.stringify(graduateFixture)); const player = world.people[world.activePersonId];
  const account = accountFor(world); account.cash += 100000000n; account.openingCash += 100000000n;
  player.biology.role = 'contribute'; player.stats.health = 100;
  const spouse = createContact(world, { age: 24, gender: 'female', compatibleWith: player.gender }); spouse.wantsChildren = true; spouse.stats.health = 100; spouse.biology.fertility = 100; player.biology.fertility = 100;
  connectPerson(world, spouse.id); const relation = relationFor(world, player.id, spouse.id)!;
  relation.kind = 'partner'; relation.roles.push('partner'); relation.romance = 'engaged'; relation.strength = 90; relation.trust = 90;
  world = acknowledge(resolveCommand(world, { type: 'marry', personId: spouse.id, budget: weddingBudgets(world)[0].amount }));
  return { world, spouseId: spouse.id };
}
function finish(world: World) {
  let guard = 0;
  while ((world.pending || world.annual) && guard++ < 100) {
    if (world.pending?.kind === 'decision') world = resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: world.pending.choices[0].id });
    else if (world.pending) world = acknowledge(world); else world = resolveCommand(world, { type: 'resume' });
  }
  return world;
}
test('a genuine v5 marriage result migrates without changing accounts, ring, household, decisions or streams', () => {
  const migrated = decodeWorld(JSON.stringify(marriageFixture)); expect(migrated.schemaVersion).toBe(6);
  expect(migrated.random).toEqual(marriageFixture.random); expect(migrated.pending?.id).toBe(marriageFixture.pending.id);
  expect(migrated.pregnancies).toEqual([]); expect(migrated.custody).toEqual([]);
  const acknowledged = acknowledge(migrated); expect(acknowledged.assets).toEqual(migrated.assets); expect(acknowledged.accounts).toEqual(migrated.accounts); expect(acknowledged.marriages).toEqual(migrated.marriages);
});
test('conception waits nine actual months, interrupts with the same newborn, and resumes without a second birth', () => {
  let { world, spouseId } = married();
  world.random.outcomes = 1;
  world = acknowledge(resolveCommand(world, { type: 'try-child' }));
  expect(world.pregnancies[0].status).toBe('pregnant');
  expect(() => resolveCommand(world, { type: 'try-child' })).toThrow(/pregnancy/);
  const start = { ...world.date }; world = resolveCommand(world, { type: 'advance' });
  expect(world.annual?.monthsProcessed).toBe(9); expect(world.pending?.kind).toBe('result');
  const child = childrenOf(world)[0]; expect(child.born.year * 12 + child.born.month - (start.year * 12 + start.month)).toBe(9);
  expect(childrenOf(world, spouseId).map(person => person.id)).toContain(child.id);
  expect(child.appearance.face === world.people[world.activePersonId].appearance.face || child.appearance.face === world.people[spouseId].appearance.face).toBe(true);
  const saved = decodeWorld(encodeWorld(world)); world = finish(saved);
  expect(childrenOf(world).map(person => person.id)).toEqual([child.id]); expect(world.date.year).toBe(start.year + 1);
});
test('adoption records the same child, both adoptive parents, real fee and current household', () => {
  let { world, spouseId } = married(); const before = accountFor(world).cash;
  world = acknowledge(resolveCommand(world, { type: 'adopt', age: 4 })); const child = childrenOf(world)[0];
  expect(accountFor(world).cash).toBeLessThan(before); expect(child.householdId).toBe(world.people[world.activePersonId].householdId);
  expect(world.relationships.filter(item => item.to === child.id && item.parentType === 'adoptive').map(item => item.from).sort()).toEqual([world.activePersonId, spouseId].sort());
  world = acknowledge(resolveCommand(world, { type: 'name-child', childId: child.id, firstName: 'Maya' }));
  expect(world.people[child.id].firstName).toBe('Maya'); expect(decodeWorld(encodeWorld(world))).toEqual(world);
  expect(() => resolveCommand(world, { type: 'adopt', age: 3 })).toThrow(/already tried/);
});
test('mutual family intentions and reproductive capacity gate conception', () => {
  const { world, spouseId } = married(), player = world.people[world.activePersonId], spouse = world.people[spouseId];
  spouse.wantsChildren = false; expect(() => resolveCommand(world, { type: 'try-child' })).toThrow(/Both partners/);
  spouse.wantsChildren = true; player.biology.role = 'carry'; expect(conceptionReason(world, player, spouse)).toMatch(/capacities/);
});
test('divorce equalises actual marital gains, preserves starting wealth and records custody', () => {
  let { world, spouseId } = married(); const child = addChild(world, [world.people[world.activePersonId], world.people[spouseId]], 'biological');
  post(world, 1000000n, 0n, 'fixture-income', 'Test marital earnings');
  const before = netWorth(world).minor + netWorth(world, spouseId).minor, quote = divorceQuote(world, spouseId);
  expect(quote.signed).toBe(500000n);
  world = acknowledge(resolveCommand(world, { type: 'divorce', personId: spouseId, custody: 'shared', quotedPayment: quote.signed }));
  expect(netWorth(world).minor + netWorth(world, spouseId).minor).toBe(before);
  expect(world.marriages.at(-1)!.endReason).toBe('divorce'); expect(world.custody[0].childId).toBe(child.id);
  expect(world.custody[0].arrangement).toBe('shared'); expect(world.people[child.id].householdId).toBe(world.people[world.activePersonId].householdId);
  const payerCash = accountFor(world, world.people[spouseId]).cash, receiverCash = accountFor(world).cash;
  familyFinanceMonth(world); expect(accountFor(world, world.people[spouseId]).cash).toBeLessThan(payerCash); expect(accountFor(world).cash).toBeGreaterThan(receiverCash);
  validateWorld(world);
});
test('an unaffordable settlement becomes a conserved receivable and a later repayment transfers cash once', () => {
  let { world, spouseId } = married(); const player = world.people[world.activePersonId], spouse = world.people[spouseId];
  const cash = accountFor(world).cash; post(world, -cash, 0n, 'fixture-spending', 'Test exhausted cash');
  const total = netWorth(world).minor + netWorth(world, spouseId).minor; const receiver = accountFor(world, spouse).cash;
  oweFamily(world, player.id, spouse.id, 50000n, 'USD', 'settlement');
  expect(accountFor(world, spouse).cash).toBe(receiver); expect(netWorth(world).minor + netWorth(world, spouseId).minor).toBe(total);
  const debt = world.liabilities.find(item => item.creditorId === spouseId)!; post(world, 20000n, 0n, 'fixture-income', 'Test later income');
  world = acknowledge(resolveCommand(world, { type: 'repay', liabilityId: debt.id, amount: 15000n }));
  expect(world.liabilities.find(item => item.id === debt.id)!.principal).toBe(35000n);
  expect(accountFor(world, world.people[spouseId]).cash).toBe(receiver + 15000n); expect(accountFor(world).cash).toBe(5000n);
});
test('an orphan joins a real guardian household without replacing the child identity', () => {
  const { world, spouseId } = married(); const child = addChild(world, [world.people[world.activePersonId], world.people[spouseId]], 'biological');
  for (const person of Object.values(world.people).filter(person => person.id !== child.id)) { person.died = { ...world.date }; person.causeOfDeath = 'test fixture'; recordFamilyDeath(world, person.id); endEmployment(world, person.id); }
  careAfterDeath(world, world.activePersonId); const guardian = world.relationships.find(item => item.to === child.id && item.kind === 'guardian')!;
  expect(guardian).toBeDefined(); expect(world.people[child.id]).toBe(child); expect(world.people[guardian.from].died).toBeNull(); expect(child.householdId).toBe(world.people[guardian.from].householdId);
  validateWorld(world);
});
test('a child born after divorce receives a recorded primary home and support arrangement', () => {
  let { world, spouseId } = married(); world.random.outcomes = 1;
  world = acknowledge(resolveCommand(world, { type: 'try-child' })); const quote = divorceQuote(world, spouseId);
  world = acknowledge(resolveCommand(world, { type: 'divorce', personId: spouseId, custody: 'shared', quotedPayment: quote.signed }));
  world = resolveCommand(world, { type: 'advance' }); const child = childrenOf(world)[0];
  expect(child).toBeDefined(); expect(world.custody.find(item => item.childId === child.id && !item.ended)?.primaryId).toBe(spouseId);
  expect(child.householdId).toBe(world.people[spouseId].householdId); world = finish(world); validateWorld(world);
});
test.each(countryCodes)('%s marriage, children and divorce conserve recorded wealth in the local currency', code => {
  let world = createLife('life_family_' + code, 12, { ...randomCreation(12), country: code, city: countries[code].cities[0] }, { year: 2026, month: 1, day: 18 });
  const player = world.people[world.activePersonId]; player.born.year = 2000;
  world.people = { [player.id]: player }; world.relationships = []; world.marriages = []; world.workHistory = [];
  world.accounts = world.accounts.filter(item => item.ownerId === player.id); world.households[0].members = [player.id];
  world.birthAcknowledged = true; player.stats.smarts = 90; hireNpc(world, player);
  const cash = rules[code].baseWage * 10n; accountFor(world).cash = cash; accountFor(world).openingCash = cash;
  const spouse = createContact(world, { age: 24, gender: 'female', compatibleWith: player.gender }); connectPerson(world, spouse.id);
  const relation = relationFor(world, player.id, spouse.id)!; relation.kind = 'partner'; relation.roles.push('partner'); relation.romance = 'engaged';
  world = acknowledge(resolveCommand(world, { type: 'marry', personId: spouse.id, budget: weddingBudgets(world)[0].amount }));
  addChild(world, [world.people[player.id], world.people[spouse.id]], 'biological');
  post(world, rules[code].baseWage, 0n, 'fixture-income', 'Test marital earnings'); const quote = divorceQuote(world, spouse.id);
  expect(quote.signed).toBe(rules[code].baseWage / 2n);
  const before = netWorth(world).minor + netWorth(world, spouse.id).minor;
  world = acknowledge(resolveCommand(world, { type: 'divorce', personId: spouse.id, custody: 'shared', quotedPayment: quote.signed }));
  expect(netWorth(world).minor + netWorth(world, spouse.id).minor).toBe(before); validateWorld(world);
});
