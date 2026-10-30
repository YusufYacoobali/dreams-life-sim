import React, { useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useAnimatedReaction,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { durationMs, type MiniGameKind } from '../core/types';
import { gameStyles as s, palette as c } from './gameStyles';
const MovingRect = Animated.createAnimatedComponent(Rect);
export function MiniGameHUD({
  kind,
  clock,
  assisted,
  untimed = false,
}: {
  kind: MiniGameKind;
  clock: SharedValue<number>;
  assisted: boolean;
  untimed?: boolean;
}) {
  const total = durationMs[kind],
    [remaining, setRemaining] = useState(Math.ceil(total / 1000));
  const props = useAnimatedProps(
    () => ({ width: Math.max(0, 1 - clock.value / total) * 100 }),
    [clock, total],
  );
  useAnimatedReaction(
    () => Math.ceil((total - clock.value) / 1000),
    (next, previous) => {
      if (next !== previous) scheduleOnRN(setRemaining, Math.max(0, next));
    },
    [clock, total],
  );
  return (
    <View style={{ paddingHorizontal: 22, gap: 7, paddingBottom: 9 }}>
      <View style={[s.row, { justifyContent: 'space-between' }]}>
        <Text style={[s.muted, { color: c.white }]}>{assisted || untimed ? 'Your pace' : 'Time left'}</Text>
        <Text
          accessibilityLabel={
            untimed ? 'Memory challenge, no time limit' : assisted
              ? 'Assisted controls, no real-time deadline'
              : remaining + ' seconds remaining'
          }
          style={[s.muted, { fontVariant: ['tabular-nums'], color: c.white }]}
        >
          {assisted ? 'Assisted' : untimed ? 'Memory' : remaining + 's'}
        </Text>
      </View>
      {!untimed && <Svg
        height="4"
        width="100%"
        viewBox="0 0 100 4"
        preserveAspectRatio="none"
        accessible={false}
      >
        <Rect width="100" height="4" rx="2" fill="#FFFFFF26" />
        <MovingRect animatedProps={props} height="4" rx="2" fill={c.blue} />
      </Svg>}
    </View>
  );
}
