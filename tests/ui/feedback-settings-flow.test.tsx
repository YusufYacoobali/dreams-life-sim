import React from 'react';
import { AccessibilityInfo, AppState, AppStateStatus, Modal, Platform } from 'react-native';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useStore } from 'zustand';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createPreferencesStore } from '../../src/state/preferencesStore';
import { createGameStore } from '../../src/state/gameStore';
import { createLife, randomCreation } from '../../src/game/createLife';
import { encodeWorld } from '../../src/game/model';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { AppFeedback } from '../../src/ui/AppFeedback';
import { FeedbackProvider } from '../../src/ui/feedback';
import { Button } from '../../src/ui/components';
import { ThemeProvider } from '../../src/ui/theme';

let mockPreferences: ReturnType<typeof createPreferencesStore>, mockGame: ReturnType<typeof createGameStore>;
const mockImpact = jest.fn(), mockAndroidHaptic = jest.fn(), mockAudioMode = jest.fn(), mockAudioCreate = jest.fn();
const mockPlayer = { isLoaded: true, volume: 1, seekTo: jest.fn(), play: jest.fn(), pause: jest.fn(), remove: jest.fn() };
// The overlay's native/UI runtime is exercised in cinematic-transition.test;
// this journey keeps the persisted feedback settings and both navigators live.
jest.mock('../../src/ui/cinematic/CinematicTransition', () => ({ CinematicTransitionProvider: ({ children }: React.PropsWithChildren) => children }));
jest.mock('expo-haptics', () => ({ impactAsync: (...args: unknown[]) => mockImpact(...args), performAndroidHapticsAsync: (...args: unknown[]) => mockAndroidHaptic(...args),
  ImpactFeedbackStyle: { Light: 'light' }, AndroidHaptics: { Virtual_Key: 'virtual-key' } }));
jest.mock('expo-audio', () => ({ setAudioModeAsync: (...args: unknown[]) => mockAudioMode(...args), createAudioPlayer: (...args: unknown[]) => mockAudioCreate(...args) }));
jest.mock('../../assets/audio/action-tap.wav', () => 42);
jest.mock('../../src/notifications/dailyReminders', () => ({
  reconcileDailyReminders: async (config: { enabled: boolean }) => ({ status: config.enabled ? 'scheduled' : 'off' }),
  requestDailyReminderPermission: async () => ({ status: 'granted', canAskAgain: true }),
  subscribeToDailyReminderResponses: () => () => {},
}));
jest.mock('../../src/state/usePreferences', () => ({ usePreferences: (selector: unknown) => require('zustand').useStore(mockPreferences, selector), preferencesStore: { getState: () => mockPreferences.getState() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockGame, selector), gameStore: { getState: () => mockGame.getState() } }));
jest.mock('expo-router', () => {
  const Stack = ({ screenOptions, children }: { screenOptions: unknown; children: React.ReactNode }) => require('react').createElement(require('react-native').View, { testID: 'navigator', screenOptions }, children);
  Stack.Screen = () => null;
  return { Stack, Redirect: () => null, usePathname: () => '/life', useGlobalSearchParams: () => ({}), router: { back: jest.fn(), push: jest.fn(), navigate: jest.fn() } };
});
import Settings from '../../app/settings';
import GameLayout from '../../app/(game)/_layout';
import RootLayout from '../../app/_layout';

let motionChanged: (enabled: boolean) => void, appStateChanged: (state: AppStateStatus) => void, previousAppState: AppStateStatus;
const removedMotion = jest.fn(), removedAppState = jest.fn();
beforeEach(() => {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  const subscribe = jest.fn(); subscribe.mockImplementation((_event: string, listener: (enabled: boolean) => void) => { motionChanged = listener; return { remove: removedMotion }; });
  jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation(subscribe);
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => { appStateChanged = listener; return { remove: removedAppState }; });
  previousAppState = AppState.currentState; AppState.currentState = 'active';
  mockImpact.mockResolvedValue(undefined); mockAndroidHaptic.mockResolvedValue(undefined); mockAudioMode.mockResolvedValue(undefined); mockAudioCreate.mockReturnValue(mockPlayer); mockPlayer.seekTo.mockResolvedValue(undefined);
});
afterEach(() => { AppState.currentState = previousAppState; jest.restoreAllMocks(); });

