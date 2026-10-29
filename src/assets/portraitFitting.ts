import { headFits, naturalFaces } from './portraitFit';

// Each authored wig has its own reference head and fitting response. Curly
// volume and buns respond less to jaw width than close-fitting straight hair.
// The head illustrations themselves never scale in response to a hairstyle.
const hairProfiles = [
  [0,1,.8], [1,1,.9], [2,.95,.8], [3,.85,.7],
  [4,1,.9], [5,.85,.7], [6,1,.9], [7,.95,.8],
  [8,1,.9], [9,1,.8], [10,.95,.9], [11,.95,.9],
  [12,.85,.8], [13,.75,.75], [14,.95,.8], [15,1,.9],
  [0,1,.8], [3,.85,.7], [0,1,.8], [4,1,.9],
  [10,.95,.9], [1,.6,.6], [13,.75,.75],
] as const;

export function fitPortraitHair(wig: number, identity: number, stage: number, face: number) {
  const target = headFits[identity][stage][face];
  const [referenceIdentity, widthResponse, heightResponse] = hairProfiles[wig];
  const reference = headFits[referenceIdentity][3][naturalFaces[referenceIdentity]];
  const scaleX = Math.max(.86,Math.min(1.2,1+(target[1]/reference[1]-1)*widthResponse));
  const scaleY = Math.max(.92,Math.min(1.1,1+((140-target[2])/(140-reference[2])-1)*heightResponse));
  return { left:target[0]-160*scaleX, top:target[2]-reference[2]*scaleY,
    width:320*scaleX, height:320*scaleY };
}
