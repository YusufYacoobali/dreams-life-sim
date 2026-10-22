import React from 'react';
import { Image, View } from 'react-native';
import type { Person } from '../game/model';
import { portraitImages } from './portraitImages';
import { portraitCanvasSize, portraitLayers, portraitTraits, type PortraitTraits } from './portraitPlan';

type PortraitProps = {
  appearance: Person['appearance']; age: number; name: string;
  size?: number; decorative?: boolean;
};

export function CharacterPortrait({ appearance, age, name, size = 56, decorative = false }: PortraitProps) {
  return <View accessible={!decorative} accessibilityRole={decorative ? undefined : 'image'}
    accessibilityLabel={decorative ? undefined : name} accessibilityElementsHidden={decorative}
    importantForAccessibility={decorative ? 'no-hide-descendants' : 'auto'}
    style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
    <PortraitDrawing {...portraitTraits(appearance, age)} size={size} />
  </View>;
}

// Save copies can give unchanged appearances fresh object identities. Memoize
// rendered scalars so an unchanged drawing does not rebuild layers every year.
const PortraitDrawing = React.memo(function PortraitDrawing({ size, ...traits }: PortraitTraits & { size: number }) {
  const scale = size / portraitCanvasSize;
  return <>
    {portraitLayers(traits).map(layer => <Image key={layer.asset} source={portraitImages[layer.asset]}
      accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      resizeMode="stretch" fadeDuration={0}
      style={{ position: 'absolute', width: layer.width * scale, height: layer.height * scale,
        left: layer.left * scale, top: layer.top * scale, tintColor: layer.color }} />)}
  </>;
});
