export const petSpecies = ['dog', 'cat', 'rabbit', 'parrot'] as const;
export type PetSpecies = typeof petSpecies[number];
export const petRules = {
  dog: { label: 'Dog', foodBps: 10, adoptionBps: 100, minimumLife: 120, maximumLife: 204 },
  cat: { label: 'Cat', foodBps: 7, adoptionBps: 60, minimumLife: 144, maximumLife: 240 },
  rabbit: { label: 'Rabbit', foodBps: 5, adoptionBps: 30, minimumLife: 72, maximumLife: 144 },
  parrot: { label: 'Parrot', foodBps: 8, adoptionBps: 80, minimumLife: 240, maximumLife: 600 },
} as const;
export const petOfferIds = ['buddy', 'milo', 'luna', 'cleo', 'pip', 'olive'] as const;
export const petOffers: Record<typeof petOfferIds[number], { species: PetSpecies; breed: string; name: string; ageMonths: number; description: string }> = {
  buddy: { species: 'dog', breed: 'Golden Retriever', name: 'Buddy', ageMonths: 12, description: 'A young retriever with an extremely optimistic view of tennis balls.' },
  milo: { species: 'dog', breed: 'Mixed Breed', name: 'Milo', ageMonths: 72, description: 'A gentle older dog who takes sofa arrangements seriously.' },
  luna: { species: 'cat', breed: 'Domestic Shorthair', name: 'Luna', ageMonths: 12, description: 'Curious, affectionate and convinced your keyboard is a heated bed.' },
  cleo: { species: 'cat', breed: 'Domestic Shorthair', name: 'Cleo', ageMonths: 84, description: 'A calm adult cat looking for a sunny spot and a familiar person.' },
  pip: { species: 'rabbit', breed: 'Dwarf Rabbit', name: 'Pip', ageMonths: 6, description: 'A bright little rabbit who appreciates quiet company and fresh greens.' },
  olive: { species: 'parrot', breed: 'Companion Parrot', name: 'Olive', ageMonths: 36, description: 'A sociable bird with a long future and strong opinions about breakfast.' },
};
