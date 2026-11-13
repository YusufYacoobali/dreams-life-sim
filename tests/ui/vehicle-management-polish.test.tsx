import React from 'react';
import * as Native from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '../support/rendering';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';
import { buyLifestyle, lifestyleFixture } from '../helpers/lifestyle';
import { encodeWorld } from '../../src/game/model';
import { ThemeProvider } from '../../src/ui/theme';
import { assetCatalog } from '../../src/game/content/assets';
import { vehicleActivityCost } from '../../src/game/systems/vehicleActivities';
import { AssetCatalogue } from '../../src/ui/AssetCatalogue';
import { AssetOfferPage } from '../../src/ui/AssetOfferDetails';
import { PendingEvent } from '../../src/ui/PendingEvent';
let mockStore: ReturnType<typeof createGameStore>, mockId = '';
jest.mock('../../src/state/useGame', () => ({ useGame: (select: unknown) => require('zustand').useStore(mockStore, select) }));
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn(), navigate: jest.fn(), dismissTo: jest.fn() }, useLocalSearchParams: () => ({ id: mockId }) }));
import Vehicle from '../../app/(game)/asset/[id]';
const frame = (child: React.ReactNode, dark = false) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 320, height: 640 }, insets: { top: 24, bottom: 24, left: 0, right: 0 } }}><ThemeProvider appearance={dark ? 'dark' : 'light'}>{child}<PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { await fireEvent.press(screen.getByRole('button', { name })); }); };
afterEach(() => jest.restoreAllMocks());

test.each([false, true])('vehicle management is grouped with one ownership flow and no licence, trade-in or duplicate repair controls (dark=%s)', async dark => {
  const world = buyLifestyle(lifestyleFixture(), 'city-car'), { sqlite, driver } = database();
  try {
    const repository = new SaveRepository(driver); await repository.initialise(); await repository.create(world);
    mockStore = createGameStore({ repository: async () => repository, date: () => world.date, id: () => 'unused' }); await mockStore.getState().bootstrap();
    mockId = world.assets[0].id;
    jest.spyOn(Native, 'useWindowDimensions').mockReturnValue({ width: 320, height: 640, scale: 2, fontScale: dark ? 2 : 1 });
    const before = encodeWorld(mockStore.getState().world!); await render(frame(<Vehicle />, dark));
    for (const title of ['Driving & Trips', 'Care & Maintenance', 'Upgrades', 'Ownership']) expect(screen.getByRole('button', { name: title })).toBeOnTheScreen();
    expect(screen.queryByText('Vehicle Licences')).toBeNull(); expect(screen.queryByText('Driving Licence')).toBeNull();
    expect(screen.queryByRole('button', { name: /Trade In|Repair & Improve/ })).toBeNull();
    await press('Ownership'); expect(screen.getAllByRole('button', { name: /^Sell Vehicle/ })).toHaveLength(1);
    expect(screen.queryByRole('button', { name: /Scrap This Vehicle/ })).toBeNull();
    await press(/^Gift This Vehicle/); expect(screen.getByLabelText('Search people')).toBeOnTheScreen();
    await press('Never mind'); expect(encodeWorld(mockStore.getState().world!)).toBe(before);
    await press('Care & Maintenance'); const fee = vehicleActivityCost(world, world.assets[0], 'service');
    await press(/^Service Vehicle/);
    sqlite.exec("CREATE TRIGGER fail_vehicle_service BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    await press('Confirm'); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/));
    expect(encodeWorld(await repository.load(world.id))).toBe(before);
    sqlite.exec('DROP TRIGGER fail_vehicle_service'); await press('Confirm');
    const saved = mockStore.getState().world!;
    expect(saved.lifestyle!.records.filter(row => row.kind === 'vehicle-service')).toHaveLength(1);
    expect(saved.lifestyle!.records.at(-1)!.paid).toBe(fee); expect(encodeWorld(await repository.load(world.id))).toBe(encodeWorld(saved));
  } finally { sqlite.close(); }
});

test('boats and aircraft disappear from new purchases while actual owned vehicles remain literal', async () => {
  const world = buyLifestyle(lifestyleFixture(), 'harbour-dinghy'), { sqlite, driver } = database();
  try {
    const repository = new SaveRepository(driver); await repository.initialise(); await repository.create(world);
    mockStore = createGameStore({ repository: async () => repository, date: () => world.date, id: () => 'unused' }); await mockStore.getState().bootstrap();
    const before = encodeWorld(mockStore.getState().world!), view = await render(frame(<AssetCatalogue kind="vehicle" />));
    for (const offer of assetCatalog.filter(row => row.licenceKind === 'boat' || row.licenceKind === 'pilot')) {
      expect(screen.queryByRole('button', { name: new RegExp(offer.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) })).toBeNull();
    }
    await view.rerender(frame(<AssetOfferPage id="harbour-dinghy" />));
    expect(screen.getByText('New purchases of this vehicle are currently unavailable.')).toBeOnTheScreen();
    expect(mockStore.getState().world!.assets[0].catalogId).toBe('harbour-dinghy'); expect(encodeWorld(mockStore.getState().world!)).toBe(before);
  } finally { sqlite.close(); }
});
