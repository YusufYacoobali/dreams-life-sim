import { displayText } from '../../src/ui/displayNumbers';
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
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
import { SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';
import { ThemeProvider } from '../../src/ui/theme';
let mockStore: ReturnType<typeof createGameStore>, mockPreferences: ReturnType<typeof createPreferencesStore>;
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
jest.mock('../../src/state/usePreferences', () => ({ usePreferences: (selector: unknown) => require('zustand').useStore(mockPreferences, selector) }));
import GodMode from '../../app/god-mode';
import Settings from '../../app/settings';
import Assets from '../../app/(game)/(tabs)/assets';
import { GodModeShortcut } from '../../src/ui/GodModeAccess';

const frame = (child: React.ReactNode) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider>{child}</ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
const tab = (name: string) => fireEvent.press(screen.getByRole('tab', { name }));
async function fixture() {
  Constants.expoConfig!.extra = require('../../app.config.cjs')({ config: {} }).extra;
  const db = database(), repository = new SaveRepository(db.driver); await repository.initialise();
  const before = { ...createLife('life_god_ui', 42, randomCreation(42), { year: 2026, month: 10, day: 22 }), birthAcknowledged: true }; await repository.create(before);
  mockPreferences = createPreferencesStore({ repository: async () => repository }); await mockPreferences.getState().bootstrap();
  let sequence = 0;
  const deps = { repository: async () => repository, date: () => before.date, id: () => 'life_ui_' + sequence++, godModeAccess: () => isGodModeBuild() && mockPreferences.getState().settings.godModeEnabled };
  mockStore = createGameStore(deps); await mockStore.getState().bootstrap();
  return { ...db, repository, before, deps };
}

const buildGlobals = globalThis as unknown as { __DEV__: boolean };
let previousDev: boolean, previousExtra: NonNullable<typeof Constants.expoConfig>['extra'];
beforeEach(() => { previousDev = __DEV__; previousExtra = Constants.expoConfig!.extra; buildGlobals.__DEV__ = false; });
afterEach(() => { buildGlobals.__DEV__ = previousDev; Constants.expoConfig!.extra = previousExtra; });

test('release Settings enable opens the editor; bulk edits update Assets immediately and survive cold store load', async () => {
  const { sqlite, repository, before, deps } = await fixture(), view = render(frame(<Settings />));
  expect(screen.queryByRole('button', { name: 'Open God Mode Editor' })).toBeNull();
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
  expect(screen.getByRole('button', { name: /God Mode Editor/ })).toBeTruthy();
  await act(async () => { mockStore = createGameStore(deps); await mockStore.getState().bootstrap(); }); expect(mockStore.getState().world).toEqual(saved); expect(await repository.load(before.id)).toEqual(saved);
  view.unmount(); sqlite.close();
});

test('invalid edits, reset, destructive confirmation, cancel and failed-save retry keep real storage coherent', async () => {
  const { sqlite, repository, before } = await fixture(); await mockPreferences.getState().setGodModeEnabled(true); const view = render(frame(<GodMode />)), encoded = encodeWorld(before);
  tab('Stats'); fireEvent.changeText(screen.getByLabelText('Health value'), '101'); await press('Save Changes'); expect(screen.getAllByRole('alert').some(item => /0 to 100/.test(String(item.props.children)))).toBe(true); expect(encodeWorld(await repository.load(before.id))).toBe(encoded);
  await press('Reset Changes'); expect(screen.getByLabelText('Health value').props.value).toBe(String(before.people[before.activePersonId].stats.health));
  await press('Min All Stats'); await press('Cancel'); expect(screen.getByRole('header', { name: 'Discard unsaved changes?' })).toBeTruthy(); await press('Never mind'); expect(encodeWorld(await repository.load(before.id))).toBe(encoded);
  await press('Save Changes'); expect(screen.getByRole('header', { name: 'Save these testing changes?' })).toBeTruthy();
  sqlite.exec("CREATE TRIGGER fail_god_ui BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  await press('Confirm Save Changes'); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/could not be saved/)); expect(encodeWorld(await repository.load(before.id))).toBe(encoded); expect(await repository.snapshots(before.id)).toEqual([]);
  sqlite.exec('DROP TRIGGER fail_god_ui'); await press('Confirm Save Changes'); expect(mockStore.getState().world!.people[before.activePersonId].stats.health).toBe(0); expect(mockStore.getState().world!.people[before.activePersonId].died).toBeNull(); expect(await repository.snapshots(before.id)).toHaveLength(1);
  view.unmount(); sqlite.close();
});

test('missing testing capability still denies direct editor saves even with a persisted toggle', async () => {
  const { sqlite, before, repository } = await fixture(); await mockPreferences.getState().setGodModeEnabled(true); Constants.expoConfig!.extra = { godModeTesting: false };
  const view = render(frame(<Settings />)); expect(screen.queryByRole('switch', { name: 'God Mode' })).toBeNull(); expect(screen.queryByRole('button', { name: 'Open God Mode Editor' })).toBeNull();
  view.rerender(frame(<GodModeShortcut />)); expect(screen.queryByRole('button', { name: /God Mode/ })).toBeNull();
  view.rerender(frame(<GodMode />)); expect(screen.getByText('God Mode is unavailable or switched off.')).toBeTruthy(); expect(screen.queryByRole('button', { name: 'Save Changes' })).toBeNull();
  expect(await mockStore.getState().editGodMode({ lifeId: before.id, personId: before.activePersonId, expectedRevision: before.revision, commands: [{ type: 'stat', stat: 'health', value: 100 }] })).toBe(false); expect(await repository.load(before.id)).toEqual(before);
  view.unmount(); sqlite.close();
});

test('stale drafts require reload and disabling God Mode keeps saved values', async () => {
  const { sqlite, repository, before } = await fixture(); await mockPreferences.getState().setGodModeEnabled(true); const view = render(frame(<GodMode />));
  tab('Stats'); fireEvent.changeText(screen.getByLabelText('Smarts value'), '99');
  await act(async () => { await mockStore.getState().editGodMode({ lifeId: before.id, personId: before.activePersonId, expectedRevision: before.revision, commands: [{ type: 'stat', stat: 'smarts', value: 47 }] }); });
  expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled(); await press('Reload Values'); expect(screen.getByLabelText('Smarts value').props.value).toBe('47');
  await act(async () => { await mockPreferences.getState().setGodModeEnabled(false); }); expect(screen.getByText('God Mode is unavailable or switched off.')).toBeTruthy(); expect((await repository.load(before.id)).people[before.activePersonId].stats.smarts).toBe(47);
  view.unmount(); sqlite.close();
});

test('a save conflict from another session offers a real repository reload before retry', async () => {
  const { sqlite, before, deps, repository } = await fixture(); await mockPreferences.getState().setGodModeEnabled(true); const view = render(frame(<GodMode />));
  tab('Stats'); fireEvent.changeText(screen.getByLabelText('Smarts value'), '99');
  const other = createGameStore(deps); await other.getState().bootstrap();
  expect(await other.getState().editGodMode({ lifeId: before.id, personId: before.activePersonId, expectedRevision: before.revision, commands: [{ type: 'stat', stat: 'smarts', value: 47 }] })).toBe(true);
  await press('Save Changes'); await waitFor(() => expect(screen.getByRole('button', { name: 'Reload Values' })).toBeTruthy());
  await press('Reload Values'); expect(screen.getByLabelText('Smarts value').props.value).toBe('47'); expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
  expect(await repository.snapshots(before.id)).toHaveLength(1); view.unmount(); sqlite.close();
});
