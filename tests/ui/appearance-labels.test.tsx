import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { useCreationDraft } from '../../src/state/creationDraft';
import { avatarPresets } from '../../src/ui/CreationElements';
import { ThemeProvider } from '../../src/ui/theme';
import { decodeWorld, encodeWorld } from '../../src/game/model';
import graduate from '../fixtures/v3-employed-graduate.json';

let mockStore: ReturnType<typeof createGameStore>;
let mockRepository = jest.fn(async () => { throw new Error('Read-only component test'); });
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() }, Redirect: () => null }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import { router } from 'expo-router';
import Appearance from '../../app/appearance';
import Life from '../../app/(game)/(tabs)/life';

const frame = (child: React.ReactNode) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider>{child}</ThemeProvider></SafeAreaProvider>;
const press = async (role: 'radio' | 'tab' | 'button', name: string) => { await act(async () => { fireEvent.press(screen.getByRole(role, { name })); }); };
beforeEach(() => {
  jest.clearAllMocks(); useCreationDraft.setState({ draft: null }); useCreationDraft.getState().begin(42, 'custom');
  mockRepository = jest.fn(async () => { throw new Error('Read-only component test'); });
  mockStore = createGameStore({ repository: mockRepository, date: () => ({ year: 2026, month: 1, day: 1 }), id: () => 'unused' });
});

test('real presets describe distinct actual traits and retain the same selection, identity and single radio target', async () => {
  const draft = useCreationDraft.getState().draft!;
  useCreationDraft.getState().update({ ...draft.input, appearance: { ...avatarPresets[0] } });
  const original = structuredClone(useCreationDraft.getState().draft!.input);
  render(frame(<Appearance />));
  expect(screen.getAllByRole('radio', { name: /^Avatar \d+, / })).toHaveLength(16);
  expect(screen.getByRole('radio', { name: 'Avatar 1, oval face, medium skin tone, black side swept hair', checked: true })).toBeOnTheScreen();
  const seventh = 'Avatar 7, long face, very light skin tone, black shoulder length hair';
  expect(screen.getByRole('radio', { name: seventh, checked: false })).toBeOnTheScreen();
  expect(screen.queryAllByRole('image')).toHaveLength(0);
  await press('radio', seventh);
  expect(screen.getByRole('radio', { name: seventh, checked: true })).toBeOnTheScreen();
  expect(useCreationDraft.getState().draft!.input).toEqual({ ...original, appearance: avatarPresets[6] });
  await press('button', 'Continue'); expect(router.back).toHaveBeenCalledTimes(1);
});

test('all existing skin swatches have neutral descriptive labels bound to their unchanged actual palette index', async () => {
  render(frame(<Appearance />)); await press('tab', 'Skin Tone');
  const original = structuredClone(useCreationDraft.getState().draft!.input);
  for (const [index, label] of ['Skin tone 1, very light', 'Skin tone 2, light', 'Skin tone 3, medium', 'Skin tone 4, tan', 'Skin tone 5, brown', 'Skin tone 6, deep brown'].entries()) {
    await press('radio', label);
    expect(screen.getByRole('radio', { name: label, checked: true })).toBeOnTheScreen();
    expect(useCreationDraft.getState().draft!.input).toEqual({ ...original, appearance: { ...original.appearance, skin: index } });
  }
});

test('the custom first slot describes its actual face and hair; a bald preview never announces an invisible stored hair colour', async () => {
  const draft = useCreationDraft.getState().draft!;
  useCreationDraft.getState().update({ ...draft.input, appearance: { face: 3, skin: 5, hair: 7, hairColor: 4 } });
  render(frame(<Appearance />));
  expect(screen.getByRole('radio', { name: 'Avatar 1, broad face, deep brown skin tone, auburn coily afro', checked: true })).toBeOnTheScreen();
  await press('tab', 'Hair Style'); await press('radio', 'Bald'); await press('tab', 'Avatars');
  expect(screen.getByRole('radio', { name: 'Avatar 1, broad face, deep brown skin tone, bald', checked: true })).toBeOnTheScreen();
  expect(useCreationDraft.getState().draft!.input.appearance).toEqual({ face: 3, skin: 5, hair: 0, hairColor: 4 });
  expect(screen.queryAllByRole('image')).toHaveLength(0);
});

test('the genuine employed Life header exposes its actual visible identity, role, age and cash without duplicate portrait focus or a save', async () => {
  const world = decodeWorld(JSON.stringify(graduate)), original = encodeWorld(world);
  mockStore.setState({ world }); render(frame(<Life />));
  const label = 'My Life profile. Leonardo Ricci. Age 23. Software Developer. Bank balance $45,660.00';
  expect(screen.getByRole('button', { name: label })).toBeOnTheScreen();
  expect(screen.getByText('$45,660.00')).toBeOnTheScreen();
  expect(screen.queryByRole('image', { name: 'Leonardo Ricci' })).toBeNull();
  await press('button', label); expect(router.push).toHaveBeenCalledWith('/profile');
  expect(encodeWorld(mockStore.getState().world!)).toBe(original);
  expect(mockRepository).not.toHaveBeenCalled();
});
