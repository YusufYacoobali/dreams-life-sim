import { AppState } from 'react-native';
import type { GameplayCue, GameplayFeedback } from '../feedback/gameplayFeedback';

type Sound = { source: number; volume: number; priority: number; start?: number; durationMs?: number; trimEnd?: boolean };
type Status = { isLoaded: boolean; playing?: boolean; currentTime?: number; didJustFinish?: boolean; error?: string | null };
type Player = {
  isLoaded: boolean; duration?: number; volume: number; playing?: boolean; currentTime?: number;
  seekTo: (seconds: number) => Promise<void>; play: () => void; pause: () => void; remove: () => void;
  addListener?: (event: 'playbackStatusUpdate', listener: (status: Status) => void) => { remove: () => void };
};
type Audio = { setAudioModeAsync: (mode: typeof audioMode) => Promise<void>; createAudioPlayer: (source: number, options: { keepAudioSessionActive: boolean; updateInterval: number; downloadFirst: boolean }) => Player };
export const audioMode = { playsInSilentMode: false, interruptionMode: 'mixWithOthers' as const, allowsRecording: false,
  shouldPlayInBackground: false, shouldRouteThroughEarpiece: false };

// Native playback positions trim measured lead-in/tails without re-encoding assets.
export const effectSounds: Record<'tap' | GameplayCue, Sound> = {
  tap: { source: require('../../assets/audio/action-tap.wav'), volume: 0.35, priority: 0, durationMs: 45 },
  'age-up': { source: require('../../assets/audio/age-up.mp3'), volume: 0.65, priority: 2, durationMs: 144 },
  'big-success': { source: require('../../assets/audio/big-success.mp3'), volume: 0.45, priority: 3, start: 0.14, durationMs: 2420, trimEnd: true },
  purchase: { source: require('../../assets/audio/freesound_gamestudio-purchase-success-384963.mp3'), volume: 0.22, priority: 2, durationMs: 1220, trimEnd: true },
  error: { source: require('../../assets/audio/universfield-error-notification-08-206492.mp3'), volume: 0.32, priority: 2, durationMs: 740, trimEnd: true },
};

/** One cache and playback lane for the app, including mini-game input effects. */
export class AudioController {
  private users = 0;
  private generation = 0;
  private players = new Map<string, Player>();
  private mode: Promise<Audio | null> | null = null;
  private subscription: { remove: () => void } | null = null;
  private finish: (() => void) | null = null;
  private playing: Player | null = null;
  private priority = -1;
  private lastRequest = -Infinity;
  private silentUntil = -Infinity;
  private seen = new Set<string>();
  private warnings = new Set<string>();

