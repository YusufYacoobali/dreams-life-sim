import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  AppState,
  BackHandler,
  ScrollView,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from 'expo-router';
import {
  cancelAnimation,
  Easing,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useFeedback } from '../../ui/feedback';
import { useMiniGameAudio } from '../core/useMiniGameAudio';
import {
  durationMs,
  titles,
  type MiniGameAction,
  type MiniGameKind,
  type MiniGameSession,
} from '../core/types';
import { evaluateSession } from '../core/evaluation';
import { SportsGame } from '../sports/SportsGame';
import { CrimeGame } from '../crime/CrimeGame';
import { DockingGame } from '../astronaut/DockingGame';
import { GameButton } from './GameButton';
import { SceneBackdrop, ScenePreview } from './SceneBackdrop';
import { preloadSceneArt } from './sceneArtwork';
import { MiniGameHUD } from './MiniGameHUD';
import { MiniGameResult } from './MiniGameResult';
import { gameStyles as s, palette as c } from './gameStyles';

type Phase =
  | 'intro'
  | 'countdown'
  | 'playing'
  | 'paused'
  | 'finishing'
  | 'result';
type Props = {
  kind: MiniGameKind;
  session: MiniGameSession | null;
  difficulty: number;
  practice?: boolean;
  error: string | null;
  busy: boolean;
  unavailable?: string;
  onStart: (assisted: boolean) => Promise<boolean>;
  onInput: (action: MiniGameAction, at: number) => Promise<boolean>;
  onPause: (at: number) => Promise<boolean>;
  onResume: () => Promise<boolean>;
  onComplete: (at: number) => Promise<boolean>;
  onForfeit: () => Promise<boolean>;
  onExit: () => void;
  onSkip: () => Promise<boolean>;
  onRestart?: () => void;
  onReload?: () => Promise<MiniGameSession | null>;
};
const instructions = {
  sports: 'Aim for a corner, then stop the power in the green zone.',
  crime: 'Match the green marker to unlock all three bolts.',
  astronaut: 'Line up with the green port. Tap down to brake.',
};

