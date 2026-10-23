import type { Person } from '../game/model';
import { facialIdentity, legacyNPCPortraitAppearance } from '../game/appearance';
import { portraitImages, type PortraitAsset } from './portraitImages';
import { portraitAgeStage, type PortraitAgeStage } from './portraitLayout';
import { fitPortraitHair } from './portraitFitting';
import { naturalFaces } from './portraitFit';

export const portraitCanvasSize = 320;
export const identityHair = [3,4,3,2,4,2,4,3,4,1,5,4,3,5,3,4] as const;
export type PortraitTraits = {
  identity: number; face: number; skin: number; hair: number;
  stage: PortraitAgeStage; hairColor: number; grey: number; clothing: number;
};
export type PortraitLayer = {
  asset: PortraitAsset; left: number; top: number; width: number; height: number;
  opacity?: number;
  skinClip?: { outfit: number; scale: number };
  /** A window into the illustrated head atlas. */
  crop?: { left: number; top: number; width: number; height: number };
};

/** Scalars keep unchanged drawings memoized across save copies and renames. */
export function portraitTraits(savedAppearance: Person['appearance'], age: number, personId?: string, legacyDefaultGender?: Person['gender']): PortraitTraits {
  const appearance = personId && legacyDefaultGender ? legacyNPCPortraitAppearance(savedAppearance,personId,legacyDefaultGender) : savedAppearance;
  const identity = appearance.identity ?? (personId ? facialIdentity(personId) : 0), stage = portraitAgeStage(age);
  return { identity, face: appearance.face, skin: appearance.skin,
    hair: stage === 0 ? 0 : appearance.hair, stage, hairColor: stage === 0 || appearance.hair === 0 ? 0 : appearance.hairColor,
    grey: stage === 0 || appearance.hair === 0 ? 0 : Math.max(0, Math.min(.9, (age-45)/60)),
    clothing: appearance.outfit ?? identity };
}

/** Pure local layer plan, shared by the app and visual verification. */
export function portraitLayers({ identity, face, skin, hair, stage, hairColor, grey, clothing }: PortraitTraits): PortraitLayer[] {
  if (stage === 0) {
    // Infant portraits use the existing baby illustration alone, centred and
    // enlarged for small profile circles. Adult jaw deformations do not fit
    // baby anatomy; use the authored contour without changing the saved face.
    // Keep saved clothes/hair for age 3+.
    const scale = 1.35;
    return [{ asset:`head-${identity}-0-${skin}` as PortraitAsset,
      left:(320-272*scale)/2, top:0,
      width:272*scale, height:248*scale,
      crop:{ left:-naturalFaces[identity]*272*scale, top:0, width:1088*scale, height:248*scale } }];
  }
  const layers: PortraitLayer[] = [];
  const add = (asset: PortraitAsset, opacity = 1, scale = 1, left = 0, top = 0) => {
    if (asset in portraitImages) layers.push({ asset, opacity, width: 320*scale, height: 320*scale, left, top });
  };
  const wig = hair === identityHair[identity] ? identity : 15+hair;
  // Young children have shorter exposed necks. Move the whole head/hair rig
  // towards the shoulders, preserving both facial and hairstyle proportions.
  const headScale = .8, headLeft = 32, headTop = stage === 1 ? 34 : 10;
  const bodyScale = [0.78,0.88,0.96,1,1,1,1,1][stage];
  // Reuse the illustrated neck/chest under each actual garment opening. The
  // clip prevents skin peeking above shoulders or leaving holes inside a V-neck.
  const body = `body-${identity}-${skin}` as PortraitAsset;
  layers.push({ asset:body,left:160-320*bodyScale,top:320-422*bodyScale,
    width:640*bodyScale,height:422*bodyScale,skinClip:{outfit:clothing,scale:bodyScale} });
  // Keep the complete head under the foreground hair. A rectangular temple
  // crop leaves holes inside authored hair openings and clips natural cheeks.
  // Opaque locks cover ears because hair is always drawn after the head.
  const bounds = { left:24,right:296 };
  // Child/teen source necks flare at their bottom edge. Keep that concealed
  // under the fitted anatomical neck rather than showing a skin-coloured rim.
  const headHeight = stage === 1 || stage === 2 ? 216 : 248;
  layers.push({ asset: `head-${identity}-${stage}-${skin}` as PortraitAsset,
    left:headLeft+bounds.left*headScale, top:headTop+44*headScale,
    width:(bounds.right-bounds.left)*headScale, height:headHeight*headScale,
    crop: { left:-(face*272+bounds.left-24)*headScale, top:0, width:1088*headScale, height:248*headScale } });
  add(`clothing-${clothing}` as PortraitAsset, 1, bodyScale, 160*(1-bodyScale),320*(1-bodyScale));
  if (hair) {
    const fit = fitPortraitHair(wig,identity,stage,face);
    const hairLayer = (color: number, opacity: number) => layers.push({ asset:`hair-${wig}-${color}-front` as PortraitAsset,
      left:headLeft+fit.left*headScale, top:headTop+fit.top*headScale,
      width:fit.width*headScale, height:fit.height*headScale, opacity });
    hairLayer(hairColor,1);
    if (grey > 0) hairLayer(5,grey);
  }
  return layers;
}
