import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import type { AudioPlayer } from 'expo-audio';

/** A local cue, prepared only after Sound Effects has been saved as enabled. */
export function useActionSound(enabled: boolean, source: number = require('../../assets/audio/action-tap.wav')) {
  const player = useRef<AudioPlayer | null>(null), request = useRef(0);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active') { request.current++; try { player.current?.pause(); } catch { /* Optional audio. */ } }
    });
    // A missing native module or audio-session failure leaves all game actions operational.
    void (async () => {
      const audio: typeof import('expo-audio') = require('expo-audio');
      await audio.setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers', allowsRecording: false,
        shouldPlayInBackground: false, shouldRouteThroughEarpiece: false });
      if (!active) return;
      const next = audio.createAudioPlayer(source, { keepAudioSessionActive: false, updateInterval: 1000 });
      player.current = next; next.volume = 0.35;
    })().catch(() => {});
    return () => {
      active = false; request.current++; subscription.remove();
      const previous = player.current; player.current = null;
      try { previous?.remove(); } catch { /* Optional audio. */ }
    };
  }, [enabled, source]);
  return useCallback(async () => {
    const current = player.current, thisRequest = ++request.current;
    if (!enabled || !current?.isLoaded || (AppState.currentState && AppState.currentState !== 'active')) return;
    try {
      await current.seekTo(0);
      if (player.current === current && request.current === thisRequest && (!AppState.currentState || AppState.currentState === 'active')) current.play();
    } catch { /* Playback must never affect action completion. */ }
  }, [enabled]);
}
