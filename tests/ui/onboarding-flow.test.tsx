import React from 'react';
import { FlatList } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { useCreationDraft } from '../../src/state/creationDraft';
import { createLife, randomCreation } from '../../src/game/createLife';
import { copyWorld, encodeWorld, fullName, ageOn } from '../../src/game/model';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { avatarPresets } from '../../src/ui/CreationElements';
import { SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';
import { ThemeProvider } from '../../src/ui/theme';
import * as components from '../../src/ui/components';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import friendship from '../fixtures/v35-native-best-friend-checkpoints.json';
let mockStore: ReturnType<typeof createGameStore>, mockSeed = 42;
let mockParams: { seed?: string; mode?: string } = {};
jest.mock('expo-router', () => ({
  router: { back: jest.fn(), replace: jest.fn(), push: jest.fn(route => { if (route?.pathname === '/new-life') mockParams = route.params; }), setParams: jest.fn(params => { mockParams = { ...mockParams, ...params }; }) },
  useLocalSearchParams: () => mockParams, useFocusEffect: jest.fn(), Redirect: () => null,
}));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector), freshSeed: () => mockSeed++, gameStore: { getState: () => mockStore.getState() } }));
import { router } from 'expo-router';
import Welcome from '../../app/index';
import NewLife from '../../app/new-life';
import Appearance from '../../app/appearance';
import Birth from '../../app/birth';
import Life from '../../app/(game)/(tabs)/life';
import { PendingEvent } from '../../src/ui/PendingEvent';
const frame = (child: React.ReactNode, appearance: 'light' | 'dark' = 'light') => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider appearance={appearance}>{child}<PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
beforeEach(() => { useCreationDraft.setState({ draft: null }); mockParams = {}; mockSeed = 42; });

