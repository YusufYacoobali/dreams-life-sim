import React, { useMemo } from 'react';
import { Image, Platform, View, type ViewStyle } from 'react-native';
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
  // Native multiply starts at API 29. Earlier Android uses one cached colour
  // matrix on the grayscale source, retaining detail instead of washing it out
  // with a flat tint and a 35%-opacity grayscale overlay.
  const multiply = Platform.OS !== 'android' || Number(Platform.Version) >= 29;
  const filter = useMemo(() => multiply ? undefined : legacyTintFilter(color), [multiply, color]);
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: 'absolute', left, top, width, height: sourceHeight * scale, overflow: 'hidden', isolation: 'isolate' }}>
    {multiply && <Image source={atlas} resizeMode="stretch" accessible={false} style={[image, { tintColor: color }]} />}
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, mixBlendMode: multiply ? 'multiply' : 'normal', filter }}><Image source={atlas} resizeMode="stretch" accessible={false} style={[image, { opacity: 1 }]} /></View>
  </View>;
}

// React Native's Android ColorMatrixColorFilter works before API 29. These
// native matrix coefficients map neutral source luminance to the exact tint;
// no pixels, masks, appearance traits or source rectangles are rebuilt in JS.
const sepiaWhite = [1.351, 1.203, 0.937];
const luminance = 0.213 * sepiaWhite[0] + 0.715 * sepiaWhite[1] + 0.072 * sepiaWhite[2];
const chroma = sepiaWhite.map(value => value - luminance);
const rotated = [
  -0.213 * sepiaWhite[0] - 0.715 * sepiaWhite[1] + 0.928 * sepiaWhite[2],
  0.143 * sepiaWhite[0] + 0.140 * sepiaWhite[1] - 0.283 * sepiaWhite[2],
  -0.787 * sepiaWhite[0] + 0.715 * sepiaWhite[1] + 0.072 * sepiaWhite[2],
];
const determinant = (chroma[0] - chroma[1]) * (rotated[2] - rotated[1]) - (chroma[2] - chroma[1]) * (rotated[0] - rotated[1]);
function legacyTintFilter(color: string): NonNullable<ViewStyle['filter']> {
  const [red, green, blue] = [1, 3, 5].map(index => parseInt(color.slice(index, index + 2), 16) / 255);
  const cosine = ((red - green) * (rotated[2] - rotated[1]) - (blue - green) * (rotated[0] - rotated[1])) / determinant;
  const sine = ((chroma[0] - chroma[1]) * (blue - green) - (chroma[2] - chroma[1]) * (red - green)) / determinant;
  const brightness = (green - cosine * chroma[1] - sine * rotated[1]) / luminance;
  // Android pre-concatenates these matrices: the rightmost sepia runs first.
  return [{ brightness }, { hueRotate: Math.atan2(sine, cosine) * 180 / Math.PI + 'deg' }, { saturate: brightness > 0 ? Math.hypot(cosine, sine) / brightness : 0 }, { sepia: 1 }];
}
