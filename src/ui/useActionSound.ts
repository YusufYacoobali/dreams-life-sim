import { useCallback, useEffect, useRef } from 'react';
import { audioController } from './audioController';

/** Screens share cached players. Only the last enabled owner releases them. */
export function useActionSound(enabled: boolean, source?: number) {
  const current = useRef(enabled);
  current.current = enabled;
  useEffect(() => {
    current.current = enabled;
    if (!enabled) return;
    const release = audioController.retain();
    if (source !== undefined) audioController.warmSource(source);
    return () => { current.current = false; release(); };
  }, [enabled, source]);
  return useCallback(async () => {
    if (current.current) void audioController.play(source === undefined ? 'tap' : 'mini-game', source);
  }, [source]);
}
