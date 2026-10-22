import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { copyWorld, decodeWorld, encodeWorld, type World } from '../../src/game/model';
import { createLife, randomCreation } from '../../src/game/createLife';
import { createContact } from '../../src/game/systems/npcs';
import { ThemeProvider } from '../../src/ui/theme';
import { bindEvent, eventTemplates } from '../../src/game/content/events';
import graduate from '../fixtures/v3-employed-graduate.json';
import { resolveCommand } from '../../src/game/engine';
import { rentalQuote } from '../../src/game/systems/rentalHomes';
import { assetCatalog } from '../../src/game/content/assets';
import { accountFor } from '../../src/game/systems/common';
import { petAdoptionFee, petMonth } from '../../src/game/systems/pets';
import { monthFrom } from '../../src/game/calendar';

let mockWorld: World;
const mockDispatch = jest.fn(), mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (...args: unknown[]) => mockPush(...args), back: jest.fn() }, useLocalSearchParams: () => ({}) }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: (s: unknown) => unknown) => selector({ world: mockWorld, busy: false, error: null, dispatch: mockDispatch, clearError: jest.fn() }) }));
jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = require('react'), { Text } = require('react-native');
  const glyphs = require('@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json');
  return ({ name, size, color, style, ...props }: any) => <Text {...props} allowFontScaling={false} style={[{ fontFamily: 'Ionicons', fontSize: size, color }, style]}>{String.fromCodePoint(glyphs[name] || glyphs['ellipse-outline'])}</Text>;
});
import Activities from '../../app/(game)/(tabs)/activities';
import Assets from '../../app/(game)/(tabs)/assets';
import Life from '../../app/(game)/(tabs)/life';
import Rentals from '../../app/(game)/rentals';
import { PendingEvent } from '../../src/ui/PendingEvent';

function capture(name: string, tree: unknown) {
  const directory = process.env.DREAMS_POLISH_CAPTURE_DIR;
  if (!directory) return;
  const clean = (node: any): any => Array.isArray(node) ? node.map(clean) : !node || typeof node !== 'object' ? node : ({
    type: node.type, props: { style: StyleSheet.flatten(node.props?.style), source: node.props?.source,
      svg: node.type?.startsWith('RNSVG') ? Object.fromEntries(['d', 'name', 'clipPath', 'matrix', 'x', 'y', 'width', 'height', 'minX', 'minY', 'vbWidth', 'vbHeight', 'src', 'align'].filter(key => node.props?.[key] !== undefined).map(key => [key, node.props[key]])) : undefined,
      contentContainerStyle: StyleSheet.flatten(node.props?.contentContainerStyle), edges: node.props?.edges,
      accessibilityRole: node.props?.accessibilityRole, accessibilityLabel: node.props?.accessibilityLabel,
      allowFontScaling: node.props?.allowFontScaling, resizeMode: node.props?.resizeMode,
      placeholder: node.props?.placeholder, value: node.props?.value }, children: node.children?.map(clean) });
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, name + '.json'), JSON.stringify(clean(tree)));
}

afterEach(() => jest.restoreAllMocks());

