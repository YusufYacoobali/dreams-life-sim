import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { escapeGates, escapeMistakes, escapeRounds, escapeState } from './escapeLogic';
import type { MiniGameAction, MiniGameSession } from '../core/types';
import { GameButton } from '../components/GameButton';
import { gameStyles as s, palette as c } from '../components/gameStyles';

/** Text labels carry the whole puzzle; colour and motion are decorative. */
export function EscapeGame({ session, clock, enabled, controlsVisible = true, reducedMotion = false, onInput }: {
  session: MiniGameSession;
  clock: SharedValue<number>;
  enabled: boolean;
  controlsVisible?: boolean;
  reducedMotion?: boolean;
  onInput: (action: MiniGameAction, at: number) => unknown;
}) {
  const state = escapeState(session, session.inputs),
    gates = escapeGates(session.seed, session.escapeVersion === 2 ? session.inputs.length : state.stage);
  const opacity = useRef(new Animated.Value(1)).current;
  const animatedStyle = { opacity };
  useEffect(() => {
    if (reducedMotion || session.escapeVersion !== 2) { opacity.setValue(1); return; }
    opacity.setValue(0.72);
    const animation = Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [state.phase, state.feedback, session.inputs.length, session.escapeVersion, reducedMotion, opacity]);
  if (session.escapeVersion === 2) {
    const preview = state.phase === 'preview', hint = state.phase === 'hint';
    const submit = (action: MiniGameAction) => onInput(action, Math.min(14000, session.elapsedMs + 100));
    const symbols = preview ? state.sequence : hint ? [state.sequence[state.stage]] : [];
    return <View style={{ flexGrow: 1, padding: 24, gap: 20, justifyContent: 'center' }}>
      <Text style={[s.eyebrow, { color: c.gold, textAlign: 'center' }]}>THE PAPER EXIT · ROUND {state.round + 1}/{escapeRounds(session.difficulty)}</Text>
      <Text accessibilityRole="header" style={[s.title, { color: c.white, textAlign: 'center' }]}>
        {state.complete ? 'The exit is open' : state.failed ? 'The pattern slipped' : preview ? 'Remember these stamps' : hint ? 'One stamp to hold onto' : 'Recall the hidden pattern'}
      </Text>
      <Text style={[s.text, { color: c.white, textAlign: 'center' }]}>
        {preview ? 'Study the order. Hide it when you are ready; the next round will be longer.' : hint ? 'This is your next stamp. Hide the hint before choosing. Each attempt has only two hints.' : state.complete ? 'Every round is complete.' : state.failed ? 'This attempt is over.' : 'Choose the stamps in order. The gates shuffle after every choice. Take your time.'}
      </Text>
      <Animated.View style={[{ gap: 12 }, animatedStyle]}>
        {(preview || hint) && controlsVisible && <View accessibilityLabel={preview ? 'Pattern preview' : 'Limited hint'} style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
          {symbols.map((symbol, index) => <View key={index} style={{ padding: 12, borderRadius: 12, borderWidth: 2, borderColor: c.gold, backgroundColor: '#112443' }}>
            <Text accessibilityLabel={`${hint ? 'Next stamp' : `Stamp ${index + 1}`}: ${symbol}`} style={[s.text, { color: c.white, textTransform: 'capitalize' }]}>{symbol}</Text>
          </View>)}
        </View>}
        {!preview && !hint && <View accessible accessibilityLabel={`${state.stage} of ${state.sequence.length} stamps recalled`} style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
          {state.sequence.map((_, index) => <View key={index} style={{ minWidth: 30, padding: 8, borderRadius: 12, borderWidth: 1, borderColor: '#FFFFFF66', backgroundColor: index < state.stage ? '#215B47' : '#112443' }}><Text accessible={false} style={[s.text, { color: c.white }]}>{index < state.stage ? '✓' : '·'}</Text></View>)}
        </View>}
        <Text accessibilityLiveRegion="polite" style={[s.text, { color: state.feedback === 'incorrect' ? '#FFB5AE' : c.white, textAlign: 'center' }]}>
          {state.failed ? 'No mistakes left. The shuffle caught you.' : state.complete ? 'You remembered every round.' : preview ? `Round ${state.round + 1}: ${state.sequence.length} stamps to remember.` : hint ? `${2 - state.hints} hints left.` : state.feedback === 'incorrect' ? `Wrong stamp. Try the same position again. ${escapeMistakes(session.difficulty, 2) - state.mistakes} mistakes left.` : state.feedback === 'correct' ? 'Correct stamp.' : `Choose stamp ${state.stage + 1} of ${state.sequence.length}.`}
        </Text>
      </Animated.View>
      {controlsVisible && !state.complete && !state.failed && <View style={{ gap: 10 }}>
        {preview || hint ? <GameButton label={preview ? 'Hide pattern and begin' : 'Hide hint and continue'} disabled={!enabled} onPress={() => submit({ type: 'escape-recall' })} /> : <>
          {gates.map(symbol => <GameButton key={symbol} label={symbol[0].toUpperCase() + symbol.slice(1)} accessibilityLabel={`Choose ${symbol} gate`} disabled={!enabled} onPress={() => submit({ type: 'stamp', symbol })} />)}
          {session.assisted && <GameButton secondary label={`Hint: next stamp (${2 - state.hints} left)`} disabled={!enabled || state.hints >= 2} onPress={() => submit({ type: 'escape-hint' })} />}
        </>}
      </View>}
      <Text style={[s.muted, { color: '#CCD5E8', textAlign: 'center' }]}>{escapeMistakes(session.difficulty, 2) - state.mistakes} mistakes left · No time limit{session.assisted ? ' · Two hints per attempt' : ''}</Text>
    </View>;
  }

  return <View style={{ flexGrow: 1, padding: 24, gap: 20, justifyContent: 'center' }}>
    <Text style={[s.eyebrow, { color: c.gold, textAlign: 'center' }]}>THE PAPER EXIT</Text>
    <Text accessibilityRole="header" style={[s.title, { color: c.white, textAlign: 'center' }]}>
      Follow the stamps
    </Text>
    <Text style={[s.text, { color: c.white, textAlign: 'center' }]}>
      Match the next word below. The gates shuffle after every choice.
    </Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
      {state.sequence.map((symbol, index) => <View key={index} style={{ padding: 10, borderRadius: 12, borderWidth: index === state.stage ? 3 : 1, borderColor: index === state.stage ? c.gold : '#FFFFFF66', backgroundColor: index < state.stage ? '#215B47' : '#112443' }}>
        <Text accessibilityLabel={`Stamp ${index + 1}: ${symbol}${index < state.stage ? ', completed' : index === state.stage ? ', next' : ''}`} style={[s.text, { color: c.white, textTransform: 'capitalize' }]}>
          {index < state.stage ? '✓ ' : ''}{symbol}
        </Text>
      </View>)}
    </View>
    <Text accessibilityLiveRegion="polite" style={[s.muted, { color: c.white, textAlign: 'center' }]}>
      {state.complete ? 'The exit is open.' : state.failed ? 'The shuffle caught you.' : `${state.stage} of ${state.sequence.length} matched · Mistakes left: ${escapeMistakes(session.difficulty) - state.mistakes}`}
    </Text>
    {controlsVisible && <View style={{ gap: 10 }}>
      {gates.map((symbol) => <GameButton key={symbol} label={symbol[0].toUpperCase() + symbol.slice(1)}
        accessibilityLabel={`Choose ${symbol} gate`} disabled={!enabled || state.complete || state.failed}
        onPress={() => onInput({ type: 'stamp', symbol }, session.assisted ? session.elapsedMs + 500 : Math.max(session.elapsedMs, Math.round(clock.value)))} />)}
    </View>}
    <Text style={[s.muted, { color: '#CCD5E8', textAlign: 'center' }]}>Find the exit before the paper folds.</Text>
  </View>;
}
