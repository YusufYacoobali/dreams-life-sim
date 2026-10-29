import { displayText } from '../../src/ui/displayNumbers';
import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { createGameStore } from '../../src/state/gameStore';
import { createPreferencesStore } from '../../src/state/preferencesStore';
import { createLife, randomCreation } from '../../src/game/createLife';
import { encodeWorld, fullName } from '../../src/game/model';
import { formatMoney } from '../../src/game/money';
import { countries } from '../../src/game/countries';
import Constants from 'expo-constants';
import { isGodModeBuild } from '../../src/access/buildAccess';
import { godModeSessionStore } from '../../src/state/godModeSession';
import { SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';
import { ThemeProvider } from '../../src/ui/theme';
let mockStore: ReturnType<typeof createGameStore>, mockPreferences: ReturnType<typeof createPreferencesStore>;
const mockRedirect = jest.fn();
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() }, Redirect: (props: unknown) => { mockRedirect(props); return null; } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
jest.mock('../../src/state/usePreferences', () => ({ usePreferences: (selector: unknown) => require('zustand').useStore(mockPreferences, selector) }));
// These journeys exercise the real playground route/access gate, not a running
// mini-game. Its native animation shell has separate mini-game coverage.
jest.mock('../../src/minigames/components/MiniGameScreen', () => ({ MiniGameScreen: () => null }));
jest.mock('expo-asset', () => ({ Asset: { loadAsync: jest.fn(async () => []) } }));
import GodMode from '../../app/god-mode';
import Settings from '../../app/settings';
import Assets from '../../app/(game)/(tabs)/assets';
import { MiniGamePlayground } from '../../src/minigames/MiniGamePlayground';

const frame = (child: React.ReactNode) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider>{child}</ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
const tab = (name: string) => fireEvent.press(screen.getByRole('tab', { name }));
const revealInSettings = async () => { await press('App Preferences'); await press('App Preferences'); await press('App Preferences'); };
async function fixture(profile: 'internal' | 'production' = 'internal', capability?: boolean, revealed = false) {
  const previousBuildEnv = { ...process.env };
  try {
    process.env.EAS_BUILD_PROFILE = profile;
    process.env.EAS_BUILD_DISTRIBUTION = profile === 'production' ? 'store' : 'internal';
    process.env.DREAMS_GOD_MODE_TESTING = '1';
    Constants.expoConfig!.extra = require('../../app.config.cjs')({ config: {} }).extra;
  } finally { process.env = previousBuildEnv; }
  if (capability !== undefined) Constants.expoConfig!.extra = { ...Constants.expoConfig!.extra, godModeTesting: capability };
  if (revealed) godModeSessionStore.getState().reveal();
  const db = database(), repository = new SaveRepository(db.driver); await repository.initialise();
  const before = { ...createLife('life_god_ui', 42, randomCreation(42), { year: 2026, month: 10, day: 22 }), birthAcknowledged: true }; await repository.create(before);
  mockPreferences = createPreferencesStore({ repository: async () => repository }); await mockPreferences.getState().bootstrap();
  let sequence = 0;
  const deps = { repository: async () => repository, date: () => before.date, id: () => 'life_ui_' + sequence++, godModeAccess: () => {
    const preferences = mockPreferences.getState();
    return isGodModeBuild() && godModeSessionStore.getState().revealed && preferences.ready && !preferences.loadFailed && preferences.settings.godModeEnabled;
  } };
  mockStore = createGameStore(deps); await mockStore.getState().bootstrap();
  return { ...db, repository, before, deps };
}

const buildGlobals = globalThis as unknown as { __DEV__: boolean };
let previousDev: boolean, previousExtra: NonNullable<typeof Constants.expoConfig>['extra'];
beforeEach(() => { previousDev = __DEV__; previousExtra = Constants.expoConfig!.extra; buildGlobals.__DEV__ = false; godModeSessionStore.getState().reset(); });
afterEach(() => { buildGlobals.__DEV__ = previousDev; Constants.expoConfig!.extra = previousExtra; godModeSessionStore.getState().reset(); jest.restoreAllMocks(); });

