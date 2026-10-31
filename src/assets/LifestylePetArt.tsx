import React from 'react';
import { Image, View } from 'react-native';
/** Original generated PNG; these measured rectangles only clip at render time. */
export const lifestylePetRects = {
    hamster: [82, 23, 397, 450], 'guinea-pig': [549, 50, 465, 418], turtle: [1037, 100, 486, 365],
    fish: [32, 504, 518, 469], horse: [566, 471, 509, 530], rosette: [1118, 546, 333, 424],
} as const;
export type LifestylePetArtId = keyof typeof lifestylePetRects;
export function LifestylePetArt({ id, size = 40 }: {
    id: LifestylePetArtId;
    size?: number;
}) { const [x, y, width, height] = lifestylePetRects[id], scale = size / Math.max(width, height); return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}><View style={{ width: width * scale, height: height * scale, overflow: 'hidden' }}><Image source={require('../../assets/generated/lifestyle-pets-atlas.png')} accessible={false} resizeMode="stretch" style={{ position: 'absolute', width: 1536 * scale, height: 1024 * scale, left: -x * scale, top: -y * scale }}/></View></View>; }
