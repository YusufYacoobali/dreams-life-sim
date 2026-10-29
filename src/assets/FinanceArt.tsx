import React from 'react';
import { Image, View } from 'react-native';
import { financeImages } from './financeImages';

export type FinanceArtId = keyof typeof financeImages;
export const financeArtIds = Object.freeze(Object.keys(financeImages)) as readonly FinanceArtId[];
export const isFinanceArtId = (id: string): id is FinanceArtId => Object.hasOwn(financeImages, id);

/** Wealth and financial records have separate original illustrations; bank artwork stays separate. */
export const FinanceArt = React.memo(function FinanceArt({ id, size = 40 }: { id: FinanceArtId; size?: number }) {
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    style={{ width: size, height: size, flexShrink: 0, alignItems: 'center', justifyContent: 'center' }}>
    <Image accessible={false} source={financeImages[id]} resizeMode="contain" fadeDuration={0} style={{ width: size, height: size }} />
  </View>;
});
