import React, { useEffect, useId, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import Svg, {
  Circle,
  G,
  Image as SvgImage,
  Path,
  Rect,
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
import { SceneCanvas } from '../components/SceneCanvas';
import { sceneArt } from '../components/sceneArtwork';
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
  const door = useAnimatedProps(
    () => ({
      transform: svgMotion(
        shake.value,
        0,
        0,
        1 - opening.value * 0.2,
        1,
        25,
        0,
      ),
    }),
    [shake, opening],
    svgAdapter,
  );
  const warning = useAnimatedProps(() => ({ opacity: flash.value }), [flash]);
  useEffect(() => {
    if (state.suspicion && !reducedMotion) {
      shake.value = withSequence(
        withTiming(-3, { duration: 60 }),
        withTiming(3, { duration: 70 }),
        withTiming(0, { duration: 90 }),
      );
      flash.value = withSequence(
        withTiming(0.1, { duration: 65 }),
        withTiming(0, { duration: 220 }),
      );
    }
  }, [state.suspicion, reducedMotion, shake, flash]);
  useEffect(() => {
    if (state.stage === 3)
      opening.value = withTiming(1, { duration: reducedMotion ? 0 : 650 });
  }, [state.stage, reducedMotion, opening]);
  const target = targetAngle(session.seed, Math.min(2, state.stage)),
    radians = ((target - 90) * Math.PI) / 180,
    tx = 200 + Math.cos(radians) * 137,
    ty = 262 + Math.sin(radians) * 137;
  return (
    <>
      <SceneCanvas controlsHeight={session.assisted ? 245 : 185}>
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 400 560"
          preserveAspectRatio="xMidYMid slice"
          accessible={false}
        >
          <Rect x="25" y="18" width="350" height="524" rx="10" fill="#03090F" />
          <Path d="M60 380H349M60 425H349" stroke="#6F829344" strokeWidth="6" />
          <MovingGroup animatedProps={door}>
            <SvgImage
              href={sceneArt.safe}
              x="0"
              y="0"
              width="400"
              height="560"
              preserveAspectRatio="xMidYMid slice"
            />
            <Circle cx="200" cy="262" r="145" fill="#020A10" opacity="0.55" />
            <Circle
              cx="200"
              cy="262"
              r="141"
              stroke="#A0B6C4"
              opacity="0.3"
              strokeWidth="1"
              fill="none"
            />
            <MovingGroup id={id + '-dial'} animatedProps={rotation}>
              <SvgImage
                href={sceneArt.dial}
                x="75"
                y="137"
                width="250"
                height="250"
              />
              <Path d="M200 127L195 144H205Z" fill="#D8F3FF" />
            </MovingGroup>
            {state.stage < 3 && (
              <G>
                <Circle cx={tx} cy={ty} r="14" fill="#75E9B8" opacity="0.13" />
                <Circle
                  cx={tx}
                  cy={ty}
                  r="8"
                  fill="none"
                  stroke="#8CFFD0"
                  strokeWidth="2"
                />
                <Circle cx={tx} cy={ty} r="2.5" fill="#D4FFEC" />
              </G>
            )}
            {[0, 1, 2].map((i) => (
              <G key={i}>
                <Rect
                  x="348"
                  y={145 + i * 112}
                  width={state.stage > i ? 9 : 23}
                  height="26"
                  rx="4"
                  fill={state.stage > i ? '#6FC5AA' : '#75818B'}
                  stroke="#B2CBD2"
                  strokeWidth="0.5"
                />
                <Circle
                  cx={176 + i * 24}
                  cy="445"
                  r="4"
                  fill={state.stage > i ? '#88F7C4' : '#40515E'}
                />
              </G>
            ))}
          </MovingGroup>
          <MovingGroup animatedProps={warning}>
            <Rect width="400" height="560" fill="#D73945" />
          </MovingGroup>
        </Svg>
      </SceneCanvas>
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
        <Text style={s.controlTitle} accessibilityLiveRegion="polite">
          {state.stage === 3
            ? 'All bolts released'
            : state.suspicion >= 100
              ? 'Alarm triggered'
              : `Target ${Math.round(target)}° · ${session.assisted ? 'Dial ' + angle + '°' : 'Meet the green marker'}`}
        </Text>
        <View
          style={{ height: 4, backgroundColor: '#233548', borderRadius: 4 }}
        >
          <View
            style={{
              height: 4,
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
