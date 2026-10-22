/** Stable saved option indices; artwork and colour palettes may evolve. */
export const skinTones = ['#FFD4B4', '#F0B98F', '#D99560', '#BC7749', '#985B36', '#75432E'] as const;
export const hairColors = ['#24211F', '#704329', '#B2783D', '#E5B861', '#BC5C37'] as const;
export const hairLabels = ['Bald', 'Short straight', 'Cropped curls', 'Side swept', 'Shoulder length', 'Long curls', 'Bun', 'Coily afro'] as const;
export const faceLabels = ['Oval', 'Round', 'Long', 'Broad'] as const;
export type PortraitAgeStage = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export function portraitAgeStage(age: number): PortraitAgeStage {
  return age < 3 ? 0 : age < 12 ? 1 : age < 19 ? 2 : age < 40 ? 3 : age < 60 ? 4 : age < 80 ? 5 : age < 95 ? 6 : 7;
}
/** Gradual greying changes the hair mask, never the eyes or skin. */
export function ageingHairColor(color: string, age: number): string {
  const grey = Math.max(0, Math.min(0.85, (age - 45) / 65));
  return '#' + [1, 3, 5].map(index => Math.round(parseInt(color.slice(index, index + 2), 16) * (1 - grey) + 215 * grey).toString(16).padStart(2, '0')).join('');
}
