import type { World } from '../model';
import { assetCatalog } from '../content/assets';
import { newLifestyle } from './lifestyleCommon';
import { householdPets } from './petSchemas';
import { newCompanion } from './petLifestyleState';

/** Prospective, idempotent setup on a mutable command copy, never during decoding. */
export function activateLifestyle(world: World, skipAssetId?: string) {
  let changed = false;
  if (!world.lifestyle) { world.lifestyle = newLifestyle(world.date); changed = true; }
  for (const asset of world.assets) {
    if (asset.ownerId !== world.activePersonId || asset.id === skipAssetId) continue;
    // Anonymous rental contracts retain their old economics until they end.
    if (asset.kind === 'property' && !asset.propertyLife && asset.rental === 'none' && !asset.listing) {
      asset.propertyLife = { version: 1, enabled: { ...world.date }, amenities: [], lastGatheringMonth: null, lastInspectionMonth: null }; changed = true;
    }
    if (asset.kind === 'vehicle' && !asset.vehicleLife && asset.stolen?.status !== 'held') {
      const mileage = assetCatalog.find(row => row.id === asset.catalogId)?.listingMileage ?? 0;
      asset.vehicleLife = { version: 1, usageVersion: 2, enabled: { ...world.date }, mileage, initialMileage: mileage, lastServiceMonth: null, appearance: 'original', upgrades: [], lastUseMonth: null }; changed = true;
    }
  }
  for (const pet of householdPets(world)) if (!pet.companion) {
    pet.companion = newCompanion(world, pet); changed = true;
  }
  return changed;
}

/** Quotes and availability can preview setup without changing the published save. */
export function lifestylePreview(world: World): World {
  const view = { ...world, assets: world.assets.map(asset => ({ ...asset })), pets: world.pets.map(pet => ({ ...pet })) };
  return activateLifestyle(view) ? view : world;
}
