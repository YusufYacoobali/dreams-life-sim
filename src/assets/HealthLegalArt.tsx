import React from 'react';
import { Image, View } from 'react-native';
import { healthLegalRects } from './healthLegalLayout';
const atlas = require('../../assets/generated/health-legal-atlas.png');
export type HealthLegalArtId = keyof typeof healthLegalRects;
export function HealthLegalArt({ id, size = 48 }: { id: HealthLegalArtId; size?: number }) {
  const [x, y, width, height] = healthLegalRects[id], scale = size / Math.max(width, height);
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}><View style={{ width: width * scale, height: height * scale, overflow: 'hidden' }}><Image source={atlas} accessible={false} resizeMode="stretch" style={{ position: 'absolute', width: 1254 * scale, height: 1254 * scale, left: -x * scale, top: -y * scale }} /></View></View>;
}
