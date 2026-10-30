export const features = ['athlete', 'astronaut', 'cult', 'military', 'god_mode', 'time_machine'] as const;
export type PremiumFeature = typeof features[number];
export const careerFeatures = features.slice(0, 4) as readonly PremiumFeature[];
export const products = {
  'dreams.athlete': { title: 'Athlete Career', features: ['athlete'], description: 'Team contracts, twelve-month seasons, matches and performance management.' },
  'dreams.astronaut': { title: 'Astronaut Career', features: ['astronaut'], description: 'Space programme training, qualifications and research assignments.' },
  'dreams.cult': { title: 'Cult Leader Career', features: ['cult'], description: 'Found a cult, choose beliefs, recruit followers and manage communal headquarters.' },
  'dreams.military': { title: 'Military Career', features: ['military'], description: 'Service training, fixed contracts, branches and assignments.' },
  'dreams.god_mode': { title: 'God Mode', features: ['god_mode'], description: 'Edit money, stats, skills and relationships. Choose a royal birth in New Life.' },
  'dreams.time_machine': { title: 'Unlimited Time Machine', features: ['time_machine'], description: 'Unlimited checkpoint restores and new timeline branches across every life.' },
  'dreams.career_pass': { title: 'All Careers Pass', features: ['athlete', 'astronaut', 'cult', 'military'], description: 'Permanently unlock all four premium careers across every life.' },
  'dreams.full_unlock': { title: 'Full Unlock', features: [...features], description: 'All premium careers, God Mode and unlimited Time Machine across every life.' },
} as const satisfies Record<string, { title: string; features: readonly PremiumFeature[]; description: string }>;
export type ProductId = keyof typeof products;
export const productIds = Object.keys(products) as ProductId[];
export type Ownership = Readonly<Record<PremiumFeature, boolean>>;
export const noOwnership = (): Ownership => Object.fromEntries(features.map(feature => [feature, false])) as Record<PremiumFeature, boolean>;
export const ownsProduct = (ownership: Ownership, id: ProductId): boolean => products[id].features.every(feature => ownership[feature]);
export const featureProduct = (feature: PremiumFeature): ProductId => ('dreams.' + feature) as ProductId;
export function paywallProducts(feature: PremiumFeature): ProductId[] {
  return [featureProduct(feature), ...(careerFeatures.includes(feature) ? ['dreams.career_pass' as const] : []), 'dreams.full_unlock'];
}
