import React, { useEffect, useId, useState } from 'react';
import { Platform, Text, useWindowDimensions, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { nativeSvgProps, svgMotion } from '../core/svgMotion';
import {
  advanceDocking,
  dockingState,
  initialDocking,
  thrustDocking,
} from './dockingPhysics';
import type { MiniGameAction, MiniGameSession } from '../core/types';
import { GameButton } from '../components/GameButton';
import { gameStyles as s, palette as c } from '../components/gameStyles';
const svgAdapter = Platform.OS === 'web' ? undefined : nativeSvgProps;
const MovingGroup = Animated.createAnimatedComponent(G);
export function DockingGame({
  session,
  clock,
  enabled,
  reducedMotion,
  onInput,
  onFinished,
}: {
  session: MiniGameSession;
  clock: SharedValue<number>;
  enabled: boolean;
  reducedMotion: boolean;
  onInput: (action: MiniGameAction, at: number) => void;
  onFinished: (at: number) => void;
}) {
  const viewport = useWindowDimensions(),
    sceneHeight = Math.max(
      160,
      viewport.height - 180 - 260 * Math.max(1, viewport.fontScale),
    );
  const id = useId().replace(/:/g, ''),
    base = useSharedValue(initialDocking(session.seed, session.difficulty)),
    fired = useSharedValue(false),
    flare = useSharedValue(-1000),
    flareAngle = useSharedValue(0),
    capture = useSharedValue(0),
    [telemetry, setTelemetry] = useState({
      fuel: 100,
      speed: 6,
      alignment: 21,
      side: 'Left',
      range: 58,
      drift: 'steady',
    });
  useEffect(() => {
    const state = dockingState(session, session.inputs, session.elapsedMs);
    if (state.at >= base.value.at) base.value = state;
    setTelemetry({
      fuel: state.fuel,
      speed: Math.round(Math.hypot(state.vx, state.vy) * 100),
      alignment: Math.round(Math.abs(state.x - 0.5) * 100),
      side: state.x < 0.485 ? 'Left' : state.x > 0.515 ? 'Right' : 'Aligned',
      range: Math.max(0, Math.round((state.y - 0.24) * 100)),
      drift: state.vx < -0.003 ? 'left' : state.vx > 0.003 ? 'right' : 'steady',
    });
  }, [session, base]);
  const current = useDerivedValue(
    () => advanceDocking(base.value, clock.value, session.difficulty),
    [base, clock, session.difficulty],
  );
  const ship = useAnimatedProps(
    () => ({
      transform: svgMotion(
        (current.value.x + (0.5 - current.value.x) * capture.value) * 400,
        current.value.y * 560,
        current.value.vx * 90,
      ),
    }),
    [current, capture],
    svgAdapter,
  );
  const stars = useAnimatedProps(
    () => ({
      opacity: reducedMotion ? 1 : 0.8 + 0.18 * Math.sin(clock.value / 2000),
    }),
    [clock, reducedMotion],
  );
  const thrust = useAnimatedProps(
    () => ({
      transform: svgMotion(0, 0, flareAngle.value),
      opacity: !reducedMotion && clock.value - flare.value < 210 ? 0.85 : 0,
    }),
    [reducedMotion, clock, flare, flareAngle],
    svgAdapter,
  );
  useAnimatedReaction(
    () => Math.floor(clock.value / 500),
    (next, previous) => {
      if (next !== previous) {
        const state = current.value;
        scheduleOnRN(setTelemetry, {
          fuel: state.fuel,
          speed: Math.round(Math.hypot(state.vx, state.vy) * 100),
          alignment: Math.round(Math.abs(state.x - 0.5) * 100),
          side:
            state.x < 0.485 ? 'Left' : state.x > 0.515 ? 'Right' : 'Aligned',
          range: Math.max(0, Math.round((state.y - 0.24) * 100)),
          drift:
            state.vx < -0.003 ? 'left' : state.vx > 0.003 ? 'right' : 'steady',
        });
      }
    },
    [clock, current],
  );
  useAnimatedReaction(
    () => current.value.finished,
    (finished) => {
      if (finished && !fired.value) {
        fired.value = true;
        if (current.value.score >= 30)
          capture.value = withTiming(1, { duration: reducedMotion ? 0 : 400 });
        scheduleOnRN(onFinished, clock.value);
      }
    },
    [current, fired, clock, onFinished, capture, reducedMotion],
  );
  const pulse = (direction: 'left' | 'right' | 'up' | 'down' | 'coast') => {
    const at = Math.round(
        session.assisted
          ? Math.min(14000, session.elapsedMs + 400)
          : clock.value,
      ),
      state = advanceDocking(base.value, at, session.difficulty);
    if (state.finished) {
      onFinished(at);
      return;
    }
    base.value = thrustDocking(state, direction);
    flare.value = direction === 'coast' ? -1000 : at;
    flareAngle.value =
      direction === 'left'
        ? -90
        : direction === 'right'
          ? 90
          : direction === 'down'
            ? 180
            : 0;
    onInput({ type: 'thrust', direction }, at);
  };
  return (
    <>
      <View style={{ height: sceneHeight }}>
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 400 560"
          preserveAspectRatio="none"
          accessible={false}
        >
          <Defs>
            <LinearGradient id={id + 'earth'} x1="0" y1="0" x2="0.7" y2="1">
              <Stop stopColor="#67D3EB" />
              <Stop offset="0.2" stopColor="#257CA8" />
              <Stop offset="1" stopColor="#071C43" />
            </LinearGradient>
            <LinearGradient id={id + 'metal'} x1="0" y1="0" x2="1" y2="1">
              <Stop stopColor="#DFEAF0" />
              <Stop offset="0.5" stopColor="#7E9BAF" />
              <Stop offset="1" stopColor="#30485D" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="560" fill="#040E23" />
          <MovingGroup animatedProps={stars}>
            {Array.from({ length: 52 }, (_, i) => (
              <Circle
                key={i}
                cx={(i * 137 + 23) % 400}
                cy={(i * 83 + 19) % 490}
                r={i % 7 ? 0.8 : 1.5}
                fill="#D3E8F6"
                opacity={0.25 + (i % 5) * 0.13}
              />
            ))}
          </MovingGroup>
          <Circle cx="95" cy="720" r="303" fill="#48BDE8" opacity="0.06" />
          <Circle cx="95" cy="720" r="292" fill="#8AE3EF" opacity="0.13" />
          <Circle cx="95" cy="720" r="281" fill={`url(#${id}earth)`} />
          <Path
            d="M-30 495Q80 430 185 502L168 533L107 518L87 554L30 529Z M230 568L254 530L286 540L321 597"
            fill="#66A8AD"
            opacity="0.4"
          />
          <Path
            d="M-20 500Q126 440 269 545M-20 520Q130 456 251 552"
            stroke="#F0F6EB"
            strokeWidth="9"
            fill="none"
            opacity="0.25"
          />
          <G transform="translate(200 79)">
            <Rect
              x="-33"
              y="-20"
              width="66"
              height="64"
              rx="8"
              fill={`url(#${id}metal)`}
            />
            <Rect x="-47" y="-7" width="18" height="38" rx="4" fill="#506B81" />
            <Rect x="29" y="-7" width="18" height="38" rx="4" fill="#506B81" />
            <Line
              x1="-173"
              x2="173"
              y1="8"
              y2="8"
              stroke="#859EB2"
              strokeWidth="7"
            />
            {[-1, 1].map((side) => (
              <G key={side}>
                <Rect
                  x={side < 0 ? -178 : 68}
                  y="-36"
                  width="110"
                  height="90"
                  fill="#17466F"
                  stroke="#85B5CE"
                  strokeWidth="2"
                />
                {Array.from({ length: 6 }, (_, i) => (
                  <Line
                    key={i}
                    x1={(side < 0 ? -178 : 68) + i * 22}
                    x2={(side < 0 ? -178 : 68) + i * 22}
                    y1="-36"
                    y2="54"
                    stroke="#7BA9C3"
                    opacity="0.6"
                  />
                ))}
                <Line
                  x1={side < 0 ? -178 : 68}
                  x2={side < 0 ? -68 : 178}
                  y1="9"
                  y2="9"
                  stroke="#85B5CE"
                />
              </G>
            ))}
            <Rect
              x="-22"
              y="37"
              width="44"
              height="21"
              rx="6"
              fill="#283F55"
              stroke={c.blue}
              strokeWidth="2"
            />
            <Ellipse
              cy="57"
              rx="23"
              ry="7"
              fill="#071728"
              stroke={c.blue}
              strokeWidth="3"
            />
          </G>
          <Path
            d="M200 145V510M169 162H231"
            stroke={c.blue}
            strokeDasharray="5 9"
            opacity="0.36"
            fill="none"
          />
          <Rect
            x="174"
            y="133"
            width="52"
            height="45"
            rx="12"
            fill="none"
            stroke={c.blue}
            strokeWidth="1"
            opacity="0.25"
          />
          <MovingGroup id={id + '-ship'} animatedProps={ship}>
            <MovingGroup animatedProps={thrust}>
              <Path d="M-7 20L0 51L7 20" fill="#7FDCF5" />
              <Path d="M-4 20L0 38L4 20" fill="#FFF0C9" />
            </MovingGroup>
            <Path
              d="M-14 7L-31 21V-8L-13-14M14 7L31 21V-8L13-14"
              fill="#6D889F"
              stroke="#AEC6D8"
            />
            <Rect
              x="-13"
              y="-22"
              width="26"
              height="47"
              rx="9"
              fill={`url(#${id}metal)`}
            />
            <Path d="M-11-22L-6-32H6L11-22" fill="#DAEAF1" />
            <Rect
              x="-8"
              y="-17"
              width="16"
              height="12"
              rx="3"
              fill="#123C61"
              stroke="#75CFEC"
            />
            <Path d="M-13 12H13" stroke="#263F56" strokeWidth="3" />
            <Circle cy="2" r="3" fill={c.gold} />
          </MovingGroup>
        </Svg>
      </View>
      <View style={s.controls}>
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <Text style={s.muted}>Fuel {telemetry.fuel}%</Text>
          <Text style={s.muted}>Speed {telemetry.speed} · safe ≤10</Text>
          <Text style={s.muted}>
            {telemetry.side} {telemetry.alignment}%
          </Text>
        </View>
        <Text style={s.muted}>
          Port range {telemetry.range}% · Drift {telemetry.drift}
        </Text>
        <Text style={s.text}>
          Nudge into the blue port. Brake before contact.
        </Text>
        <Text style={s.muted}>
          {session.assisted
            ? 'Each tap advances flight by 0.4 seconds. Take your time.'
            : 'Tap thrusters for small bursts. Motion keeps drifting between taps.'}
        </Text>
        <View style={s.row}>
          <GameButton
            label="↑"
            accessibilityLabel="Thrust up"
            secondary
            disabled={!enabled}
            onPress={() => pulse('up')}
          />
          <GameButton
            label="Brake ↓"
            accessibilityLabel="Thrust down to brake"
            disabled={!enabled}
            onPress={() => pulse('down')}
          />
        </View>
        <View style={s.row}>
          <GameButton
            label="←"
            accessibilityLabel="Thrust left"
            secondary
            disabled={!enabled}
            onPress={() => pulse('left')}
          />
          <GameButton
            label="Coast"
            secondary
            disabled={!enabled}
            onPress={() => pulse('coast')}
          />
          <GameButton
            label="→"
            accessibilityLabel="Thrust right"
            secondary
            disabled={!enabled}
            onPress={() => pulse('right')}
          />
        </View>
      </View>
    </>
  );
}
