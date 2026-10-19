import React from 'react';
import { Image, View } from 'react-native';
import { travelAtlasSize, travelRect, TravelArtId } from './travelLayout';
const atlas = require('../../assets/generated/travel-atlas.png');
export function TravelArt({ id, width = 72 }: { id: TravelArtId; width?: number }) {
  const [x, y, sourceWidth, sourceHeight] = travelRect(id), scale = width / sourceWidth;
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width, height: sourceHeight * scale, overflow: 'hidden', borderRadius: 8 }}><Image accessible={false} source={atlas} resizeMode="stretch" style={{ position: 'absolute', width: travelAtlasSize[0] * scale, height: travelAtlasSize[1] * scale, left: -x * scale, top: -y * scale }} /></View>;
}
