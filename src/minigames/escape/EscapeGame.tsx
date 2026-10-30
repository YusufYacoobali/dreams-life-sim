import React from 'react';
import { Text, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { escapeGates, escapeMistakes, escapeState } from './escapeLogic';
import type { MiniGameAction, MiniGameSession } from '../core/types';
import { GameButton } from '../components/GameButton';
import { gameStyles as s, palette as c } from '../components/gameStyles';

/** Text labels carry the whole puzzle; colour and motion are decorative. */
export function EscapeGame({ session, clock, enabled, controlsVisible = true, onInput }: {
  session: MiniGameSession;
  clock: SharedValue<number>;
  enabled: boolean;
  controlsVisible?: boolean;
  onInput: (action: MiniGameAction, at: number) => unknown;
}) {
  const state = escapeState(session, session.inputs),
    gates = escapeGates(session.seed, state.stage);
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
