import React from 'react';
import { Image, View } from 'react-native';
import { ownershipAtlasSize, ownershipRect } from './ownershipLayout';
import { FamilyArt } from './FamilyArt';
import { catalogueArt, catalogueAtlasSizes } from './catalogueLayout';
const atlas = require('../../assets/generated/ownership-atlas.png');
const catalogueAtlases = {
  homes: require('../../assets/generated/catalogue-homes.png'),
  vehicles: require('../../assets/generated/catalogue-vehicles.png'),
  'lifestyle-vehicles': require('../../assets/generated/catalogue-lifestyle-vehicles.png'),
};
/** Measured source regions preserve aspect and leave the generated PNG untouched. */
export function CatalogArt({ id, size = 56 }: { id: string; size?: number }) {
  if (id === 'engagement-ring') return <FamilyArt id="rings" size={size} />;
  const illustration = catalogueArt[id];
  const [x, y, width, height] = illustration?.rect ?? ownershipRect(id);
  const image = illustration ? catalogueAtlases[illustration.atlas] : atlas;
  const [atlasWidth, atlasHeight] = illustration ? catalogueAtlasSizes[illustration.atlas] : ownershipAtlasSize;
  const scale = size / Math.max(width, height);
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: width * scale, height: height * scale, overflow: 'hidden' }}><Image accessible={false} source={image} resizeMode="stretch" style={{ position: 'absolute', width: atlasWidth * scale, height: atlasHeight * scale, left: -x * scale, top: -y * scale }} /></View>
  </View>;
}
