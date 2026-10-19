import React from 'react';
import { Image, View } from 'react-native';
import { petsLeisureAtlasSize, petsLeisureRects } from './petsLeisureLayout';

const atlas = require('../../assets/generated/pets-leisure-atlas.png');
export const petIllustrations = { 'pet-dog': 'dog', 'pet-cat': 'cat', 'pet-rabbit': 'rabbit', 'pet-parrot': 'parrot', 'pet-paw': 'paw', 'pet-vet': 'vet' } as const;
export type PetsLeisureArtId = keyof typeof petsLeisureRects;
/** Native clipping preserves the generated pixels and each object's proportions. */
export function PetsLeisureArt({ id, size = 40, label }: { id: PetsLeisureArtId; size?: number; label?: string }) {
  const [x, y, width, height] = petsLeisureRects[id], scale = size / Math.max(width, height);
  return <View accessible={!!label} accessibilityRole={label ? 'image' : undefined} accessibilityLabel={label}
    accessibilityElementsHidden={!label} importantForAccessibility={label ? 'yes' : 'no-hide-descendants'}
    style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: width * scale, height: height * scale, overflow: 'hidden' }}>
      <Image source={atlas} accessible={false} resizeMode="stretch" style={{ position: 'absolute', width: petsLeisureAtlasSize[0] * scale, height: petsLeisureAtlasSize[1] * scale, left: -x * scale, top: -y * scale }} />
    </View>
  </View>;
}
