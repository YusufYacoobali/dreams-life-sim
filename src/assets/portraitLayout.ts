/** Measured source rectangles; generated source remains unmodified. */
export const portraitAtlasSize = 1254;
export const headRects = [
  [56, 70, 216, 250], [367, 44, 216, 276], [672, 20, 228, 300], [986, 10, 232, 310],
  [44, 330, 230, 310], [358, 330, 232, 310], [666, 330, 237, 310], [980, 330, 237, 310],
] as const;
export const hairRects = [
  null, [43, 650, 244, 220], [354, 649, 233, 220], [651, 648, 268, 225],
  [945, 646, 302, 310], [0, 920, 332, 334], [353, 897, 240, 350], [633, 927, 302, 276],
] as const;
export const skinTones = ['#F3D5BC', '#E5B995', '#C88F61', '#A86B45', '#7E4B30', '#4C3026'] as const;
export const hairColors = ['#271D18', '#66422D', '#B17B43', '#E8CC8B', '#BB6B42'] as const;
export const hairLabels = ['Bald', 'Short straight', 'Cropped curls', 'Side swept', 'Shoulder length', 'Long curls', 'Bun', 'Coily afro'] as const;
export const faceLabels = ['Oval', 'Round', 'Long', 'Broad'] as const;
export const faceScales = [[0.94, 1], [1.06, 0.96], [0.92, 1.04], [1.08, 1]] as const;
export type SourceRect = readonly [number, number, number, number];
export function portraitAgeStage(age: number): number {
  return age < 3 ? 0 : age < 12 ? 1 : age < 19 ? 2 : age < 40 ? 3 : age < 60 ? 4 : age < 80 ? 5 : age < 95 ? 6 : 7;
}
export function ageingHairColor(color: string, age: number): string {
  const grey = Math.max(0, Math.min(0.85, (age - 45) / 65));
  return '#' + [1, 3, 5].map(index => Math.round(parseInt(color.slice(index, index + 2), 16) * (1 - grey) + 215 * grey).toString(16).padStart(2, '0')).join('');
}
