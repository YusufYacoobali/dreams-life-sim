import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SceneMotion } from './SceneMotion';

const hero = require('../../assets/generated/welcome-hero.png');
// Fixed positions, independent of game randomness and every saved life.
const lights = [
  { left: '13%', top: '30%', size: 3, drift: -13 }, { left: '27%', top: '35%', size: 2, drift: 8 },
  { left: '42%', top: '28%', size: 3, drift: -7 }, { left: '68%', top: '32%', size: 2, drift: 11 },
  { left: '82%', top: '25%', size: 3, drift: -9 }, { left: '76%', top: '45%', size: 2, drift: 6 },
  { left: '23%', top: '49%', size: 2, drift: -8 }, { left: '54%', top: '42%', size: 3, drift: 5 },
] as const;

// Save/startup feedback must not rebuild the decorative animation graph.
export const OpeningScene = React.memo(function OpeningScene() {
  return <SceneMotion identity="welcome-opening" duration={1800} style={styles.scene}>{({ progress }) => <>
    <Animated.Image source={hero} accessible={false} resizeMode="cover" style={[styles.hero, { transform: [
      { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1.045, 1] }) },
      { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) },
    ] }]} />
    <Animated.View style={[styles.sunlight, { opacity: progress.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.08, 0.3, 0.12] }), transform: [
      { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.1] }) },
    ] }]}><LinearGradient colors={['#FFE7AF99', '#FFCC6733', '#FFCC6700']} style={styles.glow} /></Animated.View>
    {lights.map((light, index) => <Animated.View key={index} style={[styles.light, { left: light.left, top: light.top, width: light.size, height: light.size,
      opacity: progress.interpolate({ inputRange: [0, 0.2 + index * 0.035, 0.8, 1], outputRange: [0, 0.75, 0.45, 0] }),
      transform: [
        { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [15, -22] }) },
        { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, light.drift] }) },
      ],
    }]} />)}
    <LinearGradient colors={['rgba(3,18,54,0.15)', 'transparent', 'rgba(2,12,31,0.96)']} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
  </>}</SceneMotion>;
});

/** A small light stroke reveals beneath the wordmark; the actual brand text is always visible. */
export const OpeningBrandAccent = React.memo(function OpeningBrandAccent() {
  return <SceneMotion identity="welcome-brand" duration={1500} style={styles.accentSpace}>{({ progress }) => <Animated.View style={{
    opacity: progress.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0.2, 0.9, 0.65] }),
    transform: [{ scaleX: progress.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) }],
  }}><LinearGradient colors={['#FFE6B000', '#FFE6B0', '#FFE6B000']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.accent} /></Animated.View>}</SceneMotion>;
});

const styles = StyleSheet.create({
  scene: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  hero: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  sunlight: { position: 'absolute', top: '31%', left: '29%', width: 320, height: 320, borderRadius: 160, overflow: 'hidden' },
  glow: { flex: 1, borderRadius: 160 },
  light: { position: 'absolute', borderRadius: 3, backgroundColor: '#FFF0BE' },
  accentSpace: { height: 2, width: 88, marginTop: 5, marginBottom: 2 },
  accent: { width: 88, height: 2, borderRadius: 1 },
});
