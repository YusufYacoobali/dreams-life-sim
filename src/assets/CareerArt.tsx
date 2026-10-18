import React from 'react';
import { Image, View } from 'react-native';
import { careerRects } from './careerLayout';
const atlas = require('../../assets/generated/career-atlas.png');
export type CareerArtId = keyof typeof careerRects;
export function CareerArt({ id, size = 48 }: {
    id: CareerArtId;
    size?: number;
}) {
    const [x, y, width, height] = careerRects[id], scale = size / Math.max(width, height);
    return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}><View style={{ width: width * scale, height: height * scale, overflow: 'hidden' }}><Image source={atlas} accessible={false} resizeMode="stretch" style={{ position: 'absolute', width: 1254 * scale, height: 1254 * scale, left: -x * scale, top: -y * scale }}/></View></View>;
}
