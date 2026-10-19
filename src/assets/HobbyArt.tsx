import React from 'react';
import { Image, View } from 'react-native';
import type { HobbyKind } from '../game/content/leisure';
import { PetsLeisureArt } from './PetsLeisureArt';
import { ordinaryHobbyAtlasSize, ordinaryHobbyRects } from './ordinaryHobbyLayout';

const atlas = require('../../assets/generated/ordinary-hobby-atlas.png');
export type OrdinaryHobbyArtId = keyof typeof ordinaryHobbyRects;
export const ordinaryHobbyIllustrations = { 'leisure-reading': 'reading', 'leisure-gaming': 'gaming', 'leisure-cooking': 'cooking', 'leisure-gardening': 'gardening' } as const;
const ordinary = (kind: HobbyKind): kind is OrdinaryHobbyArtId => kind in ordinaryHobbyRects;

/** Render the original transparent artwork at its reviewed native clipping bounds. */
export function OrdinaryHobbyArt({ id, size = 40, label }: { id: OrdinaryHobbyArtId; size?: number; label?: string }) {
  const [x, y, width, height] = ordinaryHobbyRects[id], scale = size / Math.max(width, height);
  return <View accessible={!!label} accessibilityRole={label ? 'image' : undefined} accessibilityLabel={label}
    accessibilityElementsHidden={!label} importantForAccessibility={label ? 'yes' : 'no-hide-descendants'}
    style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: width * scale, height: height * scale, overflow: 'hidden' }}>
      <Image source={atlas} accessible={false} resizeMode="stretch" style={{ position: 'absolute', width: ordinaryHobbyAtlasSize[0] * scale, height: ordinaryHobbyAtlasSize[1] * scale, left: -x * scale, top: -y * scale }} />
    </View>
  </View>;
}

export function HobbyArt({ kind, size = 40 }: { kind: HobbyKind; size?: number }) {
  return ordinary(kind) ? <OrdinaryHobbyArt id={kind} size={size} /> : <PetsLeisureArt id={kind} size={size} />;
}
