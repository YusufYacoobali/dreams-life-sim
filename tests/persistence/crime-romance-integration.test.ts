import { createLife, randomCreation } from '../../src/game/createLife';
import { decodeWorld, encodeWorld, moneyJSON, validateWorld, type World } from '../../src/game/model';
import { enableOverhaul } from '../../src/game/systems/overhaul';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { SaveRepository } from '../../src/persistence/repository';
import { recordDeath, resolveCommand } from '../../src/game/engine';
import { accountFor } from '../../src/game/systems/common';
import { createContact } from '../../src/game/systems/npcs';
import { connectPerson } from '../../src/game/systems/relationshipContacts';
import { partnerRelation, relationFor } from '../../src/game/systems/relationshipQueries';
import { addChild, adoptionFee, childrenOf, divorceQuote } from '../../src/game/systems/family';
import { weddingBudgets } from '../../src/game/systems/relationships';
import { offerRomance } from '../../src/game/systems/romanceDrama';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { assetCatalog } from '../../src/game/content/assets';
import { assetPrice } from '../../src/game/systems/assetPricing';
import { database } from '../support/sqlite';
import graduate from '../fixtures/v3-employed-graduate.json';
import creative from '../fixtures/v50-creative-polish-compat.json';
import marriage from '../fixtures/v5-marriage-result.json';

function comparable(value: unknown) { return JSON.parse(JSON.stringify(value, moneyJSON)); }
function legacy() { return decodeWorld(JSON.stringify(graduate)); }

test('new ordinary lives include the prospective overhaul without acquiring creative-career capability', () => {
  const world = createLife('life_overhaul_capability', 42, randomCreation(42), { year: 2026, month: 10, day: 30 });
  expect(world).toMatchObject({ schemaVersion: 49, engineVersion: 51, contentVersion: 28, overhaulVersion: 1, prisonLives: [], affairs: [], romanceOffers: [] });
  expect(decodeWorld(encodeWorld(world))).toEqual(world);
});

test('ordinary commands on an immutable legacy save preserve absent optional fields across a strict cold reopen', async () => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver);
  try {
    await repository.initialise(); const before = legacy(); await repository.create(before);
    const loaded = await repository.load(before.id), routine = loaded.people[loaded.activePersonId].health.routine;
    const next = resolveCommand(loaded, { type: 'health-routine', routine: { ...routine, mindfulness: !routine.mindfulness } }, true);
    expect(next).not.toHaveProperty('overhaulVersion');
    expect(next).not.toHaveProperty('affairs');
    expect(next).not.toHaveProperty('prisonLives');
    expect(next).not.toHaveProperty('romanceOffers');
    await repository.commit(next, loaded.revision, 'overhaul:legacy-routine');
    const cold = new SaveRepository(driver); await cold.initialise();
    expect(await cold.load(next.id)).toStrictEqual(next);
    expect(Object.keys(await cold.load(next.id))).toEqual(Object.keys(next));
  } finally { sqlite.close(); }
});

test('a new date on an old life enables partner autonomy while the original date keeps its legacy format', () => {
  const before = legacy(), actor = before.people[before.activePersonId];
  const target = createContact(before, { age: 28, country: actor.country, city: actor.city });
  actor.attractedTo = [target.gender]; target.attractedTo = [actor.gender];
  connectPerson(before, target.id);
  const relation = relationFor(before, actor.id, target.id)!;
  relation.romance = 'dating'; relation.strength = 90; relation.trust = 90;
  const original = validateWorld(before);
  const familiarDate = resolveCommand(original, { type: 'ask-date', personId: target.id, activity: 'walk' });
  expect(familiarDate).not.toHaveProperty('overhaulVersion');
  const newDate = resolveCommand(original, { type: 'ask-date', personId: target.id, activity: 'cooking' });
  expect(newDate).toMatchObject({ overhaulVersion: 1, affairs: [], romanceOffers: [], prisonLives: [] });
  expect(newDate.relationships.find(item => item.id === relation.id)?.romance).toBe('dating');
  expect(newDate.marriages).toEqual(original.marriages);
  expect(decodeWorld(encodeWorld(newDate))).toEqual(newDate);
});

