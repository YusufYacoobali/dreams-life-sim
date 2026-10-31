export const petSpecies = ['dog', 'cat', 'rabbit', 'parrot', 'hamster', 'guinea-pig', 'turtle', 'fish', 'horse'] as const;
export type PetSpecies = typeof petSpecies[number];
export const petRules = {
  dog: { label: 'Dog', foodBps: 10, adoptionBps: 100, minimumLife: 120, maximumLife: 204 },
  cat: { label: 'Cat', foodBps: 7, adoptionBps: 60, minimumLife: 144, maximumLife: 240 },
  rabbit: { label: 'Rabbit', foodBps: 5, adoptionBps: 30, minimumLife: 72, maximumLife: 144 },
  parrot: { label: 'Parrot', foodBps: 8, adoptionBps: 80, minimumLife: 240, maximumLife: 600 },
  hamster: { label: 'Hamster', foodBps: 2, adoptionBps: 10, minimumLife: 18, maximumLife: 36 },
  'guinea-pig': { label: 'Guinea Pig', foodBps: 4, adoptionBps: 20, minimumLife: 48, maximumLife: 96 },
  turtle: { label: 'Turtle', foodBps: 4, adoptionBps: 45, minimumLife: 240, maximumLife: 600 },
  fish: { label: 'Fish', foodBps: 2, adoptionBps: 8, minimumLife: 24, maximumLife: 72 },
  horse: { label: 'Horse', foodBps: 95, adoptionBps: 1500, minimumLife: 240, maximumLife: 420 },
} as const;
export const legacyPetOfferIds = ['buddy', 'milo', 'luna', 'cleo', 'pip', 'olive'] as const;
export const petOfferIds = ['buddy', 'milo', 'luna', 'cleo', 'pip', 'olive', 'archie', 'dot', 'jet', 'pearl', 'rocket', 'biscuit', 'doug', 'pebble', 'admiral', 'maple'] as const;
export const petOffers: Record<typeof petOfferIds[number], { species: PetSpecies; breed: string; name: string; ageMonths: number; description: string }> = {
  buddy: { species: 'dog', breed: 'Golden Retriever', name: 'Buddy', ageMonths: 12, description: 'A young retriever with an extremely optimistic view of tennis balls.' },
  milo: { species: 'dog', breed: 'Mixed Breed', name: 'Milo', ageMonths: 72, description: 'A gentle older dog who takes sofa arrangements seriously.' },
  luna: { species: 'cat', breed: 'Domestic Shorthair', name: 'Luna', ageMonths: 12, description: 'Curious, affectionate and convinced your keyboard is a heated bed.' },
  cleo: { species: 'cat', breed: 'Domestic Shorthair', name: 'Cleo', ageMonths: 84, description: 'A calm adult cat looking for a sunny spot and a familiar person.' },
  pip: { species: 'rabbit', breed: 'Dwarf Rabbit', name: 'Pip', ageMonths: 6, description: 'A bright little rabbit who appreciates quiet company and fresh greens.' },
  olive: { species: 'parrot', breed: 'Companion Parrot', name: 'Olive', ageMonths: 36, description: 'A sociable bird with a long future and strong opinions about breakfast.' },
  archie: { species: 'dog', breed: 'Cocker Spaniel', name: 'Archie', ageMonths: 8, description: 'A breeder’s young spaniel: affectionate, energetic and catastrophically damp after every drink.' },
  dot: { species: 'dog', breed: 'Retired Greyhound', name: 'Dot', ageMonths: 60, description: 'A rescue greyhound who runs briefly and then retires to the furniture.' },
  jet: { species: 'dog', breed: 'Border Collie', name: 'Jet', ageMonths: 24, description: 'A shelter collie looking for someone with a project. Any project. Immediately.' },
  pearl: { species: 'cat', breed: 'Persian', name: 'Pearl', ageMonths: 18, description: 'A domestic breeder’s affectionate cat who expects grooming to feature heavily in your plans.' },
  rocket: { species: 'cat', breed: 'Tabby', name: 'Rocket', ageMonths: 6, description: 'A rescue kitten who considers gravity a suggestion.' },
  biscuit: { species: 'hamster', breed: 'Syrian Hamster', name: 'Biscuit', ageMonths: 3, description: 'A specialist domestic adoption. Small, curious and committed to nocturnal interior design.' },
  doug: { species: 'guinea-pig', breed: 'Domestic Guinea Pig', name: 'Doug', ageMonths: 12, description: 'A rescue companion with a remarkably accurate vegetable clock.' },
  pebble: { species: 'turtle', breed: 'Domestic Pond Turtle', name: 'Pebble', ageMonths: 36, description: 'A specialist companion with a proper habitat and a lengthy view of friendship.' },
  admiral: { species: 'fish', breed: 'Domestic Goldfish', name: 'Admiral', ageMonths: 6, description: 'A specialist adoption including a suitable tank. Recognises feeding time better than most humans.' },
  maple: { species: 'horse', breed: 'Rescue Cob', name: 'Maple', ageMonths: 120, description: 'A horse-rescue companion. Kind eyes, substantial care costs and a requirement for suitable grounds.' },
};
export const petAdoptionRoutes = ['shelter', 'rescue', 'breeder', 'specialist', 'horse-rescue'] as const;
export function petRoute(id: typeof petOfferIds[number]): typeof petAdoptionRoutes[number] { if (['archie', 'pearl'].includes(id)) return 'breeder'; if (['dot', 'rocket', 'doug'].includes(id)) return 'rescue'; if (['biscuit', 'pebble', 'admiral'].includes(id)) return 'specialist'; return id === 'maple' ? 'horse-rescue' : 'shelter'; }
export function petTrait(id: typeof petOfferIds[number]) { return ({ buddy: 'loyal', milo: 'affectionate', luna: 'curious', cleo: 'affectionate', pip: 'nervous', olive: 'mischievous', archie: 'energetic', dot: 'nervous', jet: 'stubborn', pearl: 'affectionate', rocket: 'mischievous', biscuit: 'curious', doug: 'loyal', pebble: 'stubborn', admiral: 'curious', maple: 'loyal' } as const)[id]; }

/** Prospective route/age prices; missing pricingVersion keeps the original species fee. */
export const petOfferFeeBpsV1: Record<typeof petOfferIds[number], number> = { buddy: 100, milo: 30, luna: 60, cleo: 20, pip: 30, olive: 80, archie: 500, dot: 50, jet: 80, pearl: 300, rocket: 45, biscuit: 10, doug: 20, pebble: 45, admiral: 8, maple: 1500 };
