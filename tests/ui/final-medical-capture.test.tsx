import React from 'react';
import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { decodeWorld, encodeWorld, type World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { decodeSave } from '../../src/persistence/archive';
import { addCondition } from '../../src/game/systems/health';
import { post } from '../../src/game/systems/common';
import { SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';
import { captureFinalPolish } from '../support/finalPolishCapture';
import { medicalEpisodeScenarios } from '../support/medicalEpisodes';
import { ThemeProvider } from '../../src/ui/theme';
import graduate from '../fixtures/v3-employed-graduate.json';
import oldMedical from '../fixtures/v8-medical-archive.json';
let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = require('react'), { Text } = require('react-native');
  const glyphs = require('@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json');
  return ({ name, size, color, style, ...props }: any) => <Text {...props} allowFontScaling={false} style={[{ fontFamily: 'Ionicons', fontSize: size, color }, style]}>{String.fromCodePoint(glyphs[name] || glyphs['ellipse-outline'])}</Text>;
});
import Doctor from '../../app/(game)/doctor';
import { PendingEvent } from '../../src/ui/PendingEvent';

function urgentScenario() {
  const world = decodeWorld(JSON.stringify(graduate));
  post(world, 2_000_000n, 0n, 'fixture-medical-budget', 'Declared test care budget');
  addCondition(world, world.people[world.activePersonId], 'asthma', 95);
  return resolveCommand(world, { type: 'advance' }, true);
}
afterEach(() => jest.restoreAllMocks());
test.each([false, true])('actual urgent and archived medical popup trees, dark/large=%s', async dark => {
  jest.spyOn(require('react-native'), 'useWindowDimensions').mockReturnValue({ width: dark ? 320 : 390, height: 844, scale: 2, fontScale: dark ? 1.4 : 1 });
  for (const [name, initial] of [['medical-urgent', urgentScenario()], ['medical-legacy', decodeSave(JSON.stringify(oldMedical)).world]] as const) {
    expect(initial.pending).toBeTruthy();
    const { sqlite, driver } = database(), repository = new SaveRepository(driver);
    await repository.initialise(); await repository.create(initial);
    mockStore = createGameStore({ repository: async () => repository, date: () => initial.date, id: () => 'life_medical_visual_unused' });
    expect(await mockStore.getState().bootstrap()).toBe(true);
    const world: World = mockStore.getState().world!, before = encodeWorld(world);
    const view = render(<SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: dark ? 320 : 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider appearance={dark ? 'dark' : 'light'}><Doctor /><PendingEvent /></ThemeProvider></SafeAreaProvider>);
    captureFinalPolish(name + '-' + (dark ? 'dark-large' : 'light'), view.toJSON(), world);
    expect(encodeWorld(mockStore.getState().world!)).toBe(before);
    view.unmount(); sqlite.close();
  }
});

test.each([false, true])('new symptom, diagnosis and treatment trees use actual episode commands, dark/large=%s', async dark => {
  jest.spyOn(require('react-native'), 'useWindowDimensions').mockReturnValue({ width: dark ? 320 : 390, height: 844, scale: 2, fontScale: dark ? 1.4 : 1 });
  const scenarios = medicalEpisodeScenarios();
  for (const [name, initial] of [['medical-symptoms', scenarios.symptoms], ['medical-diagnosis', scenarios.diagnosis], ['medical-treatment', scenarios.treated]] as const) {
    const { sqlite, driver } = database(), repository = new SaveRepository(driver);
    await repository.initialise(); await repository.create(initial);
    mockStore = createGameStore({ repository: async () => repository, date: () => initial.date, id: () => 'life_episode_visual_unused' });
    expect(await mockStore.getState().bootstrap()).toBe(true);
    const before = encodeWorld(mockStore.getState().world!);
    const view = render(<SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: dark ? 320 : 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider appearance={dark ? 'dark' : 'light'}><Doctor /><PendingEvent /></ThemeProvider></SafeAreaProvider>);
    captureFinalPolish(name + '-' + (dark ? 'dark-large' : 'light'), view.toJSON(), mockStore.getState().world!);
    expect(encodeWorld(mockStore.getState().world!)).toBe(before);
    view.unmount(); sqlite.close();
  }
});
