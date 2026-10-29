import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { decodeWorld, encodeWorld, type World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { partnerRelation, otherPerson } from '../../src/game/systems/relationships';
import { addCondition } from '../../src/game/systems/health';
import { accountFor } from '../../src/game/systems/common';
import { SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';
import { captureFinalPolish } from '../support/finalPolishCapture';
import { ThemeProvider } from '../../src/ui/theme';
import married from '../fixtures/v5-marriage-result.json';
import graduate from '../fixtures/v3-employed-graduate.json';

let mockStore: ReturnType<typeof createGameStore>, mockRoute: { id?: string; kind?: string } = {};
const mockNavigate = jest.fn();
jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn(), navigate: (...args: unknown[]) => mockNavigate(...args), dismissTo: (...args: unknown[]) => mockNavigate(...args) },
  useLocalSearchParams: () => mockRoute,
}));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = require('react'), { Text } = require('react-native');
  const glyphs = require('@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json');
  return ({ name, size, color, style, ...props }: any) => <Text {...props} allowFontScaling={false} style={[{ fontFamily: 'Ionicons', fontSize: size, color }, style]}>{String.fromCodePoint(glyphs[name] || glyphs['ellipse-outline'])}</Text>;
});
import PersonProfile from '../../app/(game)/person/[id]';
import Family from '../../app/(game)/family';
import Service from '../../app/(game)/service/[kind]';
import Doctor from '../../app/(game)/doctor';
import Condition from '../../app/(game)/condition/[id]';
import Assets from '../../app/(game)/(tabs)/assets';
import { AssetOfferPage } from '../../src/ui/AssetOfferDetails';
import { PendingEvent } from '../../src/ui/PendingEvent';

function prepared(couple = false) {
  let world = decodeWorld(JSON.stringify(couple ? married : graduate));
  while (world.pending?.kind === 'result') world = resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
  const account = accountFor(world); account.cash += 1000000000n; account.openingCash += 1000000000n;
  return world;
}
async function boot(world: World) {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver);
  await repository.initialise(); await repository.create(world);
  mockStore = createGameStore({ repository: async () => repository, date: () => world.date, id: () => 'life_visual_unused' });
  expect(await mockStore.getState().bootstrap()).toBe(true);
  return { sqlite, repository };
}
const frame = (content: React.ReactNode, dark: boolean) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: dark ? 320 : 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider appearance={dark ? 'dark' : 'light'}>{content}<PendingEvent /></ThemeProvider></SafeAreaProvider>;
afterEach(() => jest.restoreAllMocks());

test.each([false, true])('final polish production screens produce read-only review trees, dark/large=%s', async dark => {
  jest.spyOn(require('react-native'), 'useWindowDimensions').mockReturnValue({ width: dark ? 320 : 390, height: 844, scale: 2, fontScale: dark ? 1.4 : 1 });
  const suffix = dark ? 'dark-large' : 'light';
  for (const name of ['partner-ready', 'partner-discuss', 'family', 'family-unavailable', 'astronaut-requirement', 'doctor', 'condition-undiagnosed'] as const) {
    const world = prepared(['partner-ready', 'partner-discuss', 'family'].includes(name));
    let content: React.ReactNode;
    if (name.startsWith('partner')) {
      const partner = otherPerson(world, partnerRelation(world)!); partner.wantsChildren = name === 'partner-ready';
      world.people[world.activePersonId].wantsChildren = true; mockRoute = { id: partner.id }; content = <PersonProfile />;
    } else if (name.startsWith('family')) { mockRoute = {}; content = <Family />; }
    else if (name === 'astronaut-requirement') { mockRoute = { kind: 'astronaut' }; content = <Service />; }
    else if (name === 'doctor') { mockRoute = {}; content = <Doctor />; }
    else { const condition = addCondition(world, world.people[world.activePersonId], 'diabetes', 55); mockRoute = { id: condition.id }; content = <Condition />; }
    const { sqlite } = await boot(world), before = encodeWorld(mockStore.getState().world!);
    const view = render(frame(content, dark));
    captureFinalPolish(name + '-' + suffix, view.toJSON(), mockStore.getState().world!);
    expect(encodeWorld(mockStore.getState().world!)).toBe(before);
    view.unmount(); sqlite.close();
  }
});

test.each([false, true])('purchase review and its saved result use actual production trees, dark/large=%s', async dark => {
  jest.spyOn(require('react-native'), 'useWindowDimensions').mockReturnValue({ width: dark ? 320 : 390, height: 844, scale: 2, fontScale: dark ? 1.4 : 1 });
  mockNavigate.mockClear(); mockRoute = { id: 'studio' };
  const { sqlite, repository } = await boot(prepared()), suffix = dark ? 'dark-large' : 'light';
  const offer = <AssetOfferPage id="studio" />;
  const view = render(frame(offer, dark));
  await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Review Purchase' })); });
  captureFinalPolish('purchase-confirm-' + suffix, view.toJSON(), mockStore.getState().world!);
  await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Confirm Purchase' })); });
  await waitFor(() => expect(mockStore.getState().world!.assets.some(asset => asset.catalogId === 'studio')).toBe(true));
  const saved = mockStore.getState().world!;
  expect(await repository.load(saved.id)).toEqual(saved);
  if (mockNavigate.mock.calls.length) view.rerender(frame(<Assets />, dark));
  captureFinalPolish('purchase-saved-context-' + suffix, view.toJSON(), saved);
  expect(saved.pending?.kind).toBe('result');
  view.unmount(); sqlite.close();
});
