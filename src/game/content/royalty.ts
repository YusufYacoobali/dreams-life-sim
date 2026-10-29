export const royalCountries=['GB','JP','ES'] as const;
export const royalFocuses=['balanced','community','ceremonial'] as const;
export const royalRoleBps={head:20000,regent:10000,heir:7500,family:2500,child:0} as const;
export type RoyalRole=keyof typeof royalRoleBps;
/** Fictional houses with shared authored rules, not real national dynasties. */
export const royalCountryNames={GB:'Royal Household',JP:'Imperial Household',ES:'Royal Household'};
