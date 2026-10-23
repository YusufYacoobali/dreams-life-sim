import { AppState, type AppStateStatus } from 'react-native';
import { AudioController, audioMode } from '../../src/ui/audioController';

const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
function setup() {
  const players = new Map<number, ReturnType<typeof player>>();
  function player() { return { isLoaded: true, volume: 1, duration: 0.1, seekTo: jest.fn(async (_at: number) => {}), play: jest.fn(), pause: jest.fn(), remove: jest.fn() }; }
  const createAudioPlayer = jest.fn((source: number) => { const next = player(); players.set(source, next); return next; });
  const setAudioModeAsync = jest.fn(async () => {});
  const controller = new AudioController(() => ({ createAudioPlayer, setAudioModeAsync }));
  const release = controller.retain();
  return { controller, release, players, createAudioPlayer, setAudioModeAsync };
}
let change: (state: AppStateStatus) => void, previous: AppStateStatus;
beforeEach(() => {
  jest.useFakeTimers(); previous = AppState.currentState; AppState.currentState = 'active';
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => { change = listener; return { remove: jest.fn() }; });
});
afterEach(() => { AppState.currentState = previous; jest.restoreAllMocks(); jest.useRealTimers(); });

test('two screens share five warm players and one audio session, retaining custom mini-game players until the last owner leaves', async () => {
  const context = setup(), releaseSecond = context.controller.retain(); await flush();
  expect(context.createAudioPlayer).toHaveBeenCalledTimes(5);
  expect(context.setAudioModeAsync).toHaveBeenCalledTimes(1);
  expect(context.setAudioModeAsync).toHaveBeenCalledWith(audioMode);
  context.controller.warmSource(90); context.controller.warmSource(90); await flush();
  expect(context.createAudioPlayer).toHaveBeenCalledTimes(6);
  context.release(); expect(context.players.get(42)!.remove).not.toHaveBeenCalled();
  releaseSecond(); releaseSecond();
  for (const player of context.players.values()) expect(player.remove).toHaveBeenCalledTimes(1);
});

test('a committed purchase preempts the tap, suppresses lesser sounds and cannot replay its receipt', async () => {
  const { controller, release, players } = setup(); await flush();
  void controller.play('tap'); await flush(); expect(players.get(42)!.play).toHaveBeenCalledTimes(1);
  controller.gameplay({ id: 'life:1', cues: ['purchase'] }); await flush();
  expect(players.get(42)!.pause).toHaveBeenCalledTimes(1);
  expect(players.get(45)!.play).toHaveBeenCalledTimes(1);
  void controller.play('tap'); void controller.play('mini-game', 90); await flush();
  expect(players.get(42)!.play).toHaveBeenCalledTimes(1); expect(players.has(90)).toBe(false);
  await jest.advanceTimersByTimeAsync(1500);
  controller.gameplay({ id: 'life:1', cues: ['purchase'] }); await flush();
  expect(players.get(45)!.play).toHaveBeenCalledTimes(1); release();
});

test('Age Up followed by an automatic milestone uses one sequential lane, once each', async () => {
  const { controller, release, players } = setup(); await flush();
  controller.gameplay({ id: 'life:year', cues: ['age-up', 'big-success'] }); await flush();
  expect(players.get(43)!.play).toHaveBeenCalledTimes(1); expect(players.get(44)!.play).not.toHaveBeenCalled();
  await jest.advanceTimersByTimeAsync(144);
  expect(players.get(43)!.pause).toHaveBeenCalledTimes(1);
  expect(players.get(44)!.seekTo).toHaveBeenCalledWith(0.14);
  expect(players.get(44)!.play).toHaveBeenCalledTimes(1);
  void controller.play('tap'); await flush(); expect(players.get(42)!.play).not.toHaveBeenCalled();
  release();
});

test.each(['background', 'inactive'] as const)('%s cancels a seek in flight and never replays on foreground', async state => {
  const { controller, release, players } = setup(); await flush();
  let finish!: () => void;
  players.get(43)!.seekTo.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  controller.gameplay({ id: 'year', cues: ['age-up'] }); await flush();
  AppState.currentState = state; change(state); finish(); await flush();
  expect(players.get(43)!.play).not.toHaveBeenCalled();
  AppState.currentState = 'active'; change('active'); await flush();
  expect(players.get(43)!.play).not.toHaveBeenCalled(); release();
});

test('disabling sound cancels pending playback, releases the cache and ignores subsequent notifications', async () => {
  const { controller, release, players } = setup(); await flush();
  let finish!: () => void;
  players.get(46)!.seekTo.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  controller.gameplay({ id: 'failure', cues: ['error'] }); await flush(); release(); finish(); await flush();
  controller.gameplay({ id: 'another', cues: ['big-success'] }); await flush();
  for (const player of players.values()) { expect(player.play).not.toHaveBeenCalled(); expect(player.remove).toHaveBeenCalledTimes(1); }
});

test('a mini-game input uses its cached existing sound and a failed result stops it before the error cue', async () => {
  const { controller, release, players, createAudioPlayer } = setup(); await flush();
  controller.warmSource(90); await flush(); void controller.play('mini-game', 90); await flush();
  expect(players.get(90)!.play).toHaveBeenCalledTimes(1);
  controller.gameplay({ id: 'mini:failed', cues: ['error'] }); await flush();
  expect(players.get(90)!.pause).toHaveBeenCalledTimes(1); expect(players.get(46)!.play).toHaveBeenCalledTimes(1);
  expect(createAudioPlayer).toHaveBeenCalledTimes(6); release();
});

test('native setup failures are swallowed without creating players or leaving queued playback', async () => {
  const createAudioPlayer = jest.fn(), controller = new AudioController(() => ({ createAudioPlayer, setAudioModeAsync: async () => { throw Error('unavailable'); } }));
  const release = controller.retain(); controller.gameplay({ id: 'year', cues: ['age-up'] }); await flush();
  expect(createAudioPlayer).not.toHaveBeenCalled(); release();
});

test('a serious committed event stops any celebration and suppresses the same interaction’s generic tap', async () => {
  const { controller, release, players } = setup(); await flush();
  controller.gameplay({ id: 'milestone', cues: ['big-success'] }); await flush();
  controller.gameplay({ id: 'family-loss', cues: [], silence: true });
  expect(players.get(44)!.pause).toHaveBeenCalledTimes(1);
  void controller.play('tap'); await flush(); expect(players.get(42)!.play).not.toHaveBeenCalled(); release();
});

test('a stalled native seek expires instead of playing a stale cue or permanently suppressing taps', async () => {
  const { controller, release, players } = setup(); await flush();
  let finish!: () => void;
  players.get(45)!.seekTo.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  controller.gameplay({ id: 'purchase', cues: ['purchase'] }); await flush();
  await jest.advanceTimersByTimeAsync(300); finish(); await flush();
  expect(players.get(45)!.play).not.toHaveBeenCalled();
  void controller.play('tap'); await flush(); expect(players.get(42)!.play).toHaveBeenCalledTimes(1); release();
});
