import React from 'react';
import { Image, View } from 'react-native';

const images = {
  ball: require('../../assets/generated/action-symbols/ball.png'),
  popcorn: require('../../assets/generated/action-symbols/popcorn.png'),
  podium: require('../../assets/generated/action-symbols/podium.png'),
  telescope: require('../../assets/generated/action-symbols/telescope.png'),
  microphone: require('../../assets/generated/action-symbols/microphone.png'),
  dumbbell: require('../../assets/generated/action-symbols/dumbbell.png'),
  'film-camera': require('../../assets/generated/action-symbols/film-camera.png'),
  passport: require('../../assets/generated/action-symbols/passport.png'),
  suitcase: require('../../assets/generated/action-symbols/suitcase.png'),
  'beach-umbrella': require('../../assets/generated/action-symbols/beach-umbrella.png'),
  plane: require('../../assets/generated/action-symbols/plane.png'),
  book: require('../../assets/generated/polish3/actions/academic-help.png'),
} as const;

export type SimpleSymbolArtId = keyof typeof images;

/** One contained subject, shared across action slots without changing their IDs. */
export function SimpleSymbolArt({ id, size = 40, width = size, height = size, label }: {
  id: SimpleSymbolArtId; size?: number; width?: number; height?: number; label?: string;
}) {
  return <View accessible={!!label} accessibilityRole={label ? 'image' : undefined} accessibilityLabel={label}
    accessibilityElementsHidden={!label} importantForAccessibility={label ? 'yes' : 'no-hide-descendants'}
    style={{ width, height, flexShrink: 0, justifyContent: 'center', alignItems: 'center' }}>
    <Image source={images[id]} accessible={false} resizeMode="contain" fadeDuration={0} style={{ width, height }} />
  </View>;
}