async function setup(begin = true, raw?: string) {
  const directory = mkdtempSync(join(tmpdir(), 'dreams-feedback-settings-')), path = join(directory, 'dreams.db'); let sqlite: DatabaseSync;
  const connect = (): SqlDatabase => {
    sqlite = new DatabaseSync(path); sqlite.exec('PRAGMA foreign_keys=ON'); const connection = sqlite;
    const session: SqlSession = { run: async (sql, values = []) => { connection.prepare(sql).run(...values); }, get: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).get(...values) as T ?? null, all: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).all(...values) as T[] };
    return { ...session, exec: async sql => { connection.exec(sql); }, transaction: async action => { connection.exec('BEGIN IMMEDIATE'); try { const result = await action(session); connection.exec('COMMIT'); return result; } catch (error) { connection.exec('ROLLBACK'); throw error; } } };
  };
  let repository = new SaveRepository(connect()); await repository.initialise();
  const initial = createLife('life_feedback', 42, randomCreation(42), { year: 2026, month: 10, day: 20 }); await repository.create(initial);
  if (raw !== undefined) await repository.saveAppSettings(raw);
  const bootstrap = async () => {
    mockPreferences = createPreferencesStore({ repository: async () => repository }); await mockPreferences.getState().bootstrap();
    mockGame = createGameStore({ repository: async () => repository, date: () => initial.date, id: () => 'unused' }); expect(await mockGame.getState().bootstrap()).toBe(true);
  };
  await bootstrap(); if (begin) expect(await mockGame.getState().acknowledgeBirth()).toBe(true);
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()])) as Record<string, Record<string, unknown>[]>;
  const lifeRows = () => { const all = rows(); return { ...all, preferences: all.preferences.filter(row => row.key !== 'app_settings') }; };
  return { get sqlite() { return sqlite; }, get repository() { return repository; }, rows, lifeRows,
    cold: async () => { sqlite.close(); repository = new SaveRepository(connect()); await bootstrap(); },
    close: () => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); } };
}
function Action() { const busy = useStore(mockGame, state => state.busy); return <Button label="Begin Test Life" busy={busy} onPress={() => { void mockGame.getState().acknowledgeBirth(); }} />; }
function Frame() { return <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider><AppFeedback><Settings /><Action /><GameLayout /></AppFeedback></ThemeProvider></SafeAreaProvider>; }
async function renderFrame() { const view = render(<Frame />); await act(async () => {}); return view; }
const press = async (name: string) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
const toggle = async (name: string, enabled: boolean) => { await act(async () => { fireEvent(screen.getByRole('switch', { name }), 'valueChange', enabled); }); };
const modal = () => within(screen.UNSAFE_getByType(Modal));
const flags = [{ name: 'Reduce Motion', field: 'reducedMotion' }, { name: 'Haptic Feedback', field: 'haptics' }, { name: 'Sound Effects', field: 'soundEffects' }] as const;

