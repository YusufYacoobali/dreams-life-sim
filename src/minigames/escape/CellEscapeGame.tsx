import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path, Polygon, Rect } from 'react-native-svg';
import type { MiniGameAction, MiniGameSession } from '../core/types';
import { cellEscapeState, cellMistakeLimit, type CellKey, type KeyShape } from './cellEscapeLogic';

const ink = '#F4F2FF', gold = '#F7C957';
const shapePoints: Partial<Record<KeyShape, string>> = { triangle: '30,7 53,49 7,49', square: '10,10 50,10 50,50 10,50', diamond: '30,4 56,30 30,56 4,30', star: '30,4 37,21 55,22 41,34 46,53 30,42 14,53 19,34 5,22 23,21', hexagon: '17,7 43,7 56,30 43,53 17,53 4,30' };
/** Interactive shapes are native controls, separate from the illustrated scene layers. */
function KeyGlyph({ item, slot = false }: { item: CellKey; slot?: boolean }) {
  return <Svg width={64} height={slot ? 74 : 110} viewBox={slot ? '0 0 60 70' : '0 0 60 110'} accessible={false}>
    {!slot && <><Rect x={25} y={40} width={10} height={56} rx={3} fill={gold} stroke="#9E681E" strokeWidth={2} />{Array.from({ length: item.teeth }, (_, index) => <Rect key={index} x={32} y={65 + index * 10} width={13} height={6} rx={1} fill={gold} stroke="#9E681E" strokeWidth={1} />)}</>}
    {item.shape === 'circle' ? <Circle cx={30} cy={30} r={23} fill={slot ? '#17283B' : gold} stroke={slot ? '#B9C8DC' : '#9E681E'} strokeWidth={3} /> : <Polygon points={shapePoints[item.shape]} fill={slot ? '#17283B' : gold} stroke={slot ? '#B9C8DC' : '#9E681E'} strokeWidth={3} strokeLinejoin="round" />}
    {!slot && <Circle cx={30} cy={28} r={7} fill="#1F324A" stroke="#FFF0A5" strokeWidth={2} />}
    {slot && Array.from({ length: item.teeth }, (_, index) => <Circle key={index} cx={30 + index * 8 - (item.teeth - 1) * 4} cy={63} r={2.5} fill={gold} />)}
  </Svg>;
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
    <Text style={{ color: ink, fontSize: 16, lineHeight: 23, textAlign: 'center' }}>Choose a key, then tap its matching lock.</Text>
    <View style={{ width: '100%', maxWidth: 420, overflow: 'hidden', borderRadius: 22, borderWidth: 12, borderColor: '#56647B', backgroundColor: '#0B1525', minHeight: 260 }}>
      <View accessible={false} style={{ position: 'absolute', inset: 12, backgroundColor: '#A6E1CA', opacity: state.complete ? 1 : 0 }} />
      <Animated.View style={{ backgroundColor: '#354A65', borderColor: '#76879E', borderWidth: 5, borderRadius: 10, padding: 16, gap: 16, transform: [{ translateX: door.interpolate({ inputRange: [0, 1], outputRange: [0, 600] }) }] }}>
        <View accessible={false} style={{ height: 32, flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#0B1525', borderRadius: 4 }}>{[0, 1, 2, 3, 4].map(id => <View key={id} style={{ width: 8, height: '100%', backgroundColor: '#A5B4C9' }} />)}</View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
          {state.locks.map(lock => {
            const key = state.keys.find(item => item.id === lock.keyId)!, open = state.unlocked.includes(lock.id);
            return <Animated.View key={lock.id} style={{ transform: [{ translateX: state.lastLock === lock.id && state.feedback === 'incorrect' ? shake : 0 }, { scale: state.lastLock === lock.id && state.feedback === 'correct' ? unlock : 1 }] }}><Pressable accessibilityRole="button" accessibilityLabel={'Lock ' + (lock.id + 1) + ': ' + keyLabel(key) + (open ? ', open' : ', locked')} accessibilityState={{ disabled: !available || open || selected === null }} disabled={!available || open || selected === null} onPress={() => place(lock.id)} style={{ minWidth: 76, minHeight: 94, padding: 8, alignItems: 'center', borderRadius: 14, borderWidth: 2, borderColor: open ? '#73E2A4' : '#97ABC6', backgroundColor: open ? '#275A4B' : '#4F6380' }}>
              {open ? <Svg width={64} height={74} viewBox="0 0 64 74" accessible={false}><Path d="M17 27 V19 C17 2 45 2 45 19" fill="none" stroke="#B8FFD6" strokeWidth={6} strokeLinecap="round" /><Rect x={10} y={29} width={44} height={35} rx={8} fill={gold} /><Path d="M22 46 L29 53 L43 38" fill="none" stroke="#245B43" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" /></Svg> : <KeyGlyph item={key} slot />}
            </Pressable></Animated.View>;
          })}
        </View>
      </Animated.View>
    </View>
    <Text accessibilityLiveRegion="polite" style={{ color: state.feedback === 'incorrect' ? '#FFB9AD' : ink, fontSize: 17, fontWeight: '600', textAlign: 'center' }}>{state.complete ? 'The door is open!' : state.failed ? 'The door stays locked.' : state.feedback === 'incorrect' ? 'That key does not fit. Try another.' : state.feedback === 'correct' ? 'Another lock opens.' : 'Find the matching shapes and notches.'}</Text>
    <Text style={{ color: '#CDD8E8', fontSize: 15, textAlign: 'center' }}>{state.unlocked.length}/{state.locks.length} locks open · {cellMistakeLimit(session.difficulty) - state.mistakes} mistakes left</Text>
    {controlsVisible && !state.complete && !state.failed && <View accessibilityRole="radiogroup" accessibilityLabel="Keys" style={{ width: '100%', maxWidth: 420, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
      {state.keys.map(key => <Animated.View key={key.id} style={{ transform: [{ translateY: selected === key.id ? lift : 0 }] }}><Pressable accessibilityRole="radio" accessibilityLabel={'Key: ' + keyLabel(key) + (state.usedKeys.includes(key.id) ? ', used' : '')} accessibilityState={{ checked: selected === key.id, disabled: !available || state.usedKeys.includes(key.id) }} disabled={!available || state.usedKeys.includes(key.id)} onPress={() => { if (mounted.current && available && !submitting.current) setSelected(key.id); }} style={{ width: 84, minHeight: 116, borderRadius: 16, padding: 8, alignItems: 'center', borderWidth: 2, borderColor: selected === key.id ? gold : '#667E9E', backgroundColor: selected === key.id ? '#425576' : '#233650', opacity: state.usedKeys.includes(key.id) ? 0.25 : 1 }}><KeyGlyph item={key} /></Pressable></Animated.View>)}
    </View>}
  </View>;
}
