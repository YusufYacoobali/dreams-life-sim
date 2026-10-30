import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { recordDeath, resolveCommand } from '../../src/game/engine';
import { netWorth } from '../../src/game/valuation';
import { accountFor } from '../../src/game/systems/common';
import { createContact } from '../../src/game/systems/npcs';
import { completeAssetSale, saleQuote } from '../../src/game/systems/assets';
import { assetPrice } from '../../src/game/systems/assetPricing';
import { assetCatalog } from '../../src/game/content/assets';
import { theftTargetVehicle } from '../../src/game/systems/stolenVehicles';
import { SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';
import { diskDatabase } from '../support/refinementSqlite';
import graduate from '../fixtures/v3-employed-graduate.json';

function theft(detected: boolean) {
  let original = decodeWorld(JSON.stringify(graduate));
  const actor = original.people[original.activePersonId];
  actor.stats.energy = actor.stats.health = actor.stats.smarts = 100;
  actor.legal.crimeSkill = 100;
  const owner = createContact(original, { age: 30, country: actor.country, city: actor.city });
  // The named victim genuinely purchases this exact vehicle before the theft.
  original.activePersonId = owner.id;
  const offer = assetCatalog.find(item => item.id === 'used-compact')!;
  original = acknowledge(resolveCommand(original, { type: 'buy-asset', catalogId: offer.id, financing: 'cash', depositBps: 10000, termMonths: 120, quotedPrice: assetPrice(original, offer) }));
  original.activePersonId = actor.id;
  const command = { type: 'crime' as const, offence: 'vehicle-theft' as const, victimId: owner.id };
  for (let seed = 0; seed < 100; seed++) {
    const before = decodeWorld(encodeWorld(original));
    before.random.outcomes = seed;
    const after = resolveCommand(before, command);
    const incident = after.incidents.at(-1)!;
    if ((incident.stage === 'charged') === detected) return { before, after, command, ownerId: owner.id };
  }
  throw new Error('Expected both actual detection outcomes in the controlled seed range');
}

function acknowledge(world: World) {
  if (world.pending?.kind !== 'result') throw new Error('Expected non-arrested theft result');
  return resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
}

test.each([false, true])('a genuine vehicle theft (detected=%s) atomically saves one linked inventory record, no cash payout and exactly one incident', async detected => {
  const { before, after, command, ownerId } = theft(detected);
  const folder = mkdtempSync(join(tmpdir(), 'dreams-refinement-stolen-'));
  const file = join(folder, 'life.db');
  let { sqlite, driver } = diskDatabase(file);
  let repository = new SaveRepository(driver);
  try {
    const asset = after.assets.find(item => item.stolen)!;
    expect(asset).toMatchObject({
      ownerId: detected ? null : before.activePersonId,
      ownershipSource: 'theft', pricePaid: 0n, costBasis: 0n, insured: false,
      stolen: { rulesVersion: 1, thiefId: before.activePersonId, registeredOwnerId: ownerId, status: detected ? 'seized' : 'held' },
    });
    const incident = after.incidents.find(item => item.id === asset.stolen!.incidentId)!;
    expect(after.assets.map(item => item.id)).toEqual(before.assets.map(item => item.id));
    expect(before.assets.find(item => item.id === asset.id)).toMatchObject({ ownerId, ownershipSource: 'purchase' });
    expect(incident).toMatchObject({ offence: 'vehicle-theft', personId: before.activePersonId, victimId: ownerId, gain: { minor: 0n } });
    expect(after.accounts).toStrictEqual(before.accounts);
    expect(after.ledger).toStrictEqual(before.ledger);
    expect(netWorth(after)).toEqual(netWorth(before));
    expect(after.cases.length - before.cases.length).toBe(detected ? 1 : 0);
    await repository.initialise(); await repository.create(before);
    sqlite.exec("CREATE TRIGGER reject_stolen_receipt BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'stolen asset storage failure'); END");
    await expect(repository.commit(after, before.revision, 'refinement:theft', true)).rejects.toThrow('stolen asset storage failure');
    expect(await repository.load(before.id)).toStrictEqual(before);
    expect(await repository.snapshots(before.id)).toEqual([]);
    expect(sqlite.prepare('SELECT count(*) AS n FROM receipts').get()).toEqual({ n: 0 });
    expect(resolveCommand(await repository.load(before.id), command)).toStrictEqual(after);
    sqlite.exec('DROP TRIGGER reject_stolen_receipt');
    await repository.commit(after, before.revision, 'refinement:theft', true);
    expect(await repository.commit(after, before.revision, 'refinement:theft', true)).toStrictEqual(after);
    sqlite.close();
    ({ sqlite, driver } = diskDatabase(file));
    repository = new SaveRepository(driver); await repository.initialise();
    const cold = await repository.load(before.id);
    expect(cold).toStrictEqual(after);
    expect(cold.assets.filter(item => item.stolen?.incidentId === incident.id)).toHaveLength(1);
    expect(cold.incidents.filter(item => item.id === incident.id)).toHaveLength(1);
    expect(sqlite.prepare('SELECT count(*) AS n FROM receipts').get()).toEqual({ n: 1 });
    expect(await repository.recoveryPreview(before.id)).toStrictEqual(before);
  } finally { sqlite.close(); rmSync(folder, { recursive: true, force: true }); }
});

test('returning a genuine stolen vehicle on one Time Machine future preserves the charge risk and leaves another future holding the same unsaleable vehicle', async () => {
  const { after } = theft(false), before = acknowledge(after);
  const asset = before.assets.find(item => item.stolen)!;
  const { sqlite, driver } = database(), repository = new SaveRepository(driver);
  try {
    await repository.initialise(); await repository.create(before);
    const [point] = await repository.snapshot(before.id, before.revision);
    const command = { type: 'return-stolen-vehicle' as const, assetId: asset.id };
    const returned = resolveCommand(before, command);
    expect(returned.assets.find(item => item.id === asset.id)).toMatchObject({ ownerId: asset.stolen!.registeredOwnerId, ...asset.stolen!.originalTitle, stolen: { status: 'recovered', resolved: before.date } });
    expect(returned.incidents).toStrictEqual(before.incidents);
    expect(returned.cases).toStrictEqual(before.cases);
    expect(returned.accounts).toStrictEqual(before.accounts);
    expect(returned.ledger).toStrictEqual(before.ledger);
    await repository.commit(returned, before.revision, 'refinement:return-stolen');
    const branch = await repository.restoreBranch(before.id, point.id, returned.revision, 'life_refinement_stolen_branch', 'refinement:stolen-branch');
    expect(branch.assets.find(item => item.id === asset.id)).toStrictEqual(asset);
    expect(resolveCommand(branch, command)).toStrictEqual({ ...returned, id: branch.id });
    const encoded = encodeWorld(branch);
    expect(() => resolveCommand(branch, { type: 'sell-asset', assetId: asset.id, quotedPrice: saleQuote(branch, asset).price })).toThrow(/stolen|lawful title/i);
    expect(() => resolveCommand(branch, { type: 'insure', assetId: asset.id, enabled: true })).toThrow(/stolen|lawful title/i);
    expect(() => completeAssetSale(decodeWorld(encoded), asset.id, asset.value)).toThrow(/stolen|lawful title/i);
    expect(encodeWorld(branch)).toBe(encoded);
    expect(await repository.load(before.id)).toStrictEqual(returned);
    expect(accountFor(branch).cash).toBe(accountFor(returned).cash);
  } finally { sqlite.close(); }
});

test('death cannot liquidate or bequeath a held stolen vehicle, and a cold save retains its seizure and original theft identity', async () => {
  const { after } = theft(false), before = acknowledge(after), dead = decodeWorld(encodeWorld(before));
  const asset = dead.assets.find(item => item.stolen)!, ledgerStart = dead.ledger.length;
  recordDeath(dead, dead.activePersonId, 'refinement fixture death');
  expect(dead.assets.find(item => item.id === asset.id)).toMatchObject({ ownerId: null, ownershipSource: 'theft', stolen: { incidentId: asset.stolen!.incidentId, status: 'seized', resolved: dead.date } });
  expect(dead.estates.find(item => item.personId === dead.activePersonId)?.distributions.every(item => !item.assets.includes(asset.id))).toBe(true);
  expect(dead.ledger.slice(ledgerStart).filter(item => item.category === 'estate-asset-sale')).toEqual([]);
  expect(dead.incidents).toStrictEqual(before.incidents);
  validateWorld(dead);
  const { sqlite, driver } = database(), repository = new SaveRepository(driver);
  try {
    await repository.initialise(); await repository.create(dead);
    const cold = new SaveRepository(driver); await cold.initialise();
    expect(await cold.load(dead.id)).toStrictEqual(dead);
  } finally { sqlite.close(); }
});

test('the actual registered owner can sell a returned vehicle with its original purchase basis and retained theft history', async () => {
  const { after } = theft(false), held = acknowledge(after);
  const stolen = held.assets.find(item => item.stolen)!;
  const returned = acknowledge(resolveCommand(held, { type: 'return-stolen-vehicle', assetId: stolen.id }));
  const ownerWorld = decodeWorld(encodeWorld(returned));
  ownerWorld.activePersonId = stolen.stolen!.registeredOwnerId;
  const restored = ownerWorld.assets.find(item => item.id === stolen.id)!;
  expect(restored).toMatchObject(stolen.stolen!.originalTitle);
  expect(restored.ownerId).toBe(ownerWorld.activePersonId);
  const quote = saleQuote(ownerWorld, restored), cash = accountFor(ownerWorld).cash;
  const sold = resolveCommand(ownerWorld, { type: 'sell-asset', assetId: restored.id, quotedPrice: quote.price });
  expect(accountFor(sold).cash - cash).toBe(quote.proceeds);
  expect(sold.assets.find(item => item.id === restored.id)).toMatchObject({ ownerId: null, stolen: { status: 'recovered', incidentId: stolen.stolen!.incidentId, originalTitle: stolen.stolen!.originalTitle } });
  expect(sold.incidents).toStrictEqual(held.incidents);
  const { sqlite, driver } = database(), repository = new SaveRepository(driver);
  try {
    await repository.initialise(); await repository.create(sold);
    const cold = new SaveRepository(driver); await cold.initialise();
    expect(await cold.load(sold.id)).toStrictEqual(sold);
  } finally { sqlite.close(); }
});

test('an explicit named victim without a recorded vehicle cannot create a replacement car or consume an attempt', () => {
  const world = decodeWorld(JSON.stringify(graduate)), actor = world.people[world.activePersonId];
  actor.stats.energy = actor.stats.smarts = actor.stats.health = actor.legal.crimeSkill = 100;
  const target = createContact(world, { age: 30, country: actor.country, city: actor.city });
  const input = encodeWorld(world);
  expect(() => resolveCommand(world, { type: 'crime', offence: 'vehicle-theft', victimId: target.id })).toThrow(/recorded lawful vehicle/);
  expect(encodeWorld(world)).toBe(input);
});

test('a previously returned car cannot be stolen repeatedly to manufacture additional inventory or proceeds', () => {
  const { after } = theft(false), held = acknowledge(after), asset = held.assets.find(item => item.stolen)!;
  const returned = acknowledge(resolveCommand(held, { type: 'return-stolen-vehicle', assetId: asset.id }));
  const world = decodeWorld(encodeWorld(returned));
  // A separate controlled adult actor has no prior offence allowance to mask
  // the recovered-vehicle check. The original theft and purchase stay literal.
  const originalActor = world.people[world.activePersonId];
  const newcomer = createContact(world, { age: 30, country: originalActor.country, city: originalActor.city });
  newcomer.stats.energy = newcomer.stats.smarts = newcomer.stats.health = newcomer.legal.crimeSkill = 100;
  world.activePersonId = newcomer.id;
  const input = encodeWorld(validateWorld(world)), ownerId = asset.stolen!.registeredOwnerId;
  expect(() => theftTargetVehicle(world, ownerId)).toThrow(/recorded lawful vehicle/);
  expect(() => resolveCommand(world, { type: 'crime', offence: 'vehicle-theft', victimId: ownerId })).toThrow(/recorded lawful vehicle/);
  expect(encodeWorld(world)).toBe(input);
  expect(world.assets.map(item => item.id)).toEqual(returned.assets.map(item => item.id));
});
