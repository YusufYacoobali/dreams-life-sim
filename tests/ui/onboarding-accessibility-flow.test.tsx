import React from 'react';
import { BackHandler, Keyboard, TextInput } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { useCreationDraft } from '../../src/state/creationDraft';
import { createLife, randomCreation } from '../../src/game/createLife';
import { encodeWorld, fullName } from '../../src/game/model';
import { SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';
import { ThemeProvider } from '../../src/ui/theme';

let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({
  router: { back: jest.fn(), replace: jest.fn(), push: jest.fn(), setParams: jest.fn() },
  useLocalSearchParams: () => ({ seed: '42', mode: 'custom' }),
  useFocusEffect: (effect: React.EffectCallback) => require('react').useEffect(effect, [effect]), Redirect: () => null,
}));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector), freshSeed: () => 42 }));
import { router } from 'expo-router';
import Welcome from '../../app/index';
import NewLife from '../../app/new-life';
import Birth from '../../app/birth';

const date = { year: 2026, month: 10, day: 20 };
const frame = (children: React.ReactNode) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider>{children}</ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
const world = () => mockStore.getState().world!;
const expectAlert = (message: string | RegExp) => { const alert = screen.getByRole('alert'); expect(alert).toHaveTextContent(message); expect(alert).toHaveProp('accessibilityLiveRegion', 'polite'); };

async function setup() {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise();
  let nextYield: Promise<void> | undefined;
  const pauseNextSave = () => { let release!: () => void; nextYield = new Promise<void>(resolve => { release = resolve; }); return release; };
  mockStore = createGameStore({ repository: async () => repository, date: () => date, id: () => 'life_accessible_opening', yieldToUI: async () => { const pause = nextYield; nextYield = undefined; if (pause) await pause; } });
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  return { sqlite, driver, repository, rows, pauseNextSave };
}

beforeEach(() => { useCreationDraft.setState({ draft: null }); jest.clearAllMocks(); });
afterEach(() => { jest.restoreAllMocks(); });

test('failed startup exposes a live alert; retry disables opening controls and loads the exact saved life without writing', async () => {
  const context = await setup();
  try {
    const existing = createLife('life_accessible_existing', 9, randomCreation(9), date); existing.birthAcknowledged = true;
    await context.repository.create(existing); const beforeRows = context.rows();
    jest.spyOn(context.repository, 'list').mockRejectedValueOnce(new Error('read failure'));
    expect(await mockStore.getState().bootstrap()).toBe(false);
    const view = render(frame(<Welcome />)); expectAlert('Could not open saved lives. Please try again.');
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeEnabled();
    const release = context.pauseNextSave(); await press('Try Again'); expect(mockStore.getState().busy).toBe(true);
    for (const name of ['Start Your Life', 'Random Life', 'Saved Lives, Import and Export']) {
      const control = screen.getByRole('button', { name }); expect(control).toBeDisabled(); expect(control).toHaveProp('accessibilityState', { disabled: true });
      await press(name);
    }
    expect(router.push).not.toHaveBeenCalled(); expect(context.rows()).toEqual(beforeRows);
    await act(async () => { release(); }); await waitFor(() => expect(mockStore.getState().busy).toBe(false));
    expect(screen.queryByRole('alert')).toBeNull(); expect(world()).toEqual(existing); expect(context.rows()).toEqual(beforeRows);
    const continueButton = screen.getByRole('button', { name: 'Continue as ' + fullName(existing.people[existing.activePersonId]) });
    expect(continueButton).toBeEnabled(); expect(continueButton).toHaveProp('accessibilityState', { disabled: false });
    await press('Continue as ' + fullName(existing.people[existing.activePersonId])); expect(router.push).toHaveBeenLastCalledWith('/life');
    expect(context.rows()).toEqual(beforeRows); view.unmount();
  } finally { context.sqlite.close(); }
});

