import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { createGameStore } from '../../src/state/gameStore';
import { encodeWorld } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { hobbyEventFee } from '../../src/game/systems/hobbyEvents';
import { leisurePayer } from '../../src/game/systems/leisure';
import { SaveRepository } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { database } from '../support/sqlite';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import archive from '../fixtures/v27-responsive-archive.json';
let mockStore: ReturnType<typeof createGameStore>, mockHobbyKind = 'guitar';
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() }, useLocalSearchParams: () => ({ kind: mockHobbyKind }) }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import HobbyEvent from '../../app/(game)/hobby-event/[kind]';
import Hobby from '../../app/(game)/hobby/[kind]';
const frame = (children: React.ReactNode) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider>{children}<PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };

test.each(['Use familiar skills', 'Try something ambitious', 'Enjoy taking part'])('%s retains the chosen draft after SQLite rollback, retries warm and cold-resumes exactly once', async label => {
  const { sqlite, driver } = database(); const repository = new SaveRepository(driver); await repository.initialise(); await repository.import(JSON.stringify(archive));
  const cold = async () => { const coldRepository = new SaveRepository(driver); mockStore = createGameStore({ repository: async () => coldRepository, date: () => ({ year: 2026, month: 10, day: 20 }), id: () => 'unused' }); await mockStore.getState().bootstrap(); };
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  try {
    await cold(); const originalMoments = sqlite.prepare('SELECT * FROM snapshots ORDER BY 1,2').all();
    let guard = 0;
    while ((mockStore.getState().world!.pending || mockStore.getState().world!.annual) && guard++ < 100) {
      const w = mockStore.getState().world!, command: GameCommand = w.pending?.kind === 'decision' ? { type: 'choose', eventId: w.pending.id, choiceId: w.pending.choices.find(item => !choiceUnavailable(w, item))!.id } : w.pending ? { type: 'acknowledge', resultId: w.pending.id } : { type: 'resume' };
      expect(await mockStore.getState().dispatch(command)).toBe(true);
    }
    expect(guard).toBeLessThan(100); mockHobbyKind = 'guitar'; const world = () => mockStore.getState().world!, before = encodeWorld(world()), beforeRows = rows();
    const view = render(frame(<Hobby />)); await press('View Community Event'); expect(router.push).toHaveBeenLastCalledWith({ pathname: '/hobby-event/[kind]', params: { kind: 'guitar' } }); view.rerender(frame(<HobbyEvent />));
    expect(screen.getByText('Open Mic Afternoon')).toBeOnTheScreen(); expect(screen.getByText(/Responsible payer:/)).toBeOnTheScreen(); await press('Back'); expect(router.back).toHaveBeenCalled();
    await act(async () => { fireEvent.press(screen.getByRole('radio', { name: label })); });
    expect(encodeWorld(world())).toBe(before); expect(rows()).toEqual(beforeRows);
    const approach = label === 'Use familiar skills' ? 'familiar' : label === 'Try something ambitious' ? 'stretch' : 'relaxed', command: GameCommand = { type: 'enter-hobby-event', kind: 'guitar', approach, reviewedPayerId: leisurePayer(world())!.id, quotedFee: hobbyEventFee(world().people[world().activePersonId].country, 'guitar') }, predicted = resolveCommand(world(), command, true);
    const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    sqlite.exec("CREATE TRIGGER fail_hobby_event BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    await press('Ask To Enter Event'); await waitFor(() => expect(mockStore.getState().error).toMatch(/couldn't be saved/)); expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/);
    expect(encodeWorld(world())).toBe(before); expect(rows()).toEqual(beforeRows); expect(screen.getByRole('radio', { name: label, checked: true })).toBeOnTheScreen();
    sqlite.exec('DROP TRIGGER fail_hobby_event'); await press('Ask To Enter Event'); expect(world()).toEqual(predicted); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    const savedRows = rows(); await act(async () => { await cold(); }); view.rerender(frame(<HobbyEvent />)); expect(world()).toEqual(predicted); expect(rows()).toEqual(savedRows); expect(screen.getByRole('button', { name: 'Continue' })).toBeOnTheScreen();
    await press('Continue'); expect(world().hobbyEvents).toHaveLength(1); expect(world().hobbyEvents[0]).toEqual(predicted.hobbyEvents[0]); expect(screen.getByRole('button', { name: 'Ask To Enter Event' })).toBeDisabled(); expect(screen.getByText('Event History')).toBeOnTheScreen();
    await act(async () => { expect(await mockStore.getState().dispatch(command)).toBe(false); }); expect(world().hobbyEvents).toHaveLength(1); expect(sqlite.prepare('SELECT * FROM snapshots ORDER BY 1,2').all()).toEqual(originalMoments);
    for (const point of archive.snapshots) expect(sqlite.prepare('SELECT payload FROM snapshots WHERE snapshot_id=?').get(point.summary.id)?.payload).toBe(point.payload);
    view.unmount();
  } finally { jest.restoreAllMocks(); sqlite.close(); }
}, 60000);

test('an invalid event route offers a useful return without a payable action', async () => {
  const { sqlite, driver } = database(); try { const repository = new SaveRepository(driver); await repository.initialise(); await repository.import(JSON.stringify(archive)); mockStore = createGameStore({ repository: async () => repository, date: () => ({ year: 2026, month: 10, day: 20 }), id: () => 'unused' }); await mockStore.getState().bootstrap(); mockHobbyKind = 'unknown'; const view = render(frame(<HobbyEvent />)); expect(screen.getByText('This hobby is unavailable.')).toBeOnTheScreen(); expect(screen.queryByRole('button', { name: 'Ask To Enter Event' })).toBeNull(); view.unmount(); } finally { sqlite.close(); }
});
