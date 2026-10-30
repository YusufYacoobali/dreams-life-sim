export const dateActivityIds = ['walk', 'coffee', 'meal', 'movie', 'dinner', 'outing', 'park', 'concert', 'cooking', 'surprise'] as const;
export type DateActivity = typeof dateActivityIds[number];
