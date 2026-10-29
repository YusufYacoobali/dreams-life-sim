// Shared duration rule: validators do not load education command handlers.
export const courseMonths = (program: 'university' | 'trade' | 'graduate', field: string) => program === 'trade' ? 24 : program === 'graduate' && field === 'law' ? 36 : 48;
