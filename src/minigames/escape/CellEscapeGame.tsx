import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, G, Polygon } from 'react-native-svg';
import type { MiniGameAction, MiniGameSession } from '../core/types';
import { cellEscapeState, cellMistakeLimit, type CellKey, type KeyShape } from './cellEscapeLogic';
import { CellEscapeDoorArt, CellEscapeKeyArt, CellEscapeObjectArt } from '../../assets/CellEscapeArt';

const ink = '#F4F2FF', gold = '#F7C957';
const shapePoints: Partial<Record<KeyShape, string>> = { triangle: '30,7 53,49 7,49', square: '10,10 50,10 50,50 10,50', diamond: '30,4 56,30 30,56 4,30', star: '30,4 37,21 55,22 41,34 46,53 30,42 14,53 19,34 5,22 23,21', hexagon: '17,7 43,7 56,30 43,53 17,53 4,30' };
/** Interactive shapes are native controls, separate from the illustrated scene layers. */
function KeyGlyph({ item, slot = false }: { item: CellKey; slot?: boolean }) {
  if (!slot) return <CellEscapeKeyArt shape={item.shape} teeth={item.teeth} width={42} height={72} />;
  return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: 48, height: 56 }}>
    <CellEscapeObjectArt id="plate" width={48} height={56} />
    <Svg width={48} height={56} viewBox="0 0 60 70" accessible={false} style={StyleSheet.absoluteFill}>
      <G transform="translate(7.5 5) scale(0.75)">{item.shape === 'circle' ? <Circle cx={30} cy={30} r={23} fill="#101C2D" stroke="#8C9EB6" strokeWidth={3} /> : <Polygon points={shapePoints[item.shape]} fill="#101C2D" stroke="#8C9EB6" strokeWidth={3} strokeLinejoin="round" />}</G>
      {Array.from({ length: item.teeth }, (_, index) => <Circle key={index} cx={30 + index * 8 - (item.teeth - 1) * 4} cy={58} r={2.5} fill={gold} />)}
    </Svg>
  </View>;
}
const keyLabel = (key: CellKey) => key.shape + ', ' + key.teeth + (key.teeth === 1 ? ' notch' : ' notches');
export function CellEscapeGame({ session, enabled, controlsVisible = true, reducedMotion = false, viewport, onInput }: {
  session: MiniGameSession; viewport?: { width: number; height: number }; enabled: boolean; controlsVisible?: boolean; reducedMotion?: boolean; onInput: (action: MiniGameAction, at: number) => unknown;
}) {
  const state = cellEscapeState(session, session.inputs), [selected, setSelected] = useState<number | null>(null);
  const door = useRef(new Animated.Value(0)).current, shake = useRef(new Animated.Value(0)).current, lift = useRef(new Animated.Value(0)).current, unlock = useRef(new Animated.Value(1)).current;
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const submitting = useRef(false), current = useRef({ enabled, controlsVisible, inputs: session.inputs.length }); current.current = { enabled, controlsVisible, inputs: session.inputs.length };
  useEffect(() => { submitting.current = false; setSelected(null); }, [session.id, session.inputs.length]);
  useEffect(() => {
    if (reducedMotion) { door.setValue(state.complete ? 1 : 0); shake.setValue(0); unlock.setValue(1); return; }
    const animation = state.complete ? Animated.timing(door, { toValue: 1, duration: 550, useNativeDriver: true }) : state.feedback === 'incorrect' ? Animated.sequence([-7, 7, -4, 4, 0].map(toValue => Animated.timing(shake, { toValue, duration: 45, useNativeDriver: true }))) : Animated.timing(shake, { toValue: 0, duration: 0, useNativeDriver: true });
    const opening = state.feedback === 'correct' ? Animated.sequence([Animated.timing(unlock, { toValue: 1.12, duration: 100, useNativeDriver: true }), Animated.spring(unlock, { toValue: 1, speed: 20, bounciness: 3, useNativeDriver: true })]) : Animated.timing(unlock, { toValue: 1, duration: 0, useNativeDriver: true });
    animation.start(); opening.start(); return () => { animation.stop(); opening.stop(); };
  }, [session.inputs.length, state.complete, reducedMotion, door, shake, unlock]);
  useEffect(() => {
    if (reducedMotion) { lift.setValue(0); return; }
    const animation = Animated.spring(lift, { toValue: selected === null ? 0 : -10, useNativeDriver: true, speed: 18, bounciness: 5 }); animation.start(); return () => animation.stop();
  }, [selected, reducedMotion, lift]);
  const available = enabled && controlsVisible && !state.complete && !state.failed;
  const place = (lockId: number) => {
    if (!mounted.current || !available || submitting.current || selected === null || !current.current.enabled || !current.current.controlsVisible || current.current.inputs !== session.inputs.length || state.unlocked.includes(lockId) || state.usedKeys.includes(selected)) return;
    submitting.current = true;
    const result = onInput({ type: 'escape-fit', keyId: selected, lockId }, Math.min(14000, session.elapsedMs + 100));
    if (result === false) submitting.current = false;
    if (result && typeof (result as PromiseLike<unknown>).then === 'function') void Promise.resolve(result).finally(() => { submitting.current = false; });
  };
  const window = useWindowDimensions();
  const contentWidth = Math.min(420, Math.max(0, (viewport?.width ?? window.width) - 32));
  const doorWidth = Math.min(380, contentWidth), gap = 8, lockWidth = 64;
  const columns = Math.max(1, Math.floor((doorWidth - 32 + gap) / (lockWidth + gap)));
  const lockColumns = state.locks.length === 4 && columns < 4 ? Math.min(2, columns) : Math.min(state.locks.length === 4 ? 4 : 3, columns);
  const lockRows = Array.from({ length: Math.ceil(state.locks.length / lockColumns) }, (_, row) => state.locks.slice(row * lockColumns, (row + 1) * lockColumns));
  const keyColumns = Math.max(1, Math.min(3, Math.floor((contentWidth + gap) / (48 + gap))));
  const keyWidth = Math.floor((contentWidth - gap * (keyColumns - 1)) / keyColumns);
  const keyRows = Array.from({ length: Math.ceil(state.keys.length / keyColumns) }, (_, row) => state.keys.slice(row * keyColumns, (row + 1) * keyColumns));
  const [blocks, setBlocks] = useState({ instruction: 0, feedback: 0, tray: 0 });
  const measure = (name: keyof typeof blocks, height: number) => setBlocks(previous => previous[name] === height ? previous : { ...previous, [name]: height });
  // Only the measured ScrollView viewport supplies a height budget. Text/tray
  // keep their natural scaled heights; an undersized screen scrolls instead.
  const minDoorHeight = 86 + lockRows.length * 76 + (lockRows.length - 1) * gap;
  const remainingHeight = (viewport?.height ?? 0) - blocks.instruction - blocks.feedback - (controlsVisible && !state.complete && !state.failed ? blocks.tray : 0) - 64;
  const doorHeight = Math.max(minDoorHeight, Math.min(300, remainingHeight));
  const message = state.complete ? 'The door is open!' : state.failed ? 'The door stays locked.' : state.feedback === 'incorrect' ? 'That key does not fit. Try another.' : state.feedback === 'correct' ? 'Another lock opens.' : null;
  return <View testID="cell-gameplay-content" style={[styles.content, { minHeight: viewport?.height, gap: 12 }]}>
    <Text onLayout={event => measure('instruction', event.nativeEvent.layout.height)} style={styles.instruction}>Choose a key, then tap its matching lock.</Text>
    <View testID="cell-door" style={{ width: doorWidth, height: doorHeight, overflow: 'hidden', borderRadius: 16, borderWidth: 3, borderColor: '#72849A', backgroundColor: state.complete ? '#A6E1CA33' : '#15293C' }}>
      <Animated.View style={{ flex: 1, borderColor: '#76879E', borderWidth: 1, borderRadius: 12, overflow: 'hidden', padding: 12, gap: 12, justifyContent: 'space-evenly', transform: [{ translateX: door.interpolate({ inputRange: [0, 1], outputRange: [0, 600] }) }] }}>
        <CellEscapeDoorArt />
        <View accessible={false} pointerEvents="none" style={{ alignItems: 'center' }}><CellEscapeObjectArt id="window" width={112} height={40} /></View>
        <View style={{ gap }}>
          {lockRows.map((locks, row) => <View key={row} testID={'cell-lock-row-' + row} style={{ flexDirection: 'row', justifyContent: 'center', gap }}>
            {locks.map(lock => {
              const key = state.keys.find(item => item.id === lock.keyId)!, open = state.unlocked.includes(lock.id);
              return <Animated.View key={lock.id} style={{ transform: [{ translateX: state.lastLock === lock.id && state.feedback === 'incorrect' ? shake : 0 }, { scale: state.lastLock === lock.id && state.feedback === 'correct' ? unlock : 1 }] }}><Pressable accessibilityRole="button" accessibilityLabel={'Lock ' + (lock.id + 1) + ': ' + keyLabel(key) + (open ? ', open' : ', locked')} accessibilityState={{ disabled: !available || open || selected === null }} disabled={!available || open || selected === null} onPress={() => place(lock.id)} style={{ width: lockWidth, minHeight: 76, padding: 4, justifyContent: 'center', alignItems: 'center', borderRadius: 10, borderWidth: 1.5, borderColor: open ? '#73E2A4' : '#97ABC6', backgroundColor: open ? '#275A4B' : '#4F6380' }}>
                {open ? <CellEscapeObjectArt id="open" width={48} height={56} /> : <KeyGlyph item={key} slot />}
              </Pressable></Animated.View>;
            })}
          </View>)}
        </View>
      </Animated.View>
    </View>
    <View onLayout={event => measure('feedback', event.nativeEvent.layout.height)} style={styles.feedback}>
      {message && <Text accessibilityLiveRegion="polite" style={[styles.feedbackText, { color: state.feedback === 'incorrect' ? '#FFB9AD' : ink }]}>{message}</Text>}
      <Text style={styles.progress}>{state.unlocked.length}/{state.locks.length} locks open · {cellMistakeLimit(session.difficulty) - state.mistakes} mistakes left</Text>
    </View>
    {controlsVisible && !state.complete && !state.failed && <View onLayout={event => measure('tray', event.nativeEvent.layout.height)} accessibilityRole="radiogroup" accessibilityLabel="Keys" style={{ width: contentWidth, gap: 12 }}>
      {keyRows.map((keys, row) => <View key={row} testID={'cell-key-row-' + row} style={{ flexDirection: 'row', justifyContent: 'center', gap }}>
        {keys.map(key => {
          const used = state.usedKeys.includes(key.id), chosen = selected === key.id;
          return <Animated.View key={key.id} style={{ transform: [{ translateY: chosen ? lift : 0 }] }}><Pressable accessibilityRole="radio" accessibilityLabel={'Key: ' + keyLabel(key) + (used ? ', used' : '')} accessibilityState={{ checked: chosen, disabled: !available || used }} disabled={!available || used} onPress={() => { if (mounted.current && available && !submitting.current) setSelected(key.id); }} style={{ width: keyWidth, flexGrow: 1, minHeight: 100, borderRadius: 12, paddingVertical: 4, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: chosen ? gold : '#92A6BD', backgroundColor: chosen ? '#425576' : '#233650E8', opacity: used ? 0.45 : !available ? 0.65 : 1 }}>
            <KeyGlyph item={key} />
            <Text testID={'cell-key-label-' + key.id} style={{ alignSelf: 'stretch', flexShrink: 1, color: chosen ? '#FFE596' : ink, fontSize: 12, lineHeight: 16, fontWeight: '600', textAlign: 'center' }}>{chosen ? '✓' : used ? 'Used' : key.teeth + ' ' + '•'.repeat(key.teeth)}</Text>
          </Pressable></Animated.View>;
        })}
      </View>)}
    </View>}
  </View>;
}
const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, alignItems: 'center', justifyContent: 'space-between' },
  instruction: { color: ink, fontSize: 14, lineHeight: 20, textAlign: 'center', width: '100%', maxWidth: 420, textShadowColor: '#18283D', textShadowRadius: 3 },
  feedback: { width: '100%', maxWidth: 420, backgroundColor: '#18283DEB', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, gap: 2 },
  feedbackText: { color: ink, fontSize: 14, lineHeight: 20, fontWeight: '600', textAlign: 'center' },
  progress: { color: '#DCE5F0', fontSize: 13, lineHeight: 18, textAlign: 'center' },
});
