import React, { forwardRef } from 'react';
import { StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import type { CinematicKind } from './cinematicTiming';

const sources = {
  welcome: require('../../../assets/cinematics/welcome.lottie'),
  birth: require('../../../assets/cinematics/birth.lottie'),
  death: require('../../../assets/cinematics/death.lottie'),
};

type Props = {
  kind: CinematicKind;
  onLoaded: () => void;
  onFinished: (cancelled: boolean) => void;
  onFailure: (error: string) => void;
};

/** Native Core Animation / Android hardware rendering. Bundled compressed paths
 * load natively, avoiding large JSON objects on the JS thread. play(start, end)
 * also runs natively; React receives only load and segment-completion events.
 */
export const CinematicInk = forwardRef<LottieView, Props>(function CinematicInk({ kind, onLoaded, onFinished, onFailure }, ref) {
  return <LottieView ref={ref} source={sources[kind]} style={StyleSheet.absoluteFill} resizeMode="cover"
    autoPlay={false} loop={false} speed={1} renderMode="HARDWARE" cacheComposition={kind !== 'welcome'}
    onAnimationLoaded={onLoaded} onAnimationFinish={onFinished} onAnimationFailure={onFailure} />;
});
