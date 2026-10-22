import React, { useEffect, useId, useMemo, useState } from 'react';
import {
  PanResponder,
  Platform,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  Polygon,
  Rect,
  Stop,
  Text as SvgText,
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
import { gameStyles as s, palette as c } from '../components/gameStyles';
const svgAdapter = Platform.OS === 'web' ? undefined : nativeSvgProps;
const MovingGroup = Animated.createAnimatedComponent(G),
  MovingRect = Animated.createAnimatedComponent(Rect);
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
  const viewport = useWindowDimensions(),
    sceneHeight = Math.max(
      160,
      viewport.height -
        180 -
        (session.assisted ? 340 : 275) * Math.max(1, viewport.fontScale),
    );
  const id = useId().replace(/:/g, ''),
    [aim, setAim] = useState({ x: 0.8, y: 0.25 }),
    [power, setPower] = useState(0.78),
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
        duration: reducedMotion ? 0 : 850,
        easing: Easing.out(Easing.cubic),
      });
  }, [shot, flight, reducedMotion]);
  const savedShot = shot?.action.type === 'shot' ? shot.action : null;
  const releasedPower = shot
    ? session.assisted
      ? (savedShot?.power ?? 0.5)
      : shotPower(shot.at)
    : 0.5;
  const endX = 32 + (savedShot?.x ?? aim.x) * 336,
    endY =
      releasedPower > 0.97
        ? 78
        : releasedPower < 0.12
          ? 360
          : 112 + (savedShot?.y ?? aim.y) * 170;
  const keeperAtRelease = keeperPosition(
      session.assisted ? 0 : (shot?.at ?? 0),
      session.seed,
      session.difficulty,
    ),
    caught =
      !!savedShot &&
      releasedPower >= 0.12 &&
      releasedPower <= 0.97 &&
      savedShot.x >= 0.08 &&
      savedShot.x <= 0.92 &&
      savedShot.y > 0.24 &&
      savedShot.y <= 0.9 &&
      Math.abs(savedShot.x - keeperAtRelease) <
        0.09 + session.difficulty * 0.012;
  const diveSign = savedShot && savedShot.x < keeperAtRelease ? -1 : 1,
    keeperEndY = caught ? endY - 23 : 220;
  const diveX = savedShot
    ? (savedShot.x - keeperAtRelease) * (caught ? 1 : 0.6) -
      (caught ? (diveSign * 36) / 336 : 0)
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
        232 + (keeperEndY - 232) * flight.value,
        diveSign * 32 * flight.value,
      ),
    }),
    [
      shot,
      keeperAtRelease,
      diveX,
      keeperEndY,
      diveSign,
      flight,
      session.assisted,
      session.seed,
      session.difficulty,
      clock,
    ],
    svgAdapter,
  );
  const target = useAnimatedProps(
    () => ({ transform: svgMotion(targetX.value, targetY.value) }),
    [targetX, targetY],
    svgAdapter,
  );
  const ball = useAnimatedProps(
    () => ({
      transform: svgMotion(
        200 + (endX - 200) * flight.value,
        470 +
          (endY - 470) * flight.value -
          Math.sin(flight.value * Math.PI) * 75,
        flight.value * 300,
        1 - flight.value * 0.6,
      ),
    }),
    [endX, endY, flight],
    svgAdapter,
  );
  const cheering = !!shot && evaluateShot(session, shot).score >= 30;
  const crowd = useAnimatedProps(
    () => ({
      transform: svgMotion(
        0,
        cheering && !reducedMotion ? -Math.sin(flight.value * Math.PI) * 3 : 0,
      ),
    }),
    [cheering, reducedMotion, flight],
    svgAdapter,
  );
  const callout = useAnimatedProps(
    () => ({
      opacity: flight.value,
      transform: svgMotion(0, 8 * (1 - flight.value)),
    }),
    [flight],
    svgAdapter,
  );
  const meter = useAnimatedProps(
    () => ({
      width: (session.assisted ? power : shotPower(clock.value)) * 260,
    }),
    [session.assisted, power, clock],
  );
  const drag = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () =>
          enabled && !shot && !session.assisted,
        onMoveShouldSetPanResponder: () =>
          enabled && !shot && !session.assisted,
        onPanResponderGrant: (event) =>
          setAim({
            x: Math.max(
              0.01,
              Math.min(
                0.99,
                ((event.nativeEvent.locationX / size.width) * 400 - 32) / 336,
              ),
            ),
            y: Math.max(
              0.01,
              Math.min(
                0.99,
                ((event.nativeEvent.locationY / size.height) * 560 - 112) / 170,
              ),
            ),
          }),
        onPanResponderMove: (event) => {
          targetX.value = Math.max(
            35,
            Math.min(365, (event.nativeEvent.locationX / size.width) * 400),
          );
          targetY.value = Math.max(
            114,
            Math.min(279, (event.nativeEvent.locationY / size.height) * 560),
          );
        },
        onPanResponderRelease: () =>
          setAim({
            x: (targetX.value - 32) / 336,
            y: (targetY.value - 112) / 170,
          }),
      }),
    [enabled, shot, session.assisted, size, targetX, targetY],
  );
  const adjust = (x: number, y: number) =>
    setAim((previous) => ({
      x: Math.max(0.05, Math.min(0.95, previous.x + x)),
      y: Math.max(0.05, Math.min(0.95, previous.y + y)),
    }));
  return (
    <>
      <View
        style={{ height: sceneHeight }}
        onLayout={(event) => setSize(event.nativeEvent.layout)}
        {...drag.panHandlers}
        accessible={false}
      >
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 400 560"
          preserveAspectRatio="none"
          accessible={false}
        >
          <Defs>
            <LinearGradient id={id + 'sky'} x1="0" y1="0" x2="0" y2="1">
              <Stop stopColor="#122C53" />
              <Stop offset="1" stopColor="#526D89" />
            </LinearGradient>
            <LinearGradient id={id + 'pitch'} x1="0" y1="0" x2="0" y2="1">
              <Stop stopColor="#266B59" />
              <Stop offset="1" stopColor="#0C453D" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="560" fill={`url(#${id}sky)`} />
          <Path d="M0 64 Q200 140 400 64V238H0Z" fill="#10223D" />
          <MovingGroup animatedProps={crowd}>
            {[0, 1, 2, 3].map((row) => (
              <G key={row}>
                {Array.from({ length: 30 }, (_, i) => (
                  <Circle
                    key={i}
                    cx={i * 14 - 4}
                    cy={106 + row * 25 + Math.sin(i) * 4}
                    r={2.2}
                    fill={['#DBBC7B', '#739AB1', '#BAA9A2'][i % 3]}
                    opacity={0.5 + row * 0.08}
                  />
                ))}
              </G>
            ))}
          </MovingGroup>
          <Path d="M0 235H400V560H0Z" fill={`url(#${id}pitch)`} />
          <Path
            d="M35 560L130 275H270L365 560M0 362H400M125 560Q200 410 275 560"
            fill="none"
            stroke="#B4E0C1"
            strokeWidth="2"
            opacity="0.5"
          />
          <Rect
            x="58"
            y="126"
            width="284"
            height="140"
            rx="3"
            fill="#112C34"
            opacity="0.7"
          />
          {Array.from({ length: 15 }, (_, i) => (
            <Line
              key={i}
              x1={58 + i * 20}
              x2={58 + i * 20}
              y1="126"
              y2="266"
              stroke="#A0C4CD"
              opacity="0.24"
            />
          ))}
          {Array.from({ length: 8 }, (_, i) => (
            <Line
              key={i}
              x1="58"
              x2="342"
              y1={126 + i * 20}
              y2={126 + i * 20}
              stroke="#A0C4CD"
              opacity="0.24"
            />
          ))}
          <Path
            d="M58 266V126H342V266"
            fill="none"
            stroke="#EAF4EF"
            strokeWidth="7"
          />
          <MovingGroup animatedProps={keeper}>
            <Ellipse cy="48" rx="34" ry="8" fill="#032C2E" opacity="0.5" />
            <Path
              d="M-11 1L-30 15L-42 0M11 1L30 15L42 0M-8 25L-18 47M8 25L18 47"
              stroke="#F4CB7C"
              strokeWidth="11"
              strokeLinecap="round"
              fill="none"
            />
            <Rect x="-15" y="-5" width="30" height="37" rx="9" fill="#F9AE53" />
            <Circle cy="-17" r="13" fill="#DDAF8F" />
            <Path
              d="M-12-21Q0-35 12-21"
              stroke="#392D2B"
              strokeWidth="5"
              fill="none"
            />
            <Circle cx="-4" cy="-17" r="1.2" fill="#24303B" />
            <Circle cx="4" cy="-17" r="1.2" fill="#24303B" />
            <Circle cx="-43" r="6" fill="#F4F8FF" />
            <Circle cx="43" r="6" fill="#F4F8FF" />
          </MovingGroup>
          <MovingGroup animatedProps={target} opacity={shot ? 0.8 : 1}>
            <Circle r="19" fill="none" stroke={c.gold} strokeWidth="2" />
            <Circle r="4" fill={c.gold} />
            <Path
              d="M-27 0H-12M12 0H27M0-27V-12M0 12V27"
              stroke={c.gold}
              strokeWidth="2"
            />
          </MovingGroup>
          {shot && (
            <Path
              d={`M200 470 Q${(200 + endX) / 2} ${endY - 95} ${endX} ${endY}`}
              stroke="#F6CD8255"
              strokeWidth="3"
              strokeDasharray="4 8"
              fill="none"
            />
          )}
          <Ellipse
            cx="200"
            cy="488"
            rx="23"
            ry="7"
            fill="#031C1E"
            opacity="0.45"
          />
          <MovingGroup animatedProps={ball}>
            <Circle r="15" fill="#F5F1E7" stroke="#28434B" strokeWidth="2" />
            <Polygon points="0,-10 9,-2 5,8 -5,8 -9,-2" fill="#263845" />
            <Path
              d="M-14-5L-9-2M14-5L9-2M0 15V8"
              stroke="#28434B"
              strokeWidth="1"
            />
          </MovingGroup>
          {shot && (
            <MovingGroup animatedProps={callout}>
              <SvgText
                x="200"
                y="355"
                textAnchor="middle"
                fill={c.gold}
                fontSize="32"
                fontWeight="800"
              >
                {cheering
                  ? 'GOAL!'
                  : caught
                    ? 'SAVED'
                    : releasedPower < 0.12
                      ? 'SHORT'
                      : releasedPower > 0.97
                        ? 'OVER'
                        : 'WIDE'}
              </SvgText>
            </MovingGroup>
          )}
          <Rect
            x="68"
            y="31"
            width="264"
            height="32"
            rx="16"
            fill="#061633BD"
          />
          <SvgText
            x="200"
            y="52"
            fill={c.white}
            fontSize="12"
            fontWeight="700"
            textAnchor="middle"
          >
            90:00 · THE LAST KICK
          </SvgText>
        </Svg>
      </View>
      <View style={s.controls}>
        <Text style={s.muted}>
          {session.assisted
            ? 'Choose placement and power. Take your time.'
            : 'Drag the target. Shoot when power reaches the gold zone.'}
        </Text>
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
            : ' · ' + Math.round(aim.x * 100) + '% across'}
        </Text>
        <Svg
          width="100%"
          height="18"
          viewBox="0 0 260 18"
          preserveAspectRatio="none"
          accessible={false}
        >
          <Rect width="260" height="18" rx="9" fill="#102C45" />
          <MovingRect
            id={id + '-power'}
            animatedProps={meter}
            height="18"
            rx="9"
            fill={c.blue}
          />
          <Rect
            x="185"
            width="35"
            height="18"
            rx="3"
            fill={c.gold}
            opacity="0.8"
          />
        </Svg>
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
    </>
  );
}
