/** Illustration style hints for automatic casting, never player restrictions.
 * Indices identify the existing 16 heads, 8 hairstyles and 16 garments.
 */
export type ArtworkPresentation = 'masculine' | 'feminine' | 'neutral';
type ArtworkTags = readonly ArtworkPresentation[];
export const faceArtworkTags: readonly ArtworkTags[] = [
  ['masculine','neutral'], ['feminine'], ['masculine'], ['masculine'],
  ['feminine','neutral'], ['masculine','neutral'], ['feminine','neutral'], ['masculine'],
  ['feminine'], ['masculine'], ['feminine'], ['feminine'],
  ['masculine','neutral'], ['feminine'], ['masculine'], ['feminine','neutral'],
];
export const hairArtworkTags: readonly ArtworkTags[] = [
  ['neutral'], ['masculine','neutral'], ['masculine','neutral'], ['masculine','neutral'],
  ['feminine'], ['feminine'], ['feminine','neutral'], ['feminine','neutral'],
];
export const clothingArtworkTags: readonly ArtworkTags[] = [
  ['masculine','neutral'], ['feminine'], ['masculine','neutral'], ['neutral'],
  ['feminine'], ['neutral'], ['feminine'], ['masculine','neutral'],
  ['feminine'], ['masculine','neutral'], ['feminine'], ['feminine'],
  ['masculine','neutral'], ['feminine'], ['neutral'], ['feminine'],
];

/** Neutral casting uses a balanced selection of the existing facial drawings.
 * The style belongs to the artwork; it makes no claim about a person's gender.
 */
export const automaticArtworkPools = {
  masculine: { identities:[0,2,3,5,7,9,12,14], hair:[0,1,2,3], outfits:[0,2,3,5,7,9,12,14] },
  feminine: { identities:[1,4,6,8,10,11,13,15], hair:[1,2,4,5,6,7], outfits:[1,3,4,5,6,8,10,11,13,14,15] },
  neutral: { identities:[0,4,5,6,12,15], hair:[0,1,2,3,6,7], outfits:[0,2,3,5,7,9,12,14] },
} as const;

export function supportsArtworkPresentation(tags: readonly ArtworkPresentation[], presentation: ArtworkPresentation) {
  return tags.includes(presentation) || presentation !== 'neutral' && tags.includes('neutral');
}
