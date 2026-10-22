import React from 'react';
import { Image, View } from 'react-native';
import { polishImages, type PolishArtId } from './polishImages';

export { polishImages, type PolishArtId } from './polishImages';
export const isPolishArtId = (id: string): id is PolishArtId => Object.hasOwn(polishImages,id);

/** Original illustrations, contained within a predictable row/popup footprint. */
export const PolishArt = React.memo(function PolishArt({ id, size = 40 }: { id:PolishArtId; size?:number }) {
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    style={{ width:size,height:size,flexShrink:0,alignItems:'center',justifyContent:'center' }}>
    <Image accessible={false} source={polishImages[id]} resizeMode="contain" fadeDuration={0}
      style={{ width:size,height:size }} />
  </View>;
});