test.each([
  ['ordinary', () => legacy()],
  ['enhanced creative', () => unpackCheckpoint(creative.pending)],
] as const)('enabling the overhaul in an existing %s save changes only empty prospective capability fields', (_, create) => {
  const world = create(), before = comparable(world);
  expect(world).not.toHaveProperty('overhaulVersion');
  expect(world).not.toHaveProperty('prisonLives');
  expect(world).not.toHaveProperty('affairs');
  expect(world).not.toHaveProperty('romanceOffers');
  enableOverhaul(world);
  expect(comparable(world)).toEqual({ ...before, overhaulVersion: 1, prisonLives: [], affairs: [], romanceOffers: [] });
  expect(validateWorld(world)).toEqual(world);
  expect(unpackCheckpoint(packCheckpoint(world))).toEqual(world);
  const once = encodeWorld(world); enableOverhaul(world);
  expect(encodeWorld(world)).toBe(once);
});

test('published creative pending decisions keep their exact participants, words, effects and RNG when enabling new features', () => {
  const world = unpackCheckpoint(creative.pending), before = comparable({ pending: world.pending, random: world.random, careers: world.careers, ledger: world.ledger, relationships: world.relationships });
  enableOverhaul(world);
  const cold = decodeWorld(encodeWorld(world));
  expect(comparable({ pending: cold.pending, random: cold.random, careers: cold.careers, ledger: cold.ledger, relationships: cold.relationships })).toEqual(before);
  expect(cold).toMatchObject({ schemaVersion: 50, engineVersion: 52, contentVersion: 29, overhaulVersion: 1 });
});

test.each(['prisonLives', 'affairs', 'romanceOffers'] as const)('an enabled save missing %s is rejected rather than silently repaired', collection => {
  const world = legacy(); enableOverhaul(world);
  const broken = comparable(world); delete broken[collection];
  expect(() => decodeWorld(JSON.stringify(broken))).toThrow();
});

test('future overhaul capability is rejected without replacing the previously readable life', async () => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver);
  try {
    await repository.initialise(); const before = legacy(); await repository.create(before);
    const unsupported = comparable(before); unsupported.overhaulVersion = 2;
    expect(() => decodeWorld(JSON.stringify(unsupported))).toThrow();
    expect(await repository.load(before.id)).toEqual(before);
  } finally { sqlite.close(); }
});

test('capability opt-in commits atomically and cold reopening retains the same ordinary and enhanced save formats', async () => {
  for (const original of [legacy(), unpackCheckpoint(creative.pending)]) {
    const { sqlite, driver } = database(), repository = new SaveRepository(driver);
    try {
      await repository.initialise(); await repository.create(original);
      const next = decodeWorld(encodeWorld(original)); enableOverhaul(next); next.revision++;
      sqlite.exec("CREATE TRIGGER reject_overhaul_receipt BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'overhaul storage failure'); END");
      await expect(repository.commit(next, original.revision, 'overhaul:enable')).rejects.toThrow('overhaul storage failure');
      expect(await repository.load(original.id)).toEqual(original);
      expect(sqlite.prepare('SELECT COUNT(*) AS n FROM receipts').get()).toEqual({ n: 0 });
      sqlite.exec('DROP TRIGGER reject_overhaul_receipt');
      expect(await repository.commit(next, original.revision, 'overhaul:enable')).toEqual(next);
      const reopened = new SaveRepository(driver); await reopened.initialise();
      expect(await reopened.load(next.id)).toEqual(next);
      expect(await reopened.recoveryPreview(next.id)).toEqual(original);
    } finally { sqlite.close(); }
  }
});

function acknowledge(world: World) {
  if (world.pending?.kind !== 'result') throw new Error('Expected an action result');
  return resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
}
function paidAssignment() {
  const joined = acknowledge(resolveCommand(legacy(), { type: 'organised-join', style: 'street-syndicate' }));
  const gangId = joined.gangs.find(gang => gang.organised && !gang.left)!.id;
  const command = { type: 'organised-mission' as const, gangId, mission: 'missing-envelope', approach: 'cautious' as const };
  for (let seed = 1; seed <= 100; seed++) {
    const before = decodeWorld(encodeWorld(joined)); before.random.outcomes = seed;
    const next = resolveCommand(before, command), job = next.gangs.find(gang => gang.id === gangId)!.organised!.jobs[0];
    if (job.success && next.pending?.kind === 'result') return { before, next, command, gangId };
  }
  throw new Error('No successful non-arrested assignment fixture');
}