test.each([false, true])('an actual archived result acknowledgement keeps presentation stable and respects journal drag=%s', async dragged => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise();
  const initial = unpackCheckpoint(friendship.backup.checkpoint); await repository.create(initial);
  mockStore = createGameStore({ repository: async () => repository, date: () => initial.date, id: () => 'unused' }); await mockStore.getState().bootstrap();
  const portrait = jest.spyOn(components, 'Portrait'), journal = jest.spyOn(FlatList.prototype, 'render');
  const scrollToEnd = jest.fn(), responder = jest.spyOn(FlatList.prototype, 'getScrollResponder').mockReturnValue({ scrollToEnd } as unknown as ReturnType<FlatList['getScrollResponder']>);
  const frames = new Map<number, (time: number) => void>(); let nextFrame = 0;
  const request = jest.spyOn(global, 'requestAnimationFrame').mockImplementation(callback => { frames.set(++nextFrame, callback); return nextFrame; });
  const cancel = jest.spyOn(global, 'cancelAnimationFrame').mockImplementation(id => { if (typeof id === 'number') frames.delete(id); });
  const flushFrames = () => act(() => { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback(0)); });
  const view = render(frame(<Life />));
  try {
    flushFrames(); expect(scrollToEnd).toHaveBeenCalledWith({ animated: false }); scrollToEnd.mockClear();
    const before = mockStore.getState().world!, identity = screen.getByRole('button', { name: /^My Life profile\./ }).props.accessibilityLabel;
    const data = screen.UNSAFE_getByType(FlatList).props.data, counts = { portrait: portrait.mock.calls.length, journal: journal.mock.calls.length };
    expect(counts.portrait).toBeGreaterThan(0); expect(counts.journal).toBeGreaterThan(0);
    if (dragged) fireEvent(screen.UNSAFE_getByType(FlatList), 'scrollBeginDrag');
    await press('Continue'); const after = mockStore.getState().world!;
    flushFrames(); expect(scrollToEnd).toHaveBeenCalledTimes(dragged ? 0 : 1);
    if (!dragged) expect(scrollToEnd).toHaveBeenCalledWith({ animated: false });
    expect(after.people).toEqual(before.people); expect(after.journal).toEqual(before.journal); expect(after.accounts).toEqual(before.accounts); expect(after.pending).toBeNull();
    expect(screen.getByRole('button', { name: identity })).toBeOnTheScreen(); expect(after.revision).toBe(before.revision + 1); expect(await repository.load(after.id)).toEqual(after);
    expect(portrait).toHaveBeenCalledTimes(counts.portrait); expect(journal).toHaveBeenCalledTimes(counts.journal); expect(screen.UNSAFE_getByType(FlatList).props.data).toBe(data);

    view.rerender(frame(<Life />, 'dark')); expect(screen.getByText(fullName(after.people[after.activePersonId]))).toHaveStyle({ color: '#F6F8FF' });
    expect(screen.UNSAFE_getByType(FlatList).props.data).toBe(data); expect(mockStore.getState().world).toBe(after);
    await press('Age Up'); const progressed = mockStore.getState().world!, player = progressed.people[progressed.activePersonId], progressedRows = screen.UNSAFE_getByType(FlatList).props.data;
    expect(progressed.date).not.toEqual(after.date); expect(progressedRows).not.toBe(data); expect(portrait.mock.calls.length).toBeGreaterThan(counts.portrait); expect(journal.mock.calls.length).toBeGreaterThan(counts.journal);
    expect(screen.getByRole('button', { name: new RegExp('^My Life profile\\. ' + fullName(player) + '\\. Age ' + ageOn(player, progressed.date) + '\\.') })).toBeOnTheScreen();
    for (const [label, value] of [['Happiness', player.stats.happiness], ['Health', player.stats.health], ['Smarts', player.stats.smarts], ['Looks', player.stats.looks], ['Respect', player.stats.respect]] as const) expect(screen.getByRole('progressbar', { name: label })).toHaveAccessibilityValue({ now: value });
    expect(await repository.load(progressed.id)).toEqual(progressed);

    // View-only restore/invalidation controls: these are never saved or passed
    // off as engine outcomes. In particular, equal lengths/IDs are insufficient.
    const stored = encodeWorld(await repository.load(progressed.id)), firstId = progressedRows[0].entry.id;
    const edited = copyWorld(progressed), entry = edited.journal.find(item => item.id === firstId)!; entry.text = 'Updated journal wording for this read-only view.';
    await act(async () => { mockStore.setState({ world: edited }); }); const editedRows = screen.UNSAFE_getByType(FlatList).props.data;
    expect(editedRows).not.toBe(progressedRows); expect(editedRows).toHaveLength(progressedRows.length); expect(screen.getByText(entry.text)).toBeOnTheScreen();
    const dated = copyWorld(edited); dated.journal.find(item => item.id === firstId)!.date.year++;
    await act(async () => { mockStore.setState({ world: dated }); }); const datedRows = screen.UNSAFE_getByType(FlatList).props.data;
    expect(datedRows).not.toBe(editedRows); expect(datedRows[0].age).toBe(editedRows[0].age + 1);
    const changedLook = copyWorld(dated), appearance = changedLook.people[changedLook.activePersonId].appearance; appearance.face = (appearance.face + 1) % 4;
    await act(async () => { mockStore.setState({ world: changedLook }); }); expect(portrait.mock.calls.at(-1)![0].appearance).toEqual(appearance);
    const restored = copyWorld(changedLook); restored.id += '_restored_view'; const beforeRestore = portrait.mock.calls.length;
    await act(async () => { mockStore.setState({ world: restored }); }); expect(portrait.mock.calls.length).toBeGreaterThan(beforeRestore); expect(screen.UNSAFE_getByType(FlatList).props.data).not.toBe(datedRows);
    expect(encodeWorld(await repository.load(progressed.id))).toBe(stored);
  } finally { view.unmount(); portrait.mockRestore(); journal.mockRestore(); responder.mockRestore(); request.mockRestore(); cancel.mockRestore(); sqlite.close(); }
});

