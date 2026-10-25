import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { platformContent, type PlatformId } from '../game/content/social';
import { platformMarks } from './platformMarks';
import { instagramMarkGradient, platformMarkPresentation } from './platformMarkPresentation';

/** Four recognizable vector marks in the same high-contrast optical footprint. */
export const PlatformMark = React.memo(function PlatformMark({ platform, size = 36, decorative = true }: {
  platform: PlatformId; size?: number; decorative?: boolean;
}) {
  const mark = platformMarks[platform], presentation = platformMarkPresentation[platform];
  const gradientId = 'platform-instagram-' + React.useId().replace(/:/g, '');
  return <View accessible={!decorative} accessibilityRole={decorative ? undefined : 'image'}
    accessibilityLabel={decorative ? undefined : platformContent[platform].name}
    accessibilityElementsHidden={decorative} importantForAccessibility={decorative ? 'no-hide-descendants' : 'auto'}
    style={{ width: size, height: size, flexShrink: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: presentation.background, borderRadius: size * .24 }}>
    <Svg width={size * .7} height={size * .7} viewBox={mark.viewBox} preserveAspectRatio="xMidYMid meet" accessible={false}>
      {platform === 'photogram' && <Defs><LinearGradient id={gradientId} x1={instagramMarkGradient.x1} y1={instagramMarkGradient.y1} x2={instagramMarkGradient.x2} y2={instagramMarkGradient.y2}>
        {instagramMarkGradient.stops.map(stop => <Stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />)}
      </LinearGradient></Defs>}
      <Path d={mark.path} fill={platform === 'photogram' ? 'url(#' + gradientId + ')' : presentation.fill} />
    </Svg>
  </View>;
});
