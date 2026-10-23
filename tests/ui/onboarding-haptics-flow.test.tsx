import React from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { createPreferencesStore } from '../../src/state/preferencesStore';
import { useCreationDraft } from '../../src/state/creationDraft';
import { SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';
import { encodeWorld } from '../../src/game/model';
import { outfitLabels, hairLabels } from '../../src/assets/portraitLayout';
import { hairColorLabels } from '../../src/ui/appearanceLabels';
import { AppFeedback } from '../../src/ui/AppFeedback';
import { ThemeProvider } from '../../src/ui/theme';

let mockStore: ReturnType<typeof createGameStore>, mockPreferences: ReturnType<typeof createPreferencesStore>;
const mockHaptic = jest.fn(), mockAndroidHaptic = jest.fn(), mockSound = jest.fn();
jest.mock('expo-haptics', () => ({ impactAsync: (...args: unknown[]) => mockHaptic(...args), performAndroidHapticsAsync: (...args: unknown[]) => mockAndroidHaptic(...args),
  ImpactFeedbackStyle: { Light: 'light' }, AndroidHaptics: { Virtual_Key: 'virtual-key' } }));
jest.mock('../../src/ui/useActionSound', () => ({ useActionSound: () => mockSound }));
jest.mock('../../src/state/usePreferences', () => ({ usePreferences: (selector: unknown) => require('zustand').useStore(mockPreferences, selector) }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector), freshSeed: () => 42 }));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), setParams: jest.fn() },
  useLocalSearchParams: () => ({ seed: '42', mode: 'custom' }), useFocusEffect: (effect: React.EffectCallback) => require('react').useEffect(effect, [effect]), Redirect: () => null }));
import { router } from 'expo-router';
import Welcome from '../../app/index';
import NewLife from '../../app/new-life';
import Appearance from '../../app/appearance';
import Life from '../../app/(game)/(tabs)/life';

const frame = (child: React.ReactNode) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider><AppFeedback>{child}</AppFeedback></ThemeProvider></SafeAreaProvider>;
const press = async (role: 'button' | 'radio' | 'tab' | 'checkbox', name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole(role, { name })); }); };
const pulse = async (role: 'button' | 'radio' | 'tab' | 'checkbox', name: string | RegExp) => {
  const before = mockHaptic.mock.calls.length; await press(role, name); expect(mockHaptic).toHaveBeenCalledTimes(before + 1);
};
function pressHandler(name: string) {
  let control = screen.getByRole('button', { name });
  while (typeof control.props.onPress !== 'function') { if (!control.parent) throw new Error('Missing native press handler'); control = control.parent; }
  return control.props.onPress as () => unknown;
}
async function setup(bootstrap = true) {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise();
  let nextYield: Promise<void> | undefined;
  mockStore = createGameStore({ repository: async () => repository, date: () => ({ year: 2026, month: 10, day: 22 }), id: () => 'life_haptic_opening',
    yieldToUI: async () => { const held = nextYield; nextYield = undefined; if (held) await held; } });
  if (bootstrap) expect(await mockStore.getState().bootstrap()).toBe(true);
  mockPreferences = createPreferencesStore({ repository: async () => repository }); await mockPreferences.getState().bootstrap(); await mockPreferences.getState().setHaptics(true);
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  const hold = () => { let release!: () => void; nextYield = new Promise<void>(resolve => { release = resolve; }); return release; };
  return { sqlite, repository, rows, hold };
}
beforeEach(() => {
  jest.clearAllMocks(); useCreationDraft.setState({ draft: null }); jest.replaceProperty(Platform, 'OS', 'ios');
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation(jest.fn().mockReturnValue({ remove: jest.fn() }));
  mockHaptic.mockResolvedValue(undefined); mockAndroidHaptic.mockResolvedValue(undefined); mockSound.mockResolvedValue(undefined);
});
afterEach(() => { jest.restoreAllMocks(); });

