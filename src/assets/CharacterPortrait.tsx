import React, { useId } from 'react';
import { Image, View } from 'react-native';
import Svg, { ClipPath, Defs, G, Image as SvgImage, Path } from 'react-native-svg';
import type { Person } from '../game/model';
import { portraitImages } from './portraitImages';
import { portraitCanvasSize, portraitLayers, portraitTraits, type PortraitTraits } from './portraitPlan';
import { necklinePaths } from './portraitFit';

type PortraitProps = {
  appearance: Person['appearance']; age: number; name: string;
  size?: number; decorative?: boolean;
  personId?: string;
  /** The shared Portrait wrapper supplies this only for proven legacy NPCs. */
  legacyDefaultGender?: Person['gender'];
};

export function CharacterPortrait({ appearance, age, name, size = 56, decorative = false, personId, legacyDefaultGender }: PortraitProps) {
  return <View accessible={!decorative} accessibilityRole={decorative ? undefined : 'image'}
    accessibilityLabel={decorative ? undefined : name} accessibilityElementsHidden={decorative}
    importantForAccessibility={decorative ? 'no-hide-descendants' : 'auto'}
    style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
    <PortraitDrawing {...portraitTraits(appearance, age, personId, legacyDefaultGender)} size={size} />
  </View>;
}

// Save copies can give unchanged appearances fresh object identities. Memoize
// rendered scalars so an unchanged drawing does not rebuild layers every year.
const PortraitDrawing = React.memo(function PortraitDrawing({ size, ...traits }: PortraitTraits & { size: number }) {
  const scale = size / portraitCanvasSize;
  const skinClipId = 'portrait-skin-'+useId().replace(/:/g,'');
  return <>
    {portraitLayers(traits).map((layer,index) => layer.skinClip ? <Svg key={layer.asset} width={size} height={size}
      viewBox="0 0 320 320" pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      style={{position:'absolute',left:0,top:0}}>
      <Defs><ClipPath id={skinClipId}><Path d={necklinePaths[layer.skinClip.outfit][Math.min(traits.stage,3)]}
        transform={`translate(${160*(1-layer.skinClip.scale)} ${320*(1-layer.skinClip.scale)}) scale(${layer.skinClip.scale})`} /></ClipPath></Defs>
      <G clipPath={`url(#${skinClipId})`}><SvgImage href={portraitImages[layer.asset]}
        x={layer.left} y={layer.top} width={layer.width} height={layer.height} preserveAspectRatio="none" /></G>
    </Svg> : <View key={layer.asset+':'+index} pointerEvents="none"
      accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      style={{ position: 'absolute', width: layer.width * scale, height: layer.height * scale,
        left: layer.left * scale, top: layer.top * scale, opacity: layer.opacity ?? 1, overflow: 'hidden' }}>
      <Image source={portraitImages[layer.asset]} accessible={false} accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants" resizeMode="stretch" fadeDuration={0}
        style={{ position: 'absolute', width: (layer.crop?.width ?? layer.width) * scale,
          height: (layer.crop?.height ?? layer.height) * scale,
          left: (layer.crop?.left ?? 0) * scale, top: (layer.crop?.top ?? 0) * scale }} />
    </View>)}
  </>;
});
