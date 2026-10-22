import React, { useMemo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SceneMotion } from './SceneMotion';

const birthMarks = [
  { kind: 'heart', color: '#FF9694', size: 23, left: '5%', top: 28, fromX: 18, fromY: 16 },
  { kind: 'star', color: '#FFD16C', size: 25, left: '85%', top: 65, fromX: -18, fromY: 4 },
  { kind: 'dot', color: '#95DDF2', size: 9, left: '80%', top: 22, fromX: -14, fromY: 20 },
  { kind: 'dot', color: '#95DDF2', size: 10, left: '4%', top: 132, fromX: 20, fromY: -12 },
  { kind: 'heart', color: '#FFB9AA', size: 17, left: '83%', top: 145, fromX: -16, fromY: -18 },
  { kind: 'star', color: '#FFE2A4', size: 17, left: '18%', top: 8, fromX: 12, fromY: 24 },
] as const;
const memorialLights = [
  { left: '13%', top: 86, size: 4, rise: 28 },
  { left: '27%', top: 30, size: 3, rise: 22 },
  { left: '58%', top: 12, size: 4, rise: 32 },
  { left: '82%', top: 52, size: 3, rise: 26 },
  { left: '88%', top: 123, size: 4, rise: 34 },
] as const;

/** Decorative only: factual text, navigation and saving stay outside this scene. */
export function LifeMilestoneArt({ kind, identity, children }: React.PropsWithChildren<{ kind: 'birth' | 'death'; identity: string }>) {
  return <SceneMotion identity={kind + ':' + identity} duration={kind === 'birth' ? 1500 : 1800} style={styles.scene}>
    {({ progress }) => kind === 'birth' ? <BirthArt progress={progress}>{children}</BirthArt> : <MemorialArt progress={progress}>{children}</MemorialArt>}
  </SceneMotion>;
}

function BirthArt({ progress, children }: React.PropsWithChildren<{ progress: Animated.Value }>) {
  const motion = useMemo(() => ({
    portrait: progress.interpolate({ inputRange: [0, 0.65, 1], outputRange: [0.88, 1.035, 1] }),
    ring: progress.interpolate({ inputRange: [0, 1], outputRange: [0.62, 1.08] }),
    outerRing: progress.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1.04] }),
    haloOpacity: progress.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0.12, 0.55, 0.24] }),
    markOpacity: progress.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.25, 0.95, 0.85] }),
    marks: birthMarks.map(mark => ({
      x: progress.interpolate({ inputRange: [0, 1], outputRange: [mark.fromX, 0] }),
      y: progress.interpolate({ inputRange: [0, 1], outputRange: [mark.fromY, 0] }),
    })),
  }), [progress]);
  return <View style={styles.frame}>
    <Animated.View style={[styles.birthGlow, { opacity: motion.haloOpacity, transform: [{ scale: motion.outerRing }] }]} />
    <Animated.View style={[styles.birthOuterRing, { opacity: motion.haloOpacity, transform: [{ scale: motion.outerRing }] }]} />
    <Animated.View style={[styles.birthRing, { opacity: motion.haloOpacity, transform: [{ scale: motion.ring }] }]} />
    <Animated.View style={[styles.babyFrame, { transform: [{ scale: motion.portrait }] }]}>{children}</Animated.View>
    {birthMarks.map((mark, index) => <Animated.View key={index} style={{ position: 'absolute', left: mark.left, top: mark.top, opacity: motion.markOpacity, transform: [{ translateX: motion.marks[index].x }, { translateY: motion.marks[index].y }] }}>
      {mark.kind === 'dot' ? <View style={{ width: mark.size, height: mark.size, borderRadius: mark.size / 2, backgroundColor: mark.color }} /> : <Ionicons name={mark.kind} color={mark.color} size={mark.size} />}
    </Animated.View>)}
  </View>;
}

function MemorialArt({ progress, children }: React.PropsWithChildren<{ progress: Animated.Value }>) {
  const motion = useMemo(() => ({
    settle: progress.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }),
    scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }),
    glow: progress.interpolate({ inputRange: [0, 0.65, 1], outputRange: [0.05, 0.14, 0.1] }),
    glowScale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1.08] }),
    light: progress.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0.15, 0.6, 0.32] }),
    lights: memorialLights.map(light => progress.interpolate({ inputRange: [0, 1], outputRange: [light.rise, 0] })),
  }), [progress]);
  return <View style={styles.frame}>
    <Animated.View style={[styles.memorialGlow, { opacity: motion.glow, transform: [{ scale: motion.glowScale }] }]} />
    {memorialLights.map((light, index) => <Animated.View key={index} style={{ position: 'absolute', left: light.left, top: light.top, width: light.size, height: light.size, borderRadius: light.size / 2, backgroundColor: '#F3D5A7', opacity: motion.light, transform: [{ translateY: motion.lights[index] }] }} />)}
    <Animated.View style={{ transform: [{ translateY: motion.settle }, { scale: motion.scale }] }}>{children}</Animated.View>
  </View>;
}

const styles = StyleSheet.create({
  scene: { width: 250, maxWidth: '100%', height: 190, alignSelf: 'center' },
  frame: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  babyFrame: { width: 158, height: 158, borderRadius: 79, backgroundColor: '#D9F2FE', alignItems: 'center', justifyContent: 'center' },
  birthGlow: { position: 'absolute', width: 182, height: 182, borderRadius: 91, backgroundColor: '#D9F2FE' },
  birthRing: { position: 'absolute', width: 174, height: 174, borderRadius: 87, borderWidth: 1.5, borderColor: '#73CAE8' },
  birthOuterRing: { position: 'absolute', width: 198, height: 198, borderRadius: 99, borderWidth: 1, borderColor: '#A0DFF3' },
  memorialGlow: { position: 'absolute', width: 182, height: 168, borderRadius: 91, backgroundColor: '#F3D5A7' },
});