test('custom identity, country/city and appearance survive editor navigation into the real newborn, first year and cold resume', async () => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); mockStore = createGameStore({ repository: async () => repository, date: () => ({ year: 2026, month: 10, day: 19 }), id: () => 'life_onboarding' }); await mockStore.getState().bootstrap();
  const view = render(frame(<Welcome />)); await press('Start Your Life'); expect(router.push).toHaveBeenCalledWith({ pathname: '/new-life', params: { seed: '42', mode: 'custom' } }); view.rerender(frame(<NewLife />)); expect(screen.queryByRole('image', { name: 'Your adult appearance' })).toBeNull(); expect(screen.queryByText('Royal Family')).toBeNull(); expect(screen.queryByText('Ordinary Family')).toBeNull(); expect(screen.getByRole('button', { name: /^More Options/ })).toBeOnTheScreen();
  await press(/^More Options/); expect(screen.getByRole('button', { name: /^More Options/ })).toHaveProp('accessibilityState', expect.objectContaining({ expanded: true })); const attraction = screen.getByRole('checkbox', { name: 'Men' }); expect(attraction).toHaveProp('accessibilityState', expect.objectContaining({ checked: true })); await act(async () => { fireEvent.press(attraction); }); expect(screen.getByRole('checkbox', { name: 'Men' })).toHaveProp('accessibilityState', expect.objectContaining({ checked: false })); await act(async () => { fireEvent.press(screen.getByRole('checkbox', { name: 'Women' })); }); expect(screen.getByRole('checkbox', { name: 'Non-binary' })).toBeDisabled(); await act(async () => { fireEvent.press(screen.getByRole('radio', { name: 'Neither' })); }); expect(screen.getByRole('radio', { name: 'Neither' })).toHaveProp('accessibilityState', expect.objectContaining({ checked: true })); await press(/^More Options/);
  fireEvent.changeText(screen.getByLabelText('First name'), 'Alex'); fireEvent.changeText(screen.getByLabelText('Last name'), 'Carter'); await press(/^Country\./); fireEvent.press(screen.getByRole('radio', { name: 'Japan' })); await press('Choose'); await press(/^City\./); fireEvent.press(screen.getByRole('radio', { name: 'Osaka' })); await press('Choose');
  await press('Choose Appearance'); expect(router.push).toHaveBeenLastCalledWith('/appearance'); view.rerender(frame(<Appearance />)); expect(screen.getAllByRole('radio', { name: /^Avatar \d+, / })).toHaveLength(16); expect(screen.queryAllByRole('image', { name: /^Avatar \d+$/ })).toHaveLength(0); fireEvent.press(screen.getByRole('radio', { name: 'Avatar 7, long face, very light skin tone, black shoulder length hair' })); expect(useCreationDraft.getState().draft!.input.appearance).toEqual(avatarPresets[6]);
  fireEvent.press(screen.getByRole('tab', { name: 'Skin Tone' })); fireEvent.press(screen.getByRole('radio', { name: 'Skin tone 3, medium' })); fireEvent.press(screen.getByRole('tab', { name: 'Hair Style' })); expect(screen.getAllByRole('image')).toHaveLength(1); expect(screen.getByRole('image', { name: 'Your adult appearance' })).toBeOnTheScreen(); fireEvent.press(screen.getByRole('radio', { name: 'Coily afro' })); fireEvent.press(screen.getByRole('tab', { name: 'Hair Color' })); fireEvent.press(screen.getByRole('radio', { name: 'Chestnut' })); await press('Continue');
  view.rerender(frame(<NewLife />)); expect(screen.getByLabelText('First name')).toHaveProp('value', 'Alex'); expect(screen.getByLabelText('Last name')).toHaveProp('value', 'Carter'); expect(screen.getByText('Osaka')).toBeOnTheScreen(); const draft = structuredClone(useCreationDraft.getState().draft!); expect(mockStore.getState().world).toBeNull(); expect(await repository.list()).toEqual([]);
  await press('Start My Life'); await waitFor(() => expect(mockStore.getState().world?.id).toBe('life_onboarding')); const newborn = mockStore.getState().world!, player = newborn.people[newborn.activePersonId]; expect(player.appearance).toEqual(draft.input.appearance); expect(player.country).toBe('JP'); expect(player.nationality).toBe('JP'); expect(player.city).toBe('Osaka'); expect(player.born).toEqual({ year: 2026, month: 10, day: 19 }); expect(player.firstName).toBe('Alex');
  view.rerender(frame(<Birth />)); expect(screen.getByText(/October 19, 2026/)).toBeOnTheScreen(); expect(screen.getByText(/Japanese/)).toBeOnTheScreen(); for (const relation of newborn.relationships.filter(item => item.to === player.id && item.roles.includes('parent'))) expect(screen.getByText(new RegExp(fullName(newborn.people[relation.from])))).toBeOnTheScreen(); await press('Begin Life!'); view.rerender(frame(<Life />)); expect(screen.getByText('Tap Age Up to live your first year.')).toBeOnTheScreen(); expect(screen.getByRole('button', { name: /^My Life profile\. Alex Carter\. Age 0\. Newborn\. Bank balance [¥￥]0$/ })).toBeOnTheScreen(); expect(screen.queryByRole('image', { name: 'Alex Carter' })).toBeNull();
  const before = encodeWorld(mockStore.getState().world!); sqlite.exec("CREATE TRIGGER fail_first_year BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END"); await press('Age Up'); await waitFor(() => expect(screen.getByText(/couldn't be saved/)).toBeOnTheScreen()); expect(encodeWorld(mockStore.getState().world!)).toBe(before); expect(encodeWorld(await repository.load(newborn.id))).toBe(before); expect(await repository.snapshots(newborn.id)).toEqual([]);
  sqlite.exec('DROP TRIGGER fail_first_year'); await press('Age Up'); let guard = 0;
  while ((mockStore.getState().world!.pending || mockStore.getState().world!.annual) && guard++ < 100) { const world = mockStore.getState().world!; if (world.pending?.kind === 'result') await press('Continue'); else if (world.pending?.kind === 'decision') { const choice = world.pending.choices.find(item => !choiceUnavailable(world, item))!; await press(choice.label); } else await press('Continue This Year'); }
  expect(guard).toBeLessThan(100); const aged = mockStore.getState().world!; expect(ageOn(aged.people[player.id], aged.date)).toBe(1); expect(aged.people[player.id].appearance).toEqual(player.appearance); expect(aged.birthAcknowledged).toBe(true); expect(await repository.load(newborn.id)).toEqual(aged); expect((await repository.snapshots(newborn.id)).length).toBeGreaterThan(0);
  mockStore = createGameStore({ repository: async () => repository, date: () => aged.date, id: () => 'life_unused' }); await act(async () => { await mockStore.getState().bootstrap(); }); view.rerender(frame(<Welcome />)); await press('Continue as Alex Carter'); expect(router.push).toHaveBeenLastCalledWith('/life'); const revision = mockStore.getState().world!.revision; await act(async () => { await mockStore.getState().acknowledgeBirth(); }); expect(mockStore.getState().world!.revision).toBe(revision); view.rerender(frame(<Life />)); await press('More Life Options'); fireEvent.press(screen.getByRole('radio', { name: 'Settings' })); await press('Open'); expect(router.push).toHaveBeenLastCalledWith('/settings'); expect(mockStore.getState().world).toEqual(aged); view.unmount(); sqlite.close();
});
test('random creation previews and rerolls a real separate seed; customising keeps the selected identity instead of silently rerolling it', async () => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); mockStore = createGameStore({ repository: async () => repository, date: () => ({ year: 2026, month: 10, day: 19 }), id: () => 'life_random_opening' }); await mockStore.getState().bootstrap(); const view = render(frame(<Welcome />)); await press('Random Life'); expect(router.push).toHaveBeenCalledWith({ pathname: '/new-life', params: { seed: '42', mode: 'random' } }); view.rerender(frame(<NewLife />)); expect(screen.getByText('Let Fate Decide')).toBeOnTheScreen(); expect(screen.queryByLabelText('First name')).toBeNull(); expect(useCreationDraft.getState().draft!.input).toEqual(randomCreation(42));
  await press('Roll Again'); expect(useCreationDraft.getState().draft!.seed).toBe(43); expect(useCreationDraft.getState().draft!.input).toEqual(randomCreation(43)); const selected = structuredClone(useCreationDraft.getState().draft!.input); await press('Customise This Life'); expect(screen.getByLabelText('First name')).toHaveProp('value', selected.firstName); expect(useCreationDraft.getState().draft!.input).toEqual(selected); expect(mockStore.getState().world).toBeNull(); expect(await repository.list()).toEqual([]); await press('Start My Life'); await waitFor(() => expect(mockStore.getState().world).not.toBeNull()); expect(mockStore.getState().world!.people.person_player.appearance).toEqual(selected.appearance); view.unmount(); sqlite.close();
});
test('starting another life requires the concrete confirmation and keeps the previous saved life', async () => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); const original = createLife('life_existing', 9, randomCreation(9), { year: 2026, month: 10, day: 19 }); original.birthAcknowledged = true; await repository.create(original); mockStore = createGameStore({ repository: async () => repository, date: () => original.date, id: () => 'life_second' }); await mockStore.getState().bootstrap(); mockParams = { seed: '42', mode: 'custom' }; const view = render(frame(<NewLife />)); await press('Start My Life'); expect(screen.getByText('Start another life?')).toBeOnTheScreen(); expect(mockStore.getState().world).toEqual(original); await press(/Never mind/i); expect(await repository.list()).toHaveLength(1); await press('Start My Life'); await press('Start a New Life'); await waitFor(() => expect(mockStore.getState().world?.id).toBe('life_second')); expect(await repository.list()).toHaveLength(2); expect(await repository.load(original.id)).toEqual(original); view.unmount(); sqlite.close();
});

