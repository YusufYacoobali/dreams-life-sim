import React, { useEffect, useId, useState } from 'react';
import { Platform, Text, useWindowDimensions, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { nativeSvgProps, svgMotion } from '../core/svgMotion';
import { dialAngle, lockState, targetAngle } from './crimeLogic';
import type { MiniGameAction, MiniGameSession } from '../core/types';
import { GameButton } from '../components/GameButton';
import { gameStyles as s, palette as c } from '../components/gameStyles';
const svgAdapter = Platform.OS === 'web' ? undefined : nativeSvgProps;
const MovingGroup = Animated.createAnimatedComponent(G);
export function CrimeGame({
  session,
  clock,
  enabled,
  reducedMotion,
  onInput,
}: {
  session: MiniGameSession;
  clock: SharedValue<number>;
  enabled: boolean;
  reducedMotion: boolean;
  onInput: (action: MiniGameAction, at: number) => void;
}) {
  const viewport = useWindowDimensions(),
    sceneHeight = Math.max(
      160,
      viewport.height -
        180 -
        (session.assisted ? 225 : 165) * Math.max(1, viewport.fontScale),
    );
  const id = useId().replace(/:/g, ''),
    state = lockState(session, session.inputs),
    [angle, setAngle] = useState(0),
    shake = useSharedValue(0),
    opening = useSharedValue(0),
    flash = useSharedValue(0);
  const rotation = useAnimatedProps(
    () => ({
      transform: svgMotion(
        0,
        0,
        session.assisted ? angle : dialAngle(clock.value, session.difficulty),
        1,
        1,
        200,
        262,
      ),
    }),
    [session.assisted, angle, clock, session.difficulty],
    svgAdapter,
  );
  const tremor = useAnimatedProps(
    () => ({
      transform: svgMotion(
        shake.value,
        0,
        0,
        1 - opening.value * 0.28,
        1,
        38,
        0,
      ),
    }),
    [shake, opening],
    svgAdapter,
  );
  useEffect(() => {
    if (state.suspicion && !reducedMotion) {
      shake.value = withSequence(
        withTiming(-4, { duration: 55 }),
        withTiming(4, { duration: 65 }),
        withTiming(0, { duration: 65 }),
      );
      flash.value = withSequence(
        withTiming(0.12, { duration: 50 }),
        withTiming(0, { duration: 180 }),
      );
    }
  }, [state.suspicion, reducedMotion, shake, flash]);
  useEffect(() => {
    if (state.stage === 3)
      opening.value = withTiming(1, { duration: reducedMotion ? 0 : 500 });
  }, [state.stage, reducedMotion, opening]);
  const warning = useAnimatedProps(() => ({ opacity: flash.value }), [flash]);
  const target = targetAngle(session.seed, Math.min(2, state.stage)),
    radians = ((target - 90) * Math.PI) / 180,
    tx = 200 + Math.cos(radians) * 137,
    ty = 262 + Math.sin(radians) * 137;
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
            <LinearGradient id={id + 'metal'} x1="0" y1="0" x2="1" y2="1">
              <Stop stopColor="#425668" />
              <Stop offset="0.45" stopColor="#1B2D3F" />
              <Stop offset="1" stopColor="#091827" />
            </LinearGradient>
            <LinearGradient id={id + 'dial'} x1="0" y1="0" x2="1" y2="1">
              <Stop stopColor="#CED5D4" />
              <Stop offset="0.45" stopColor="#8C9B9F" />
              <Stop offset="1" stopColor="#344A5B" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="560" fill="#071422" />
          <Path
            d="M0 65L400 0M0 505L400 455"
            stroke="#213548"
            strokeWidth="1"
          />
          <Rect
            x="24"
            y="50"
            width="352"
            height="460"
            rx="24"
            fill="#263A4B"
            stroke="#5B6A76"
            strokeWidth="3"
          />
          <Rect x="38" y="65" width="324" height="430" rx="16" fill="#060E1A" />
          <Rect
            x="285"
            y="130"
            width="60"
            height="280"
            rx="6"
            fill="#C7A568"
            opacity="0.25"
          />
          <MovingGroup animatedProps={tremor}>
            <Rect
              x="38"
              y="65"
              width="324"
              height="430"
              rx="16"
              fill={`url(#${id}metal)`}
              stroke="#091725"
              strokeWidth="6"
            />
            {[0, 1, 2].map((i) => (
              <G key={i}>
                <Rect
                  x="354"
                  y={150 + i * 112}
                  width={state.stage > i ? 10 : 26}
                  height="30"
                  rx="5"
                  fill={state.stage > i ? c.green : '#77848A'}
                />
                <Circle
                  cx={162 + i * 38}
                  cy="95"
                  r="7"
                  fill={state.stage > i ? c.green : '#3A4E60'}
                />
              </G>
            ))}
            <Circle
              cx="200"
              cy="262"
              r="151"
              fill="#091523"
              stroke="#849295"
              strokeWidth="2"
            />
            <Circle cx="200" cy="262" r="130" fill={`url(#${id}dial)`} />
            {Array.from({ length: 48 }, (_, i) => {
              const a = ((i * 7.5 - 90) * Math.PI) / 180;
              return (
                <Line
                  key={i}
                  x1={200 + Math.cos(a) * (i % 4 ? 114 : 107)}
                  y1={262 + Math.sin(a) * (i % 4 ? 114 : 107)}
                  x2={200 + Math.cos(a) * 123}
                  y2={262 + Math.sin(a) * 123}
                  stroke="#152B3C"
                  strokeWidth={i % 4 ? 1 : 2}
                />
              );
            })}
            <Circle cx={tx} cy={ty} r="13" fill={c.gold} />
            <Circle
              cx={tx}
              cy={ty}
              r="21"
              fill="none"
              stroke={c.gold}
              opacity="0.35"
              strokeWidth="4"
            />
            <MovingGroup id={id + '-dial'} animatedProps={rotation}>
              <Path d="M200 134L193 158H207Z" fill="#061633" />
              <Circle
                cx="200"
                cy="262"
                r="67"
                fill="#243B4D"
                stroke="#6C7F87"
                strokeWidth="3"
              />
              <Path
                d="M200 207V248"
                stroke={c.gold}
                strokeWidth="5"
                strokeLinecap="round"
              />
              <Circle
                cx="200"
                cy="262"
                r="18"
                fill="#102635"
                stroke="#87928F"
                strokeWidth="2"
              />
            </MovingGroup>
            <SvgText
              x="200"
              y="445"
              textAnchor="middle"
              fill={c.gold}
              fontSize="11"
              letterSpacing="4"
            >
              MERIDIAN SECURITY
            </SvgText>
          </MovingGroup>
          <MovingGroup animatedProps={warning}>
            <Rect width="400" height="560" fill="#D73945" />
          </MovingGroup>
        </Svg>
      </View>
      <View style={s.controls}>
        <View style={s.row}>
          {[0, 1, 2].map((i) => (
            <Text
              key={i}
              style={[
                s.eyebrow,
                { color: state.stage > i ? c.green : c.muted },
              ]}
            >
              {state.stage > i ? '●' : '○'} BOLT {i + 1}
            </Text>
          ))}
        </View>
        <Text style={s.text} accessibilityLiveRegion="polite">
          {state.stage === 3
            ? 'All bolts released'
            : `Target ${Math.round(target)}° · ${session.assisted ? 'Dial ' + angle + '°' : 'Tap when the pointer meets gold'}`}
        </Text>
        <View style={{ height: 7, backgroundColor: c.panel, borderRadius: 4 }}>
          <View
            style={{
              height: 7,
              width: `${state.suspicion}%`,
              backgroundColor: c.red,
              borderRadius: 4,
            }}
          />
        </View>
        <Text style={s.muted}>
          Alarm {state.suspicion}% · Three mistakes trigger the alarm
        </Text>
        {session.assisted && (
          <View style={s.row}>
            <GameButton
              label="−10°"
              accessibilityLabel="Turn dial left ten degrees"
              secondary
              disabled={!enabled}
              onPress={() => setAngle((value) => (value + 350) % 360)}
            />
            <GameButton
              label="+10°"
              accessibilityLabel="Turn dial right ten degrees"
              secondary
              disabled={!enabled}
              onPress={() => setAngle((value) => (value + 10) % 360)}
            />
          </View>
        )}
        <GameButton
          label="Lock alignment"
          disabled={!enabled || state.stage === 3 || state.suspicion >= 100}
          onPress={() =>
            onInput(
              { type: 'lock', ...(session.assisted ? { angle } : {}) },
              clock.value,
            )
          }
        />
      </View>
    </>
  );
}
