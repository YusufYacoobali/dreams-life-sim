import { copyWorld, decodeWorld, encodeWorld, type World } from '../../src/game/model';
import { activateLifestyle, lifestylePreview } from '../../src/game/systems/lifestyleActivation';
import { resolveCommand } from '../../src/game/engine';
import { licenceFee } from '../../src/game/systems/vehicleLicences';
import { vehicleActivityCost } from '../../src/game/systems/vehicleActivities';
import { amenityQuote } from '../../src/game/systems/propertyAmenities';
import { createGameStore } from '../../src/state/gameStore';
import { SaveRepository } from '../../src/persistence/repository';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { database } from '../support/sqlite';
import petHistory from '../fixtures/v30-pet-owner-loss.json';
import { buyLifestyle, lifestyleFixture, act as apply } from '../helpers/lifestyle';

function legacy() {
  const world = copyWorld(buyLifestyle(buyLifestyle(lifestyleFixture(), 'family-house'), 'used-scooter'));
  for (const asset of world.assets) { delete asset.propertyLife; delete asset.vehicleLife; }
  delete world.lifestyle;
  return decodeWorld(encodeWorld(world));
}
const ordinary = (world: World) => ({ people: world.people, journal: world.journal, ledger: world.ledger, accounts: world.accounts, liabilities: world.liabilities, random: world.random });
test('read-only decoding and presentation keep an older checkpoint literal while all activity setup is idempotent', () => {
  const old = legacy(), encoded = encodeWorld(old), proof = structuredClone(ordinary(old));
  const restored = unpackCheckpoint(packCheckpoint(old)); expect(encodeWorld(restored)).toBe(encoded);
  const preview = lifestylePreview(restored);
  expect(preview.lifestyle).toBeDefined(); expect(preview.assets[0].propertyLife).toBeDefined(); expect(preview.assets[1].vehicleLife).toMatchObject({ mileage: 12500, initialMileage: 12500 });
  expect(encodeWorld(restored)).toBe(encoded); expect(ordinary(preview)).toEqual(proof);
  const next = copyWorld(old); expect(activateLifestyle(next)).toBe(true);
  const prepared = encodeWorld(next); expect(activateLifestyle(next)).toBe(false); expect(encodeWorld(next)).toBe(prepared);
});

test('an anonymous legacy rental keeps its original terms and never becomes a named tenancy through setup', () => {
  let old = legacy(); old = apply(old, { type: 'rent-property', assetId: old.assets[0].id });
  const asset = old.assets[0], terms = structuredClone(asset);
  activateLifestyle(old); expect(old.assets[0]).toEqual(terms); expect(asset.propertyLife).toBeUndefined();
  expect(old.lifestyle!.tenancies).toHaveLength(0);
});

test('partially configured assets retain their exact mileage, improvements, dates and licence records', () => {
  let world = buyLifestyle(buyLifestyle(lifestyleFixture(), 'family-house'), 'used-scooter');
  world = apply(world, { type: 'take-licence-test', kind: 'road', answers: [1, 2, 0], quotedFee: licenceFee(world, 'road') });
  world = apply(world, { type: 'vehicle-activity', assetId: world.assets[1].id, activity: 'drive', contactId: null, quotedCost: vehicleActivityCost(world, world.assets[1], 'drive') });
  const managed = encodeWorld(world), proof = structuredClone(world.assets);
  activateLifestyle(world); expect(world.assets).toEqual(proof); expect(encodeWorld(world)).toBe(managed);
});

test('setup and a paid improvement save atomically, retry once and keep a restored Time Machine branch independent', async () => {
  const old = legacy(), oldText = encodeWorld(old), asset = old.assets[0];
  const { sqlite, driver } = database();
  try {
    const repository = new SaveRepository(driver); await repository.initialise(); await repository.create(old);
    const store = createGameStore({ repository: async () => repository, date: () => old.date, id: () => 'life_lifestyle_branch', premiumAccess: () => true });
    await store.getState().bootstrap(); expect(encodeWorld(store.getState().world!)).toBe(oldText);
    await store.getState().saveSnapshot(); const snapshot = store.getState().snapshots[0].id;
    const quote = amenityQuote(lifestylePreview(old).assets[0], 'kitchen');
    const command = { type: 'install-amenity' as const, assetId: asset.id, amenity: 'kitchen' as const, quotedCost: quote.cost };
    sqlite.exec("CREATE TRIGGER fail_automatic_lifestyle BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    expect(await store.getState().dispatch(command)).toBe(false);
    expect(encodeWorld(store.getState().world!)).toBe(oldText); expect(encodeWorld(await repository.load(old.id))).toBe(oldText);
    sqlite.exec('DROP TRIGGER fail_automatic_lifestyle'); expect(await store.getState().dispatch(command)).toBe(true);
    const saved = store.getState().world!; expect(saved.assets[0].propertyLife!.amenities).toHaveLength(1); expect(saved.random).toEqual(old.random);
    expect(encodeWorld(await new SaveRepository(driver).load(old.id))).toBe(encodeWorld(saved));
    expect(await store.getState().restoreSnapshot(snapshot)).toBe(true);
    const branch = store.getState().world!; expect(branch.id).not.toBe(old.id); expect(branch.lifestyle).toBeUndefined();
    expect(branch.assets).toEqual(old.assets); expect(branch.random).toEqual(old.random);
    expect(encodeWorld(await repository.load(old.id))).toBe(encodeWorld(saved));
    const activated = resolveCommand(branch, { type: 'inspect-property', assetId: asset.id });
    expect(activated.lifestyle).toBeDefined(); expect(activated.assets[0].propertyLife).toBeDefined(); expect(activated.random).toEqual(branch.random);
  } finally { sqlite.close(); }
});


test('an older companion gains optional activities without changing ownership, care costs, health, bonds or paid history', () => {
  const world = copyWorld(unpackCheckpoint(petHistory.payload)), pet = world.pets.find(row => row.status === 'active')!;
  delete pet.companion;
  const proof = structuredClone(pet), random = { ...world.random };
  activateLifestyle(world);
  const companion = pet.companion; expect(companion).toMatchObject({ training: 0, healthVersion: 2 });
  const { companion: _activities, ...unchanged } = pet; expect(unchanged).toEqual(proof); expect(world.random).toEqual(random);
  const once = encodeWorld(world); activateLifestyle(world); expect(encodeWorld(world)).toBe(once);
});