test.each(flags)('$name commits only its independent preference, keeps failure exact, retries and survives closing the actual database', async ({ name, field }) => {
  const context = await setup(true, '{"version":1,"appearance":"dark"}');
  try {
    const beforeRows = context.rows(), lifeRows = context.lifeRows(), before = encodeWorld(mockGame.getState().world!), archive = await context.repository.export('life_feedback');
    expect(Object.keys(beforeRows)).toHaveLength(8); const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'); let view = await renderFrame();
    expect(screen.getByRole('switch', { name })).not.toBeChecked(); expect(await context.repository.loadAppSettings()).toBe('{"version":1,"appearance":"dark"}');
    context.sqlite.exec("CREATE TRIGGER fail_feedback BEFORE INSERT ON preferences WHEN NEW.key='app_settings' BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    await toggle(name, true); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/could not be saved/));
    expect(screen.getAllByRole('alert')).toHaveLength(1); expect(screen.getByRole('switch', { name })).not.toBeChecked(); expect(mockPreferences.getState().settings[field]).toBe(false); expect(context.rows()).toEqual(beforeRows);
    expect(mockImpact).not.toHaveBeenCalled(); expect(mockAndroidHaptic).not.toHaveBeenCalled(); expect(mockAudioCreate).not.toHaveBeenCalled();
    context.sqlite.exec('DROP TRIGGER fail_feedback'); await press('Try Again'); await waitFor(() => expect(screen.getByRole('switch', { name })).toBeChecked());
    expect(context.lifeRows()).toEqual(lifeRows); expect(encodeWorld(mockGame.getState().world!)).toBe(before); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore(); expect(await context.repository.export('life_feedback')).toBe(archive);
    const savedRows = context.rows(); view.unmount(); await context.cold(); view = await renderFrame(); expect(screen.getByRole('switch', { name })).toBeChecked(); expect(mockPreferences.getState().settings.appearance).toBe('dark'); expect(context.rows()).toEqual(savedRows); expect(encodeWorld(mockGame.getState().world!)).toBe(before); view.unmount();
  } finally { context.close(); }
});

test('pending preference writes publish nothing early, block conflicting switches and duplicate retries, and repeated current choices never write', async () => {
  const context = await setup();
  try {
    const before = context.rows(), view = await renderFrame(); let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; }), save = context.repository.saveAppSettings.bind(context.repository);
    const write = jest.spyOn(context.repository, 'saveAppSettings').mockImplementationOnce(async value => { await gate; await save(value); });
    await toggle('Haptic Feedback', true); expect(mockPreferences.getState().busy).toBe(true); expect(context.rows()).toEqual(before);
    for (const { name } of flags) expect(screen.getByRole('switch', { name })).toBeDisabled(); expect(screen.getByRole('switch', { name: 'Haptic Feedback' })).not.toBeChecked();
    await toggle('Reduce Motion', true); await toggle('Sound Effects', true); expect(await mockPreferences.getState().setHaptics(false)).toBe(false); expect(await mockPreferences.getState().retry()).toBe(false); expect(write).toHaveBeenCalledTimes(1);
    await act(async () => { release(); }); await waitFor(() => expect(screen.getByRole('switch', { name: 'Haptic Feedback' })).toBeChecked()); const saved = context.rows();
    await act(async () => { expect(await mockPreferences.getState().setHaptics(true)).toBe(true); expect(await mockPreferences.getState().setReducedMotion(false)).toBe(true); expect(await mockPreferences.getState().setSoundEffects(false)).toBe(true); expect(await mockPreferences.getState().setAppearance('light')).toBe(true); expect(await mockPreferences.getState().reset()).toBe(true); });
    expect(write).toHaveBeenCalledTimes(1); expect(context.rows()).toEqual(saved); view.unmount();
  } finally { context.close(); }
});