test('blank names show a useful error before new-life confirmation and leave the existing life untouched', async () => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise();
  const original = createLife('life_existing_names', 9, randomCreation(9), { year: 2026, month: 10, day: 19 }); original.birthAcknowledged = true;
  await repository.create(original); mockStore = createGameStore({ repository: async () => repository, date: () => original.date, id: () => 'life_invalid_names' }); await mockStore.getState().bootstrap();
  mockParams = { seed: '42', mode: 'custom' }; const view = render(frame(<NewLife />));
  fireEvent.changeText(screen.getByLabelText('First name'), '   '); await press('Start My Life');
  expect(screen.getByText('Enter a first name.')).toBeOnTheScreen(); expect(screen.queryByText('Start another life?')).toBeNull();
  fireEvent.changeText(screen.getByLabelText('First name'), 'Alex'); fireEvent.changeText(screen.getByLabelText('Last name'), ''); await press('Start My Life');
  expect(screen.getByText('Enter a last name.')).toBeOnTheScreen(); expect(screen.queryByText('Start another life?')).toBeNull();
  expect(mockStore.getState().world).toEqual(original); expect(await repository.load(original.id)).toEqual(original); expect(await repository.list()).toHaveLength(1);
  fireEvent.changeText(screen.getByLabelText('Last name'), 'Carter'); await press('Start My Life'); expect(screen.getByText('Start another life?')).toBeOnTheScreen();
  await press(/Never mind/i); expect(useCreationDraft.getState().draft!.input).toMatchObject({ firstName: 'Alex', lastName: 'Carter' });
  expect(await repository.list()).toHaveLength(1); view.unmount(); sqlite.close();
});
