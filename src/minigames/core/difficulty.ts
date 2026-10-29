// Only new attempts use this setting. Saved attempts replay their own difficulty.
export const newChallengeDifficulty = 3;

/** Decorative/challenge entropy is independent of every life-simulation RNG. */
export function challengeSeed(text: string) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++)
    hash = Math.imul(hash ^ text.charCodeAt(i), 16777619) >>> 0;
  return hash;
}
export function difficultyFor(skill: number, periods: number) {
  return Math.max(
    1,
    Math.min(
      5,
      5 -
        Math.floor(
          (Math.max(0, Math.min(100, skill)) +
            Math.min(25, Math.max(0, periods))) /
            25,
        ),
    ),
  );
}
