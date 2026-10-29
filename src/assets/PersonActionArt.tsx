import React from 'react';
import { Image, View } from 'react-native';
import { personActionImages } from './personActionImages';

export type PersonActionArtId = keyof typeof personActionImages;
export const personActionArtIds = Object.freeze(Object.keys(personActionImages)) as readonly PersonActionArtId[];
export const isPersonActionArtId = (id: string): id is PersonActionArtId => Object.hasOwn(personActionImages, id);

/** Explicit action-specific artwork, shared by profile rows and their saved results. */
export const PersonActionArt = React.memo(function PersonActionArt({ id, size = 40 }: { id: PersonActionArtId; size?: number }) {
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    style={{ width: size, height: size, flexShrink: 0, alignItems: 'center', justifyContent: 'center' }}>
    <Image accessible={false} source={personActionImages[id]} resizeMode="contain" fadeDuration={0} style={{ width: size, height: size }} />
  </View>;
});
