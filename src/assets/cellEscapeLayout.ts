export const cellEscapeAtlasSize = [1536, 1024] as const;
export const cellObjectRects = {
  door: [38, 23, 679, 980],
  plate: [745, 712, 253, 273],
  open: [1013, 687, 227, 306],
  window: [1245, 748, 283, 194],
} as const;
export const cellKeyRects = {
  circle: [812, 11, 141, 311],
  triangle: [1068, 10, 154, 313],
  square: [1333, 11, 143, 312],
  diamond: [805, 342, 154, 324],
  star: [1061, 342, 163, 324],
  hexagon: [1327, 348, 154, 318],
} as const;
// Shaft anchors are relative to each clip. Exact teeth are drawn by the UI.
export const cellKeyTeeth = {
  circle: [83, 211],
  triangle: [88, 212],
  square: [83, 211],
  diamond: [89, 226],
  star: [94, 226],
  hexagon: [89, 220],
} as const;
