import React, { useEffect, useId, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
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
  controlsVisible = true,
  onInput,
  onFinished,
}: {
  session: MiniGameSession;
  clock: SharedValue<number>;
  enabled: boolean;
  reducedMotion: boolean;
  controlsVisible?: boolean;
  onInput: (action: MiniGameAction, at: number) => boolean | void;
  onFinished: (at: number) => void;
}) {
  const { fontScale } = useWindowDimensions(),
    interaction = useRef({ enabled, onInput, sessionId: session.id }),
    id = useId().replace(/:/g, ''),
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
  interaction.current = { enabled, onInput, sessionId: session.id };
  useEffect(() => {
    interaction.current.enabled = enabled;
    return () => { interaction.current.enabled = false; };
  }, []);
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
    if (!interaction.current.enabled || interaction.current.sessionId !== session.id) return;
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
    // The screen accepts one durable input at a time, before optimistic visuals.
    // A rapid/stale native callback must not spend fuel without a saved input.
    if (interaction.current.onInput({ type: 'thrust', direction }, at) === false) return;
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
  };
  return (
    <>
      <SceneCanvas controlsHeight={376}>
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
      <View style={[styles.telemetry, !controlsVisible && { opacity: 0 }]}>
          <Text style={styles.readout}>Fuel {telemetry.fuel}%</Text>
          <Text style={styles.readout}>Speed {telemetry.speed} · safe ≤10</Text>
          <Text style={styles.readout}>
            {telemetry.side} {telemetry.alignment}%
          </Text>
      </View>
      <View style={[s.controls, { gap: 8, paddingTop: 12 }, !controlsVisible && { opacity: 0 }]}>
        <View accessible={false} style={styles.handle} />
        <Text style={s.controlTitle}>Line up. Tap down to brake.</Text>
        <View style={styles.disc} testID="docking-control-disc">
          <GameButton
            label="←"
            icon="left"
            accessibilityLabel="Thrust left"
            secondary
            round
            size={64}
            style={[styles.direction, styles.left]}
            textStyle={styles.arrow}
            disabled={!enabled}
            onPress={() => pulse('left')}
          />
          <GameButton
            label="↑"
            icon="up"
            accessibilityLabel="Thrust up"
            secondary
            round
            size={64}
            style={[styles.direction, styles.up]}
            textStyle={styles.arrow}
            disabled={!enabled}
            onPress={() => pulse('up')}
          />
          <GameButton
            label="↓"
            icon="down"
            accessibilityLabel="Thrust down to brake"
            secondary
            round
            size={64}
            style={[styles.direction, styles.down]}
            textStyle={styles.arrow}
            disabled={!enabled}
            onPress={() => pulse('down')}
          />
          <GameButton
            label="→"
            icon="right"
            accessibilityLabel="Thrust right"
            secondary
            round
            size={64}
            style={[styles.direction, styles.right]}
            textStyle={styles.arrow}
            disabled={!enabled}
            onPress={() => pulse('right')}
          />
            <GameButton
              label="Coast"
              accessibilityHint={session.assisted ? 'Advance 0.4 seconds without thrust' : 'Keep drifting without thrust'}
              round
              size={fontScale > 1.3 ? 88 : 80}
              style={{ position: 'absolute', left: fontScale > 1.3 ? 76 : 80, top: fontScale > 1.3 ? 76 : 80 }}
              disabled={!enabled}
              onPress={() => pulse('coast')}
            />
        </View>
        <Text style={[s.muted, { textAlign: 'center' }]}>
          Range {telemetry.range}% · Drift {telemetry.drift}
          {session.assisted
            ? ' · Each tap advances 0.4 seconds'
            : ''}
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  telemetry: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: 16,
    rowGap: 4,
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  readout: { color: '#F4F8FF', fontSize: 12, fontVariant: ['tabular-nums'] },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#C9CDD4', alignSelf: 'center', marginBottom: 4 },
  disc: { width: 240, height: 240, borderRadius: 120, alignSelf: 'center', backgroundColor: '#EAF0F766' },
  direction: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D6E3F3',
    shadowColor: '#183B63',
    shadowOpacity: 0.12,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  arrow: { color: '#101B43' },
  up: { left: 88, top: 8 },
  left: { left: 8, top: 88 },
  right: { right: 8, top: 88 },
  down: { left: 88, bottom: 8 },
});