test('actual welcome, creation, modal and appearance controls pulse once for accepted changes, without sounds on selections or writes to a life', async () => {
  const context = await setup(false);
  try {
    const before = context.rows(), view = render(frame(<Welcome />));
    expect(screen.getByLabelText('Opening your saved lives')).toBeOnTheScreen(); expect(mockHaptic).not.toHaveBeenCalled();
    await act(async () => { await mockStore.getState().bootstrap(); });
    await pulse('button', 'Random Life'); expect(router.push).toHaveBeenLastCalledWith({ pathname: '/new-life', params: { seed: '42', mode: 'random' } });
    expect(screen.queryByRole('button', { name: 'Saved Lives' })).toBeNull(); await pulse('button', 'Help');
    const oldStart = pressHandler('Start New Life'); await pulse('button', 'Start New Life'); expect(router.push).toHaveBeenLastCalledWith({ pathname: '/new-life', params: { seed: '42', mode: 'custom' } });
    view.rerender(frame(<NewLife />));
    const calls = mockHaptic.mock.calls.length, navigation = jest.mocked(router.push).mock.calls.length;
    await act(async () => { oldStart(); }); expect(mockHaptic).toHaveBeenCalledTimes(calls); expect(router.push).toHaveBeenCalledTimes(navigation);
    fireEvent.changeText(screen.getByLabelText('First name'), 'Alex'); expect(mockHaptic).toHaveBeenCalledTimes(calls);
    await pulse('button', 'Next avatar'); await pulse('button', 'Previous avatar');
    const gender = useCreationDraft.getState().draft!.input.gender === 'female' ? 'Male' : 'Female';
    await pulse('radio', gender); const selected = mockHaptic.mock.calls.length; await press('radio', gender); expect(mockHaptic).toHaveBeenCalledTimes(selected);
    await pulse('button', /^Country\./); await pulse('radio', 'United Kingdom');
    const countrySelection = mockHaptic.mock.calls.length; await press('radio', 'United Kingdom'); expect(mockHaptic).toHaveBeenCalledTimes(countrySelection);
    await pulse('button', 'Choose'); expect(useCreationDraft.getState().draft!.input.country).toBe('GB');
    await pulse('button', /^More Options\./); await pulse('radio', useCreationDraft.getState().draft!.input.background === 'royal' ? /^Ordinary Family\./ : /^Royal Family\./);
    await pulse('checkbox', 'Men');
    const childBefore = mockHaptic.mock.calls.length, wantsChildren = useCreationDraft.getState().draft!.input.wantsChildren ?? true;
    await act(async () => { fireEvent(screen.getByRole('switch', { name: 'Would like children' }), 'valueChange', !wantsChildren); });
    expect(mockHaptic).toHaveBeenCalledTimes(childBefore + 1);
    const reproduction = useCreationDraft.getState().draft!.input.reproductiveRole;
    await pulse('radio', reproduction === 'neither' ? 'Can carry a pregnancy' : 'Neither');
    await pulse('button', 'Choose Appearance'); view.rerender(frame(<Appearance />));
    const avatar = screen.getAllByRole('radio', { name: /^Avatar \d+, / }).find(item => !item.props.accessibilityState.checked)!;
    await pulse('radio', avatar.props.accessibilityLabel);
    expect(screen.queryByRole('radiogroup', { name:'Face shape' })).toBeNull();
    await pulse('tab', 'Skin Tone');
    const skin = useCreationDraft.getState().draft!.input.appearance.skin;
    await pulse('radio', skin === 0 ? 'Skin tone 6, deep brown' : 'Skin tone 1, very light');
    await pulse('tab', 'Hair Style'); const hair = useCreationDraft.getState().draft!.input.appearance.hair;
    await pulse('radio', hairLabels[hair === 0 ? 1 : 0]);
    await pulse('tab', 'Hair Color'); const color = useCreationDraft.getState().draft!.input.appearance.hairColor;
    await pulse('radio', hairColorLabels[color === 0 ? 1 : 0]);
    await pulse('tab', 'Clothing');
    const appearance = useCreationDraft.getState().draft!.input.appearance;
    const outfit = (appearance.outfit ?? appearance.identity ?? 0) === 0 ? 1 : 0;
    await pulse('radio', outfitLabels[outfit]);
    const selectedOutfit = mockHaptic.mock.calls.length; await press('radio', outfitLabels[outfit]);
    expect(mockHaptic).toHaveBeenCalledTimes(selectedOutfit);
    expect(mockSound).not.toHaveBeenCalled(); expect(context.rows()).toEqual(before); expect(mockStore.getState().world).toBeNull();
    await act(async () => { await mockPreferences.getState().setSoundEffects(true); });
    await pulse('button', 'Continue'); expect(mockSound).toHaveBeenCalledTimes(1); expect(router.back).toHaveBeenCalledTimes(1);
    await pulse('button', 'Back'); expect(mockSound).toHaveBeenCalledTimes(1); expect(router.back).toHaveBeenCalledTimes(2);
    view.rerender(frame(<NewLife />)); await pulse('button', /^Random Life\./); expect(mockSound).toHaveBeenCalledTimes(1);
    await pulse('button', 'Roll Again'); await pulse('button', 'Customise This Life'); expect(mockSound).toHaveBeenCalledTimes(3); expect(mockStore.getState().world).toBeNull();
    view.unmount();
  } finally { context.sqlite.close(); }
});

