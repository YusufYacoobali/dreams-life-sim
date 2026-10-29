import React from 'react';
import * as Native from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { assetCatalog } from '../../src/game/content/assets';
import { copyWorld, decodeWorld, encodeWorld, type World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { assetPrice } from '../../src/game/systems/assets';
import { accountFor } from '../../src/game/systems/common';
import { AssetFeatures, AssetListing } from '../../src/ui/AssetFeatures';
import { assetFeatures } from '../../src/ui/assetFeatureData';
import { ThemeProvider } from '../../src/ui/theme';
import graduate from '../fixtures/v3-employed-graduate.json';

let mockWorld: World, mockRoute = { id: 'studio', kind: 'property' };
const mockDispatch = jest.fn(), mockPush = jest.fn();
jest.mock('expo-router', () => ({ useLocalSearchParams: () => mockRoute, router: { push: (...args: unknown[]) => mockPush(...args), back: jest.fn(), navigate: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: (state: unknown) => unknown) => selector({ world: mockWorld, busy: false, error: null, dispatch: mockDispatch }) }));
jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = require('react'), { Text } = require('react-native');
  const glyphs = require('@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json');
  return ({ name, size, color, ...props }: any) => <Text {...props} allowFontScaling={false} style={{ fontFamily: 'Ionicons', fontSize: size, color }}>{String.fromCodePoint(glyphs[name])}</Text>;
});
import Shopping from '../../app/(game)/shopping/[kind]';
import Offer from '../../app/(game)/offer/[id]';
import OwnedAsset from '../../app/(game)/asset/[id]';
import Rentals from '../../app/(game)/rentals';
import Rental from '../../app/(game)/rental/[id]';

const funded = () => {
  const world = decodeWorld(JSON.stringify(graduate)), account = accountFor(world);
  account.cash += 1_000_000_000n; account.openingCash += 1_000_000_000n;
  return world;
};
function purchase(world: World, id: string) {
  const offer = assetCatalog.find(item => item.id === id)!;
  const bought = resolveCommand(world, { type: 'buy-asset', catalogId: id, financing: 'cash', depositBps: 10000, termMonths: 360, quotedPrice: assetPrice(world, offer) }, true);
  return resolveCommand(bought, { type: 'acknowledge', resultId: bought.pending!.id }, true);
}
function capture(name: string, tree: unknown) {
  const directory = process.env.DREAMS_POLISH_CAPTURE_DIR;
  if (!directory) return;
  const clean = (node: any): any => Array.isArray(node) ? node.map(clean) : !node || typeof node !== 'object' ? node : ({
    type: node.type, props: { style: Native.StyleSheet.flatten(node.props?.style), source: node.props?.source,
      contentContainerStyle: Native.StyleSheet.flatten(node.props?.contentContainerStyle), edges: node.props?.edges,
      accessibilityRole: node.props?.accessibilityRole, accessibilityLabel: node.props?.accessibilityLabel,
      allowFontScaling: node.props?.allowFontScaling, resizeMode: node.props?.resizeMode }, children: node.children?.map(clean) });
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, name + '.json'), JSON.stringify(clean(tree)));
}
afterEach(() => { jest.restoreAllMocks(); mockDispatch.mockReset(); mockPush.mockReset(); });