test('device motion changes and the durable app choice control actual modal and game navigation animations without writing a life', async () => {
  let answer!: (enabled: boolean) => void;
  jest.mocked(AccessibilityInfo.isReduceMotionEnabled).mockImplementation(() => new Promise(resolve => { answer = resolve; }));
  const context = await setup();
  try {
    const before = context.rows(), view = await renderFrame();
    expect(screen.getByTestId('navigator').props.screenOptions.animation).toBe('none'); await press('Restore Default Appearance'); expect(screen.UNSAFE_getByType(Modal).props.animationType).toBe('none');
    await act(async () => { motionChanged(true); answer(false); }); expect(screen.UNSAFE_getByType(Modal).props.animationType).toBe('none'); expect(screen.getByText(/Your device requests reduced motion/)).toBeOnTheScreen();
    await act(async () => { motionChanged(false); }); expect(screen.UNSAFE_getByType(Modal).props.animationType).toBe('fade'); expect(screen.getByTestId('navigator').props.screenOptions.animation).toBe('default');
    await press('Never mind'); expect(context.rows()).toEqual(before); await toggle('Reduce Motion', true); await press('Restore Default Appearance'); expect(screen.UNSAFE_getByType(Modal).props.animationType).toBe('none'); expect(screen.getByTestId('navigator').props.screenOptions.animation).toBe('none'); await press('Never mind');
    await toggle('Reduce Motion', false); expect(screen.getByTestId('navigator').props.screenOptions.animation).toBe('default'); const current = context.rows();
    await act(async () => { motionChanged(true); motionChanged(false); }); expect(context.rows()).toEqual(current); expect(context.lifeRows()).toEqual({ ...before, preferences: before.preferences.filter(row => row.key !== 'app_settings') }); view.unmount(); expect(removedMotion).toHaveBeenCalledTimes(1);
  } finally { context.close(); }
});

test('the actual root navigator follows OS motion settings and disposes its listener without changing app or life records', async () => {
  const context = await setup();
  try {
    const before = context.rows(), view = render(<SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><RootLayout /></SafeAreaProvider>); await waitFor(() => expect(screen.getByTestId('navigator').props.screenOptions.animation).toBe('default'));
    await act(async () => { motionChanged(true); }); expect(screen.getByTestId('navigator').props.screenOptions.animation).toBe('none'); await act(async () => { motionChanged(false); }); expect(screen.getByTestId('navigator').props.screenOptions.animation).toBe('default'); expect(context.rows()).toEqual(before); view.unmount(); expect(removedMotion).toHaveBeenCalledTimes(1);
  } finally { context.close(); }
});

test('a failed appearance reset stays open with one error, retries exactly, and retains all saved feedback choices', async () => {
  const context = await setup(true, '{"version":1,"appearance":"dark","reducedMotion":true,"haptics":true,"soundEffects":true}');
  try {
    const before = context.rows(), view = await renderFrame(); await press('Restore Default Appearance'); await press('Never mind'); expect(context.rows()).toEqual(before); await press('Restore Default Appearance');
    context.sqlite.exec("CREATE TRIGGER fail_reset BEFORE INSERT ON preferences WHEN NEW.key='app_settings' BEGIN SELECT RAISE(ABORT,'storage failure'); END"); await press('Restore Appearance'); await waitFor(() => expect(modal().getByRole('alert')).toHaveTextContent(/could not be saved/));
    expect(screen.getAllByRole('alert')).toHaveLength(1); expect(modal().getByText('Restore the default appearance?')).toBeOnTheScreen(); expect(context.rows()).toEqual(before);
    context.sqlite.exec('DROP TRIGGER fail_reset'); await press('Restore Appearance'); await waitFor(() => expect(screen.queryByText('Restore the default appearance?')).toBeNull()); expect(mockPreferences.getState().settings).toEqual({ version: 1, appearance: 'light', reducedMotion: true, haptics: true, soundEffects: true, dailyReminder: false, reminderHour: 19, reminderMinute: 0 }); expect(context.lifeRows()).toEqual({ ...before, preferences: before.preferences.filter(row => row.key !== 'app_settings') }); view.unmount();
  } finally { context.close(); }
});

