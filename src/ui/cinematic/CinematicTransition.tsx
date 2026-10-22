import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AppState, BackHandler, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';
import { StatusBar } from 'expo-status-bar';
import { router, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import type LottieView from 'lottie-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { gameStore } from '../../state/useGame';
import { usePreferences } from '../../state/usePreferences';
import { useFeedback } from '../feedback';
import { CinematicInk } from './CinematicInk';
import { COVER_TIME, DURATION, FPS, NAVY, type CinematicKind } from './cinematicTiming';
import { isNewDeath } from './committedDeath';
import { CinematicContext, type PlayCinematic } from './CinematicContext';

type Request = { id: number; kind: CinematicKind; destination?: string; navigate?: () => void; covered: boolean };
let welcomeClaimed = false;
let sequence = 0;
const hideSplash = () => { void SplashScreen.hideAsync().catch(() => {}); };

/** Root host survives route changes and sits above native-stack and event modals.
 * This state is presentation-only and deliberately never persisted in a life.
 */
export function CinematicTransitionProvider({ children }: React.PropsWithChildren) {
  const path = usePathname(), { reducedMotion, deviceReducedMotion } = useFeedback();
  const preferencesReady = usePreferences(s => s.ready), preferencesFailed = usePreferences(s => s.loadFailed);
  const userReducedMotion = usePreferences(s => s.settings.reducedMotion);
  const [request, setRequest] = useState<Request | null>(() => !welcomeClaimed && path === '/' ? { id: ++sequence, kind: 'welcome', covered: true } : null);
  const [running, setRunning] = useState(false);
  const current = useRef(request), options = useRef({ reducedMotion, deviceReducedMotion, preferencesReady, path });
  options.current = { reducedMotion, deviceReducedMotion, preferencesReady, path };
  const cover = useCallback((id: number) => {
    const active = current.current;
    if (!active || active.id !== id || active.covered) return;
    const next = { ...active, covered: true };
    current.current = next; setRequest(next);
    // Mark first, so late UI callbacks, backgrounding and skipping cannot repeat navigation.
    try { active.navigate?.(); }
    catch { current.current = null; setRequest(null); setRunning(false); }
  }, []);
  const finish = useCallback((id: number) => {
    if (current.current?.id !== id) return;
    cover(id);
    current.current = null; setRequest(null); setRunning(false); hideSplash();
  }, [cover]);
  const play = useCallback<PlayCinematic>((kind, destination, navigate) => {
    const previous = current.current;
    if (previous) finish(previous.id);
    const prefs = options.current;
    if (prefs.reducedMotion || prefs.deviceReducedMotion !== false || AppState.currentState !== 'active') { navigate(); return; }
    const next = { id: ++sequence, kind, destination, navigate, covered: false };
    current.current = next; setRequest(next); setRunning(true);
  }, [finish]);

  useEffect(() => { welcomeClaimed = true; }, []);
  useEffect(() => {
    if (request?.kind !== 'welcome') return;
    if (deviceReducedMotion === true || preferencesFailed || (preferencesReady && userReducedMotion)) finish(request.id);
    else if (preferencesReady && deviceReducedMotion === false && !reducedMotion) setRunning(true);
  }, [request?.id, request?.kind, preferencesReady, preferencesFailed, userReducedMotion, reducedMotion, deviceReducedMotion, finish]);
  useEffect(() => {
    if (request?.kind !== 'welcome' || running) return;
    // An unavailable accessibility API or storage never leaves a launch overlay stuck.
    const timer = setTimeout(() => finish(request.id), 1000);
    return () => clearTimeout(timer);
  }, [request?.id, request?.kind, running, finish]);
  useEffect(() => {
    if (running && reducedMotion && request) finish(request.id);
  }, [running, reducedMotion, request?.id, finish]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active' && current.current) finish(current.current.id);
    });
    return () => subscription.remove();
  }, [finish]);
  useEffect(() => {
    if (!request) return;
    const back = BackHandler.addEventListener('hardwareBackPress', () => true);
    // Also covers a lost native callback or a route that fails to mount.
    const watchdog = setTimeout(() => finish(request.id), DURATION[request.kind] + 1500);
    return () => { back.remove(); clearTimeout(watchdog); };
  }, [request?.id, finish]);
  useLayoutEffect(() => gameStore.subscribe((state, previous) => {
    if (isNewDeath(state, previous) && !['/', '/saved-lives', '/death'].includes(options.current.path) && !options.current.path.startsWith('/saved-life/')) {
      play('death', '/death', () => router.replace('/death'));
    }
  }), [play]);

  return <CinematicContext.Provider value={{ play, activeKind: request?.kind ?? null }}>
    <View style={styles.host} onLayout={() => { if (!current.current) hideSplash(); }}>
      <View style={styles.host} accessibilityElementsHidden={!!request} importantForAccessibility={request ? 'no-hide-descendants' : 'auto'}>
        {children}
      </View>
      {request && <OverlaySurface key={request.id} onClose={() => { if (request.kind === 'welcome') finish(request.id); }}>
        <CinematicPlayer request={request} running={running} destinationReady={request.covered && path === request.destination} onCovered={cover} onFinished={finish} />
      </OverlaySurface>}
    </View>
  </CinematicContext.Provider>;
}