test.each(['internal', 'production'] as const)('%s release Settings enable opens the editor; bulk edits update Assets immediately and survive cold store load', async profile => {
  const { sqlite, repository, before, deps } = await fixture(profile), view = render(frame(<Settings />));
  expect(isGodModeBuild()).toBe(true);
  expect(mockPreferences.getState().settings.godModeEnabled).toBe(false);
  expect(screen.queryByRole('switch', { name: 'God Mode' })).toBeNull();
  expect(screen.queryByText(/God Mode/)).toBeNull();
  expect(screen.queryByRole('button', { name: 'Open God Mode Editor' })).toBeNull();
  await press('App Preferences'); await press('App Preferences');
  expect(screen.queryByRole('switch', { name: 'God Mode' })).toBeNull();
  await press('App Preferences');
  expect(screen.getByRole('switch', { name: 'God Mode' })).not.toBeChecked();
  await act(async () => { fireEvent(screen.getByRole('switch', { name: 'God Mode' }), 'valueChange', true); });
  await press('Open God Mode Editor'); expect(router.push).toHaveBeenCalledWith('/god-mode');
  view.rerender(frame(<GodMode />));
  const account = before.accounts.find(item => item.ownerId === before.activePersonId)!;
  fireEvent.changeText(screen.getByLabelText(account.currency + ' amount'), '1000000');
  tab('Stats'); fireEvent.changeText(screen.getByLabelText('Smarts value'), '100');
  fireEvent(screen.getByRole('adjustable', { name: 'Health slider' }), 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
  tab('Skills & Attributes'); fireEvent.changeText(screen.getByLabelText('Science value'), '47');
  tab('Relationships'); const relationship = before.relationships.find(item => item.from === before.activePersonId || item.to === before.activePersonId)!;
  const other = before.people[relationship.from === before.activePersonId ? relationship.to : relationship.from];
  await press(new RegExp('^' + fullName(other))); fireEvent.changeText(screen.getByLabelText('Trust value'), '100');
  await press('Save Changes'); await waitFor(() => expect(router.back).toHaveBeenCalled());
  const saved = mockStore.getState().world!; expect(saved.people[saved.activePersonId].stats.smarts).toBe(100); expect(saved.people[saved.activePersonId].skills.science).toBe(47);
  expect(saved.relationships.find(item => item.id === relationship.id)?.trust).toBe(100); expect(saved.revision).toBe(before.revision + 1);
  view.rerender(frame(<Assets />)); expect(screen.getByText('Bank: ' + displayText(formatMoney({ minor: saved.accounts.find(item => item.id === account.id)!.cash, currency: account.currency }, countries[before.people[before.activePersonId].country].locale)))).toBeTruthy();
  expect(screen.queryByRole('button', { name: /God Mode/ })).toBeNull();
  await act(async () => { mockStore = createGameStore(deps); await mockStore.getState().bootstrap(); }); expect(mockStore.getState().world).toEqual(saved); expect(await repository.load(before.id)).toEqual(saved);
  view.unmount(); sqlite.close();
});

test('invalid edits, reset, destructive confirmation, cancel and failed-save retry keep real storage coherent', async () => {
  const { sqlite, repository, before } = await fixture('internal', undefined, true); await mockPreferences.getState().setGodModeEnabled(true); const view = render(frame(<GodMode />)), encoded = encodeWorld(before);
  tab('Stats'); fireEvent.changeText(screen.getByLabelText('Health value'), '101'); await press('Save Changes'); expect(screen.getAllByRole('alert').some(item => /0 to 100/.test(String(item.props.children)))).toBe(true); expect(encodeWorld(await repository.load(before.id))).toBe(encoded);
  await press('Reset Changes'); expect(screen.getByLabelText('Health value').props.value).toBe(String(before.people[before.activePersonId].stats.health));
  await press('Min All Stats'); await press('Cancel'); expect(screen.getByRole('header', { name: 'Discard unsaved changes?' })).toBeTruthy(); await press('Never mind'); expect(encodeWorld(await repository.load(before.id))).toBe(encoded);
  await press('Save Changes'); expect(screen.getByRole('header', { name: 'Save these testing changes?' })).toBeTruthy();
  sqlite.exec("CREATE TRIGGER fail_god_ui BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  await press('Confirm Save Changes'); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/could not be saved/)); expect(encodeWorld(await repository.load(before.id))).toBe(encoded); expect(await repository.snapshots(before.id)).toEqual([]);
  sqlite.exec('DROP TRIGGER fail_god_ui'); await press('Confirm Save Changes'); expect(mockStore.getState().world!.people[before.activePersonId].stats.health).toBe(0); expect(mockStore.getState().world!.people[before.activePersonId].died).toBeNull(); expect(await repository.snapshots(before.id)).toHaveLength(1);
  view.unmount(); sqlite.close();
});

test('an explicitly absent testing capability denies direct editor saves even with a persisted enabled toggle', async () => {
  const { sqlite, before, repository } = await fixture('production', false, true); await mockPreferences.getState().setGodModeEnabled(true);
  expect(isGodModeBuild()).toBe(false);
  expect(mockPreferences.getState().settings.godModeEnabled).toBe(true);
  const view = render(frame(<Settings />)); expect(screen.queryByRole('switch', { name: 'God Mode' })).toBeNull(); expect(screen.queryByRole('button', { name: 'Open God Mode Editor' })).toBeNull();
  view.rerender(frame(<Assets />)); expect(screen.queryByRole('button', { name: /God Mode/ })).toBeNull();
  view.rerender(frame(<GodMode />)); expect(mockRedirect).toHaveBeenLastCalledWith({ href: '/settings' }); expect(screen.queryByText(/God Mode/)).toBeNull(); expect(screen.queryByRole('button', { name: 'Save Changes' })).toBeNull();
  expect(await mockStore.getState().editGodMode({ lifeId: before.id, personId: before.activePersonId, expectedRevision: before.revision, commands: [{ type: 'stat', stat: 'health', value: 100 }] })).toBe(false); expect(await repository.load(before.id)).toEqual(before);
  view.unmount(); sqlite.close();
});

test('stale drafts require reload and disabling God Mode in production prevents further edits while keeping saved values', async () => {
  const { sqlite, repository, before } = await fixture('production', undefined, true); await mockPreferences.getState().setGodModeEnabled(true); const view = render(frame(<GodMode />));
  tab('Stats'); fireEvent.changeText(screen.getByLabelText('Smarts value'), '99');
  await act(async () => { await mockStore.getState().editGodMode({ lifeId: before.id, personId: before.activePersonId, expectedRevision: before.revision, commands: [{ type: 'stat', stat: 'smarts', value: 47 }] }); });
  expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled(); await press('Reload Values'); expect(screen.getByLabelText('Smarts value').props.value).toBe('47');
  await act(async () => { await mockPreferences.getState().setGodModeEnabled(false); }); expect(mockRedirect).toHaveBeenLastCalledWith({ href: '/settings' }); expect(screen.queryByText(/God Mode/)).toBeNull();
  const disabled = mockStore.getState().world!;
  await act(async () => { expect(await mockStore.getState().editGodMode({ lifeId: disabled.id, personId: disabled.activePersonId, expectedRevision: disabled.revision, commands: [{ type: 'stat', stat: 'smarts', value: 100 }] })).toBe(false); });
  expect(await repository.load(before.id)).toEqual(disabled);
  expect(disabled.people[before.activePersonId].stats.smarts).toBe(47);
  view.unmount(); sqlite.close();
});

test('a save conflict from another session offers a real repository reload before retry', async () => {
  const { sqlite, before, deps, repository } = await fixture('internal', undefined, true); await mockPreferences.getState().setGodModeEnabled(true); const view = render(frame(<GodMode />));
  tab('Stats'); fireEvent.changeText(screen.getByLabelText('Smarts value'), '99');
  const other = createGameStore(deps); await other.getState().bootstrap();
  expect(await other.getState().editGodMode({ lifeId: before.id, personId: before.activePersonId, expectedRevision: before.revision, commands: [{ type: 'stat', stat: 'smarts', value: 47 }] })).toBe(true);
  await press('Save Changes'); await waitFor(() => expect(screen.getByRole('button', { name: 'Reload Values' })).toBeTruthy());
  await press('Reload Values'); expect(screen.getByLabelText('Smarts value').props.value).toBe('47'); expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
  expect(await repository.snapshots(before.id)).toHaveLength(1); view.unmount(); sqlite.close();
});

test('three quick taps across App Preferences reveal controls; delayed taps reset without writing settings or a life', async () => {
  const { sqlite, repository, before } = await fixture('production'), clock = jest.spyOn(Date, 'now');
  let now = 1000;
  clock.mockImplementation(() => now);
  const view = render(frame(<Settings />)), beforePreferences = await repository.loadAppSettings(),
    area = screen.getByRole('button', { name: 'App Preferences' });
  expect(within(area).getByText('Choose your appearance, feedback and daily reminders.')).toBeOnTheScreen();
  expect(area.props.accessibilityHint).toBeUndefined();
  expect(screen.queryByText(/God Mode|Testing controls/)).toBeNull();
  await act(async () => { fireEvent.press(screen.getByText('Choose your appearance, feedback and daily reminders.')); });
  now = 1100; await press('App Preferences');
  expect(screen.queryByRole('switch', { name: 'God Mode' })).toBeNull();
  now = 2000; await press('App Preferences');
  now = 2700; await press('App Preferences');
  expect(screen.queryByRole('switch', { name: 'God Mode' })).toBeNull();
  now = 3500; await press('App Preferences');
  expect(screen.getByRole('switch', { name: 'God Mode' })).not.toBeChecked();
  expect(screen.queryByRole('button', { name: 'Open God Mode Editor' })).toBeNull();
  expect(screen.getByRole('radio', { name: 'Light' })).toBeChecked();
  expect(await repository.loadAppSettings()).toBe(beforePreferences);
  expect(await repository.load(before.id)).toEqual(before);
  view.unmount(); sqlite.close();
});

test('an enabled saved toggle stays hidden in a fresh session and direct Editor/Playground routes redirect until revealed', async () => {
  const { sqlite, repository, before } = await fixture('production');
  await mockPreferences.getState().setGodModeEnabled(true);
  const savedPreferences = await repository.loadAppSettings(), view = render(frame(<Settings />));
  expect(godModeSessionStore.getState().revealed).toBe(false);
  expect(screen.queryByText(/God Mode|Testing controls/)).toBeNull();
  expect(screen.queryByRole('button', { name: 'Mini-Game Playground' })).toBeNull();
  view.rerender(frame(<GodMode />));
  expect(mockRedirect).toHaveBeenLastCalledWith({ href: '/settings' });
  expect(screen.queryByText(/God Mode/)).toBeNull();
  expect(screen.queryByRole('button', { name: 'Save Changes' })).toBeNull();
  view.rerender(frame(<MiniGamePlayground />));
  expect(mockRedirect).toHaveBeenLastCalledWith({ href: '/settings' });
  expect(screen.queryByText(/Playground|Just one more go/)).toBeNull();
  await act(async () => { expect(await mockStore.getState().editGodMode({ lifeId: before.id, personId: before.activePersonId, expectedRevision: before.revision, commands: [{ type: 'stat', stat: 'smarts', value: 100 }] })).toBe(false); });
  view.rerender(frame(<Settings />)); await revealInSettings();
  expect(screen.getByRole('switch', { name: 'God Mode' })).toBeChecked();
  expect(screen.getByRole('button', { name: 'Open God Mode Editor' })).toBeEnabled();
  view.rerender(frame(<GodMode />));
  expect(screen.getByRole('button', { name: 'Save Changes' })).toBeOnTheScreen();
  view.rerender(frame(<MiniGamePlayground />));
  expect(screen.getByRole('header', { name: 'Mini-Game Playground' })).toBeOnTheScreen();
  await act(async () => {
    godModeSessionStore.getState().reset();
    mockPreferences = createPreferencesStore({ repository: async () => repository });
    await mockPreferences.getState().bootstrap();
  });
  view.rerender(frame(<Settings />));
  expect(mockPreferences.getState().settings.godModeEnabled).toBe(true);
  expect(screen.queryByText(/God Mode|Testing controls/)).toBeNull();
  await revealInSettings();
  expect(screen.getByRole('switch', { name: 'God Mode' })).toBeChecked();
  expect(await repository.loadAppSettings()).toBe(savedPreferences);
  expect(await repository.load(before.id)).toEqual(before);
  view.unmount(); sqlite.close();
});

test('busy preferences reset partial taps and retained handlers cannot reveal while saving or after unmount', async () => {
  const { sqlite, repository } = await fixture('production'), view = render(frame(<Settings />));
  await press('App Preferences'); await press('App Preferences');
  const retainedPress = screen.UNSAFE_root.findAll(node => node.props.accessibilityLabel === 'App Preferences' && typeof node.props.onPress === 'function')[0].props.onPress as () => void,
    saveSettings = repository.saveAppSettings.bind(repository);
  let release!: () => void, write!: Promise<boolean>;
  const pending = new Promise<void>(resolve => { release = resolve; }),
    save = jest.spyOn(repository, 'saveAppSettings').mockImplementation(async raw => { await pending; await saveSettings(raw); });
  await act(async () => { write = mockPreferences.getState().setAppearance('dark'); });
  expect(screen.getByRole('button', { name: 'App Preferences' })).toBeDisabled();
  await act(async () => { retainedPress(); retainedPress(); retainedPress(); });
  expect(godModeSessionStore.getState().revealed).toBe(false);
  await act(async () => { release(); expect(await write).toBe(true); });
  await press('App Preferences'); await press('App Preferences');
  expect(screen.queryByRole('switch', { name: 'God Mode' })).toBeNull();
  await press('App Preferences');
  expect(screen.getByRole('switch', { name: 'God Mode' })).toBeEnabled();
  expect(save).toHaveBeenCalledTimes(1);
  view.unmount(); godModeSessionStore.getState().reset();
  retainedPress(); retainedPress(); retainedPress();
  expect(godModeSessionStore.getState().revealed).toBe(false);
  sqlite.close();
});

test('unreadable preferences cannot reveal or enable testing controls and retain the exact stored record', async () => {
  const { sqlite, repository, before } = await fixture('production'),
    unreadable = '{"version":1,"appearance":"broken","godModeEnabled":true}';
  await repository.saveAppSettings(unreadable);
  mockPreferences = createPreferencesStore({ repository: async () => repository });
  expect(await mockPreferences.getState().bootstrap()).toBe(false);
  const view = render(frame(<Settings />));
  expect(screen.getByRole('button', { name: 'App Preferences' })).toBeDisabled();
  await revealInSettings();
  expect(godModeSessionStore.getState().revealed).toBe(false);
  expect(screen.queryByText(/God Mode|Testing controls/)).toBeNull();
  await act(async () => { godModeSessionStore.getState().reveal(); });
  expect(screen.getByRole('switch', { name: 'God Mode' })).toBeDisabled();
  await act(async () => { fireEvent(screen.getByRole('switch', { name: 'God Mode' }), 'valueChange', true); });
  expect(screen.queryByRole('button', { name: 'Open God Mode Editor' })).toBeNull();
  view.rerender(frame(<GodMode />)); expect(mockRedirect).toHaveBeenLastCalledWith({ href: '/settings' });
  view.rerender(frame(<MiniGamePlayground />)); expect(mockRedirect).toHaveBeenLastCalledWith({ href: '/settings' });
  expect(await repository.loadAppSettings()).toBe(unreadable);
  expect(await repository.load(before.id)).toEqual(before);
  view.unmount(); sqlite.close();
});