test('a failed assignment save rolls back the actual proceeds, incident, membership history and idempotency receipt; retry pays once', async () => {
  const { before, next, command, gangId } = paidAssignment();
  const { sqlite, driver } = database(), repository = new SaveRepository(driver);
  try {
    await repository.initialise(); await repository.create(before);
    const bank = accountFor(before).cash, rows = before.ledger.length;
    const job = next.gangs.find(gang => gang.id === gangId)!.organised!.jobs[0];
    expect(job.proceeds).toBeGreaterThan(0n);
    expect(accountFor(next).cash - bank).toBe(job.proceeds);
    expect(next.ledger.slice(rows)).toHaveLength(1);
    expect(next.ledger.at(-1)).toMatchObject({ id: job.transactionId, cashDelta: job.proceeds, category: 'crime-proceeds' });
    expect(next.incidents.find(incident => incident.id === job.incidentId)?.gain.minor).toBe(job.proceeds);
    sqlite.exec("CREATE TRIGGER reject_assignment_receipt BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'assignment storage failure'); END");
    await expect(repository.commit(next, before.revision, 'overhaul:assignment', true)).rejects.toThrow('assignment storage failure');
    expect(await repository.load(before.id)).toEqual(before);
    expect(await repository.snapshots(before.id)).toEqual([]);
    expect(encodeWorld(resolveCommand(await repository.load(before.id), command))).toBe(encodeWorld(next));
    sqlite.exec('DROP TRIGGER reject_assignment_receipt');
    await repository.commit(next, before.revision, 'overhaul:assignment', true);
    const duplicate = await repository.commit(next, before.revision, 'overhaul:assignment', true);
    expect(duplicate).toEqual(next);
    const cold = new SaveRepository(driver); await cold.initialise();
    expect(await cold.load(next.id)).toEqual(next);
    expect((await cold.snapshots(next.id))).toHaveLength(1);
    expect(sqlite.prepare('SELECT COUNT(*) AS n FROM receipts').get()).toEqual({ n: 1 });
  } finally { sqlite.close(); }
});

test('a Time Machine branch retains the exact crew and rivals, reproduces a saved assignment and cannot change its source future', async () => {
  const { before, next, command, gangId } = paidAssignment();
  const { sqlite, driver } = database(), repository = new SaveRepository(driver);
  try {
    await repository.initialise(); await repository.create(before);
    const moment = (await repository.snapshot(before.id, before.revision))[0];
    await repository.commit(next, before.revision, 'overhaul:future-assignment');
    const branch = await repository.restoreBranch(before.id, moment.id, next.revision, 'life_overhaul_independent_branch', 'overhaul:branch');
    expect(branch.gangs).toEqual(before.gangs);
    expect(branch.gangs.find(gang => gang.id === gangId)!.organised!.worldId).toBe(before.id);
    const replay = resolveCommand(branch, command);
    expect(replay).toEqual({ ...next, id: branch.id });
    await repository.commit(replay, branch.revision, 'overhaul:branch-assignment');
    const left = resolveCommand(acknowledge(replay), { type: 'organised-leave', gangId });
    expect(left.gangs.find(gang => gang.id === gangId)!.left).not.toBeNull();
    expect(await repository.load(before.id)).toEqual(next);
    expect((await repository.load(branch.id)).gangs.find(gang => gang.id === gangId)!.left).toBeNull();
    expect(validateWorld(replay)).toEqual(replay);
  } finally { sqlite.close(); }
});

function marriedAffair() {
  const before = acknowledge(decodeWorld(JSON.stringify(marriage))), actor = before.people[before.activePersonId];
  const partner = partnerRelation(before)!;
  const partnerId = partner.from === actor.id ? partner.to : partner.from;
  const lover = createContact(before, { age: 28, gender: actor.attractedTo[0], compatibleWith: actor.gender, country: actor.country, city: actor.city });
  lover.traits = ['impulsive']; connectPerson(before, lover.id);
  const relationship = relationFor(before, actor.id, lover.id)!;
  relationship.strength = 95; relationship.trust = 95;
  before.random.outcomes = 0;
  const command = { type: 'romance-action' as const, personId: lover.id, action: 'affair' as const };
  const next = resolveCommand(before, command);
  if (next.affairs?.length !== 1) throw new Error('Expected the willing adult fixture to accept an affair');
  return { before, next, command, partnerId, loverId: lover.id };
}

