import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useStore } from 'zustand';
import { router } from 'expo-router';
import { createGameStore } from '../../src/state/gameStore';
import { createLife, randomCreation } from '../../src/game/createLife';
import { decodeWorld, encodeWorld } from '../../src/game/model';
import { SaveRepository } from '../../src/persistence/repository';
import { ThemeProvider } from '../../src/ui/theme';
import { EventModal } from '../../src/ui/EventModal';
import { isNewDeath } from '../../src/ui/cinematic/committedDeath';
import { database } from '../support/sqlite';
import { readyForActivity } from '../support/endLife';
import birth from '../fixtures/v6-birth-result.json';

let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({ Redirect: () => null, router: { push: jest.fn(), replace: jest.fn() }, useFocusEffect: (callback: () => void) => require('react').useEffect(callback, [callback]) }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector), freshSeed: () => 12345 }));
import Activities from '../../app/(game)/(tabs)/activities';
import Death from '../../app/death';

const frame = (child: React.ReactNode) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider>{child}</ThemeProvider></SafeAreaProvider>;
function Journey() { const world = useStore(mockStore, state => state.world)!; return world.people[world.activePersonId].died ? <Death /> : <Activities />; }
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
const review = () => screen.UNSAFE_getAllByType(EventModal).find(item => item.props.event?.id.startsWith('end-life:'))!;
const confirmationButton = () => within(review()).getByRole('button', { name: 'End This Life' });
const confirmEnd = async () => { await act(async () => { fireEvent.press(confirmationButton()); }); };

async function fixture() {
  const db = database(), repository = new SaveRepository(db.driver); await repository.initialise();
  const before = readyForActivity(decodeWorld(JSON.stringify(birth)));
  const other = { ...createLife('life_end_other', 42, randomCreation(42), before.date), birthAcknowledged: true };
  await repository.create(other); await repository.create(before);
  const deps = { repository: async () => repository, date: () => before.date, id: () => 'unused' };
  mockStore = createGameStore(deps); await mockStore.getState().bootstrap();
  return { ...db, repository, before, other, deps };
}

test('Activities confirms ending a life, atomically retries failed saves, then offers the existing legacy flow', async () => {
  const { sqlite, driver, repository, before, other, deps } = await fixture(), beforeText = encodeWorld(before), onDeath = jest.fn();
  mockStore.subscribe((next, previous) => { if (isNewDeath(next, previous)) onDeath(); });
  const view = render(frame(<Journey />)); await press(/^End This Life\./);
  expect(screen.getByRole('header', { name: 'End this life?' })).toBeTruthy();
  expect(encodeWorld(await repository.load(before.id))).toBe(beforeText);
  await press('Never mind'); expect(screen.queryByRole('header', { name: 'End this life?' })).toBeNull(); expect(onDeath).not.toHaveBeenCalled();
  await press(/^End This Life\./);
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; }), commit = repository.commit.bind(repository);
  const held = jest.spyOn(repository, 'commit').mockImplementation(async (...args) => { await gate; return commit(...args); });
  sqlite.exec("CREATE TRIGGER fail_end_life BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  await act(async () => { const button = confirmationButton(); fireEvent.press(button); fireEvent.press(button); });
  expect(held).toHaveBeenCalledTimes(1); expect(mockStore.getState().busy).toBe(true); expect(onDeath).not.toHaveBeenCalled();
  expect(confirmationButton()).toBeDisabled();
  await act(async () => { release(); }); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/));
  expect(encodeWorld(mockStore.getState().world!)).toBe(beforeText); expect(encodeWorld(await repository.load(before.id))).toBe(beforeText); expect(await repository.snapshots(before.id)).toEqual([]); expect(onDeath).not.toHaveBeenCalled();
  sqlite.exec('DROP TRIGGER fail_end_life'); await confirmEnd();
  expect(screen.getByText('You Died')).toBeTruthy(); expect(screen.getByText('Cause of death: Ended by choice')).toBeTruthy(); expect(onDeath).toHaveBeenCalledTimes(1);
  const ended = mockStore.getState().world!; expect(ended.estates.filter(item => item.personId === ended.activePersonId)).toHaveLength(1); expect(ended.date).toEqual(before.date); expect(held).toHaveBeenCalledTimes(2);
  const points = await repository.snapshots(before.id); expect(points).toHaveLength(1); expect(points[0].label).toBe('Before End This Life'); expect(await repository.load(other.id)).toEqual(other);
  await press('Continue as Child'); expect(router.push).toHaveBeenCalledWith('/legacy');
  const coldRepository = new SaveRepository(driver); await coldRepository.initialise(); const cold = createGameStore({ ...deps, repository: async () => coldRepository }); cold.subscribe((next, previous) => { if (isNewDeath(next, previous)) onDeath(); }); await cold.getState().bootstrap(); expect(cold.getState().world).toEqual(ended); expect(onDeath).toHaveBeenCalledTimes(1);
  const restored = await repository.restoreBranch(before.id, points[0].id, ended.revision, 'life_before_end', 'restore_end_life'); expect(restored).toEqual({ ...before, id: 'life_before_end' }); expect(await repository.load(before.id)).toEqual(ended);
  view.unmount(); held.mockRestore(); sqlite.close();
});

test('cancelled, superseded, switched-life and unmounted confirmation callbacks cannot end a character', async () => {
  const { sqlite, repository, before, other } = await fixture(), view = render(frame(<Activities />));
  const original = encodeWorld(before);
  await press(/^End This Life\./); const cancelled = review().props.onChoose;
  await press('Never mind'); await act(async () => { cancelled('confirm'); }); expect(encodeWorld(mockStore.getState().world!)).toBe(original);
  await press(/^End This Life\./); await act(async () => { cancelled('confirm'); }); expect(encodeWorld(mockStore.getState().world!)).toBe(original);
  const stale = review().props.onChoose;
  await act(async () => { await mockStore.getState().selectLife(other.id); }); expect(screen.queryByRole('header', { name: 'End this life?' })).toBeNull();
  await act(async () => { stale('confirm'); }); expect(mockStore.getState().world).toEqual(other); expect(await repository.load(before.id)).toEqual(before);
  await press(/^End This Life\./); const unmounted = review().props.onChoose; view.unmount();
  await act(async () => { unmounted('confirm'); }); expect(mockStore.getState().world).toEqual(other); expect(await repository.snapshots(other.id)).toEqual([]); sqlite.close();
});
