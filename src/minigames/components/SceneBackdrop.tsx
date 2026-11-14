import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { MiniGameKind } from '../core/types';
import { sceneArt } from './sceneArtwork';

export function SceneBackdrop({ kind, cell = false }: { kind: MiniGameKind; cell?: boolean }) {
  if (kind === 'escape' && cell) return (
    <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
      <Image source={require('../../../assets/generated/cell-escape-background.png')} resizeMode="cover" accessible={false} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['#18283D99', '#18283D00']} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 160 }} />
    </View>
  );
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      accessible={false}
    >
      {kind !== 'crime' && kind !== 'escape' && (
        <Image
          source={kind === 'sports' ? sceneArt.stadium : sceneArt.space}
          resizeMode="cover"
          style={StyleSheet.absoluteFill}
          accessible={false}
        />
      )}
      {kind === 'astronaut' && (
        <Image
          source={sceneArt.earth}
          resizeMode="cover"
          accessible={false}
          style={{
            position: 'absolute',
            left: '-25%',
            bottom: '-4%',
            width: '140%',
            height: '46%',
            opacity: 0.9,
          }}
        />
      )}
      <LinearGradient
        colors={['#030B18E8', '#030B1810', '#030B1800', '#030B18F5']}
        locations={[0, 0.22, 0.58, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

export function ScenePreview({ kind }: { kind: MiniGameKind }) {
  return (
    <View style={{ flex: 1 }} pointerEvents="none" accessible={false}>
      {kind === 'crime' && (
        <Image
          source={sceneArt.safe}
          resizeMode="cover"
          style={StyleSheet.absoluteFill}
        />
      )}
      {kind !== 'crime' && kind !== 'escape' && (
        <Image
          source={kind === 'sports' ? sceneArt.goal : sceneArt.station}
          resizeMode="contain"
          style={{
            position: 'absolute',
            top: '8%',
            width: '92%',
            left: '4%',
            height: '28%',
          }}
        />
      )}
      {kind === 'sports' && (
        <Image
          source={sceneArt.keeper}
          resizeMode="contain"
          style={{
            position: 'absolute',
            top: '19%',
            left: '41%',
            width: '18%',
            height: '18%',
          }}
        />
      )}
    </View>
  );
}
