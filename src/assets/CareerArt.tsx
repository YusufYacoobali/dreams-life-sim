import React from 'react';
import { Image, View } from 'react-native';
import { careerRects } from './careerLayout';
import { SimpleSymbolArt, type SimpleSymbolArtId } from './SimpleSymbolArt';
const atlas = require('../../assets/generated/career-atlas.png');
export type CareerArtId = keyof typeof careerRects;
const simpleSymbols: Partial<Record<CareerArtId, SimpleSymbolArtId>> = {
    athlete: 'ball', politician: 'podium', science: 'telescope',
    concert: 'microphone', training: 'dumbbell', film: 'film-camera',
};
export function CareerArt({ id, size = 48 }: {
    id: CareerArtId;
    size?: number;
}) {
    const symbol = simpleSymbols[id];
    if (symbol) return <SimpleSymbolArt id={symbol} size={size} />;
    const [x, y, width, height] = careerRects[id], scale = size / Math.max(width, height);
    return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}><View style={{ width: width * scale, height: height * scale, overflow: 'hidden' }}><Image source={atlas} accessible={false} resizeMode="stretch" style={{ position: 'absolute', width: 1254 * scale, height: 1254 * scale, left: -x * scale, top: -y * scale }}/></View></View>;
}