export function MiniGameScreen(props: Props) {
  const { kind, session, practice = false, error, busy } = props,
    feedback = useFeedback(),
    { height } = useWindowDimensions(),
    insets = useSafeAreaInsets(),
    overlay = [s.overlay, { top: insets.top, bottom: insets.bottom }];
  const [phase, setPhase] = useState<Phase>('intro'),
    [assisted, setAssisted] = useState(feedback.reducedMotion),
    [countdown, setCountdown] = useState(3),
    [writing, setWriting] = useState(false),
    [confirmForfeit, setConfirmForfeit] = useState(false),
    [artReady, setArtReady] = useState(false),
    [artError, setArtError] = useState(false),
    [artRetry, setArtRetry] = useState(0),
    [sceneRevision, setSceneRevision] = useState(0);
  useEffect(() => {
    let live = true;
    setArtReady(false);
    setArtError(false);
    void preloadSceneArt(kind).then(
      () => {
        if (live) setArtReady(true);
      },
      () => {
        if (live) setArtError(true);
      },
    );
    return () => {
      live = false;
    };
  }, [kind, artRetry]);
  const playSound = useMiniGameAudio(kind);
  const clock = useSharedValue(session?.elapsedMs ?? 0),
    current = useRef(props),
    phaseRef = useRef(phase),
    mounted = useRef(true),
    sessionId = useRef<string | null>(null),
    finishing = useRef(false),
    pendingInput = useRef<Promise<boolean>>(Promise.resolve(true)),
    inputInFlight = useRef(false),
    failedInput = useRef<{ action: MiniGameAction; at: number } | null>(null),
    finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  current.current = props;
  phaseRef.current = phase;
  const time = () =>
    Math.min(
      durationMs[kind],
      Math.max(
        current.current.session?.elapsedMs ?? 0,
        Math.round(clock.value),
      ),
    );
  const pause = useCallback(async () => {
    if (!['playing', 'countdown', 'finishing'].includes(phaseRef.current))
      return;
    phaseRef.current = 'paused';
    cancelAnimation(clock);
    if (finishTimer.current) clearTimeout(finishTimer.current);
    const at = Math.min(
      durationMs[current.current.kind],
      Math.round(clock.value),
    );
    setPhase('paused');
    await pendingInput.current;
    if (!failedInput.current)
      await current.current.onPause(
        Math.max(current.current.session?.elapsedMs ?? 0, at),
      );
  }, [clock]);
  const saveResult = useCallback(async (at: number) => {
    await pendingInput.current;
    if (!mounted.current) return;
    if (failedInput.current) {
      setPhase('paused');
      return;
    }
    setPhase('result');
    setWriting(true);
    try {
      await current.current.onComplete(at);
    } finally {
      if (mounted.current) setWriting(false);
    }
  }, []);
  const finish = useCallback(
    (at: number) => {
      if (finishing.current || phaseRef.current !== 'playing') return;
      finishing.current = true;
      cancelAnimation(clock);
      const end = Math.min(
        durationMs[current.current.kind],
        Math.max(current.current.session?.elapsedMs ?? 0, Math.ceil(at)),
      );
      clock.value = end;
      setPhase('finishing');
      finishTimer.current = setTimeout(
        () => {
          void saveResult(end);
        },
        feedback.reducedMotion
          ? 0
          : current.current.kind === 'sports'
            ? 1150
            : 750,
      );
    },
    [clock, feedback.reducedMotion, saveResult],
  );
  useEffect(() => {
    if (!session) {
      sessionId.current = null;
      finishing.current = false;
      setPhase('intro');
      return;
    }
    if (session.id !== sessionId.current) {
      sessionId.current = session.id;
      clock.value = session.elapsedMs;
      finishing.current = false;
      failedInput.current = null;
      setPhase(
        session.status !== 'active' || evaluateSession(session).finished
          ? 'result'
          : session.paused || session.elapsedMs > 0
            ? 'paused'
            : 'countdown',
      );
    } else if (session.status !== 'active') setPhase('result');
  }, [session, clock]);
  useEffect(() => {
    if (phase !== 'countdown' || !artReady) return;
    setCountdown(3);
    let remaining = 3;
    const timer = setInterval(() => {
      remaining--;
      if (remaining === 0) {
        clearInterval(timer);
        setPhase('playing');
      } else setCountdown(remaining);
    }, 350);
    return () => clearInterval(timer);
  }, [phase, artReady]);
  useEffect(() => {
    if (phase !== 'playing' || !session || session.assisted || !artReady)
      return;
    const total = durationMs[kind];
    clock.value = withTiming(
      total,
      { duration: Math.max(0, total - clock.value), easing: Easing.linear },
      (done) => {
        if (done) scheduleOnRN(finish, total);
      },
    );
    return () => cancelAnimation(clock);
  }, [phase, session?.id, session?.assisted, kind, clock, finish, artReady]);
  useEffect(() => {
    if (
      session &&
      session.status === 'active' &&
      phase === 'playing' &&
      evaluateSession(session).finished
    )
      finish(time());
  }, [session, phase, finish]);
  useFocusEffect(
    useCallback(() => {
      const background = AppState.addEventListener('change', (state) => {
        if (state !== 'active') void pause();
      });
      const back = BackHandler.addEventListener('hardwareBackPress', () => {
        if (
          phaseRef.current === 'intro' ||
          current.current.session?.status !== 'active'
        )
          current.current.onExit();
        else void pause();
        return true;
      });
      return () => {
        background.remove();
        back.remove();
        void pause();
      };
    }, [pause]),
  );
  useEffect(() => {
    if (
      ['background', 'inactive'].includes(AppState.currentState) &&
      ['countdown', 'playing', 'finishing'].includes(phase)
    )
      void pause();
  }, [phase, pause]);
  useEffect(() => {
    void AccessibilityInfo.isScreenReaderEnabled().then(
      (enabled) => {
        if (enabled && mounted.current && phaseRef.current === 'intro')
          setAssisted(true);
      },
      () => {},
    );
    return () => {};
  }, []);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      cancelAnimation(clock);
      if (finishTimer.current) clearTimeout(finishTimer.current);
    };
  }, [clock]);
  const input = (action: MiniGameAction, at: number) => {
    if (
      inputInFlight.current ||
      finishing.current ||
      !mounted.current ||
      writing ||
      busy ||
      phaseRef.current !== 'playing' ||
      failedInput.current
    )
      return false;
    inputInFlight.current = true;
    setWriting(true);
    feedback.hapticFeedback();
    void playSound();
    const entry = { action, at: Math.round(at) };
    let promise: Promise<boolean>;
    try {
      promise = Promise.resolve(current.current.onInput(entry.action, entry.at)).catch(() => false);
    } catch {
      promise = Promise.resolve(false);
    }
    pendingInput.current = promise;
    void promise
      .then(
        (ok) => {
          if (!mounted.current) return;
          if (ok) {
            if (current.current.session?.assisted) clock.value = entry.at;
          } else {
            failedInput.current = entry;
            cancelAnimation(clock);
            setPhase('paused');
          }
        },
        () => {
          failedInput.current = entry;
          if (mounted.current) {
            cancelAnimation(clock);
            setPhase('paused');
          }
        },
      )
      .finally(() => {
        inputInFlight.current = false;
        if (mounted.current) setWriting(false);
      });
    return true;
  };
  const resume = async () => {
    setWriting(true);
    finishing.current = false;
    try {
      if (failedInput.current) {
        const failed = failedInput.current;
        if (!(await current.current.onInput(failed.action, failed.at))) return;
        failedInput.current = null;
        clock.value = Math.max(clock.value, failed.at);
      }
      if (
        !(await current.current.onPause(time())) ||
        !(await current.current.onResume())
      )
        return;
      clock.value = Math.max(
        clock.value,
        current.current.session?.elapsedMs ?? 0,
      );
      setPhase(
        current.current.session &&
          evaluateSession(current.current.session).finished
          ? 'result'
          : 'playing',
      );
    } finally {
      if (mounted.current) setWriting(false);
    }
  };
  const enabled = phase === 'playing' && !writing && !busy && artReady;
  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom', 'left', 'right']}>
      <SceneBackdrop kind={kind} />
      <StatusBar style="light" />
      <View style={s.header}>
        <GameButton
          label={session?.status === 'active' ? 'Pause' : 'Back'}
          icon={session?.status === 'active' ? 'pause' : 'back'}
          iconColor={c.white}
          accessibilityLabel={session?.status === 'active' ? 'Pause' : 'Back'}
          secondary
          round
          size={48}
          style={{ backgroundColor: '#FFFFFF1C' }}
          textStyle={{ color: c.white }}
          disabled={
            writing ||
            busy ||
            (session?.status === 'active' &&
              !['playing', 'countdown', 'finishing'].includes(phase))
          }
          onPress={() => {
            if (session?.status === 'active') void pause();
            else props.onExit();
          }}
        />
        <View style={{ flex: 1 }}>
          <Text style={[s.eyebrow, { color: '#DCE6F2' }]}>
            {practice ? 'PRACTICE' : 'CHALLENGE'}
          </Text>
          <Text accessibilityRole="header" style={[s.title, { fontSize: 18, color: c.white }]}>
            {titles[kind]}
          </Text>
        </View>
      </View>
      {session && (
        <MiniGameHUD
          kind={kind}
          clock={clock}
          assisted={session.assisted}
        />
      )}
      <ScrollView
        accessibilityElementsHidden={phase !== 'playing'}
        importantForAccessibility={
          phase === 'playing' ? 'auto' : 'no-hide-descendants'
        }
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          minHeight: Math.max(430, height - insets.top - insets.bottom - 100),
        }}
        bounces={false}
      >
        {session ? (
          kind === 'sports' ? (
            <SportsGame
              session={session}
              clock={clock}
              enabled={enabled}
              reducedMotion={feedback.reducedMotion}
              controlsVisible={phase === 'playing' || phase === 'finishing'}
              onInput={input}
            />
          ) : kind === 'crime' ? (
            <CrimeGame
              session={session}
              clock={clock}
              enabled={enabled}
              reducedMotion={feedback.reducedMotion}
              controlsVisible={phase === 'playing' || phase === 'finishing'}
              onInput={input}
            />
          ) : (
            <DockingGame
              key={session.id + ':' + sceneRevision}
              session={session}
              clock={clock}
              enabled={enabled}
              reducedMotion={feedback.reducedMotion}
              controlsVisible={phase === 'playing' || phase === 'finishing'}
              onInput={input}
              onFinished={finish}
            />
          )
        ) : (
          <ScenePreview kind={kind} />
        )}
      </ScrollView>
      {phase === 'intro' && (
        <View style={[overlay, { justifyContent: 'flex-end' }]} accessibilityViewIsModal>
          <ScrollView
            style={{
              maxHeight: '95%',
              flexGrow: 0,
              width: '100%',
              maxWidth: 460,
            }}
            contentContainerStyle={s.card}
          >
            <View accessible={false} style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#C9CDD4', alignSelf: 'center' }} />
            <Text style={s.eyebrow}>
              {practice ? 'PRACTICE' : 'ONE ATTEMPT'}
            </Text>
            <Text accessibilityRole="header" style={[s.title, { textAlign: 'center' }]}>
              {titles[kind]}
            </Text>
            <Text style={[s.text, { textAlign: 'center' }]}>{instructions[kind]}</Text>
            <Text style={[s.muted, { textAlign: 'center' }]}>
              {practice
                ? 'Play again whenever you like. Your saved life stays unchanged.'
                : kind === 'crime'
                  ? 'Uses this year’s burglary. Arrest is possible, even if you forfeit.'
                  : kind === 'sports'
                    ? 'One shot this season. Your result affects the next match.'
                    : 'One attempt this assignment. Your result affects the next mission.'}
            </Text>
            <View style={[s.row, { justifyContent: 'space-between', backgroundColor: '#EFF3FA', borderRadius: 18, padding: 12 }]}>
              <View style={{ flex: 1 }}>
                <Text style={s.text}>Assisted controls</Text>
                <Text style={s.muted}>
                  Take your time. No fast timing.
                </Text>
              </View>
              <Switch
                accessibilityLabel="Assisted controls"
                value={assisted}
                onValueChange={setAssisted}
                trackColor={{ false: '#7B84935C', true: c.action }}
                thumbColor="#FFFFFF"
              />
            </View>
            {(error || props.unavailable) && (
              <Text
                accessibilityRole="alert"
                style={[s.text, { color: '#B12E43' }]}
              >
                {error ?? props.unavailable}
              </Text>
            )}
            {artError && (
              <>
                <Text accessibilityRole="alert" style={s.text}>
                  The scene could not be prepared. Your attempt has not started.
                </Text>
                <GameButton
                  label="Reload artwork"
                  secondary
                  onPress={() => setArtRetry((value) => value + 1)}
                />
              </>
            )}
            <GameButton
              label={
                busy
                  ? 'Saving attempt…'
                  : !artReady
                    ? 'Preparing scene…'
                    : 'Play'
              }
              disabled={busy || writing || !artReady || !!props.unavailable}
              onPress={() => {
                feedback.buttonFeedback();
                void props.onStart(assisted);
              }}
            />
            <GameButton
              label={
                kind === 'crime' && !practice
                  ? 'Use normal burglary'
                  : 'Not now'
              }
              secondary
              disabled={busy}
              onPress={() => {
                void props.onSkip();
              }}
            />
          </ScrollView>
        </View>
      )}
      {phase === 'countdown' && !artError && (
        <View style={overlay} accessibilityViewIsModal>
          <Text
            accessibilityRole="text"
            accessibilityLiveRegion="polite"
            style={{ fontSize: 96, fontWeight: '800', color: c.gold }}
          >
            {countdown}
          </Text>
          <Text style={[s.text, { color: c.white }]}>Get ready</Text>
        </View>
      )}
      {phase === 'paused' && !artError && (
        <View style={overlay} accessibilityViewIsModal>
          <ScrollView
            style={{
              width: '100%',
              maxWidth: 460,
              maxHeight: '95%',
              flexGrow: 0,
            }}
            contentContainerStyle={s.card}
          >
            <Text style={s.eyebrow}>SAVED CHALLENGE</Text>
            <Text accessibilityRole="header" style={s.title}>
              {confirmForfeit
                ? 'Forfeit this attempt?'
                : kind === 'astronaut'
                  ? 'Flight paused'
                  : 'Challenge paused'}
            </Text>
            <Text style={s.text}>
              {confirmForfeit
                ? kind === 'crime'
                  ? 'Forfeiting resolves this burglary as a failure. Detection, evidence and prosecution still apply.'
                  : 'This challenge will receive a failed result and cannot be replayed for this opportunity.'
                : error
                  ? 'Your latest move could not be confirmed. Retry it, or reload your saved progress.'
                  : 'Your progress is saved. Continue this attempt, or forfeit it.'}
            </Text>
            {error && (
              <Text
                accessibilityRole="alert"
                style={[s.text, { color: '#B12E43' }]}
              >
                {error}
              </Text>
            )}
            {!confirmForfeit ? (
              <>
                <GameButton
                  label={error ? 'Retry save & resume' : 'Resume'}
                  disabled={busy || writing || !artReady}
                  onPress={() => {
                    void resume();
                  }}
                />
                <GameButton
                  label={error ? 'Exit with saved progress' : 'Save & exit'}
                  secondary
                  disabled={busy || writing}
                  onPress={() => {
                    void (async () => {
                      await pendingInput.current;
                      if (error) {
                        props.onExit();
                        return;
                      }
                      if (!failedInput.current && (await props.onPause(time())))
                        props.onExit();
                    })();
                  }}
                />
                {error && props.onReload && (
                  <GameButton
                    label="Reload saved progress"
                    secondary
                    disabled={busy || writing}
                    onPress={() => {
                      void (async () => {
                        const saved = await props.onReload!();
                        if (!saved || !mounted.current) return;
                        failedInput.current = null;
                        finishing.current = false;
                        clock.value = saved.elapsedMs;
                        setSceneRevision((revision) => revision + 1);
                        setPhase(
                          saved.status !== 'active' ||
                            evaluateSession(saved).finished
                            ? 'result'
                            : 'paused',
                        );
                      })();
                    }}
                  />
                )}
                <GameButton
                  label="Forfeit attempt"
                  secondary
                  disabled={busy || writing}
                  onPress={() => setConfirmForfeit(true)}
                />
              </>
            ) : (
              <>
                <GameButton
                  label="Confirm forfeit"
                  disabled={busy || writing}
                  onPress={() => {
                    void props.onForfeit();
                  }}
                />
                <GameButton
                  label="Keep attempt"
                  secondary
                  disabled={busy || writing}
                  onPress={() => setConfirmForfeit(false)}
                />
              </>
            )}
          </ScrollView>
        </View>
      )}
      {phase === 'result' && session && (
        <MiniGameResult
          session={session}
          practice={practice}
          reducedMotion={feedback.reducedMotion}
          saving={busy || writing}
          error={error}
          onRetry={() => {
            void saveResult(time());
          }}
          onExit={props.onExit}
          onRestart={props.onRestart}
        />
      )}
      {artError && phase !== 'intro' && (
        <View style={overlay} accessibilityViewIsModal>
          <View style={s.card}>
            <Text style={s.text}>
              The scene could not be prepared. Your saved progress is safe.
            </Text>
            <GameButton
              label="Reload artwork"
              onPress={() => setArtRetry((value) => value + 1)}
            />
            <GameButton
              label="Exit with saved progress"
              secondary
              onPress={props.onExit}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
