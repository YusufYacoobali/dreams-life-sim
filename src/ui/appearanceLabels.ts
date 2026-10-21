import type { Person } from '../game/model';
import { faceLabels, hairLabels } from '../assets/portraitLayout';

// Neutral descriptions of the existing palette, in its unchanged light-to-dark order.
export const skinToneDescriptions = ['very light', 'light', 'medium', 'tan', 'brown', 'deep brown'] as const;
export const hairColorLabels = ['Black', 'Brown', 'Chestnut', 'Blond', 'Auburn'] as const;
export const skinToneLabel = (index: number) => 'Skin tone ' + (index + 1) + ', ' + skinToneDescriptions[index];
export function appearanceDescription(appearance: Person['appearance']) {
  const hair = appearance.hair === 0 ? 'bald' : hairColorLabels[appearance.hairColor].toLowerCase() + ' ' + hairLabels[appearance.hair].toLowerCase() + ([1, 3, 4].includes(appearance.hair) ? ' hair' : '');
  return faceLabels[appearance.face].toLowerCase() + ' face, ' + skinToneDescriptions[appearance.skin] + ' skin tone, ' + hair;
}
export const avatarLabel = (appearance: Person['appearance'], index: number) => 'Avatar ' + (index + 1) + ', ' + appearanceDescription(appearance);