test('Activities, Assets and saved event presentations remain read-only in light and small dark layouts', () => {
  mockWorld = decodeWorld(JSON.stringify(graduate));
  const original = encodeWorld(mockWorld);
  for (const dark of [false, true]) {
    const width = dark ? 320 : 390, fontScale = dark ? 1.4 : 1;
    jest.spyOn(require('react-native'), 'useWindowDimensions').mockReturnValue({ width, height: 844, scale: 2, fontScale });
    const frame = (child: React.ReactNode) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider appearance={dark ? 'dark' : 'light'}>{child}</ThemeProvider></SafeAreaProvider>;
    const suffix = dark ? 'dark-large' : 'light';
    const view = render(frame(<Activities />));
    expect(screen.getByRole('header', { name: 'Activities' })).toBeOnTheScreen();
    for (const title of ['Family', 'Health', 'Travel', 'Saved Lives', 'Settings']) expect(screen.getByText(title)).toBeOnTheScreen();
    capture('activities-' + suffix, view.toJSON());
    view.rerender(frame(<Assets />));
    expect(screen.getByRole('header', { name: 'Assets' })).toBeOnTheScreen();
    expect(screen.getByText('Net worth')).toBeOnTheScreen();
    capture('assets-' + suffix, view.toJSON());
    expect(encodeWorld(mockWorld)).toBe(original);
    for (const id of ['shoe-principle', 'friend-different-budget', 'partner-alone-time']) {
      mockWorld = id === 'shoe-principle' ? createLife('life_preview', 42, randomCreation(42), { year: 2026, month: 10, day: 22 }) : decodeWorld(original);
      if (id === 'shoe-principle') mockWorld.people[mockWorld.activePersonId].born.year -= 3;
      else {
        const kind = id.startsWith('friend-') ? 'friend' : 'partner';
        const contact = createContact(mockWorld, { age: 27, gender: 'female' });
        mockWorld.relationships.push({ id: 'relation_preview_' + kind, from: mockWorld.activePersonId, to: contact.id, kind, roles: [kind], romance: kind === 'partner' ? 'dating' : 'none', since: { ...mockWorld.date }, parentType: null, strength: 80, trust: 80, memories: [], lastInteractionYear: mockWorld.date.year });
      }
      const template = eventTemplates.find(template => template.id === id)!;
      mockWorld.pending = bindEvent(mockWorld, template);
      const frozen = encodeWorld(mockWorld);
      view.rerender(frame(<PendingEvent />));
      expect(screen.getByRole('header', { name: template.title })).toBeOnTheScreen();
      capture('event-' + id + '-' + suffix, view.toJSON());
      expect(encodeWorld(mockWorld)).toBe(frozen);
    }
    mockWorld.pending = { id: 'pet_death_review', kind: 'result', title: 'Goodbye, Biscuit', body: 'Biscuit died peacefully. The house feels quieter.', illustration: 'pet-paw', effects: [] };
    view.rerender(frame(<PendingEvent />));
    capture('event-pet-memorial-' + suffix, view.toJSON());
    // A newly delivered memorial is generated by the real pet lifecycle;
    // the preceding legacy result remains a separate save-compatibility case.
    mockWorld = decodeWorld(original);
    mockWorld = resolveCommand(mockWorld, { type: 'adopt-pet', offerId: 'buddy', reviewedOwnerId: mockWorld.activePersonId, name: 'Biscuit', quotedFee: petAdoptionFee(mockWorld, 'buddy') }, true);
    mockWorld = resolveCommand(mockWorld, { type: 'acknowledge', resultId: mockWorld.pending!.id }, true);
    mockWorld = copyWorld(mockWorld);
    mockWorld.pets[0].health = 1; mockWorld.pets[0].illness = 'infection';
    mockWorld.date = monthFrom(mockWorld.date, 1); petMonth(mockWorld);
    expect(mockWorld.pending).toMatchObject({ kind: 'result', title: 'Goodbye, Biscuit', illustration: 'pet-memorial' });
    const memorial = encodeWorld(mockWorld);
    view.rerender(frame(<PendingEvent />));
    capture('event-new-pet-memorial-' + suffix, view.toJSON());
    expect(encodeWorld(mockWorld)).toBe(memorial);
    view.unmount();
    mockWorld = decodeWorld(original);
    jest.restoreAllMocks();
  }
  expect(mockDispatch).not.toHaveBeenCalled();
});

test.each(['android', 'ios'] as const)('a leased residence is visible without joining owned property on %s, including narrow and large text', platform => {
  jest.replaceProperty(Platform, 'OS', platform);
  mockWorld = decodeWorld(JSON.stringify(graduate));
  const account = accountFor(mockWorld); account.cash += 100000000n; account.openingCash += 100000000n;
  const offer = assetCatalog.find(offer => offer.id === 'studio')!;
  mockWorld = resolveCommand(mockWorld, { type: 'sign-home-lease', catalogId: offer.id, quotedRent: rentalQuote(mockWorld, offer).monthlyRent }, true);
  const original = encodeWorld(mockWorld), owned = mockWorld.assets.length;
  for (const dark of [false, true]) {
    const width = dark ? 320 : 390;
    jest.spyOn(require('react-native'), 'useWindowDimensions').mockReturnValue({ width, height: 844, scale: 2, fontScale: dark ? 1.4 : 1 });
    const frame = (child: React.ReactNode) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width, height: 844 }, insets: { top: platform === 'ios' ? 47 : 24, bottom: 34, left: 0, right: 0 } }}><ThemeProvider appearance={dark ? 'dark' : 'light'}>{child}</ThemeProvider></SafeAreaProvider>;
    const view = render(frame(<Assets />));
    expect(screen.getByText('Your Residence')).toBeOnTheScreen();
    expect(screen.getByText(/Rented home ·/)).toBeOnTheScreen();
    expect(screen.getByText('No property owned.')).toBeOnTheScreen();
    expect(screen.UNSAFE_getByType(KeyboardAvoidingView).props.behavior).toBe(platform === 'ios' ? 'padding' : 'height');
    fireEvent.press(screen.getByRole('button', { name: /Rent a Home/ }));
    expect(mockPush).toHaveBeenLastCalledWith('/rentals');
    capture('rented-assets-' + platform + '-' + (dark ? 'dark-large' : 'light'), view.toJSON());
    view.rerender(frame(<Rentals />));
    expect(screen.getByRole('header', { name: 'Rent a Home' })).toBeOnTheScreen();
    capture('rentals-' + platform + '-' + (dark ? 'dark-large' : 'light'), view.toJSON());
    view.rerender(frame(<Life />));
    expect(screen.getByText('Home: ' + offer.name)).toBeOnTheScreen();
    view.unmount();
    expect(mockWorld.assets).toHaveLength(owned);
    expect(encodeWorld(mockWorld)).toBe(original);
  }
});