test.each(['ios', 'android'] as const)('%s native haptic and local sound never block an actual birth save, duplicate it, or consume gameplay RNG', async platform => {
  jest.replaceProperty(Platform, 'OS', platform); const context = await setup(false, '{"version":1,"appearance":"light","haptics":true,"soundEffects":true}');
  try {
    const initial = mockGame.getState().world!, unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    mockImpact.mockImplementation(() => new Promise(() => {})); mockAndroidHaptic.mockImplementation(() => new Promise(() => {}));
    let releaseSound!: () => void; mockPlayer.seekTo.mockImplementation(() => new Promise<void>(resolve => { releaseSound = resolve; }));
    const view = await renderFrame(); await waitFor(() => expect(mockAudioCreate).toHaveBeenCalledTimes(1)); expect(mockAudioMode).toHaveBeenCalledWith({ playsInSilentMode: false, interruptionMode: 'mixWithOthers', allowsRecording: false, shouldPlayInBackground: false, shouldRouteThroughEarpiece: false });
    expect(mockAudioCreate).toHaveBeenCalledWith(42, { keepAudioSessionActive: false, updateInterval: 1000 });
    await press('Begin Test Life'); await waitFor(() => expect(mockGame.getState().world!.birthAcknowledged).toBe(true)); const expected = { ...initial, birthAcknowledged: true, revision: initial.revision + 1 }; expect(mockGame.getState().world).toEqual(expected);
    expect(platform === 'ios' ? mockImpact : mockAndroidHaptic).toHaveBeenCalledWith(platform === 'ios' ? 'light' : 'virtual-key'); expect(platform === 'ios' ? mockAndroidHaptic : mockImpact).not.toHaveBeenCalled(); expect(mockPlayer.play).not.toHaveBeenCalled(); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    await act(async () => { releaseSound(); }); expect(mockPlayer.play).toHaveBeenCalledTimes(1); const savedRows = context.rows(); view.unmount(); expect(mockPlayer.remove).toHaveBeenCalledTimes(1); await context.cold(); expect(mockGame.getState().world).toEqual(expected); expect(context.rows()).toEqual(savedRows);
  } finally { context.close(); }
});

test('turning feedback off stops pending sound, releases the player, and leaves action text and operation intact', async () => {
  const context = await setup(false, '{"version":1,"appearance":"light","haptics":true,"soundEffects":true}');
  try {
    let releaseSound!: () => void; mockPlayer.seekTo.mockImplementation(() => new Promise<void>(resolve => { releaseSound = resolve; }));
    const view = await renderFrame(); await waitFor(() => expect(mockAudioCreate).toHaveBeenCalledTimes(1)); await press('How to Play. Years, routines, milestones and local progress'); // Navigation rows use haptics without adding button sounds.
    expect(mockImpact).toHaveBeenCalledTimes(1); expect(mockPlayer.seekTo).not.toHaveBeenCalled(); await press('Restore Default Appearance'); expect(mockPlayer.seekTo).toHaveBeenCalledTimes(1); await press('Never mind');
    await toggle('Sound Effects', false); await toggle('Haptic Feedback', false); const writes = context.rows(), count = mockImpact.mock.calls.length;
    await act(async () => { releaseSound(); }); expect(mockPlayer.play).not.toHaveBeenCalled(); expect(mockPlayer.remove).toHaveBeenCalledTimes(1); await press('Restore Default Appearance'); await press('Never mind'); expect(mockImpact).toHaveBeenCalledTimes(count); expect(context.rows()).toEqual(writes); view.unmount();
  } finally { context.close(); }
});

test('backgrounding suppresses a pending sound and unavailable native feedback cannot break an action', async () => {
  const context = await setup(false, '{"version":1,"appearance":"light","haptics":true,"soundEffects":true}');
  try {
    let releaseSound!: () => void; mockPlayer.seekTo.mockImplementation(() => new Promise<void>(resolve => { releaseSound = resolve; }));
    const view = await renderFrame(); await waitFor(() => expect(mockAudioCreate).toHaveBeenCalledTimes(1)); mockImpact.mockRejectedValue(new Error('hardware unavailable')); await press('Restore Default Appearance');
    await act(async () => { AppState.currentState = 'background'; appStateChanged('background'); releaseSound(); }); expect(mockPlayer.pause).toHaveBeenCalledTimes(1); expect(mockPlayer.play).not.toHaveBeenCalled(); await press('Never mind');
    await act(async () => { AppState.currentState = 'active'; appStateChanged('active'); }); mockImpact.mockImplementation(() => { throw new Error('native module missing'); }); mockPlayer.seekTo.mockRejectedValue(new Error('audio session unavailable'));
    await press('Begin Test Life'); await waitFor(() => expect(mockGame.getState().world!.birthAcknowledged).toBe(true)); expect(mockGame.getState().error).toBeNull(); expect(mockPreferences.getState().error).toBeNull(); expect(screen.getByRole('button', { name: 'Begin Test Life' })).toBeOnTheScreen(); view.unmount(); expect(removedAppState).toHaveBeenCalledTimes(1);
  } finally { context.close(); }
});

