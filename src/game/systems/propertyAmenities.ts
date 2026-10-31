import type { World } from '../model';
import { assetCatalog } from '../content/assets';
import type { AmenityId } from './lifestyleSchemas';
import { roundRatio } from '../money';
export const amenities: Record<AmenityId, {
    name: string;
    bps: number;
    minFeet: number;
    benefit: string;
}> = {
    kitchen: { name: 'Renovated kitchen', bps: 350, minFeet: 0, benefit: 'Supports cooking project work at home.' },
    bathroom: { name: 'Upgraded bathroom', bps: 250, minFeet: 0, benefit: 'Adds lasting value without changing ordinary care.' },
    gym: { name: 'Home gym', bps: 180, minFeet: 900, benefit: 'Reduces energy used by an attended running or swimming routine.' },
    garden: { name: 'Garden', bps: 150, minFeet: 700, benefit: 'Supports gardening projects and quiet pet time.' },
    'gaming-room': { name: 'Gaming room', bps: 180, minFeet: 900, benefit: 'Supports a gaming project.' },
    studio: { name: 'Music studio', bps: 250, minFeet: 1000, benefit: 'Supports guitar and singing projects.' },
    pool: { name: 'Swimming pool', bps: 650, minFeet: 2200, benefit: 'Supports a swimming project.' },
    garage: { name: 'Garage', bps: 300, minFeet: 1300, benefit: 'Reduces the price of a reviewed vehicle service by 15%.' },
    cinema: { name: 'Home cinema', bps: 280, minFeet: 1500, benefit: 'Reduces the cost of a dinner or celebration at home.' },
    office: { name: 'Home office', bps: 140, minFeet: 700, benefit: 'Supports writing and coding projects.' },
    workshop: { name: 'Workshop', bps: 220, minFeet: 1300, benefit: 'Supports pottery projects.' },
    stable: { name: 'Animal-friendly grounds', bps: 450, minFeet: 2200, benefit: 'Enables horse adoption at a suitable country property.' },
};
export const hasBuiltInAmenity = (asset: World['assets'][number], kind: AmenityId) => kind === 'pool' && asset.catalogId === 'modern-villa' || kind === 'garden' && ['garden-flat', 'country-home', 'country-estate'].includes(asset.catalogId) || kind === 'stable' && asset.catalogId === 'country-estate';
export const hasAmenity = (asset: World['assets'][number], kind: AmenityId) => hasBuiltInAmenity(asset, kind) || !!asset.propertyLife?.amenities.some(row => row.kind === kind);
export function amenityReason(asset: World['assets'][number], kind: AmenityId, world?: World) {
    const offer = assetCatalog.find(row => row.id === asset.catalogId);
    if (!asset.propertyLife || asset.kind !== 'property') return 'Enable management for this property first';
    if (hasAmenity(asset, kind)) return 'This home already has this amenity';
    if (asset.rental !== 'none' || asset.listing) return 'Install improvements while the home is vacant and unlisted';
    if ((offer?.squareFeet ?? 0) < amenities[kind].minFeet) return 'This property does not have enough space';
    if ((kind === 'garden' || kind === 'pool' || kind === 'stable') && ['studio', 'apartment', 'penthouse', 'village-flat', 'warehouse-loft'].includes(asset.catalogId)) return 'This property has no suitable private grounds';
    if (kind === 'stable' && !['country-home', 'country-estate', 'family-house'].includes(asset.catalogId)) return 'Choose suitable country or family grounds';
    if (world && asset.primaryHome && ['gym', 'gaming-room', 'studio', 'cinema', 'office', 'workshop'].includes(kind)) {
        const owner = asset.ownerId ? world.people[asset.ownerId] : undefined;
        const occupants = owner?.householdId ? Object.values(world.people).filter(person => !person.died && person.householdId === owner.householdId && person.country === asset.country && person.city === asset.city).length : 1;
        const dedicatedRooms = asset.propertyLife.amenities.filter(row => ['gym', 'gaming-room', 'studio', 'cinema', 'office', 'workshop'].includes(row.kind)).length;
        if (Math.ceil(occupants / 2) + dedicatedRooms + 1 > (offer?.bedrooms ?? 1)) return 'Your household needs the remaining room for living space';
    }
}
export function amenityQuote(asset: World['assets'][number], kind: AmenityId) { const base = asset.pricePaid || asset.costBasis || asset.value; const cost = roundRatio(base * BigInt(amenities[kind].bps), 10000n) || 1n; return { cost, addedValue: cost * 2n / 5n }; }
export function homeAmenity(world: World, kind: AmenityId, personId = world.activePersonId) { const person = world.people[personId], household = person.householdId && world.households.find(row => row.id === person.householdId); return world.assets.some(asset => asset.kind === 'property' && asset.rental === 'none' && asset.country === person.country && asset.city === person.city && (asset.ownerId === personId && asset.primaryHome || !!household && household.homeAssetId === asset.id) && hasAmenity(asset, kind)); }
