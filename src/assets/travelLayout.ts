export const travelAtlasSize = [1536, 1024] as const;
export const travelArtIds = ['new-york', 'toronto', 'london', 'sydney', 'paris', 'berlin', 'barcelona', 'rome', 'rio', 'mumbai', 'tokyo', 'cape-town', 'flight', 'passport', 'holiday', 'abroad'] as const;
export type TravelArtId = typeof travelArtIds[number];
const columns = [14, 396, 778, 1161], rows = [12, 263, 515, 751];
export function travelRect(id: TravelArtId): readonly [number, number, number, number] {
  const index = travelArtIds.indexOf(id), column = index % 4, row = Math.floor(index / 4);
  return [columns[column], rows[row], 363, row === 3 ? 270 : 237];
}
