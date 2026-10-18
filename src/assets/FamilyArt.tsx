import React from 'react';
import { Image, View } from 'react-native';
import { familyRects } from './familyLayout';
const atlas = require('../../assets/generated/family-atlas.png');
export const familyCells = familyRects;
export type FamilyArtId = keyof typeof familyCells;
export function FamilyArt({ id, size = 48 }: { id: FamilyArtId; size?: number }) {
  const [x, y, width, height] = familyRects[id]; const scale = size / Math.max(width, height);
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}><View style={{ width: width * scale, height: height * scale, overflow: 'hidden' }}><Image source={atlas} accessible={false} resizeMode="stretch" style={{ position: 'absolute', width: 1448 * scale, height: 1086 * scale, left: -x * scale, top: -y * scale }} /></View></View>;
}
