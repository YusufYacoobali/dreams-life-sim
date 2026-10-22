import { decodeWorld, encodeWorld, validateWorld, World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { accountFor } from '../../src/game/systems/common';
import { connectPerson, closeFamily, dateBudget, relationFor, weddingBudgets } from '../../src/game/systems/relationships';
import { householdLivingCost } from '../../src/game/systems/households';
import { workMonth } from '../../src/game/systems/work';
import { settleBackground } from '../../src/game/systems/npcBudget';
import { createLife, randomCreation } from '../../src/game/createLife';
import graduateFixture from '../fixtures/v3-employed-graduate.json';
import offerFixture from '../fixtures/v4-property-offer.json';

function fixture(): World {
  const world = decodeWorld(JSON.stringify(graduateFixture)); const account = accountFor(world); account.cash += 100000000n; account.openingCash += 100000000n; return world;
}
function acknowledge(world: World): World {
  if (world.pending?.kind !== 'result') throw new Error('Expected a result');
  return resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
}
function meet(world: World) {
  world = resolveCommand(world, { type: 'meet-people', purpose: 'dating', gender: 'female' });
  if (world.pending?.kind !== 'decision') throw new Error('Expected introductions');
  const id = world.pending.choices[0].id;
  world = acknowledge(resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: id }));
  return { world, id };
}

test('v4 property-offer migration preserves its exact bound choice and finances through social-model expansion', () => {
  const world = decodeWorld(JSON.stringify(offerFixture));
  expect(world.schemaVersion).toBe(42); expect(world.random).toEqual(offerFixture.random);
  expect(world.pending?.id).toBe(offerFixture.pending.id);
  expect(world.annual?.monthsProcessed).toBe(2);
  const replay = decodeWorld(encodeWorld(world)); expect(replay).toEqual(world);
  if (world.pending?.kind !== 'decision') throw new Error('Expected an offer');
  const sold = resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: 'accept' });
  expect(sold.assets[0].ownerId).toBeNull(); expect(sold.holdings).toEqual(world.holdings);
});

test('introductions create persistent eligible people and remember the chosen identity after a reload', () => {
  const { world, id } = meet(fixture()); const person = world.people[id];
  expect(person.gender).toBe('female'); expect(person.attractedTo).toContain(world.people[world.activePersonId].gender);
  expect(relationFor(world, world.activePersonId, id)?.romance).toBe('none');
  expect(decodeWorld(encodeWorld(world)).people[id]).toEqual(person);
  expect(() => resolveCommand(world, { type: 'meet-people', purpose: 'dating', gender: 'female' })).toThrow(/already tried/);
});

test('money gifts debit and credit real accounts once, and repeated social actions cannot be farmed', () => {
  let { world, id } = meet(fixture()); const giver = accountFor(world).cash; const receiver = accountFor(world, world.people[id]).cash;
  world = acknowledge(resolveCommand(world, { type: 'gift-money', personId: id, amount: 5000n }));
  expect(accountFor(world).cash).toBe(giver - 5000n); expect(accountFor(world, world.people[id]).cash).toBe(receiver + 5000n);
  expect(() => resolveCommand(world, { type: 'gift-money', personId: id, amount: 5000n })).toThrow(/already tried/);
  world = acknowledge(resolveCommand(world, { type: 'interact', personId: id, action: 'talk' }));
  expect(() => resolveCommand(world, { type: 'interact', personId: id, action: 'talk' })).toThrow(/already tried/);
  validateWorld(world);
});

test('direct dating commands reject close family and minors before spending anything', () => {
  const world = fixture(); const parent = world.relationships.find(relation => relation.kind === 'parent' && relation.to === world.activePersonId)!;
  expect(closeFamily(world, world.activePersonId, parent.from)).toBe(true);
  expect(() => resolveCommand(world, { type: 'ask-date', personId: parent.from })).toThrow(/relative/);
  const baby = createLife('life_baby', 2, randomCreation(2), { year: 2026, month: 1, day: 1 }); baby.birthAcknowledged = true;
  expect(() => resolveCommand(baby, { type: 'meet-people', purpose: 'dating', gender: 'any' })).toThrow(/adults/);
});

