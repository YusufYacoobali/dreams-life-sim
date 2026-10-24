import React from 'react';
import { Image, View } from 'react-native';
import { travelAtlasSize, travelRect, TravelArtId } from './travelLayout';
import { SimpleSymbolArt, type SimpleSymbolArtId } from './SimpleSymbolArt';
const atlas = require('../../assets/generated/travel-atlas.png');
const simpleSymbols: Partial<Record<TravelArtId, SimpleSymbolArtId>> = {
  flight: 'plane', passport: 'passport', holiday: 'beach-umbrella', abroad: 'suitcase',
};
// Shared action rows reserve 40px for an icon. Larger overview/detail artwork
// opts into an explicit width instead of spilling into a row's text column.
export function TravelArt({ id, width = 40 }: { id: TravelArtId; width?: number }) {
  const [x, y, sourceWidth, sourceHeight] = travelRect(id), scale = width / sourceWidth;
  const symbol = simpleSymbols[id];
  if (symbol) return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width, height: sourceHeight * scale, flexShrink: 0, overflow: 'hidden', borderRadius: 8 }}>
    <SimpleSymbolArt id={symbol} width={width} height={sourceHeight * scale} />
  </View>;
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width, height: sourceHeight * scale, flexShrink: 0, overflow: 'hidden', borderRadius: 8 }}><Image accessible={false} source={atlas} resizeMode="stretch" style={{ position: 'absolute', width: travelAtlasSize[0] * scale, height: travelAtlasSize[1] * scale, left: -x * scale, top: -y * scale }} /></View>;
}
