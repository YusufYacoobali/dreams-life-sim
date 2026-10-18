export const ownershipAtlasSize = [1376, 1143] as const;
export const ownershipRows = [0, 350, 580, 870, 1143] as const;
export const ownershipColumns = [0, 344, 688, 1032, 1376] as const;
export const ownershipCells: Record<string, readonly [number, number]> = {
  studio: [0, 0], apartment: [0, 0], penthouse: [0, 0], terrace: [1, 0], 'family-house': [2, 0], 'country-home': [3, 0],
  'used-compact': [0, 1], 'city-car': [0, 1], 'family-car': [1, 1], 'electric-car': [2, 1], 'sports-car': [3, 1], motorbike: [0, 2],
  watch: [1, 2], guitar: [2, 2], laptop: [3, 2], camera: [0, 3], painting: [1, 3], 'rare-book': [2, 3], portfolio: [3, 3],
};
export function ownershipRect(id: string): readonly [number, number, number, number] {
  const [column, row] = ownershipCells[id] ?? ownershipCells.portfolio;
  const x = ownershipColumns[column], y = ownershipRows[row];
  return [x, y, ownershipColumns[column + 1] - x, id === 'guitar' ? 270 : ownershipRows[row + 1] - y];
}
