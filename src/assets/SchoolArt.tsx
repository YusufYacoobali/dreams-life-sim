import React from 'react';
import { Image, View } from 'react-native';
import { schoolAtlasSize, schoolRects } from './schoolLayout';

const atlas = require('../../assets/generated/school-atlas.png');
export type SchoolArtId = keyof typeof schoolRects;
/** Native clipping preserves the generated pixels and each object's proportions. */
export function SchoolArt({ id, size = 40, label }: { id: SchoolArtId; size?: number; label?: string }) {
  const [x, y, width, height] = schoolRects[id], scale = size / Math.max(width, height);
  return <View accessible={!!label} accessibilityRole={label ? 'image' : undefined} accessibilityLabel={label}
    accessibilityElementsHidden={!label} importantForAccessibility={label ? 'yes' : 'no-hide-descendants'}
    style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: width * scale, height: height * scale, overflow: 'hidden' }}>
      <Image source={atlas} accessible={false} resizeMode="stretch" style={{ position: 'absolute', width: schoolAtlasSize[0] * scale, height: schoolAtlasSize[1] * scale, left: -x * scale, top: -y * scale }} />
    </View>
  </View>;
}
