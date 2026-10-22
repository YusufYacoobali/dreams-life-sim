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
  difficulty,
}: {
  kind: MiniGameKind;
  clock: SharedValue<number>;
  assisted: boolean;
  difficulty: number;
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
    <View style={{ paddingHorizontal: 20, gap: 4, paddingBottom: 6 }}>
      <View style={[s.row, { justifyContent: 'space-between' }]}>
        <Text style={s.eyebrow}>LEVEL {difficulty}</Text>
        <Text
          accessibilityLabel={
            assisted
              ? 'Assisted controls, no real-time deadline'
              : remaining + ' seconds remaining'
          }
          style={[s.muted, { fontVariant: ['tabular-nums'], color: c.white }]}
        >
          {assisted ? 'ASSISTED' : remaining + 's'}
        </Text>
      </View>
      <Svg
        height="2"
        width="100%"
        viewBox="0 0 100 2"
        preserveAspectRatio="none"
        accessible={false}
      >
        <Rect width="100" height="2" rx="2" fill={c.panel} />
        <MovingRect animatedProps={props} height="2" rx="2" fill={c.blue} />
      </Svg>
    </View>
  );
}
