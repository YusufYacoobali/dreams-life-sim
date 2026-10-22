import React, { useEffect, useId, useMemo, useState } from 'react';
import { PanResponder, Platform, Text, View } from 'react-native';
import Svg, {
  Circle,
  Ellipse,
  G,
  Image as SvgImage,
  Line,
  Path,
  Rect,
} from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { nativeSvgProps, svgMotion } from '../core/svgMotion';
import { evaluateShot, keeperPosition, shotPower } from './sportsLogic';
import type { MiniGameAction, MiniGameSession } from '../core/types';
import { GameButton } from '../components/GameButton';
import { SceneCanvas } from '../components/SceneCanvas';
import { sceneArt } from '../components/sceneArtwork';
import { gameStyles as s, palette as c } from '../components/gameStyles';
const svgAdapter = Platform.OS === 'web' ? undefined : nativeSvgProps;
const MovingGroup = Animated.createAnimatedComponent(G),
  MovingRect = Animated.createAnimatedComponent(Rect),
  MovingLine = Animated.createAnimatedComponent(Line);
export function SportsGame({
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
    [aim, setAim] = useState({ x: 0.8, y: 0.25 }),
    [power, setPower] = useState(0.78),
    [stage, setStage] = useState<'aim' | 'power'>('aim'),
    [size, setSize] = useState({ width: 400, height: 560 });
  const targetX = useSharedValue(32 + aim.x * 336),
    targetY = useSharedValue(112 + aim.y * 170),
    flight = useSharedValue(0),
    shot = session.inputs[0];
  useEffect(() => {
    targetX.value = 32 + aim.x * 336;
    targetY.value = 112 + aim.y * 170;
  }, [aim, targetX, targetY]);
  useEffect(() => {
    if (shot)
      flight.value = withTiming(1, {
        duration: reducedMotion ? 0 : 1050,
        easing: Easing.out(Easing.cubic),
      });
  }, [shot, flight, reducedMotion]);
  const savedShot = shot?.action.type === 'shot' ? shot.action : null,
    releasedPower = shot
      ? session.assisted
        ? (savedShot?.power ?? 0.5)
        : shotPower(shot.at)
      : 0.5,
    outcome = shot ? evaluateShot(session, shot) : null,
    caught = outcome?.detail === 'The keeper makes the save',
    goal = !!outcome && outcome.score >= 30,
    endX = 32 + (savedShot?.x ?? aim.x) * 336,
    endY =
      releasedPower > 0.97
        ? 88
        : releasedPower < 0.12
          ? 390
          : 112 + (savedShot?.y ?? aim.y) * 170,
    keeperAtRelease = keeperPosition(
      session.assisted ? 0 : (shot?.at ?? 0),
      session.seed,
      session.difficulty,
    ),
    diveSign = savedShot && savedShot.x < keeperAtRelease ? -1 : 1,
    diveX = savedShot
      ? (savedShot.x - keeperAtRelease) * (caught ? 1 : 0.65) -
        (caught ? (diveSign * 58) / 336 : 0)
      : 0;
  const keeper = useAnimatedProps(
    () => ({
      transform: svgMotion(
        32 +
          (shot
            ? keeperAtRelease + diveX * flight.value
            : keeperPosition(
                session.assisted ? 0 : clock.value,
                session.seed,
                session.difficulty,
              )) *
            336,
        242 + (caught ? endY + 38 - 242 : -9) * flight.value,
        shot ? diveSign * -10 * flight.value : 0,
        shot ? diveSign : 1,
        1,
      ),
    }),
    [
      shot,
      keeperAtRelease,
      diveX,
      caught,
      endY,
      diveSign,
      flight,
      session.assisted,
      session.seed,
      session.difficulty,
      clock,
    ],
    svgAdapter,
  );
  const idle = useAnimatedProps(
    () => ({ opacity: 1 - Math.min(1, flight.value * 5) }),
    [flight],
  );
  const dive = useAnimatedProps(
    () => ({ opacity: Math.min(1, flight.value * 5) }),
    [flight],
  );
  const target = useAnimatedProps(
    () => ({
      transform: svgMotion(targetX.value, targetY.value),
      opacity: shot ? 0 : 1,
    }),
    [targetX, targetY, shot],
    svgAdapter,
  );
  const guide = useAnimatedProps(
    () => ({
      d: `M200 480 Q${(200 + targetX.value) / 2} 310 ${targetX.value} ${targetY.value}`,
    }),
    [targetX, targetY],
  );
  const ball = useAnimatedProps(
    () => ({
      transform: svgMotion(
        200 + (endX - 200) * flight.value,
        480 +
          (endY - 480) * flight.value -
          Math.sin(flight.value * Math.PI) * 72,
        flight.value * 290,
        1 - flight.value * 0.67,
      ),
    }),
    [endX, endY, flight],
    svgAdapter,
  );
  const shadow = useAnimatedProps(
    () => ({
      transform: svgMotion(
        200 + (endX - 200) * flight.value,
        498 + (275 - 498) * flight.value,
        0,
        1 - flight.value * 0.65,
      ),
      opacity: 0.32 - Math.sin(flight.value * Math.PI) * 0.24,
    }),
    [endX, flight],
    svgAdapter,
  );
  const net = useAnimatedProps(
    () => ({
      transform: svgMotion(
        0,
        goal && !reducedMotion
          ? Math.sin(flight.value * Math.PI * 5) *
              Math.max(0, flight.value - 0.65) *
              7
          : 0,
      ),
    }),
    [goal, reducedMotion, flight],
    svgAdapter,
  );
  const meter = useAnimatedProps(
    () => ({
      width: (session.assisted ? power : shotPower(clock.value)) * 260,
    }),
    [session.assisted, power, clock],
  );
  const indicator = useAnimatedProps(
    () => ({
      x1: (session.assisted ? power : shotPower(clock.value)) * 260,
      x2: (session.assisted ? power : shotPower(clock.value)) * 260,
    }),
    [session.assisted, power, clock],
  );
  const drag = useMemo(() => {
    const locate = (x: number, y: number) => {
      const scale = Math.min(size.width / 400, size.height / 560),
        ox = (size.width - 400 * scale) / 2,
        oy = (size.height - 560 * scale) / 2;
      targetX.value = Math.max(35, Math.min(365, (x - ox) / scale));
      targetY.value = Math.max(114, Math.min(279, (y - oy) / scale));
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => enabled && !shot && stage === 'aim',
      onMoveShouldSetPanResponder: () => enabled && !shot && stage === 'aim',
      onPanResponderGrant: (e) =>
        locate(e.nativeEvent.locationX, e.nativeEvent.locationY),
      onPanResponderMove: (e) =>
        locate(e.nativeEvent.locationX, e.nativeEvent.locationY),
      onPanResponderRelease: () =>
        setAim({
          x: (targetX.value - 32) / 336,
          y: (targetY.value - 112) / 170,
        }),
      onPanResponderTerminate: () =>
        setAim({
          x: (targetX.value - 32) / 336,
          y: (targetY.value - 112) / 170,
        }),
      onPanResponderTerminationRequest: () => false,
    });
  }, [enabled, shot, stage, size, targetX, targetY]);
  const adjust = (x: number, y: number) =>
    setAim((previous) => ({
      x: Math.max(0.05, Math.min(0.95, previous.x + x)),
      y: Math.max(0.05, Math.min(0.95, previous.y + y)),
    }));
  return (
    <>
      <SceneCanvas
        controlsHeight={session.assisted ? 280 : 140}
        onLayout={(e) => setSize(e.nativeEvent.layout)}
        {...drag.panHandlers}
      >
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 400 560"
          pointerEvents="none"
          accessible={false}
        >
          <MovingGroup animatedProps={net}>
            <SvgImage
              href={sceneArt.goal}
              x="49"
              y="118"
              width="302"
              height="159"
            />
          </MovingGroup>
          <MovingGroup animatedProps={keeper}>
            <MovingGroup animatedProps={idle}>
              <SvgImage
                href={sceneArt.keeper}
                x="-43"
                y="-88"
                width="86"
                height="114"
              />
            </MovingGroup>
            <MovingGroup animatedProps={dive}>
              <SvgImage
                href={sceneArt.keeperDive}
                x="-68"
                y="-36"
                width="136"
                height="70"
              />
            </MovingGroup>
          </MovingGroup>
          {!shot && (
            <AnimatedPath
              animatedProps={guide}
              fill="none"
              stroke="#ACF5CB"
              strokeWidth="1.3"
              strokeDasharray="4 9"
              opacity="0.35"
            />
          )}
          <MovingGroup animatedProps={target}>
            <Circle
              r="23"
              stroke="#83F7B3"
              strokeWidth="7"
              opacity="0.14"
              fill="none"
            />
            <Circle
              r="18"
              stroke="#99FFC2"
              strokeWidth="1.5"
              fill="#64E49C22"
            />
            <Path
              d="M-26 0H-11M11 0H26M0-26V-11M0 11V26"
              stroke="#B2FFD1"
              strokeWidth="1.5"
            />
          </MovingGroup>
          <MovingGroup animatedProps={shadow}>
            <Ellipse rx="20" ry="5" fill="#00120B" />
          </MovingGroup>
          <MovingGroup animatedProps={ball}>
            <SvgImage
              href={sceneArt.ball}
              x="-20"
              y="-20"
              width="40"
              height="40"
            />
          </MovingGroup>
        </Svg>
      </SceneCanvas>
      <View style={s.controls}>
        <Text style={s.controlTitle}>
          {shot
            ? goal
              ? 'Goal!'
              : caught
                ? 'Saved!'
                : 'Missed!'
            : session.assisted
              ? 'Choose placement and power'
              : stage === 'aim'
                ? 'Drag to aim'
                : 'Tap to set your power'}
        </Text>
        {(session.assisted || stage === 'aim') && (
          <Text accessibilityLiveRegion="polite" style={s.muted}>
            {aim.x < 0.08 || aim.x > 0.92 || aim.y < 0.08 || aim.y > 0.9
              ? 'Outside the goal'
              : (aim.y < 0.3 ? 'High ' : aim.y > 0.7 ? 'Low ' : '') +
                (aim.x < 0.4 ? 'left' : aim.x > 0.6 ? 'right' : 'centre')}
            {session.assisted
              ? ' · Keeper: ' +
                (keeperAtRelease < 0.4
                  ? 'left'
                  : keeperAtRelease > 0.6
                    ? 'right'
                    : 'centre')
              : ' · Aim away from the keeper'}
          </Text>
        )}
        {session.assisted && (
          <View style={s.row}>
            <GameButton
              label="←"
              accessibilityLabel="Aim left"
              secondary
              disabled={!enabled || !!shot}
              onPress={() => adjust(-0.1, 0)}
            />
            <GameButton
              label="↑"
              accessibilityLabel="Aim higher"
              secondary
              disabled={!enabled || !!shot}
              onPress={() => adjust(0, -0.1)}
            />
            <GameButton
              label="↓"
              accessibilityLabel="Aim lower"
              secondary
              disabled={!enabled || !!shot}
              onPress={() => adjust(0, 0.1)}
            />
            <GameButton
              label="→"
              accessibilityLabel="Aim right"
              secondary
              disabled={!enabled || !!shot}
              onPress={() => adjust(0.1, 0)}
            />
          </View>
        )}
        {(session.assisted || stage === 'power') && (
          <Svg
            width="100%"
            height="18"
            viewBox="-2 -3 264 24"
            preserveAspectRatio="none"
            accessible={false}
          >
            <Rect width="260" height="18" rx="9" fill="#07172AE8" />
            <MovingRect
              id={id + '-power'}
              animatedProps={meter}
              height="18"
              rx="9"
              fill="#4FA3EC"
              opacity="0.3"
            />
            <Rect
              x="185"
              width="35"
              height="18"
              rx="3"
              fill="#82E8AF"
              opacity="0.8"
            />
            <MovingLine
              animatedProps={indicator}
              y1="-2"
              y2="20"
              stroke="#F4FCFF"
              strokeWidth="3"
            />
          </Svg>
        )}
        {session.assisted && (
          <View style={s.row}>
            {[0.55, 0.78, 0.9].map((value) => (
              <GameButton
                key={value}
                secondary={power !== value}
                label={Math.round(value * 100) + '% power'}
                disabled={!enabled || !!shot}
                onPress={() => setPower(value)}
              />
            ))}
          </View>
        )}
        {!session.assisted && stage === 'aim' ? (
          <GameButton
            label="Set aim"
            disabled={!enabled || !!shot}
            onPress={() => setStage('power')}
          />
        ) : (
          <View style={s.row}>
            {!session.assisted && !shot && (
              <GameButton
                label="Adjust aim"
                secondary
                disabled={!enabled}
                onPress={() => setStage('aim')}
              />
            )}
            <GameButton
              label={shot ? 'Shot away' : 'Shoot'}
              disabled={!enabled || !!shot}
              onPress={() =>
                onInput(
                  {
                    type: 'shot',
                    x: aim.x,
                    y: aim.y,
                    ...(session.assisted ? { power } : {}),
                  },
                  clock.value,
                )
              }
            />
          </View>
        )}
      </View>
    </>
  );
}
const AnimatedPath = Animated.createAnimatedComponent(Path);
