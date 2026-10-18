import React from 'react';
import { Image, View } from 'react-native';

const atlas = require('../../assets/generated/activity-atlas.png');
export const illustrationCells = {
  education: [0, 0], career: [1, 0], relationship: [2, 0], property: [3, 0],
  money: [0, 1], vehicle: [1, 1], travel: [2, 1], pets: [3, 1],
  wellbeing: [0, 2], crime: [1, 2], journal: [2, 2], birthday: [3, 2],
} as const;
export type IllustrationId = keyof typeof illustrationCells;

/** Clip a generated atlas natively. The original image is preserved unmodified. */
export function Illustration({ id, size = 40, label }: { id: IllustrationId; size?: number; label?: string }) {
  const [column, row] = illustrationCells[id];
  const scale = size / 362;
  return <View
    accessible={!!label} accessibilityLabel={label} accessibilityRole={label ? 'image' : undefined}
    accessibilityElementsHidden={!label} importantForAccessibility={label ? 'yes' : 'no-hide-descendants'}
    style={{ width: size, height: size, overflow: 'hidden' }}
  >
    <Image
      source={atlas} accessible={false} resizeMode="stretch"
      style={{ position: 'absolute', width: 1448 * scale, height: 1086 * scale, left: -column * size, top: -row * size }}
    />
  </View>;
}