test('name keyboard navigation never submits; validation and creation/newborn failures announce retry without losing identity or duplicating a life', async () => {
  const context = await setup();
  try {
    expect(await mockStore.getState().bootstrap()).toBe(true); const beforeRows = context.rows();
    const backHandlers = new Set<Parameters<typeof BackHandler.addEventListener>[1]>(), hardwareEvent = { type: 'hardwareBackPress', timeStamp: 0 };
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, handler) => {
      backHandlers.add(handler); return { remove: () => { backHandlers.delete(handler); } };
    });
    const view = render(frame(<NewLife />)), firstName = screen.getByLabelText('First name'), lastName = screen.getByLabelText('Last name');
    const lastInput = screen.UNSAFE_getAllByType(TextInput).find(input => input.props.accessibilityLabel === 'Last name')!;
    const focusLast = jest.spyOn(lastInput.instance, 'focus'), dismiss = jest.spyOn(Keyboard, 'dismiss');
    expect(firstName).toHaveProp('returnKeyType', 'next'); expect(lastName).toHaveProp('returnKeyType', 'done');
    fireEvent.changeText(firstName, ''); await act(async () => { fireEvent(firstName, 'submitEditing'); });
    expect(focusLast).toHaveBeenCalledTimes(1); expect(mockStore.getState().world).toBeNull(); expect(context.rows()).toEqual(beforeRows);
    await press('Start My Life'); expectAlert('Enter a first name.'); expect(context.rows()).toEqual(beforeRows);
    fireEvent.changeText(firstName, 'Alex'); fireEvent.changeText(lastName, ''); await press('Start My Life'); expectAlert('Enter a last name.');
    fireEvent.changeText(lastName, 'Carter'); const dismissCalls = dismiss.mock.calls.length;
    await act(async () => { fireEvent(lastName, 'submitEditing'); }); expect(dismiss).toHaveBeenCalledTimes(dismissCalls + 1);
    expect(screen.queryByRole('alert')).toBeNull(); expect(mockStore.getState().world).toBeNull(); expect(context.rows()).toEqual(beforeRows); expect(router.replace).not.toHaveBeenCalled();
    context.sqlite.exec("CREATE TRIGGER fail_accessible_creation BEFORE INSERT ON lives BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    const create = jest.spyOn(context.repository, 'create'), release = context.pauseNextSave();
    let backControl = screen.getByRole('button', { name: 'Back' });
    while (typeof backControl.props.onPress !== 'function') {
      if (!backControl.parent) throw new Error('Missing actual Header press handler');
      backControl = backControl.parent;
    }
    const backBeforeSubmit = backControl.props.onPress, hardwareBeforeSubmit = [...backHandlers].at(-1);
    let immediateHardware: boolean | null | undefined;
    await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Start My Life' })); backBeforeSubmit(); immediateHardware = hardwareBeforeSubmit?.(hardwareEvent); });
    expect(router.back).not.toHaveBeenCalled(); expect(immediateHardware).toBe(true);
    expect(mockStore.getState().busy).toBe(true);
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Back' })).toHaveProp('accessibilityState', { disabled: true });
    expect([...backHandlers].at(-1)?.(hardwareEvent)).toBe(true); await press('Back'); expect(router.back).not.toHaveBeenCalled();
    for (const name of ['Previous avatar', 'Choose Appearance', 'Next avatar']) {
      const control = screen.getByRole('button', { name }); expect(control).toBeDisabled(); expect(control).toHaveProp('accessibilityState', { disabled: true }); await press(name);
    }
    expect(screen.getByLabelText('First name')).toHaveProp('accessibilityState', { disabled: true }); expect(screen.getByLabelText('Last name')).toHaveProp('accessibilityState', { disabled: true });
    await press('Start My Life'); expect(context.rows()).toEqual(beforeRows); expect(router.push).not.toHaveBeenCalled();
    await act(async () => { release(); }); await waitFor(() => expect(mockStore.getState().busy).toBe(false));
    expectAlert(/new life couldn't be saved/); expect(mockStore.getState().world).toBeNull(); expect(context.rows()).toEqual(beforeRows);
    expect(create).toHaveBeenCalledTimes(1); expect(router.replace).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Back' })).toBeEnabled(); expect([...backHandlers].at(-1)?.(hardwareEvent)).toBe(false);
    await press('Back'); expect(router.back).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('First name')).toHaveProp('value', 'Alex'); expect(screen.getByLabelText('Last name')).toHaveProp('value', 'Carter');
    context.sqlite.exec('DROP TRIGGER fail_accessible_creation'); const finishCreation = context.pauseNextSave();
    await press('Start My Life'); expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled(); expect([...backHandlers].at(-1)?.(hardwareEvent)).toBe(true);
    await press('Start My Life'); await press('Back'); expect(router.back).toHaveBeenCalledTimes(1); expect(create).toHaveBeenCalledTimes(1); expect(context.rows()).toEqual(beforeRows);
    await act(async () => { finishCreation(); }); await waitFor(() => expect(mockStore.getState().world).not.toBeNull());
    const newborn = world(), newbornRows = context.rows(); expect(newborn.birthAcknowledged).toBe(false); expect(await context.repository.list()).toHaveLength(1); expect(create).toHaveBeenCalledTimes(2); expect(router.replace).toHaveBeenCalledTimes(1); expect(router.replace).toHaveBeenLastCalledWith('/birth');
    view.rerender(frame(<Birth />)); context.sqlite.exec("CREATE TRIGGER fail_accessible_birth BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    await press('Begin Life!'); await waitFor(() => expect(screen.getByRole('alert')).toBeOnTheScreen()); expectAlert(/progress couldn't be saved/);
    expect(encodeWorld(world())).toBe(encodeWorld(newborn)); expect(context.rows()).toEqual(newbornRows); expect(screen.getByRole('button', { name: 'Begin Life!' })).toBeEnabled();
    context.sqlite.exec('DROP TRIGGER fail_accessible_birth'); await press('Begin Life!');
    expect(world().birthAcknowledged).toBe(true); expect(world().revision).toBe(newborn.revision + 1); expect(world().people).toEqual(newborn.people); expect(world().accounts).toEqual(newborn.accounts); expect(world().ledger).toEqual(newborn.ledger); expect(world().random).toEqual(newborn.random);
    const acknowledged = world(), acknowledgedRows = context.rows(); await act(async () => { expect(await mockStore.getState().acknowledgeBirth()).toBe(true); });
    expect(world()).toEqual(acknowledged); expect(context.rows()).toEqual(acknowledgedRows); expect(await context.repository.list()).toHaveLength(1); view.unmount();
    mockStore = createGameStore({ repository: async () => new SaveRepository(context.driver), date: () => date, id: () => 'life_unused' });
    expect(await mockStore.getState().bootstrap()).toBe(true); expect(world()).toEqual(acknowledged); expect(context.rows()).toEqual(acknowledgedRows); expect(backHandlers.size).toBe(0);
  } finally { context.sqlite.close(); }
});
