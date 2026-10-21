export const dateActivityIds = ['walk', 'coffee', 'meal', 'movie'] as const;
export type DateActivity = typeof dateActivityIds[number];
