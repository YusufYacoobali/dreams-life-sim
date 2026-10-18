/** Shared fictional catalogue patterns, not real genre/listening market data. */
export const musicGenreRules = {
    pop: { audienceBps: 12000, decay: 3, description: 'Broader opening audience; faster decline' },
    rock: { audienceBps: 10000, decay: 2, description: 'Balanced opening reach and catalogue life' },
    folk: { audienceBps: 7500, decay: 1, description: 'Smaller opening audience; a longer catalogue life' },
    electronic: { audienceBps: 11500, decay: 3, description: 'Strong opening interest; faster turnover' },
    classical: { audienceBps: 6500, decay: 1, description: 'Niche opening reach; a longer catalogue life' },
} as const;
