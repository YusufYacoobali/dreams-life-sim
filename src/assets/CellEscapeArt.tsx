import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { cellEscapeAtlasSize, cellKeyRects, cellKeyTeeth, cellObjectRects } from './cellEscapeLayout';

const atlas = require('../../assets/generated/cell-escape-objects.png');
type SpriteRect = readonly [number, number, number, number];
function Sprite({ rect, width, height, stretch = false, children }: { rect: SpriteRect; width: number; height: number; stretch?: boolean; children?: React.ReactNode }) {
  const [x, y, w, h] = rect, scale = Math.min(width / w, height / h), sx = stretch ? width / w : scale, sy = stretch ? height / h : scale;
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: w * sx, height: h * sy, overflow: 'hidden' }}>
      <Image source={atlas} accessible={false} resizeMode="stretch" style={{ position: 'absolute', width: cellEscapeAtlasSize[0] * sx, height: cellEscapeAtlasSize[1] * sy, left: -x * sx, top: -y * sy }} />
      {children && <Svg accessible={false} width={w * sx} height={h * sy} viewBox={'0 0 ' + w + ' ' + h} style={{ position: 'absolute', top: 0, left: 0 }}>{children}</Svg>}
    </View>
  </View>;
}
export function CellEscapeObjectArt({ id, width, height, stretch = false }: { id: keyof typeof cellObjectRects; width: number; height: number; stretch?: boolean }) {
  return <Sprite rect={cellObjectRects[id]} width={width} height={height} stretch={stretch} />;
}
export function CellEscapeDoorArt() {
  const [x, y, w, h] = cellObjectRects.door;
  const percent = (value: number) => (value + '%') as `${number}%`;
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
    <Image source={atlas} accessible={false} resizeMode="stretch" style={{ position: 'absolute', width: percent(cellEscapeAtlasSize[0] / w * 100), height: percent(cellEscapeAtlasSize[1] / h * 100), left: percent(-x / w * 100), top: percent(-y / h * 100) }} />
  </View>;
}
export function CellEscapeKeyArt({ shape, teeth }: { shape: keyof typeof cellKeyRects; teeth: number }) {
  const [x, y] = cellKeyTeeth[shape], gradient = 'key-teeth-' + shape;
  return <Sprite rect={cellKeyRects[shape]} width={64} height={110}>
    <Defs><LinearGradient id={gradient} x1="0%" y1="0%" x2="0%" y2="100%"><Stop offset="0" stopColor="#FFE486" /><Stop offset="0.45" stopColor="#F8C34B" /><Stop offset="1" stopColor="#C88719" /></LinearGradient></Defs>
    {Array.from({ length: teeth }, (_, index) => <Rect key={index} x={x} y={y + index * 27} width={35} height={18} rx={4} fill={'url(#' + gradient + ')'} stroke="#AB6D12" strokeWidth={2} />)}
  </Sprite>;
}
