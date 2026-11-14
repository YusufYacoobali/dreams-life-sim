import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Polygon } from 'react-native-svg';
import type { MiniGameAction, MiniGameSession } from '../core/types';
import { cellEscapeState, cellMistakeLimit, type CellKey, type KeyShape } from './cellEscapeLogic';
import { CellEscapeDoorArt, CellEscapeKeyArt, CellEscapeObjectArt } from '../../assets/CellEscapeArt';
const environment = require('../../../assets/generated/cell-escape-background.png');

const ink = '#F4F2FF', gold = '#F7C957';
const shapePoints: Partial<Record<KeyShape, string>> = { triangle: '30,7 53,49 7,49', square: '10,10 50,10 50,50 10,50', diamond: '30,4 56,30 30,56 4,30', star: '30,4 37,21 55,22 41,34 46,53 30,42 14,53 19,34 5,22 23,21', hexagon: '17,7 43,7 56,30 43,53 17,53 4,30' };
/** Interactive shapes are native controls, separate from the illustrated scene layers. */
function KeyGlyph({ item, slot = false }: { item: CellKey; slot?: boolean }) {
  if (!slot) return <CellEscapeKeyArt shape={item.shape} teeth={item.teeth} />;
  return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: 64, height: 74 }}>
    <CellEscapeObjectArt id="plate" width={64} height={74} />
    <Svg width={64} height={74} viewBox="0 0 60 70" accessible={false} style={StyleSheet.absoluteFill}>
      <G transform="translate(7.5 5) scale(0.75)">{item.shape === 'circle' ? <Circle cx={30} cy={30} r={23} fill="#101C2D" stroke="#8C9EB6" strokeWidth={3} /> : <Polygon points={shapePoints[item.shape]} fill="#101C2D" stroke="#8C9EB6" strokeWidth={3} strokeLinejoin="round" />}</G>
      {Array.from({ length: item.teeth }, (_, index) => <Circle key={index} cx={30 + index * 8 - (item.teeth - 1) * 4} cy={58} r={2.5} fill={gold} />)}
    </Svg>
  </View>;
}
const keyLabel = (key: CellKey) => key.shape + ', ' + key.teeth + (key.teeth === 1 ? ' notch' : ' notches');
export function CellEscapeGame({ session, enabled, controlsVisible = true, reducedMotion = false, onInput }: {
  session: MiniGameSession; enabled: boolean; controlsVisible?: boolean; reducedMotion?: boolean; onInput: (action: MiniGameAction, at: number) => unknown;
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
  return <View style={{ flexGrow: 1, backgroundColor: '#172238', padding: 18, gap: 16, alignItems: 'center', justifyContent: 'center' }}>
    <Image source={environment} accessible={false} pointerEvents="none" resizeMode="cover" style={StyleSheet.absoluteFill} />
    <View pointerEvents="none" accessible={false} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(11,21,37,0.25)' }]} />
    <Text style={{ color: ink, fontSize: 16, lineHeight: 23, textAlign: 'center', backgroundColor: 'rgba(11,21,37,0.9)', padding: 10, borderRadius: 12 }}>Choose a key, then tap its matching lock.</Text>
    <View style={{ width: '100%', maxWidth: 420, overflow: 'hidden', borderRadius: 22, borderWidth: 12, borderColor: '#56647B', backgroundColor: '#0B1525', minHeight: 260 }}>
      <Image source={environment} accessible={false} pointerEvents="none" resizeMode="cover" style={StyleSheet.absoluteFill} />
      <View accessible={false} pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(166,225,202,0.15)', opacity: state.complete ? 1 : 0 }]} />
      <Animated.View style={{ backgroundColor: '#354A65', borderColor: '#76879E', borderWidth: 5, borderRadius: 10, overflow: 'hidden', minHeight: 236, padding: 16, gap: 16, transform: [{ translateX: door.interpolate({ inputRange: [0, 1], outputRange: [0, 600] }) }] }}>
        <CellEscapeDoorArt />
        <View accessible={false} pointerEvents="none" style={{ alignItems: 'center' }}><CellEscapeObjectArt id="window" width={180} height={56} /></View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
          {state.locks.map(lock => {
            const key = state.keys.find(item => item.id === lock.keyId)!, open = state.unlocked.includes(lock.id);
            return <Animated.View key={lock.id} style={{ transform: [{ translateX: state.lastLock === lock.id && state.feedback === 'incorrect' ? shake : 0 }, { scale: state.lastLock === lock.id && state.feedback === 'correct' ? unlock : 1 }] }}><Pressable accessibilityRole="button" accessibilityLabel={'Lock ' + (lock.id + 1) + ': ' + keyLabel(key) + (open ? ', open' : ', locked')} accessibilityState={{ disabled: !available || open || selected === null }} disabled={!available || open || selected === null} onPress={() => place(lock.id)} style={{ minWidth: 76, minHeight: 94, padding: 8, alignItems: 'center', borderRadius: 14, borderWidth: 2, borderColor: open ? '#73E2A4' : '#97ABC6', backgroundColor: open ? '#275A4B' : '#4F6380' }}>
              {open ? <CellEscapeObjectArt id="open" width={64} height={74} /> : <KeyGlyph item={key} slot />}
            </Pressable></Animated.View>;
          })}
        </View>
      </Animated.View>
    </View>
    <View style={{ backgroundColor: 'rgba(11,21,37,0.9)', padding: 10, borderRadius: 12, gap: 7, maxWidth: 420 }}>
      <Text accessibilityLiveRegion="polite" style={{ color: state.feedback === 'incorrect' ? '#FFB9AD' : ink, fontSize: 17, fontWeight: '600', textAlign: 'center' }}>{state.complete ? 'The door is open!' : state.failed ? 'The door stays locked.' : state.feedback === 'incorrect' ? 'That key does not fit. Try another.' : state.feedback === 'correct' ? 'Another lock opens.' : 'Find the matching shapes and notches.'}</Text>
      <Text style={{ color: '#CDD8E8', fontSize: 15, textAlign: 'center' }}>{state.unlocked.length}/{state.locks.length} locks open · {cellMistakeLimit(session.difficulty) - state.mistakes} mistakes left</Text>
    </View>
    {controlsVisible && !state.complete && !state.failed && <View accessibilityRole="radiogroup" accessibilityLabel="Keys" style={{ width: '100%', maxWidth: 420, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
      {state.keys.map(key => <Animated.View key={key.id} style={{ transform: [{ translateY: selected === key.id ? lift : 0 }] }}><Pressable accessibilityRole="radio" accessibilityLabel={'Key: ' + keyLabel(key) + (state.usedKeys.includes(key.id) ? ', used' : '')} accessibilityState={{ checked: selected === key.id, disabled: !available || state.usedKeys.includes(key.id) }} disabled={!available || state.usedKeys.includes(key.id)} onPress={() => { if (mounted.current && available && !submitting.current) setSelected(key.id); }} style={{ width: 84, minHeight: 116, borderRadius: 16, padding: 8, alignItems: 'center', borderWidth: 2, borderColor: selected === key.id ? gold : '#667E9E', backgroundColor: selected === key.id ? '#425576' : '#233650', opacity: state.usedKeys.includes(key.id) ? 0.25 : 1 }}><KeyGlyph item={key} /></Pressable></Animated.View>)}
    </View>}
  </View>;
}