test('an actual secret affair, its adult participants and its financial neutrality survive rollback, deterministic retry and cold reopening', async () => {
  const { before, next, command, partnerId, loverId } = marriedAffair();
  const { sqlite, driver } = database(), repository = new SaveRepository(driver);
  try {
    const affair = next.affairs![0];
    expect(affair).toMatchObject({ actorId: before.activePersonId, partnerId, loverId, discovered: null, ended: null });
    expect(affair.knownBy).toEqual([before.activePersonId, loverId]);
    expect(partnerRelation(next)?.romance).toBe('married');
    expect(relationFor(next, before.activePersonId, loverId)?.romance).toBe('none');
    expect(next.ledger).toEqual(before.ledger); expect(next.accounts).toEqual(before.accounts);
    await repository.initialise(); await repository.create(before);
    sqlite.exec("CREATE TRIGGER reject_affair_receipt BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'affair storage failure'); END");
    await expect(repository.commit(next, before.revision, 'overhaul:affair')).rejects.toThrow('affair storage failure');
    expect(await repository.load(before.id)).toEqual(before);
    expect(resolveCommand(await repository.load(before.id), command)).toEqual(next);
    sqlite.exec('DROP TRIGGER reject_affair_receipt');
    await repository.commit(next, before.revision, 'overhaul:affair');
    const cold = new SaveRepository(driver); await cold.initialise();
    expect((await cold.load(before.id)).affairs).toEqual(next.affairs);
    expect((await cold.load(before.id)).marriages).toEqual(before.marriages);
  } finally { sqlite.close(); }
});

test('confession in one Time Machine future does not disclose or erase an affair in an independently restored future', async () => {
  const { next, partnerId, loverId } = marriedAffair(), before = acknowledge(next);
  const { sqlite, driver } = database(), repository = new SaveRepository(driver);
  try {
    await repository.initialise(); await repository.create(before);
    const point = (await repository.snapshot(before.id, before.revision))[0];
    const confessed = resolveCommand(before, { type: 'romance-action', personId: partnerId, action: 'confess' });
    await repository.commit(confessed, before.revision, 'overhaul:confess');
    expect(confessed.affairs![0]).toMatchObject({ discoveryReason: 'confession', endReason: 'confessed' });
    expect(confessed.affairs![0].knownBy).toContain(partnerId);
    const branch = await repository.restoreBranch(before.id, point.id, confessed.revision, 'life_overhaul_romance_branch', 'overhaul:romance-branch');
    expect(branch.affairs![0]).toMatchObject({ discovered: null, ended: null });
    expect(branch.affairs![0].knownBy).not.toContain(partnerId);
    const ended = resolveCommand(branch, { type: 'romance-action', personId: loverId, action: 'end-affair' });
    await repository.commit(ended, branch.revision, 'overhaul:end-secret-affair');
    expect((await repository.load(ended.id)).affairs![0]).toMatchObject({ discovered: null, endReason: 'ended' });
    expect(await repository.load(before.id)).toEqual(confessed);
    expect((await repository.load(before.id)).affairs![0].discoveryReason).toBe('confession');
    expect(confessed.marriages).toEqual(before.marriages);
    expect(ended.marriages).toEqual(before.marriages);
    expect(confessed.ledger).toEqual(before.ledger);
    expect(ended.ledger).toEqual(before.ledger);
  } finally { sqlite.close(); }
});

test('death and actual child continuation retain the parent’s criminal and affair history without inheriting membership or romantic commitments', () => {
  const { next, partnerId, loverId } = marriedAffair();
  let world = acknowledge(next);
  const parentId = world.activePersonId;
  const child = addChild(world, [world.people[parentId], world.people[partnerId]], 'adoptive', 4);
  world = acknowledge(resolveCommand(world, { type: 'organised-join', style: 'street-syndicate' }));
  const originalCrew = comparable(world.gangs[0].organised!.members);
  const originalAffairId = world.affairs![0].id;
  recordDeath(world, parentId, 'test fixture death');
  expect(world.gangs[0].left).toEqual(world.date);
  expect(world.affairs![0]).toMatchObject({ id: originalAffairId, actorId: parentId, partnerId, loverId, endReason: 'death' });
  world = resolveCommand(validateWorld(world), { type: 'continue-child', personId: child.id });
  expect(world.activePersonId).toBe(child.id);
  expect(world.people[child.id].legal.gangId).toBeNull();
  expect(partnerRelation(world)).toBeUndefined();
  expect(comparable(world.gangs[0].organised!.members)).toEqual(originalCrew);
  expect(world.gangs[0].personId).toBe(parentId);
  expect(world.affairs![0]).toMatchObject({ id: originalAffairId, actorId: parentId, partnerId, loverId, endReason: 'death' });
  expect(world.marriages.find(item => item.a === parentId || item.b === parentId)?.endReason).toBe('death');
  expect(world.legacies.at(-1)).toMatchObject({ fromId: parentId, toId: child.id });
  expect(unpackCheckpoint(packCheckpoint(world))).toEqual(world);
});

