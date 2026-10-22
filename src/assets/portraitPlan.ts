import type { Person } from '../game/model';
import { facialIdentity } from '../game/appearance';
import { portraitImages, type PortraitAsset } from './portraitImages';
import { portraitAgeStage, type PortraitAgeStage } from './portraitLayout';

export const portraitCanvasSize = 320;
export const identityHair = [3,4,3,2,4,2,4,3,4,1,5,4,3,5,3,4] as const;
export type PortraitTraits = {
  identity: number; face: number; skin: number; hair: number;
  stage: PortraitAgeStage; hairColor: number; grey: number; clothing: number;
};
export type PortraitLayer = {
  asset: PortraitAsset; left: number; top: number; width: number; height: number;
  opacity?: number;
  /** A single face-shape tile inside a four-contour head atlas. */
  crop?: { left: number; top: number; width: number; height: number };
};

/** Scalars keep unchanged drawings memoized across save copies and renames. */
export function portraitTraits(appearance: Person['appearance'], age: number, personId?: string): PortraitTraits {
  const identity = appearance.identity ?? (personId ? facialIdentity(personId) : 0), stage = portraitAgeStage(age);
  return { identity, face: appearance.face, skin: appearance.skin,
    hair: stage === 0 ? 0 : appearance.hair, stage, hairColor: stage === 0 || appearance.hair === 0 ? 0 : appearance.hairColor,
    grey: stage === 0 || appearance.hair === 0 ? 0 : Math.max(0, Math.min(.9, (age-45)/60)),
    clothing: appearance.outfit ?? identity };
}

/** Pure local layer plan, shared by the app and visual verification. */
export function portraitLayers({ identity, face, skin, hair, stage, hairColor, grey, clothing }: PortraitTraits): PortraitLayer[] {
  const layers: PortraitLayer[] = [];
  const add = (asset: PortraitAsset, opacity = 1, scale = 1, left = 0, top = 0) => {
    if (asset in portraitImages) layers.push({ asset, opacity, width: 320*scale, height: 320*scale, left, top });
  };
  const wig = hair === identityHair[identity] ? identity : 15+hair;
  const hairPart = (part: 'back' | 'front') => {
    add(`hair-${wig}-${hairColor}-${part}` as PortraitAsset);
    if (grey > 0) add(`hair-${wig}-5-${part}` as PortraitAsset, grey);
  };
  if (hair) hairPart('back');
  const bodyScale = [0.78,0.88,0.96,1,1,1,1,1][stage];
  add(`body-${identity}-${skin}` as PortraitAsset, 1, bodyScale, 160*(1-bodyScale),320*(1-bodyScale));
  layers.push({ asset: `head-${identity}-${stage}-${skin}` as PortraitAsset,
    left: 24, top: 44, width: 272, height: 248,
    crop: { left: -face*272, top: 0, width: 1088, height: 248 } });
  add(`clothing-${clothing}` as PortraitAsset, 1, bodyScale, 160*(1-bodyScale),320*(1-bodyScale));
  if (hair) hairPart('front');
  return layers;
}
