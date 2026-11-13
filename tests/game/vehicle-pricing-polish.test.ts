import { copyWorld, encodeWorld, decodeWorld, validateWorld } from '../../src/game/model';
import { licenceFee, licenceFeeForCountry } from '../../src/game/systems/vehicleLicences';
import { vehicleActivityCost } from '../../src/game/systems/vehicleActivities';
import { buyLifestyle, lifestyleFixture, act } from '../helpers/lifestyle';
import { pupil } from '../support/pupil';

test('the US road test costs $80 and old recorded fee policies remain distinct', () => {
  expect(licenceFee(pupil('US', 20), 'road')).toBe(8000n);
  expect(licenceFeeForCountry('US', 'road', 1)).toBe(800n);
  expect(licenceFeeForCountry('GB', 'road')).not.toBe(licenceFeeForCountry('US', 'road'));
});
test('a new licence retains its pricing version and a forged legacy price or missing version is rejected', () => {
  const old = lifestyleFixture(), fee = licenceFee(old, 'road');
  const saved = act(old, { type: 'take-licence-test', kind: 'road', answers: [1, 2, 0], quotedFee: fee });
  expect(saved.lifestyle!.licences[0]).toMatchObject({ feeVersion: 2, fee: 8000n });
  expect(encodeWorld(decodeWorld(encodeWorld(saved)))).toBe(encodeWorld(saved));
  const forged = copyWorld(saved); delete forged.lifestyle!.licences[0].feeVersion;
  expect(() => validateWorld(forged)).toThrow(/licence/);
  expect(() => act(old, { type: 'take-licence-test', kind: 'road', answers: [1, 2, 0], quotedFee: 800n })).toThrow(/fee/);
});
test('prospective running and maintenance quotes reflect age, wear, value, vehicle class and country', () => {
  const world = buyLifestyle(lifestyleFixture(), 'used-compact'), car = world.assets[0];
  const service = vehicleActivityCost(world, car, 'service');
  expect(vehicleActivityCost(world, { ...car, ageMonths: car.ageMonths + 120 }, 'service')).toBeGreaterThan(service);
  expect(vehicleActivityCost(world, { ...car, value: car.value * 3n }, 'service')).toBeGreaterThan(service);
  expect(vehicleActivityCost(world, { ...car, condition: 40 }, 'repair')).toBeGreaterThan(vehicleActivityCost(world, { ...car, condition: 80 }, 'repair'));
  expect(vehicleActivityCost(world, { ...car, condition: 25 }, 'drive')).toBeGreaterThan(vehicleActivityCost(world, { ...car, condition: 90 }, 'drive'));
  expect(vehicleActivityCost(world, { ...car, catalogId: 'used-scooter' }, 'service')).toBeLessThan(service);
  expect(vehicleActivityCost(world, { ...car, country: 'JP', currency: 'JPY' }, 'service')).not.toBe(service);
});
