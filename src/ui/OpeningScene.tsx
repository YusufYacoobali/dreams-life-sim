import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const hero = require('../../assets/generated/welcome-hero.png');

// The welcome composition stays still beneath the root cinematic reveal.
export const OpeningScene = React.memo(function OpeningScene() {
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.scene}>
    <Image source={hero} accessible={false} resizeMode="cover" style={styles.hero} />
    <View style={styles.sunlight}><LinearGradient colors={['#FFE7AF99', '#FFCC6733', '#FFCC6700']} style={styles.glow} /></View>
    <LinearGradient colors={['rgba(3,18,54,0.15)', 'transparent', 'rgba(2,12,31,0.96)']} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
  </View>;
});

export const OpeningBrandAccent = React.memo(function OpeningBrandAccent() {
  return <View pointerEvents="none" accessible={false} style={styles.accentSpace}><LinearGradient colors={['#FFE6B000', '#FFE6B0', '#FFE6B000']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.accent} /></View>;
});

const styles = StyleSheet.create({
  scene: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  hero: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  sunlight: { position: 'absolute', top: '31%', left: '29%', width: 320, height: 320, borderRadius: 160, overflow: 'hidden', opacity: 0.12 },
  glow: { flex: 1, borderRadius: 160 },
  accentSpace: { height: 2, width: 88, marginTop: 5, marginBottom: 2, opacity: 0.65 },
  accent: { width: 88, height: 2, borderRadius: 1 },
});
