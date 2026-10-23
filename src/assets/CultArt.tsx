import React from 'react';
import { Image } from 'react-native';
export const cultImages = {
  cult: require('../../assets/generated/cult/cult.png'),
  philosophy: require('../../assets/generated/cult/philosophy.png'),
  doctrines: require('../../assets/generated/cult/doctrines.png'),
  rules: require('../../assets/generated/cult/rules.png'),
  recruitment: require('../../assets/generated/cult/recruitment.png'),
  followers: require('../../assets/generated/cult/followers.png'),
  ceremony: require('../../assets/generated/cult/ceremony.png'),
  treasury: require('../../assets/generated/cult/treasury.png'),
  headquarters: require('../../assets/generated/cult/headquarters.png'),
  rivalry: require('../../assets/generated/cult/rivalry.png'),
  scandal: require('../../assets/generated/cult/scandal.png'),
  claim: require('../../assets/generated/cult/claim.png'),
};
export type CultArtId = keyof typeof cultImages;
export function CultArt({
  id = 'cult',
  size = 48,
}: {
  id?: CultArtId;
  size?: number;
}) {
  return (
    <Image
      source={cultImages[id]}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      resizeMode="contain"
      style={{ width: size, height: size }}
    />
  );
}
