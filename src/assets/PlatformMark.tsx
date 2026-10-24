import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { platformContent, type PlatformId } from '../game/content/social';
import { useColors } from '../ui/theme';
import { platformMarks } from './platformMarks';

/** Four recognizable vector marks in the same high-contrast optical footprint. */
export const PlatformMark = React.memo(function PlatformMark({ platform, size = 36, decorative = true }: {
  platform: PlatformId; size?: number; decorative?: boolean;
}) {
  const c = useColors(), mark = platformMarks[platform];
  return <View accessible={!decorative} accessibilityRole={decorative ? undefined : 'image'}
    accessibilityLabel={decorative ? undefined : platformContent[platform].name}
    accessibilityElementsHidden={decorative} importantForAccessibility={decorative ? 'no-hide-descendants' : 'auto'}
    style={{ width: size, height: size, flexShrink: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: c.inset, borderRadius: size * .24 }}>
    <Svg width={size * .7} height={size * .7} viewBox={mark.viewBox} preserveAspectRatio="xMidYMid meet" accessible={false}>
      <Path d={mark.path} fill={c.ink} />
    </Svg>
  </View>;
});
