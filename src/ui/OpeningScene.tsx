import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';

export const openingBackground = '#0D1729';

/** Small native shapes, interpreted from the image-generation concept.
 * This stays still beneath the existing root ink cinematic. No bitmap is loaded. */
export const OpeningScene = React.memo(function OpeningScene({ width = 184 }: { width?: number }) {
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width, height: width * 200 / 240 }}>
      <Svg width={width} height={width * 200 / 240} viewBox="0 0 240 200" accessible={false}>
        <Path d="M120 181V49" stroke="#A5ADE8" strokeWidth={3} strokeLinecap="round" />
        <Path d="M120 151C120 106 76 99 43 75" fill="none" stroke="#D8BE83" strokeWidth={3} strokeLinecap="round" />
        <Path d="M120 151C120 106 164 99 197 75" fill="none" stroke="#88C9B6" strokeWidth={3} strokeLinecap="round" />
        <Path d="M120 176C103 144 73 155 62 130M120 176C137 144 167 155 178 130" fill="none" stroke="#7F83BC" strokeWidth={2.5} strokeLinecap="round" />
        <Circle cx={120} cy={184} r={5} fill="#A5ADE8" />
        <Circle cx={62} cy={127} r={4.5} fill="#8C91CD" />
        <Circle cx={178} cy={127} r={4.5} fill="#8C91CD" />
        <Circle cx={43} cy={58} r={19} fill="#302D32" />
        <Path d="m43 47 3.3 6.8 7.5 1.1-5.4 5.3 1.3 7.5-6.7-3.6-6.7 3.6 1.3-7.5-5.4-5.3 7.5-1.1Z" fill="#E6C98D" />
        <Circle cx={120} cy={30} r={20} fill="#352B38" />
        <Path d="M120 40s-11-6.8-11-13a6 6 0 0 1 11-3 6 6 0 0 1 11 3c0 6.2-11 13-11 13Z" fill="#E5A19F" />
        <Circle cx={197} cy={58} r={19} fill="#20353A" />
        <Path d="M189 67c-5-14 5-21 16-19 2 12-3 21-13 20l10-14" fill="#90D2BA" />
        <Path d="m188 70 13-15" stroke="#20353A" strokeWidth={2} strokeLinecap="round" />
      </Svg>
  </View>;
});

export const OpeningBrandAccent = React.memo(function OpeningBrandAccent() {
  return <View pointerEvents="none" accessible={false} style={styles.accentSpace}><LinearGradient colors={['#FFE6B000', '#FFE6B0', '#FFE6B000']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.accent} /></View>;
});

const styles = StyleSheet.create({
  accentSpace: { height: 2, width: 88, marginTop: 5, marginBottom: 2, opacity: 0.65 },
  accent: { width: 88, height: 2, borderRadius: 1 },
});
