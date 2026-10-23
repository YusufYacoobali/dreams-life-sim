import React from 'react';
import { Image, View } from 'react-native';
import { jobImages } from './jobImages';

export type JobArtId = keyof typeof jobImages;
export const jobArtIds = Object.freeze(Object.keys(jobImages)) as readonly JobArtId[];
export const isJobArtId = (id: string): id is JobArtId => Object.hasOwn(jobImages, id);

/** Every ordinary role has its own original illustration; special roles use their own caller. */
export const JobArt = React.memo(function JobArt({ id, size = 40 }: { id: string; size?: number }) {
  const source = jobImages[id as JobArtId];
  if (!source) return null;
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    style={{ width: size, height: size, flexShrink: 0, alignItems: 'center', justifyContent: 'center' }}>
    <Image accessible={false} source={source} resizeMode="contain" fadeDuration={0} style={{ width: size, height: size }} />
  </View>;
});
