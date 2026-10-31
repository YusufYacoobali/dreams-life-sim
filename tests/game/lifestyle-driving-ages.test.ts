import { countryCodes } from '../../src/game/countries';
import { vehicleMinimumAge } from '../../src/game/systems/vehicleAgePolicy';
import { licenceFee, licenceQuiz } from '../../src/game/systems/vehicleLicences';
import { vehicleActivityCost, vehicleActivityReason, vehicleUseReason } from '../../src/game/systems/vehicleActivities';
import { purchaseReason, purchaseQuote } from '../../src/game/systems/assets';
import { assetCatalog } from '../../src/game/content/assets';
import { accountFor, post } from '../../src/game/systems/common';
import { decodeWorld, encodeWorld } from '../../src/game/model';
import { pupil } from '../support/pupil';
import { act } from '../helpers/lifestyle';
const expectedRoadAges = { US: 16, CA: 16, GB: 17, AU: 17, FR: 18, DE: 18, ES: 18, IT: 18, BR: 18, IN: 18, JP: 18, ZA: 18 };
const road = assetCatalog.find(row => row.id === 'used-scooter')!;
/** Controlled country/age/finance eligibility, separate from the earned-money young-driver journey. */
function funded(country: typeof countryCodes[number], age: number) { const world = pupil(country, age); post(world, 100000000n, 0n, 'unit-funding', 'Controlled driving-age fixture'); return world; }
test.each(countryCodes.flatMap(country => [-1, 0, 1].map(offset => ({ country, age: expectedRoadAges[country] + offset, eligible: offset >= 0 }))))('$country age $age cash ownership, test and direct driving match the single policy', ({ country, age, eligible }) => {
  expect(vehicleMinimumAge(country)).toBe(expectedRoadAges[country]);
  let world = funded(country, age), reason = purchaseReason(world, road, 'cash');
  const testCommand = { type: 'take-licence-test' as const, kind: 'road' as const, answers: licenceQuiz.road.map(row => row.correct), quotedFee: licenceFee(world, 'road') };
  const quote = purchaseQuote(world, road, 'cash'), buy = { type: 'buy-asset' as const, catalogId: road.id, financing: 'cash' as const, depositBps: 10000, termMonths: 120 as const, quotedPrice: quote.price };
  if (!eligible) { expect(reason).toBeDefined(); expect(() => act(world, buy)).toThrow(/age|adults/); expect(() => act(world, testCommand)).toThrow(/age/); return; }
  expect(reason).toBeUndefined();
  world = act(world, buy); const id = world.assets.at(-1)!.id;
  world = act(world, { type: 'enable-vehicle-activities', assetId: id });
  expect(vehicleActivityReason(world, world.assets.at(-1)!, 'drive')).toMatch(/licence/);
  world = act(world, testCommand);
  const asset = world.assets.at(-1)!, cash = accountFor(world).cash, cost = vehicleActivityCost(world, asset, 'drive');
  world = act(decodeWorld(encodeWorld(world)), { type: 'vehicle-activity', assetId: id, activity: 'drive', contactId: null, quotedCost: cost });
  expect(world.assets.at(-1)!.vehicleLife!.mileage).toBe(road.listingMileage! + 40);
  expect(accountFor(world).cash).toBe(cash - cost);
  world = act(world, { type: 'vehicle-activity', assetId: id, activity: 'service', contactId: null, quotedCost: vehicleActivityCost(world, world.assets.at(-1)!, 'service') });
  expect(world.assets.at(-1)!.ageMonths).toBe(0);
  expect(world.assets.at(-1)!.vehicleLife!.mileage).toBe(road.listingMileage! + 40);
  expect(decodeWorld(encodeWorld(world))).toEqual(world);
});
test.each(countryCodes.flatMap(country => ['boat', 'pilot'].map(kind => ({ country, kind: kind as 'boat' | 'pilot' }))))('$country under-18 $kind ownership, test and pre-existing vehicle use remain unavailable', ({ country, kind }) => {
  const world = funded(country, 17), offer = assetCatalog.find(row => row.id === (kind === 'boat' ? 'harbour-dinghy' : 'training-plane'))!;
  expect(vehicleMinimumAge(country, kind)).toBe(18);
  expect(purchaseReason(world, offer, 'cash')).toBeDefined();
  expect(() => act(world, { type: 'take-licence-test', kind, answers: [1, 2, 0], quotedFee: licenceFee(world, kind) })).toThrow(/18/);
  // Eligibility query for a hypothetical pre-existing lawful specialty title; no title or licence is granted.
  const asset = { catalogId: offer.id };
  expect(vehicleUseReason(world, asset)).toMatch(/18/);
});
test('under-18 cash purchases cannot spend locked inherited funds or create a mortgage', () => {
  const world = funded('US', 16); accountFor(world).lockedCash = accountFor(world).cash;
  expect(purchaseReason(world, road, 'cash')).toMatch(/balance/);
  expect(() => act(world, { type: 'buy-asset', catalogId: road.id, financing: 'cash', depositBps: 10000, termMonths: 120, quotedPrice: purchaseQuote(world, road, 'cash').price })).toThrow(/balance/);
  expect(purchaseReason(world, road, 'mortgage')).toBeDefined();
  expect(purchaseReason(world, assetCatalog.find(row => row.id === 'studio')!, 'cash')).toMatch(/adults/);
});