test('proposal transfers an actual ring only on acceptance, and marriage creates one shared household', () => {
  let { world, id } = meet(fixture()); let relation = relationFor(world, world.activePersonId, id)!;
  // Isolate commitment and ownership from the separately tested courtship pacing.
  relation.romance = 'dating'; relation.kind = 'partner'; relation.roles.push('partner'); relation.strength = 100; relation.trust = 100;
  let attempts = 0;
  while (relation.romance !== 'engaged' && attempts++ < 5) {
    world = acknowledge(resolveCommand(world, { type: 'propose', personId: id }));
    relation = relationFor(world, world.activePersonId, id)!;
    if (relation.romance !== 'engaged') world.date.year++;
  }
  expect(relation.romance).toBe('engaged');
  expect(world.assets.find(asset => asset.catalogId === 'engagement-ring')?.ownerId).toBe(id);
  const cash = accountFor(world).cash; const budget = weddingBudgets(world)[0].amount;
  world = acknowledge(resolveCommand(world, { type: 'marry', personId: id, budget }));
  expect(accountFor(world).cash).toBe(cash - budget);
  expect(world.people[id].householdId).toBe(world.people[world.activePersonId].householdId);
  expect(world.marriages.filter(marriage => !marriage.ended && (marriage.a === world.activePersonId || marriage.b === world.activePersonId))).toHaveLength(1);
  const playerCost = householdLivingCost(world, world.people[world.activePersonId]); const partnerCost = householdLivingCost(world, world.people[id]);
  expect(playerCost + partnerCost).toBe(210000n);
  expect(() => resolveCommand(world, { type: 'marry', personId: id, budget })).toThrow(/Get engaged/);
  validateWorld(world);
});

test('an NPC salary reaches that NPC account and background settlement cannot pay the same period twice', () => {
  const { world, id } = meet(fixture()); const person = world.people[id]; const playerBalance = accountFor(world).cash;
  const first = accountFor(world, person).cash;
  workMonth(world, person);
  expect(accountFor(world, person).cash).toBeGreaterThan(first); expect(accountFor(world).cash).toBe(playerBalance);
  person.finance.cycleGross = 0n; person.finance.cycleWithheld = 0n;
  world.date.year += 2;
  const through = world.date.year * 12 + world.date.month - 1;
  settleBackground(world, person, through); const restored = encodeWorld(world);
  settleBackground(world, person, through); expect(encodeWorld(world)).toBe(restored);
});

test('the same person cannot hold two active romantic partnerships', () => {
  const { world, id } = meet(fixture()); const relation = relationFor(world, world.activePersonId, id)!;
  relation.romance = 'dating'; relation.kind = 'partner'; relation.roles.push('partner');
  const other = Object.values(world.people).find(person => person.id.startsWith('person_npc_') && person.id !== id)!;
  connectPerson(world, other.id); const second = relationFor(world, world.activePersonId, other.id)!;
  second.romance = 'dating'; second.kind = 'partner'; second.roles.push('partner');
  expect(() => validateWorld(world)).toThrow(/romantic/);
});

test('an ordinary friendship can grow into a marriage through actions and actual annual progression', () => {
  let { world, id } = meet(fixture());
  for (let year = 0; year < 9 && relationFor(world, world.activePersonId, id)!.romance !== 'engaged'; year++) {
    for (const action of ['talk', 'compliment', 'spend-time'] as const) world = acknowledge(resolveCommand(world, { type: 'interact', personId: id, action }));
    world = acknowledge(resolveCommand(world, { type: 'ask-date', personId: id }));
    const relation = relationFor(world, world.activePersonId, id)!;
    if (relation.romance === 'dating' && relation.strength >= 75 && relation.trust >= 60) world = acknowledge(resolveCommand(world, { type: 'propose', personId: id }));
    if (relationFor(world, world.activePersonId, id)!.romance === 'engaged') break;
    world = resolveCommand(world, { type: 'advance' });
    while (world.pending) {
      if (world.pending.kind === 'decision') world = resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: world.pending.choices[0].id });
      else world = acknowledge(world);
    }
    world = decodeWorld(encodeWorld(world));
  }
  expect(relationFor(world, world.activePersonId, id)!.romance).toBe('engaged');
  world = acknowledge(resolveCommand(world, { type: 'marry', personId: id, budget: weddingBudgets(world)[0].amount }));
  const marriage = world.marriages.find(item => item.a === world.activePersonId || item.b === world.activePersonId)!;
  expect(marriage).toBeDefined(); expect(world.people[id].householdId).toBe(world.people[world.activePersonId].householdId);
  expect(world.ledger.some(entry => entry.personId === id && entry.category === 'income')).toBe(true);
  expect(decodeWorld(encodeWorld(world))).toEqual(world);
});
