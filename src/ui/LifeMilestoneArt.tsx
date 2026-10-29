import React from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

const birthMarks = [
  { kind: 'heart', color: '#FF9694', size: 23, left: '5%', top: 28 },
  { kind: 'star', color: '#FFD16C', size: 25, left: '85%', top: 65 },
  { kind: 'dot', color: '#95DDF2', size: 9, left: '80%', top: 22 },
  { kind: 'dot', color: '#95DDF2', size: 10, left: '4%', top: 132 },
  { kind: 'heart', color: '#FFB9AA', size: 17, left: '83%', top: 145 },
  { kind: 'star', color: '#FFE2A4', size: 17, left: '18%', top: 8 },
] as const;

/** Preserve the settled artwork. The root ink overlay owns the entrance motion,
 * including on a cold resume, which should not replay an old birth or death.
 */
export function LifeMilestoneArt({ kind, children }: React.PropsWithChildren<{ kind: 'birth' | 'death'; identity: string }>) {
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.scene}>
    <View style={styles.frame}>{kind === 'birth' ? <>
      <View style={styles.birthGlow} /><View style={styles.birthOuterRing} /><View style={styles.birthRing} />
      <View style={styles.babyFrame}>{children}</View>
      {birthMarks.map((mark, index) => <View key={index} style={{ position: 'absolute', left: mark.left, top: mark.top, opacity: 0.85 }}>
        {mark.kind === 'dot' ? <View style={{ width: mark.size, height: mark.size, borderRadius: mark.size / 2, backgroundColor: mark.color }} /> : <Ionicons name={mark.kind} color={mark.color} size={mark.size} />}
      </View>)}
    </> : <><View style={styles.memorialGlow} />{children}</>}</View>
  </View>;
}

const styles = StyleSheet.create({
  scene: { width: 250, maxWidth: '100%', height: 190, alignSelf: 'center' },
  frame: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  babyFrame: { width: 158, height: 158, borderRadius: 79, backgroundColor: '#D9F2FE', alignItems: 'center', justifyContent: 'center' },
  birthGlow: { position: 'absolute', width: 197, height: 197, borderRadius: 99, backgroundColor: '#D9F2FE', opacity: 0.24 },
  birthRing: { position: 'absolute', width: 188, height: 188, borderRadius: 94, borderWidth: 1.5, borderColor: '#73CAE8', opacity: 0.24 },
  birthOuterRing: { position: 'absolute', width: 206, height: 206, borderRadius: 103, borderWidth: 1, borderColor: '#A0DFF3', opacity: 0.24 },
  memorialGlow: { position: 'absolute', width: 197, height: 181, borderRadius: 99, backgroundColor: '#F3D5A7', opacity: 0.1 },
});
