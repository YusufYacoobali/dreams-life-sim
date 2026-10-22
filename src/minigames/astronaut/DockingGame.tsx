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
import { SceneCanvas } from '../components/SceneCanvas';
import { sceneArt } from '../components/sceneArtwork';
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
        current.value.y * 560 +
          (current.value.score >= 30 ? -12 : 24) * capture.value,
        current.value.vx * 90,
      ),
    }),
    [current, capture],
    svgAdapter,
  );
  const stars = useAnimatedProps(
    () => ({
      opacity: current.value.finished
        ? 1
        : reducedMotion
          ? 0.65
          : 0.55 + 0.18 * Math.sin(clock.value / 1300),
    }),
    [clock, reducedMotion, current],
  );
  const thrust = useAnimatedProps(
    () => ({
      transform: svgMotion(0, 0, flareAngle.value),
      opacity:
        !reducedMotion &&
        !current.value.finished &&
        clock.value - flare.value < 210
          ? 0.85
          : 0,
    }),
    [reducedMotion, clock, flare, flareAngle, current],
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
        capture.value = withTiming(1, { duration: reducedMotion ? 0 : 650 });
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
      <SceneCanvas controlsHeight={220}>
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 400 560"
          accessible={false}
        >
          <SvgImage
            href={sceneArt.station}
            x="-3"
            y="16"
            width="390"
            height="140"
          />
          <MovingGroup animatedProps={stars}>
            <Circle
              cx="200"
              cy="134"
              r="21"
              stroke={
                session.score !== null && session.score < 60 ? c.red : '#8EFFC5'
              }
              fill="#09141D66"
              strokeWidth="2"
            />
            <Circle
              cx="200"
              cy="134"
              r="28"
              stroke="#93FBCB"
              fill="none"
              strokeWidth="1"
              opacity="0.25"
            />
            <Path
              d="M200 167V490M164 134H181M219 134H236M182 166H218"
              stroke="#92EFC4"
              strokeDasharray="3 9"
              strokeWidth="1"
              opacity="0.5"
            />
          </MovingGroup>
          <MovingGroup id={id + '-ship'} animatedProps={ship}>
            <MovingGroup animatedProps={thrust}>
              <SvgImage
                href={sceneArt.thruster}
                x="-8"
                y="22"
                width="16"
                height="38"
              />
            </MovingGroup>
            <SvgImage
              href={sceneArt.ship}
              x="-30"
              y="-38"
              width="60"
              height="76"
            />
          </MovingGroup>
        </Svg>
      </SceneCanvas>
      <View style={s.controls}>
        <Text style={s.controlTitle}>
          Align with the port. Brake before contact.
        </Text>
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <Text style={s.muted}>Fuel {telemetry.fuel}%</Text>
          <Text style={s.muted}>Speed {telemetry.speed} · safe ≤10</Text>
          <Text style={s.muted}>
            {telemetry.side} {telemetry.alignment}%
          </Text>
        </View>
        <View
          style={{ height: 3, backgroundColor: '#20374C', borderRadius: 3 }}
        >
          <View
            style={{
              width: `${telemetry.fuel}%`,
              height: 3,
              backgroundColor: telemetry.fuel > 20 ? c.blue : c.red,
            }}
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
            label="↑"
            accessibilityLabel="Thrust up"
            secondary
            disabled={!enabled}
            onPress={() => pulse('up')}
          />
          <GameButton
            label="↓ Brake"
            accessibilityLabel="Thrust down to brake"
            disabled={!enabled}
            onPress={() => pulse('down')}
          />
          <GameButton
            label="→"
            accessibilityLabel="Thrust right"
            secondary
            disabled={!enabled}
            onPress={() => pulse('right')}
          />
          {session.assisted && (
            <GameButton
              label="Coast"
              secondary
              disabled={!enabled}
              onPress={() => pulse('coast')}
            />
          )}
        </View>
        <Text style={s.muted}>
          Range {telemetry.range}% · Drift {telemetry.drift}
          {session.assisted
            ? ' · Each tap advances 0.4 seconds'
            : ' · Tap for short thruster bursts'}
        </Text>
      </View>
    </>
  );
}
