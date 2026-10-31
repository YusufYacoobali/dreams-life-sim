import React from 'react';
import { Modal } from 'react-native';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';
import { lifestyleFixture, buyLifestyle, act as apply } from '../helpers/lifestyle';
import { encodeWorld } from '../../src/game/model';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import { LicenceControls } from '../../src/ui/VehicleLifestyle';
import { licenceFee, licenceQuiz } from '../../src/game/systems/vehicleLicences';
import { formatMoney } from '../../src/game/money';
import { decodeSave } from '../../src/persistence/archive';
import relocation from '../fixtures/v20-relocation-archive.json';
let mockStore: ReturnType<typeof createGameStore>, mockAssetId = '';
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn(), navigate: jest.fn() }, useLocalSearchParams: () => ({ id: mockAssetId }) }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import Asset from '../../app/(game)/asset/[id]';
const frame = () => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider><Asset /><PendingEvent /></ThemeProvider></SafeAreaProvider>;
async function press(name: string | RegExp) { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); }
test('an amenity review is read-only, cancellation spends nothing, SQLite failure retains the review and cold retry installs once', async () => {
    let initial = buyLifestyle(lifestyleFixture(), 'family-house');
    mockAssetId = initial.assets.at(-1)!.id;
    initial = apply(initial, { type: 'enable-property-management', assetId: mockAssetId });
    const { sqlite, driver } = database(), repository = new SaveRepository(driver);
    await repository.initialise();
    await repository.create(initial);
    const boot = async () => { mockStore = createGameStore({ repository: async () => new SaveRepository(driver), date: () => initial.date, id: () => 'unused' }); await mockStore.getState().bootstrap(); };
    try {
        await boot();
        const before = encodeWorld(mockStore.getState().world!), view = render(frame());
        await press(/^Improve the Home/);
        await press(/^Music studio/);
        expect(encodeWorld(mockStore.getState().world!)).toBe(before);
        expect(within(screen.UNSAFE_getByType(Modal)).getByText(/Supports guitar and singing projects/)).toBeOnTheScreen();
        await press('Never mind');
        expect(encodeWorld(mockStore.getState().world!)).toBe(before);
        await press(/^Music studio/);
        sqlite.exec("CREATE TRIGGER reject_lifestyle_review BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'lifestyle storage failure'); END");
        await press('Confirm');
        await waitFor(() => expect(mockStore.getState().error).toBeTruthy());
        expect(encodeWorld(mockStore.getState().world!)).toBe(before);
        expect(within(screen.UNSAFE_getByType(Modal)).getByRole('alert')).toBeOnTheScreen();
        sqlite.exec('DROP TRIGGER reject_lifestyle_review');
        await press('Confirm');
        const saved = mockStore.getState().world!;
        expect(saved.assets.at(-1)!.propertyLife!.amenities.map(row => row.kind)).toEqual(['studio']);
        expect(saved.lifestyle!.records.filter(row => row.kind === 'amenity')).toHaveLength(1);
        await act(async () => { await boot(); });
        view.rerender(frame());
        expect(mockStore.getState().world!).toEqual(saved);
        view.unmount();
    }
    finally {
        sqlite.close();
    }
});

test('a genuine relocated life reviews and pays its licence in the residence currency while retaining its original account', async () => {
    const initial = apply(decodeSave(JSON.stringify(relocation)).world, { type: 'enable-lifestyle' });
    expect(initial.people[initial.activePersonId].country).toBe('JP');
    expect(initial.accounts.find(row => row.ownerId === initial.activePersonId)!.currency).toBe('USD');
    const { sqlite, driver } = database(), repository = new SaveRepository(driver);
    await repository.initialise(); await repository.create(initial);
    mockStore = createGameStore({ repository: async () => new SaveRepository(driver), date: () => initial.date, id: () => 'unused' });
    await mockStore.getState().bootstrap();
    try {
        const fee = licenceFee(initial, 'road'), before = encodeWorld(initial);
        const view = render(<SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider><LicenceControls /><PendingEvent /></ThemeProvider></SafeAreaProvider>);
        await press(/^Driving Licence/);
        for (const question of licenceQuiz.road) await press(question.answers[question.correct]);
        await press('Review Test Submission');
        expect(within(screen.UNSAFE_getByType(Modal)).getByText('The test costs ' + formatMoney({ minor: fee, currency: 'JPY' }) + '. All three answers must be correct. Failed attempts remain paid and saved.')).toBeOnTheScreen();
        expect(encodeWorld(mockStore.getState().world!)).toBe(before);
        await press('Never mind');
        expect(encodeWorld(mockStore.getState().world!)).toBe(before);
        await press('Review Test Submission'); await press('Confirm');
        const saved = mockStore.getState().world!;
        expect(saved.lifestyle!.licences[0].fee).toBe(fee);
        expect(saved.accounts.find(row => row.ownerId === saved.activePersonId && row.currency === 'USD')).toEqual(initial.accounts.find(row => row.ownerId === initial.activePersonId && row.currency === 'USD'));
        expect(saved.accounts.find(row => row.ownerId === saved.activePersonId && row.currency === 'JPY')!.cash).toBe(initial.accounts.find(row => row.ownerId === initial.activePersonId && row.currency === 'JPY')!.cash - fee);
        expect(await new SaveRepository(driver).load(saved.id)).toEqual(saved);
        view.unmount();
    } finally { sqlite.close(); }
});