test('all forty listings have varied, plausible specifications without changing saved asset data', () => {
  const homes = assetCatalog.filter(offer => offer.kind === 'property'), vehicles = assetCatalog.filter(offer => offer.kind === 'vehicle');
  expect(homes).toHaveLength(20); expect(vehicles).toHaveLength(20);
  for (const home of homes) {
    expect(home.bedrooms).toBeGreaterThanOrEqual(1);
    expect(home.bathrooms).toBeGreaterThanOrEqual(1); expect(home.bathrooms).toBeLessThanOrEqual(home.bedrooms! + 1);
    expect(home.bathrooms! * 2 % 1).toBe(0);
    expect(Number.isSafeInteger(home.squareFeet)).toBe(true);
    expect(home.squareFeet).toBeGreaterThanOrEqual(300); expect(home.squareFeet).toBeLessThanOrEqual(15000);
  }
  expect(new Set(homes.map(home => [home.bedrooms, home.bathrooms, home.squareFeet].join(':'))).size).toBe(20);
  for (const vehicle of vehicles) {
    expect(Number(vehicle.rangeMiles !== undefined) + Number(vehicle.fuelEconomyMpg !== undefined)).toBe(1);
    expect(vehicle.rangeMiles ?? vehicle.fuelEconomyMpg).toBeGreaterThan(0);
    expect(vehicle.topSpeedMph).toBeGreaterThanOrEqual(40); expect(vehicle.topSpeedMph).toBeLessThanOrEqual(220);
    expect(Number.isSafeInteger(vehicle.listingMileage)).toBe(true); expect(vehicle.listingMileage).toBeGreaterThanOrEqual(0);
    if (vehicle.id.startsWith('used-')) expect(vehicle.listingMileage).toBeGreaterThan(0);
  }
  expect(new Set(vehicles.map(vehicle => [vehicle.fuelEconomyMpg, vehicle.rangeMiles, vehicle.topSpeedMph, vehicle.listingMileage].join(':'))).size).toBe(20);
  const world = purchase(funded(), 'used-compact'), cold = decodeWorld(encodeWorld(world));
  expect(cold.assets).toEqual(world.assets);
  for (const field of ['bathrooms', 'squareFeet', 'fuelEconomyMpg', 'rangeMiles', 'topSpeedMph', 'listingMileage']) expect(cold.assets[0]).not.toHaveProperty(field);
  expect(assetFeatures(assetCatalog.find(offer => offer.id === 'electric-car')!).map(feature => feature.label)).toEqual(['Top Speed', 'Mileage', 'Condition']);
  expect(assetFeatures(assetCatalog.find(offer => offer.id === 'electric-car')!).map(feature => feature.label)).not.toContain('MPG (US)');
});

test.each([false, true])('browse, offer and lease screens share feature values without mutating the life (dark=%s)', dark => {
  mockWorld = funded(); mockRoute = { id: 'studio', kind: 'property' };
  const original = encodeWorld(mockWorld), width = dark ? 320 : 390;
  jest.spyOn(require('react-native'), 'useWindowDimensions').mockReturnValue({ width, height: 844, scale: 2, fontScale: dark ? 1.4 : 1 });
  const frame = (child: React.ReactNode) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider appearance={dark ? 'dark' : 'light'}>{child}</ThemeProvider></SafeAreaProvider>;
  const suffix = dark ? 'dark-large' : 'light', view = render(frame(<Shopping />));
  expect(screen.UNSAFE_getAllByType(AssetListing)).toHaveLength(20);
  const home = screen.getByRole('button', { name: /City Studio.*Buy .*Rent .*month.*Beds: 1.*Baths: 1.*Sq ft: 420/ });
  capture('asset-property-list-' + suffix, view.toJSON());
  fireEvent.press(home); expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/offer/[id]', params: { id: 'studio' } });
  view.rerender(frame(<Offer />));
  for (const label of ['Beds: 1', 'Baths: 1', 'Sq ft: 420']) expect(screen.getByLabelText(label)).toBeOnTheScreen();
  expect(screen.getByLabelText('Beds: 1')).toHaveStyle({ flexBasis: dark ? '46%' : '30%' });
  capture('asset-property-offer-' + suffix, view.toJSON());
  mockRoute = { id: 'used-compact', kind: 'vehicle' }; view.rerender(frame(<Shopping />));
  expect(screen.UNSAFE_getAllByType(AssetListing)).toHaveLength(20);
  expect(screen.getByRole('button', { name: /Electric Sedan.*Top Speed: .*Mileage: .*Condition: 100%/ })).toBeOnTheScreen();
  capture('asset-vehicle-list-' + suffix, view.toJSON());
  view.rerender(frame(<Offer />));
  for (const label of ['Top Speed: 102 mph', 'Mileage: 68,000 mi. Listing reading', 'Condition: 65%']) expect(screen.getByLabelText(label)).toBeOnTheScreen();
  capture('asset-vehicle-offer-' + suffix, view.toJSON());
  mockRoute = { id: 'studio', kind: 'property' }; view.rerender(frame(<Rentals />));
  expect(screen.UNSAFE_getAllByType(AssetListing)).toHaveLength(20);
  fireEvent.press(screen.getByRole('button', { name: /City Studio.*Buy .*Rent .*month.*Beds: 1.*Baths: 1.*Sq ft: 420/ }));
  expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/offer/[id]', params: { id: 'studio', method: 'rent' } });
  capture('asset-rental-list-' + suffix, view.toJSON());
  view.rerender(frame(<Rental />));
  for (const label of ['Beds: 1', 'Baths: 1', 'Sq ft: 420']) expect(screen.getByLabelText(label)).toBeOnTheScreen();
  capture('asset-rental-details-' + suffix, view.toJSON());
  expect(mockDispatch).not.toHaveBeenCalled(); expect(encodeWorld(mockWorld)).toBe(original);
  view.unmount();
});

