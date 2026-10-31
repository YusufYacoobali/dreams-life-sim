import type { World } from '../model';
import type { Pet } from './petSchemas';
import { petTrait } from '../content/pets';
import { homeAmenity } from './propertyAmenities';
import { lifestyleMonthNumber as month } from './lifestyleCommon';
export function newCompanion(world: World, pet: Pet): NonNullable<Pet['companion']> { return { version: 1, enabled: { ...world.date }, healthVersion: 2, ageRelated: false, supportUntil: month(world), trait: petTrait(pet.offerId), training: 0, tricks: [], condition: 'well', recovery: 0, lastHealthMonth: month(world), preventionUntil: month(world), lastCompetitionYear: null }; }
export function horseHousing(world: World, ownerId: string) { return homeAmenity(world, 'stable', ownerId); }