  constructor(private load: () => Audio = () => require('expo-audio')) {}
  private report(stage: string, error?: unknown) {
    if (!__DEV__ || this.warnings.has(stage)) return;
    this.warnings.add(stage);
    console.warn(`[Dreams audio] ${stage}`, error ?? 'Native playback did not become ready.');
  }
  private foreground() { return !AppState.currentState || AppState.currentState === 'active'; }
  retain() {
    if (++this.users === 1) {
      this.subscription = AppState.addEventListener('change', state => { if (state !== 'active') this.stop(); });
      const generation = this.generation;
      this.mode = Promise.resolve().then(async () => {
        const audio = this.load(); await audio.setAudioModeAsync(audioMode); return audio;
      }).catch(error => { this.report('Audio setup failed; check that this native build includes expo-audio.', error); return null; });
      for (const [key, sound] of Object.entries(effectSounds)) void this.prepare(key, sound, generation);
    }
    let released = false;
    return () => {
      if (released) return;
      released = true;
      if (--this.users > 0) return;
      this.stop(); try { this.subscription?.remove(); } catch { /* Optional native subscription. */ } this.subscription = null;
      for (const player of this.players.values()) { try { player.remove(); } catch { /* Optional hardware. */ } }
      this.players.clear(); this.mode = null; this.seen.clear(); this.lastRequest = -Infinity;
    };
  }
  private async prepare(key: string, sound: Sound, generation = this.generation) {
    try {
      const audio = await this.mode;
      if (!audio || !this.users || generation !== this.generation) return null;
      let player = this.players.get(key);
      if (!player) {
        player = audio.createAudioPlayer(sound.source, { keepAudioSessionActive: false, updateInterval: 50, downloadFirst: true });
        player.volume = sound.volume;
        this.players.set(key, player);
      }
      return player;
    } catch (error) { this.report('Player creation failed.', error); return null; }
  }
  warmSource(source: number) { void this.prepare('source:' + source, { source, volume: 0.35, priority: 1 }); }
  private stop() {
    this.generation++;
    try { this.playing?.pause(); } catch { /* Optional hardware. */ }
    this.playing = null; this.priority = -1;
    this.finish?.(); this.finish = null;
  }
  private async loaded(player: Player) {
    if (player.isLoaded) return true;
    return new Promise<boolean>(resolve => {
      let subscription: { remove: () => void } | undefined;
      const finish = (ready: boolean) => { clearTimeout(timer); try { subscription?.remove(); } catch { /* Optional native subscription. */ } resolve(ready); };
      const timer = setTimeout(() => finish(false), 1500);
      try { subscription = player.addListener?.('playbackStatusUpdate', status => { if (status.isLoaded) finish(true); }); }
      catch { finish(false); }
      if (player.isLoaded) finish(true);
    });
  }
  private async seek(player: Player, start: number) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([player.seekTo(start).then(() => true), new Promise<false>(resolve => { timer = setTimeout(() => resolve(false), 1000); })]);
    } finally { clearTimeout(timer); }
  }
  private playback(player: Player, sound: Sound, generation: number) {
    return new Promise<void>(resolve => {
      let subscription: { remove: () => void } | undefined, finished = false;
      const finish = (pause = false) => {
        if (finished) return;
        finished = true; clearTimeout(watchdog);
        try { subscription?.remove(); } catch { /* Optional native subscription. */ }
        if (pause) { try { player.pause(); } catch { /* Optional native audio. */ } }
        if (this.finish === cancel) this.finish = null;
        resolve();
      };
      const cancel = () => finish();
      // This is a recovery bound, not a clip cutoff. Short cues finish naturally.
      const watchdog = setTimeout(() => finish(generation === this.generation), 2500 + (sound.durationMs ?? (player.duration || 1) * 1000));
      this.finish = cancel;
      try {
        subscription = player.addListener?.('playbackStatusUpdate', status => {
          if (generation !== this.generation) { finish(); return; }
          if (status.error) { this.report('Native playback failed.', status.error); finish(true); return; }
          if (status.didJustFinish) { finish(); return; }
          if (status.playing && sound.trimEnd && status.currentTime !== undefined && status.currentTime >= (sound.start ?? 0) + sound.durationMs! / 1000) finish(true);
        });
        player.play();
      } catch (error) { this.report('Playback could not start.', error); finish(true); }
    });
  }
  async play(key: 'tap' | 'mini-game', source?: number) {
    const sound = key === 'tap' ? effectSounds.tap : { source: source!, volume: 0.35, priority: 1 };
    await this.batch([{ key: key === 'tap' ? key : 'source:' + source, sound }]);
  }
  gameplay(event: GameplayFeedback) {
    if (!this.users || !this.foreground() || this.seen.has(event.id)) return;
    this.seen.add(event.id);
    if (this.seen.size > 256) this.seen.delete(this.seen.values().next().value!);
    if (event.silence) { this.stop(); this.silentUntil = Date.now() + 500; return; }
    if (!event.cues.length) return;
    void this.batch(event.cues.map(key => ({ key, sound: effectSounds[key] })), true);
  }
  private async batch(sounds: { key: string; sound: Sound }[], committed = false) {
    if (!this.users || !this.foreground()) return;
    const priority = Math.max(...sounds.map(row => row.sound.priority)), now = Date.now();
    if (!committed && now < this.silentUntil) return;
    if (!committed && (priority < this.priority || priority <= this.priority && now - this.lastRequest < 160)) return;
    this.stop(); const generation = this.generation;
    this.priority = priority; this.lastRequest = now;
    try {
      for (const { key, sound } of sounds) {
        const player = await this.prepare(key, sound, generation);
        if (!player || generation !== this.generation || !this.users || !this.foreground()) return;
        // Android reports an ended cached clip as not loaded until it is rewound.
        // A genuinely cold download must instead load before its final seek.
        if (!player.isLoaded && (player.currentTime ?? 0) > 0 && !await this.seek(player, 0)) return;
        if (!await this.loaded(player) || generation !== this.generation || !this.users || !this.foreground() || Date.now() - now > 2500) return;
        if (!await this.seek(player, sound.start ?? 0) || generation !== this.generation || !this.users || !this.foreground()) return;
        this.playing = player;
        await this.playback(player, sound, generation);
        if (generation !== this.generation) return;
      }
    } catch { if (generation === this.generation) { try { this.playing?.pause(); } catch { /* Optional hardware. */ } } }
    finally { if (generation === this.generation) { this.playing = null; this.priority = -1; } }
  }
}

export const audioController = new AudioController();
