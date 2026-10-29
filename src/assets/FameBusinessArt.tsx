import React from 'react';
import { Image, View } from 'react-native';
import { fameBusinessRects } from './fameBusinessLayout';
const atlas = require('../../assets/generated/fame-business-atlas.png');
export type FameBusinessArtId = keyof typeof fameBusinessRects;
export function FameBusinessArt({ id, size = 48 }: { id: FameBusinessArtId; size?: number }) {
  const [x, y, width, height] = fameBusinessRects[id], scale = size / Math.max(width, height);
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}><View style={{ width: width * scale, height: height * scale, overflow: 'hidden' }}><Image source={atlas} accessible={false} resizeMode="stretch" style={{ position: 'absolute', width: 1254 * scale, height: 1254 * scale, left: -x * scale, top: -y * scale }} /></View></View>;
}
