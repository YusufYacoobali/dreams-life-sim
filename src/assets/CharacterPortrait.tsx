import React from 'react';
import { Image, Platform, View } from 'react-native';
import type { Person } from '../game/model';
import { ageingHairColor, faceScales, hairColors, hairRects, headRects, portraitAgeStage, portraitAtlasSize, skinTones, SourceRect } from './portraitLayout';

const atlas = require('../../assets/generated/portrait-layers.png');
export function CharacterPortrait({ appearance, age, name, size = 56, decorative = false }: { appearance: Person['appearance']; age: number; name: string; size?: number; decorative?: boolean }) {
  const head = headRects[portraitAgeStage(age)];
  const hair = age < 3 ? null : hairRects[appearance.hair];
  const [scaleX, scaleY] = faceScales[appearance.face];
  return <View accessible={!decorative} accessibilityRole={decorative ? undefined : 'image'} accessibilityLabel={decorative ? undefined : name} accessibilityElementsHidden={decorative} importantForAccessibility={decorative ? 'no-hide-descendants' : 'auto'} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#EAF0F8', overflow: 'hidden' }}>
    <View style={{ position: 'absolute', width: size, height: size, transform: [{ scaleX }, { scaleY }] }}>
      <TintedLayer rect={head} color={skinTones[appearance.skin]} width={size * 0.69} left={size * 0.155} top={size * 0.14} />
      {hair && <TintedLayer rect={hair} color={ageingHairColor(hairColors[appearance.hairColor], age)} width={size * (appearance.hair >= 4 ? 0.9 : 0.78)} left={size * (appearance.hair >= 4 ? 0.05 : 0.11)} top={size * (appearance.hair === 6 ? -0.03 : 0.06)} />}
    </View>
  </View>;
}

function TintedLayer({ rect, color, width, left, top }: { rect: SourceRect; color: string; width: number; left: number; top: number }) {
  const [x, y, sourceWidth, sourceHeight] = rect;
  const scale = width / sourceWidth;
  const image = { position: 'absolute' as const, width: portraitAtlasSize * scale, height: portraitAtlasSize * scale, left: -x * scale, top: -y * scale };
  // Android's native multiply blend starts at API 29. An opaque detail image
  // otherwise hides the tint entirely; retain colour with lighter detail there.
  const multiply = Platform.OS !== 'android' || Number(Platform.Version) >= 29;
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: 'absolute', left, top, width, height: sourceHeight * scale, overflow: 'hidden', isolation: 'isolate' }}>
    <Image source={atlas} resizeMode="stretch" accessible={false} style={[image, { tintColor: color }]} />
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, mixBlendMode: multiply ? 'multiply' : 'normal' }}><Image source={atlas} resizeMode="stretch" accessible={false} style={[image, { opacity: multiply ? 1 : 0.35 }]} /></View>
  </View>;
}