test.each([false, true])('owned assets retain listing specs, use actual condition and survive a cold save (dark=%s)', dark => {
  // Commands return frozen production worlds. Configure wear on a mutable copy.
  mockWorld = copyWorld(purchase(purchase(funded(), 'used-compact'), 'family-house'));
  const car = mockWorld.assets.find(asset => asset.catalogId === 'used-compact')!;
  car.condition = 37;
  expect(car.condition).toBe(37);
  mockWorld = decodeWorld(encodeWorld(mockWorld));
  expect(mockWorld.assets.find(asset => asset.id === car.id)!.condition).toBe(37);
  const original = encodeWorld(mockWorld), width = dark ? 320 : 390;
  jest.spyOn(require('react-native'), 'useWindowDimensions').mockReturnValue({ width, height: 844, scale: 2, fontScale: dark ? 1.4 : 1 });
  const frame = (child: React.ReactNode) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider appearance={dark ? 'dark' : 'light'}>{child}</ThemeProvider></SafeAreaProvider>;
  mockRoute = { id: car.id, kind: 'vehicle' };
  const suffix = dark ? 'dark-large' : 'light', view = render(frame(<OwnedAsset />));
  expect(screen.getByLabelText('Condition: 37%')).toBeOnTheScreen();
  expect(screen.queryByLabelText('Condition: 65%')).toBeNull();
  expect(screen.getByLabelText('Mileage: 68,000 mi. Listing reading')).toBeOnTheScreen();
  capture('asset-owned-vehicle-' + suffix, view.toJSON());
  mockRoute = { id: mockWorld.assets.find(asset => asset.catalogId === 'family-house')!.id, kind: 'property' };
  view.rerender(frame(<OwnedAsset />));
  for (const label of ['Beds: 4', 'Baths: 3', 'Sq ft: 2,250']) expect(screen.getByLabelText(label)).toBeOnTheScreen();
  capture('asset-owned-property-' + suffix, view.toJSON());
  expect(encodeWorld(mockWorld)).toBe(original); expect(mockDispatch).not.toHaveBeenCalled();
  view.rerender(frame(<AssetFeatures offer={assetCatalog.find(offer => offer.id === 'used-compact')} condition={0} />));
  expect(screen.getByLabelText('Condition: 0%')).toBeOnTheScreen();
  view.unmount();
});


test.each([{width:390,fontScale:1},{width:320,fontScale:1},{width:320,fontScale:1.4},{width:320,fontScale:2}])('cars keep exactly three equal chips without truncation at $width/$fontScale',({width,fontScale})=>{
  jest.spyOn(require('react-native'),'useWindowDimensions').mockReturnValue({width,height:844,scale:2,fontScale});
  const offer=assetCatalog.find(item=>item.id==='used-compact')!;
  const view=render(<ThemeProvider appearance={fontScale>1?'dark':'light'}><AssetFeatures offer={offer} condition={37} /></ThemeProvider>);
  try{
    expect(assetFeatures(offer,37).map(feature=>feature.id)).toEqual(['speed','mileage','condition']);
    const row=screen.getByTestId('asset-feature-row'),stacked=fontScale>=1.6;
    expect(Native.StyleSheet.flatten(row.props.style)).toMatchObject({flexDirection:stacked?'column':'row',alignItems:'stretch'});
    for(const id of ['speed','mileage','condition']){const style=Native.StyleSheet.flatten(screen.getByTestId('asset-feature-'+id).props.style);expect(style.minWidth).toBe(0);if(!stacked)expect(style.flex).toBe(1);expect(style.height).toBeUndefined();expect(style.maxHeight).toBeUndefined();}
    expect(screen.getByLabelText('Top Speed: 102 mph')).toBeOnTheScreen();expect(screen.getByLabelText('Mileage: 68,000 mi. Listing reading')).toBeOnTheScreen();expect(screen.getByLabelText('Condition: 37%')).toBeOnTheScreen();
    expect(screen.queryByText('MPG (US)')).toBeNull();expect(screen.queryByText('EV range')).toBeNull();
    for(const label of ['Top Speed','Mileage','Condition'])expect(screen.getByText(label).props.numberOfLines).toBeUndefined();
    capture('polish3-vehicle-chips-'+width+'-'+fontScale,view.toJSON());
  }finally{view.unmount();}
});
