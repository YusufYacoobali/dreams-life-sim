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
        <Path d="M120 181V49" stroke="#ACADF0" strokeWidth={7} strokeLinecap="round" />
        <Path d="M120 151C120 106 76 99 43 75" fill="none" stroke="#E8BE6F" strokeWidth={7} strokeLinecap="round" />
        <Path d="M120 151C120 106 164 99 197 75" fill="none" stroke="#80C5AD" strokeWidth={7} strokeLinecap="round" />
        <Path d="M120 176C103 144 73 155 62 130M120 176C137 144 167 155 178 130" fill="none" stroke="#9695DB" strokeWidth={5.5} strokeLinecap="round" />
        <Circle cx={120} cy={184} r={7} fill="#ACADF0" />
        <Circle cx={62} cy={127} r={6.5} fill="#9695DB" />
        <Circle cx={178} cy={127} r={6.5} fill="#9695DB" />
        <Circle cx={43} cy={58} r={26} fill="#E8BE6F" />
        <Path d="m43 42 4.8 9.8 10.8 1.6-7.8 7.6 1.8 10.8L43 66.7 33.4 71.8l1.8-10.8-7.8-7.6 10.8-1.6Z" fill="#FFFBF2" />
        <Circle cx={120} cy={30} r={27} fill="#DE929A" />
        <Path d="M120 44s-15-9.3-15-17.7a8.2 8.2 0 0 1 15-4.1 8.2 8.2 0 0 1 15 4.1c0 8.4-15 17.7-15 17.7Z" fill="#FFFBF2" />
        <Circle cx={197} cy={58} r={26} fill="#80C5AD" />
        <Path d="M186 70c-7-19 6-29 22-26 3 16-4 29-18 27l14-20" fill="#FFFBF2" />
        <Path d="m185 74 18-22" stroke="#80C5AD" strokeWidth={3} strokeLinecap="round" />
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