function OverlaySurface({ children, onClose }: React.PropsWithChildren<{ onClose: () => void }>) {
  // A UIWindow overlay avoids competing with an iOS confirmation sheet that is
  // dismissing after a save. Android needs a Dialog window above native modals.
  if (Platform.OS === 'ios') return <FullWindowOverlay unstable_accessibilityContainerViewIsModal><View style={StyleSheet.absoluteFill} onLayout={hideSplash}>{children}</View></FullWindowOverlay>;
  return <Modal transparent visible animationType="none" presentationStyle="overFullScreen" statusBarTranslucent navigationBarTranslucent hardwareAccelerated onShow={hideSplash} onRequestClose={onClose}>{children}</Modal>;
}

function CinematicPlayer({ request, running, destinationReady, onCovered, onFinished }: {
  request: Request; running: boolean; destinationReady: boolean; onCovered: (id: number) => void; onFinished: (id: number) => void;
}) {
  const player = useRef<LottieView>(null), insets = useSafeAreaInsets();
  const [loaded, setLoaded] = useState(false);
  const stage = useRef<'loading' | 'cover' | 'holding' | 'reveal' | 'finished'>('loading');
  const { id, kind } = request;
  const animationFinished = useCallback((cancelled: boolean) => {
    if (cancelled) return;
    if (stage.current === 'cover') {
      stage.current = 'holding'; onCovered(id);
    } else if (stage.current === 'reveal') {
      stage.current = 'finished'; onFinished(id);
    }
  }, [id, onCovered, onFinished]);
  useEffect(() => {
    if (!running || !loaded || stage.current !== 'loading') return;
    const cover = COVER_TIME[kind];
    stage.current = cover ? 'cover' : 'reveal';
    player.current?.play(0, (cover || DURATION[kind]) * FPS / 1000);
  }, [running, loaded, kind]);
  useEffect(() => {
    if (!destinationReady || !loaded || kind === 'welcome') return;
    let frame = requestAnimationFrame(() => {
      // Hold the exact opaque native frame until the destination has laid out.
      frame = requestAnimationFrame(() => {
        stage.current = 'reveal';
        player.current?.play(COVER_TIME[kind] * FPS / 1000, DURATION[kind] * FPS / 1000);
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [destinationReady, loaded, kind]);
  useEffect(() => {
    const animation = player.current;
    return () => { stage.current = 'finished'; animation?.pause(); };
  }, []);
  return <View testID={`cinematic-${kind}`} accessibilityViewIsModal style={[styles.canvas, kind === 'welcome' && !loaded ? { backgroundColor: NAVY } : undefined]}>
    <StatusBar hidden />
    <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}><CinematicInk ref={player} kind={kind} onLoaded={() => setLoaded(true)} onFinished={animationFinished} onFailure={() => onFinished(id)} /></View>
    {kind === 'welcome' ? <Pressable accessibilityRole="button" accessibilityLabel="Skip welcome animation" onPress={() => onFinished(id)} style={[styles.skip, { top: Math.max(insets.top, 20) + 8 }]}><Text style={styles.skipText}>Skip</Text></Pressable> : <Text accessibilityRole="text" accessibilityLiveRegion="polite" style={styles.accessibleLabel}>{kind === 'birth' ? 'A New Life Begins' : 'Remembering your life'}</Text>}
  </View>;
}

const styles = StyleSheet.create({
  host: { flex: 1, backgroundColor: NAVY },
  canvas: { flex: 1 },
  skip: { position: 'absolute', right: 20, minWidth: 60, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: '#061633B3', borderWidth: 1, borderColor: '#F3D5A744' },
  skipText: { color: '#F3D5A7', fontSize: 14, fontWeight: '500' },
  accessibleLabel: { position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0 },
});