test('native audio initialization failure and an unreadable OS setting leave the actual game usable with animations reduced', async () => {
  const context = await setup(false, '{"version":1,"appearance":"light","soundEffects":true}');
  try {
    jest.mocked(AccessibilityInfo.isReduceMotionEnabled).mockRejectedValue(new Error('native accessibility unavailable')); mockAudioMode.mockRejectedValue(new Error('native audio unavailable'));
    const view = await renderFrame(); await waitFor(() => expect(mockAudioMode).toHaveBeenCalledTimes(1)); expect(mockAudioCreate).not.toHaveBeenCalled(); await press('Begin Test Life'); await waitFor(() => expect(mockGame.getState().world!.birthAcknowledged).toBe(true)); expect(screen.getByTestId('navigator').props.screenOptions.animation).toBe('none'); expect(mockGame.getState().error).toBeNull(); view.unmount();
  } finally { context.close(); }
});

test.each(['reducedMotion', 'haptics', 'soundEffects'])('invalid %s is preserved on disk and cannot be silently overwritten by a settings choice', async field => {
  const raw = JSON.stringify({ version: 1, appearance: 'dark', [field]: 'enabled' }), context = await setup(true, raw);
  try {
    const before = context.rows(), view = await renderFrame(); expect(screen.getByRole('alert')).toHaveTextContent(/could not be read/); for (const { name } of flags) expect(screen.getByRole('switch', { name })).toBeDisabled();
    expect(await mockPreferences.getState().setHaptics(true)).toBe(false); expect(await mockPreferences.getState().setReducedMotion(true)).toBe(false); expect(await mockPreferences.getState().setSoundEffects(true)).toBe(false); expect(context.rows()).toEqual(before); await press('Restore Default Appearance'); await press('Never mind'); expect(context.rows()).toEqual(before); expect(await context.repository.loadAppSettings()).toBe(raw); view.unmount();
  } finally { context.close(); }
});

test('disabled or busy central buttons do not act or produce feedback; unsupported devices expose an honest disabled control', async () => {
  const action = jest.fn(), haptic = jest.fn(async () => {}), sound = jest.fn(async () => {});
  const view = render(<FeedbackProvider reducedMotion={false} haptics onButtonFeedback={haptic} soundEffects onButtonSound={sound}><Button label="Disabled" disabled onPress={action} /><Button label="Busy" busy onPress={action} /><Button label="Ready" onPress={action} /></FeedbackProvider>);
  await press('Disabled'); await press('Busy'); expect(action).not.toHaveBeenCalled(); expect(haptic).not.toHaveBeenCalled(); expect(sound).not.toHaveBeenCalled(); await press('Ready'); expect(action).toHaveBeenCalledTimes(1); expect(haptic).toHaveBeenCalledTimes(1); expect(sound).toHaveBeenCalledTimes(1); view.unmount();
  const context = await setup(); try { jest.replaceProperty(Platform, 'OS', 'web'); const unsupported = await renderFrame(); expect(screen.getByRole('switch', { name: 'Haptic Feedback' })).toBeDisabled(); expect(screen.getByRole('switch', { name: 'Sound Effects' })).toBeDisabled(); expect(screen.getByText('Haptics are available on supported iOS and Android devices.')).toBeOnTheScreen(); unsupported.unmount(); } finally { context.close(); }
});
