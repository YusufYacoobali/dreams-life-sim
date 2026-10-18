import React from 'react';
import { Image, View } from 'react-native';
import { ownershipAtlasSize, ownershipRect } from './ownershipLayout';
const atlas = require('../../assets/generated/ownership-atlas.png');
/** Measured source regions preserve aspect and leave the generated PNG untouched. */
export function CatalogArt({ id, size = 56 }: { id: string; size?: number }) {
  const [x, y, width, height] = ownershipRect(id);
  const scale = size / Math.max(width, height);
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: width * scale, height: height * scale, overflow: 'hidden' }}><Image accessible={false} source={atlas} resizeMode="stretch" style={{ position: 'absolute', width: ownershipAtlasSize[0] * scale, height: ownershipAtlasSize[1] * scale, left: -x * scale, top: -y * scale }} /></View>
  </View>;
}