function answer(world: World, choiceId: string) {
  if (world.pending?.kind !== 'decision') throw new Error('Expected an NPC decision');
  return resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId });
}

test('an accepted NPC proposal continues through the actual wedding command, household, ownership and recorded ceremony payment', () => {
  let world = legacy();
  const actor = world.people[world.activePersonId];
  const partner = createContact(world, { age: 25, gender: actor.attractedTo[0], compatibleWith: actor.gender, country: actor.country, city: actor.city });
  connectPerson(world, partner.id);
  const relation = relationFor(world, actor.id, partner.id)!; relation.strength = relation.trust = 95;
  world.random.outcomes = 0;
  world = acknowledge(resolveCommand(world, { type: 'ask-date', personId: partner.id, activity: 'cooking' }));
  expect(partnerRelation(world)?.romance).toBe('dating');
  const beforeProposal = decodeWorld(encodeWorld(world));
  offerRomance(world, partner.id, 'proposal');
  world = acknowledge(answer(unpackCheckpoint(packCheckpoint(world)), 'accept'));
  expect(partnerRelation(world)?.romance).toBe('engaged');
  expect(world.accounts).toEqual(beforeProposal.accounts);
  expect(world.assets).toEqual(beforeProposal.assets);
  const budget = weddingBudgets(world)[0].amount, bank = accountFor(world).cash;
  world = acknowledge(resolveCommand(unpackCheckpoint(packCheckpoint(world)), { type: 'marry', personId: partner.id, budget }));
  expect(partnerRelation(world)?.romance).toBe('married');
  expect(world.marriages.at(-1)).toMatchObject({ a: actor.id, b: partner.id, ended: null, weddingCost: { minor: budget } });
  expect(world.people[actor.id].householdId).toBe(world.people[partner.id].householdId);
  expect(accountFor(world).cash).toBe(bank - budget);
  expect(world.ledger.filter(row => row.category === 'wedding')).toHaveLength(1);
  expect(world.romanceOffers!.at(-1)).toMatchObject({ kind: 'proposal', choiceId: 'accept' });
  expect(unpackCheckpoint(packCheckpoint(world))).toEqual(world);
});

test('an NPC can gift a genuinely purchased foreign-currency ring after relocation without fabricating a purchase or trapping acceptance', () => {
  let world = legacy(); const actorId = world.activePersonId, actor = world.people[actorId];
  const partner = createContact(world, { age: 28, gender: actor.attractedTo[0], compatibleWith: actor.gender, country: 'GB', city: 'London' });
  const partnerId = partner.id;
  // Control the existing NPC only to make a real GBP purchase, retaining its
  // actual debit, asset, account and provenance in the shared world.
  world.activePersonId = partnerId;
  const definition = assetCatalog.find(item => item.id === 'engagement-ring')!;
  world = acknowledge(resolveCommand(world, { type: 'buy-asset', catalogId: definition.id, financing: 'cash', depositBps: 10000, termMonths: 360, quotedPrice: assetPrice(world, definition) }));
  const ringId = world.assets.find(item => item.ownerId === partnerId && item.catalogId === definition.id)!.id;
  expect(world.assets.find(item => item.id === ringId)!.currency).toBe('GBP');
  // Declared relocated-NPC boundary: original GBP balances, employment history
  // and ownership persist; the empty resident-currency account creates no money.
  world.people[partnerId].country = actor.country; world.people[partnerId].city = actor.city;
  world.accounts.push({ id: 'account_' + partnerId + '_USD', ownerId: partnerId, currency: 'USD', openingCash: 0n, cash: 0n, lockedCash: 0n });
  world.activePersonId = actorId; connectPerson(world, partnerId);
  const relation = relationFor(world, actorId, partnerId)!;
  relation.romance = 'dating'; relation.kind = 'partner'; relation.roles.push('partner'); relation.strength = relation.trust = 95;
  enableOverhaul(world); validateWorld(world);
  expect(world.accounts.some(account => account.ownerId === actorId && account.currency === 'GBP')).toBe(false);
  const beforeLedger = comparable(world.ledger), beforeAccounts = comparable(world.accounts);
  offerRomance(world, partnerId, 'proposal');
  world = answer(unpackCheckpoint(packCheckpoint(world)), 'accept');
  expect(partnerRelation(world)?.romance).toBe('engaged');
  expect(world.assets.find(item => item.id === ringId)).toMatchObject({ ownerId: actorId, currency: 'GBP', ownershipSource: 'gift' });
  expect(world.accounts.find(account => account.ownerId === actorId && account.currency === 'GBP')).toMatchObject({ cash: 0n, openingCash: 0n });
  expect(comparable(world.accounts.slice(0, -1))).toEqual(beforeAccounts);
  expect(comparable(world.ledger)).toEqual(beforeLedger);
  expect(unpackCheckpoint(packCheckpoint(world))).toEqual(world);
});

