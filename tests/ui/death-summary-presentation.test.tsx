import React from 'react';
import * as Native from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { router } from 'expo-router';
import { ageOn, decodeWorld, encodeWorld, fullName, type World } from '../../src/game/model';
import { recordDeath } from '../../src/game/engine';
import { otherPerson, partnerRelation } from '../../src/game/systems/relationshipQueries';
import { deathSummary } from '../../src/ui/deathSummary';
import { ThemeProvider } from '../../src/ui/theme';
import family from '../fixtures/v6-birth-result.json';

let mockWorld: World, mockParams: Record<string, string> = {};
const mockDispatch = jest.fn();
jest.mock('expo-router', () => ({ Redirect: () => null, useLocalSearchParams: () => mockParams,
  useFocusEffect: (effect: () => void) => require('react').useEffect(effect, [effect]), router: { push: jest.fn(), back: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: (state: unknown) => unknown) => selector({ world: mockWorld, busy: false, error: null, dispatch: mockDispatch }), freshSeed: () => 12345 }));
jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = require('react'), { Text } = require('react-native');
  const glyphs = require('@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json');
  return ({ name, size, color, ...props }: any) => <Text {...props} allowFontScaling={false} style={{ fontFamily: 'Ionicons', fontSize: size, color }}>{String.fromCodePoint(glyphs[name])}</Text>;
});
import Death from '../../app/death';
import FamilyHistory from '../../app/family-history';
import LifeSummary from '../../app/life-summary';

function capture(name: string, tree: unknown) {
  const directory = process.env.DREAMS_POLISH_CAPTURE_DIR;
  if (!directory) return;
  const clean = (node: any): any => Array.isArray(node) ? node.map(clean) : !node || typeof node !== 'object' ? node : ({
    type: node.type, props: { style: Native.StyleSheet.flatten(node.props?.style), source: node.props?.source,
      contentContainerStyle: Native.StyleSheet.flatten(node.props?.contentContainerStyle), edges: node.props?.edges,
      accessibilityRole: node.props?.accessibilityRole, accessibilityLabel: node.props?.accessibilityLabel,
      allowFontScaling: node.props?.allowFontScaling, resizeMode: node.props?.resizeMode }, children: node.children?.map(clean) });
  mkdirSync(directory, { recursive: true }); writeFileSync(join(directory, name + '.json'), JSON.stringify(clean(tree)));
}
afterEach(() => { jest.restoreAllMocks(); jest.clearAllMocks(); mockParams = {}; });

test.each([false, true])('memorial summary, child continuation and read-only family history preserve facts and routes (dark=%s)', dark => {
  mockWorld = decodeWorld(JSON.stringify(family));
  const person = mockWorld.people[mockWorld.activePersonId], spouse = otherPerson(mockWorld, partnerRelation(mockWorld)!);
  const childId = mockWorld.relationships.find(edge => edge.from === person.id && edge.roles.includes('parent'))!.to;
  // Explicit mortality boundary on a real saved family; no new history is earned.
  recordDeath(mockWorld, person.id, 'Declared memorial presentation boundary');
  const original = encodeWorld(mockWorld), expected = deathSummary(mockWorld)!, width = dark ? 320 : 390;
  jest.spyOn(Native, 'useWindowDimensions').mockReturnValue({ width, height: 844, scale: 2, fontScale: dark ? 1.4 : 1 });
  const frame = (child: React.ReactNode) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider appearance={dark ? 'dark' : 'light'}>{child}</ThemeProvider></SafeAreaProvider>;
  const suffix = dark ? 'dark-large' : 'light', view = render(frame(<Death />));
  expect(screen.getByRole('header', { name: 'Life at a Glance' })).toBeOnTheScreen();
  expect(screen.getByText(expected.summary)).toBeOnTheScreen(); expect(screen.getByText(expected.epitaph)).toBeOnTheScreen();
  expect(screen.getByText('Cause of death: ' + person.causeOfDeath)).toBeOnTheScreen();
  for (const row of expected.rows) expect(screen.getByLabelText(row.label + ': ' + row.value)).toBeOnTheScreen();
  expect(screen.getByRole('progressbar', { name: 'Final happiness' })).toHaveAccessibilityValue({ min: 0, max: 100, now: person.stats.happiness });
  capture('death-summary-' + suffix, view.toJSON());
  fireEvent.press(screen.getByRole('button', { name: 'Continue as Child' })); expect(router.push).toHaveBeenLastCalledWith('/legacy');
  fireEvent.press(screen.getByRole('button', { name: 'Family Tree' })); expect(router.push).toHaveBeenLastCalledWith('/family-history');
  view.rerender(frame(<FamilyHistory />));
  expect(screen.getByText('Family history · Read-only')).toBeOnTheScreen();
  const sections = screen.getAllByRole('header').map(item => item.props.children).filter(label => ['Parents & Guardians', 'You & Your Partners', 'Children & Dependants'].includes(label));
  expect(sections).toEqual(['Parents & Guardians', 'You & Your Partners', 'Children & Dependants']);
  const spouseLabel = fullName(spouse) + '. Spouse at death · Age ' + ageOn(spouse, mockWorld.date);
  expect(screen.getAllByRole('button', { name: spouseLabel })).toHaveLength(1);
  capture('family-history-' + suffix, view.toJSON());
  fireEvent.press(screen.getByRole('button', { name: spouseLabel }));
  expect(router.push).toHaveBeenLastCalledWith({ pathname: '/life-summary', params: { id: spouse.id, readOnly: '1' } });
  const child = mockWorld.people[childId];
  fireEvent.press(screen.getByRole('button', { name: fullName(child) + '. Child · Age ' + ageOn(child, mockWorld.date) }));
  expect(router.push).toHaveBeenLastCalledWith({ pathname: '/life-summary', params: { id: child.id, readOnly: '1' } });
  mockParams = { id: child.id, readOnly: '1' }; view.rerender(frame(<LifeSummary />));
  expect(screen.getByText('Saved life · Read-only')).toBeOnTheScreen(); expect(screen.queryByRole('button', { name: 'Time Machine' })).toBeNull();
  expect(encodeWorld(mockWorld)).toBe(original); expect(mockDispatch).not.toHaveBeenCalled();
  mockParams = {}; mockWorld = decodeWorld(original); view.rerender(frame(<FamilyHistory />));
  expect(screen.getByRole('button', { name: spouseLabel })).toBeOnTheScreen();
  expect(encodeWorld(mockWorld)).toBe(original); expect(mockDispatch).not.toHaveBeenCalled(); view.unmount();
});
