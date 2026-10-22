import type { Person } from '../game/model';
import type { PortraitAsset } from './portraitImages';
import { headWidths } from './portraitGeometry';
import { ageingHairColor, hairColors, portraitAgeStage, skinTones, type PortraitAgeStage } from './portraitLayout';

export const portraitCanvasSize = 512;
type Appearance = Person['appearance'];
export type PortraitTraits = {
  face: number; skin: number; hair: number; stage: PortraitAgeStage;
  hairTone: string; clothing: number;
};
export type PortraitLayer = {
  asset: PortraitAsset; color?: string;
  left: number; top: number; width: number; height: number;
};

/** Deterministic presentation only. Never consumes simulation randomness. */
export function portraitTraits(appearance: Appearance, age: number): PortraitTraits {
  const stage = portraitAgeStage(age);
  return {
    face: appearance.face, skin: appearance.skin,
    hair: stage === 0 ? 0 : appearance.hair, stage,
    hairTone: stage === 0 || appearance.hair === 0 ? '' : ageingHairColor(hairColors[appearance.hairColor], age),
    clothing: (appearance.face + appearance.skin + appearance.hair * 3 + appearance.hairColor * 2) % 4,
  };
}

/** Shared by native rendering and visual review. Positions use the 512px rig. */
export function portraitLayers({ face, skin, hair, stage, hairTone, clothing }: PortraitTraits): PortraitLayer[] {
  const layers: PortraitLayer[] = [];
  const add = (asset: PortraitAsset, color?: string, width = portraitCanvasSize, height = portraitCanvasSize, left = 0, top = 0) => {
    layers.push({ asset, color, width, height, left, top });
  };
  // Each face contour is independently illustrated. Only wigs fit skull width;
  // facial features, jaw, ears and clothing never stretch with the hair.
  const hairFit = Math.max(.93, Math.min(1.17, headWidths[face][stage] / headWidths[0][3]));
  const hairWidth = portraitCanvasSize * hairFit;
  const hairLeft = (portraitCanvasSize - hairWidth) / 2;
  const hairPart = (part: 'back' | 'front') => {
    add(`hair-${hair}-${part}-mask` as PortraitAsset, hairTone, hairWidth, portraitCanvasSize, hairLeft);
    add(`hair-${hair}-${part}-detail` as PortraitAsset, undefined, hairWidth, portraitCanvasSize, hairLeft);
  };
  if ([4, 5, 7].includes(hair)) hairPart('back');
  add(`head-${face}-${stage}-mask` as PortraitAsset, skinTones[skin]);
  add(`head-${face}-${stage}-detail` as PortraitAsset);
  const clothingScale = stage === 0 ? .8 : stage === 1 ? .88 : stage === 2 ? .96 : 1;
  add(`clothing-${clothing}` as PortraitAsset, undefined, portraitCanvasSize * clothingScale, portraitCanvasSize * clothingScale,
    portraitCanvasSize * (1 - clothingScale) / 2, 430 * (1 - clothingScale));
  if (hair) hairPart('front');
  return layers;
}