test('a spouse’s divorce request with an actual child leads through reviewed settlement, conserved money, custody and later wage-funded support', () => {
  let world = acknowledge(decodeWorld(JSON.stringify(marriage))); enableOverhaul(world);
  const parentId = world.activePersonId, relationship = partnerRelation(world)!;
  const spouseId = relationship.from === parentId ? relationship.to : relationship.from;
  const initialCash = accountFor(world).cash, fee = adoptionFee(world);
  world = acknowledge(resolveCommand(world, { type: 'adopt', age: 4 }));
  const child = childrenOf(world)[0];
  expect(child).toBeDefined(); expect(accountFor(world).cash).toBe(initialCash - fee);
  expect(childrenOf(world, spouseId).map(person => person.id)).toContain(child.id);
  const originalMarriageId = world.marriages.at(-1)!.id, finances = comparable({ accounts: world.accounts, ledger: world.ledger, assets: world.assets, custody: world.custody, marriages: world.marriages });
  // Controlled offer fixture isolates response and settlement from the separately
  // tested annual conflict/rarity selector.
  offerRomance(world, spouseId, 'divorce');
  world = acknowledge(answer(unpackCheckpoint(packCheckpoint(world)), 'respect'));
  expect(comparable({ accounts: world.accounts, ledger: world.ledger, assets: world.assets, custody: world.custody, marriages: world.marriages })).toEqual(finances);
  expect(partnerRelation(world)?.romance).toBe('married');
  const quote = divorceQuote(world, spouseId), beforeCash = world.accounts.reduce((sum, row) => sum + row.cash, 0n);
  expect(quote.amount).toBeGreaterThan(0n);
  const payerCash = accountFor(world, world.people[quote.payerId], quote.currency).cash;
  const receiverCash = accountFor(world, world.people[quote.receiverId], quote.currency).cash;
  world = acknowledge(resolveCommand(world, { type: 'divorce', personId: spouseId, custody: 'shared', quotedPayment: quote.signed }));
  expect(world.marriages.find(item => item.id === originalMarriageId)).toMatchObject({ endReason: 'divorce', ended: world.date });
  expect(relationFor(world, parentId, spouseId)?.romance).toBe('ex');
  expect(accountFor(world, world.people[quote.payerId], quote.currency).cash).toBe(payerCash - quote.amount);
  expect(accountFor(world, world.people[quote.receiverId], quote.currency).cash).toBe(receiverCash + quote.amount);
  expect(world.accounts.reduce((sum, row) => sum + row.cash, 0n)).toBe(beforeCash);
  const settlement = world.ledger.filter(row => row.category === 'settlement');
  expect(settlement.map(row => row.cashDelta)).toEqual([-quote.amount, quote.amount]);
  const custody = world.custody.find(item => item.childId === child.id && !item.ended)!;
  expect(custody).toMatchObject({ arrangement: 'shared', a: parentId, b: spouseId });
  expect(world.people[child.id].householdId).toBe(world.people[custody.primaryId].householdId);
  expect(unpackCheckpoint(packCheckpoint(world))).toEqual(world);
  world = resolveCommand(world, { type: 'advance' });
  let guard = 0;
  while ((world.pending || world.annual) && guard++ < 100) {
    if (world.pending?.kind === 'decision') {
      const choice = world.pending.choices.find(option => !choiceUnavailable(world, option));
      if (!choice) throw new Error('No available annual choice');
      world = answer(world, choice.id);
    } else if (world.pending) world = acknowledge(world);
    else world = resolveCommand(world, { type: 'resume' });
  }
  expect(guard).toBeLessThan(100);
  const support = world.ledger.filter(row => row.category === 'child-support');
  expect(support.length).toBeGreaterThan(0);
  expect(support.reduce((sum, row) => sum + row.cashDelta, 0n)).toBe(0n);
  expect(world.marriages.find(item => item.id === originalMarriageId)?.endReason).toBe('divorce');
  expect(unpackCheckpoint(packCheckpoint(world))).toEqual(world);
});