test('real new-life and Age Up saves never wait for hardware, reject held duplicate taps, and honour the saved off preference and unmount', async () => {
  const context = await setup();
  try {
    mockHaptic.mockImplementation(() => new Promise<void>(() => {}));
    const view = render(frame(<NewLife />)), create = jest.spyOn(context.repository, 'create'), releaseCreation = context.hold(), start = pressHandler('Start My Life'), originalRows = context.rows();
    await act(async () => { start(); start(); });
    expect(mockHaptic).toHaveBeenCalledTimes(1); expect(mockStore.getState().busy).toBe(true); expect(context.rows()).toEqual(originalRows);
    await press('button', 'Next avatar'); expect(mockHaptic).toHaveBeenCalledTimes(1);
    await act(async () => { releaseCreation(); }); await waitFor(() => expect(mockStore.getState().world).not.toBeNull());
    expect(create).toHaveBeenCalledTimes(1); expect(router.replace).toHaveBeenCalledWith('/birth');
    await act(async () => { expect(await mockStore.getState().acknowledgeBirth()).toBe(true); });
    view.rerender(frame(<Life />)); const before = mockStore.getState().world!, beforeRows = context.rows(), advance = pressHandler('Age Up'), releaseYear = context.hold();
    mockHaptic.mockImplementation(() => { throw new Error('Haptic hardware unavailable'); });
    await act(async () => { advance(); advance(); });
    expect(mockHaptic).toHaveBeenCalledTimes(2); expect(mockStore.getState().busy).toBe(true); expect(context.rows()).toEqual(beforeRows);
    await act(async () => { releaseYear(); }); await waitFor(() => expect(mockStore.getState().busy).toBe(false));
    const saved = mockStore.getState().world!; expect(saved.revision).toBe(before.revision + 1); expect(saved.date).not.toEqual(before.date); expect(saved.pending).not.toBeNull();
    expect(context.rows().receipts).toHaveLength(beforeRows.receipts.length + 1);
    await act(async () => { advance(); }); expect(mockHaptic).toHaveBeenCalledTimes(2);
    await act(async () => { await mockPreferences.getState().setHaptics(false); });
    const settled = context.rows(), exactWorld = encodeWorld(saved);
    await press('button', /^My Life profile\./); expect(router.push).toHaveBeenLastCalledWith('/profile'); expect(mockHaptic).toHaveBeenCalledTimes(2);
    view.unmount(); await act(async () => { advance(); start(); });
    expect(mockHaptic).toHaveBeenCalledTimes(2); expect(encodeWorld(mockStore.getState().world!)).toBe(exactWorld); expect(context.rows()).toEqual(settled); expect(mockSound).not.toHaveBeenCalled();
  } finally { context.sqlite.close(); }
});
