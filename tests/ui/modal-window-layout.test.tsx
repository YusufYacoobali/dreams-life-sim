import React from 'react';
// Shared portraits can import the game store; device persistence is outside this UI fixture.
jest.mock('../../src/persistence/native', () => ({ openRepository: async () => { throw new Error('Unexpected device database access in UI fixture'); } }));
import { Modal, ScrollView, StyleSheet } from 'react-native';
import { act, fireEvent, render, screen, within } from '../support/rendering';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { EventModal, EventPresentation } from '../../src/ui/EventModal';
import { Button } from '../../src/ui/components';
import { lightColors, ThemeProvider } from '../../src/ui/theme';
import { countries, countryCodes } from '../../src/game/countries';

const review: EventPresentation = {
  id: 'new-life-window-review', kind: 'confirmation', title: 'Start another life?',
  body: 'Your current life will stay in Saved Lives.', confirmLabel: 'Start a New Life',
  terms: [
    { id: 'person', label: 'New life', value: 'Mia Fischer', tone: 'neutral' },
    { id: 'birthplace', label: 'Birthplace', value: 'Hamburg, Germany', tone: 'neutral' },
  ],
};
const frame = (children: React.ReactNode, insets: { top: number; bottom: number; left: number; right: number }) =>
  <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets }}><ThemeProvider>{children}</ThemeProvider></SafeAreaProvider>;
const noInsets = { top: 0, bottom: 0, left: 0, right: 0 };
// Capture the actual rendered Button boundary's onPress, never EventModal's
// public onChoose prop. This models a retained input from the closed card.
const buttonCallback = (label: string) => screen.UNSAFE_getAllByType(Button).find(item => item.props.label === label)!.props.onPress as () => void;

test.each([
  { label: 'legacy Android bars', insets: { top: 24, bottom: 48, left: 0, right: 0 } },
  { label: 'notched portrait', insets: { top: 47, bottom: 34, left: 0, right: 0 } },
  { label: 'no system insets', insets: { top: 0, bottom: 0, left: 0, right: 0 } },
])('$label reserves insets inside a full-window backdrop and retains scrollable review actions', async ({ insets }) => {
  const choose = jest.fn();
  await render(frame(<EventModal event={review} onChoose={choose} onCancel={() => {}} />, insets));
  const modal = screen.UNSAFE_getByType(Modal);
  // RN 0.86 only skips its fitsSystemWindows wrapper when status translucency
  // is enabled. Navigation translucency would instead enable edge-to-edge and
  // change system-bar contrast/colours, so this contract deliberately keeps it off.
  expect(modal.props).toMatchObject({ transparent: true, presentationStyle: 'overFullScreen', statusBarTranslucent: true, navigationBarTranslucent: false });
  let backdrop = screen.getByText('Start another life?').parent;
  while (backdrop && StyleSheet.flatten(backdrop.props.style)?.backgroundColor !== lightColors.overlay) backdrop = backdrop.parent;
  expect(backdrop).not.toBeNull();
  const style = StyleSheet.flatten(backdrop!.props.style);
  expect(style).toMatchObject({ flex: 1, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 });
  expect(style.height).toBeUndefined(); expect(style.marginTop).toBeUndefined(); expect(style.marginBottom).toBeUndefined();
  const scroll = screen.UNSAFE_getByType(ScrollView);
  expect(scroll.props.keyboardShouldPersistTaps).toBe('handled');
  expect(screen.getByText('Mia Fischer')).toBeOnTheScreen();
  expect(screen.getByText('Hamburg, Germany')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Never mind' })).toBeEnabled();
  await fireEvent.press(screen.getByRole('button', { name: 'Start a New Life' })); expect(choose).toHaveBeenCalledWith('confirm');
});

test('full-window review retains modal accessibility, live errors and guarded Back/cancel while saving', async () => {
  const cancel = jest.fn(), choose = jest.fn(), insets = { top: 24, bottom: 48, left: 0, right: 0 };
  const view = await render(frame(<EventModal event={review} busy error="The new life could not be saved." onChoose={choose} onCancel={cancel} />, insets));
  const alert = screen.getByRole('alert'); expect(alert).toHaveProp('accessibilityLiveRegion', 'polite');
  let card = alert.parent;
  while (card && !card.props.accessibilityViewIsModal) card = card.parent;
  expect(card).not.toBeNull();
  expect(screen.getByRole('button', { name: 'Start a New Life' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Never mind' })).toBeDisabled();
  await fireEvent.press(screen.getByRole('button', { name: 'Never mind' }));
  await fireEvent(screen.UNSAFE_getByType(Modal), 'requestClose'); expect(cancel).not.toHaveBeenCalled(); expect(choose).not.toHaveBeenCalled();
  await view.rerender(frame(<EventModal event={review} onChoose={choose} onCancel={cancel} />, insets));
  await fireEvent(screen.UNSAFE_getByType(Modal), 'requestClose'); expect(cancel).toHaveBeenCalledTimes(1);
});

test('a twelve-country selection keeps explicit actions outside its scrolling content and retains the selection through busy/error updates', async () => {
  const choose = jest.fn(), cancel = jest.fn(), insets = { top: 24, bottom: 48, left: 0, right: 0 };
  const event: EventPresentation = { id: 'creation:country', kind: 'selection', title: 'Choose a country', body: 'Where will your life begin?', confirmLabel: 'Choose', choices: countryCodes.map(id => ({ id, label: countries[id].name })) };
  const view = await render(frame(<EventModal event={event} onChoose={choose} onCancel={cancel} />, insets));
  const scrolling = within(screen.UNSAFE_getByType(ScrollView));
  expect(scrolling.getAllByRole('radio')).toHaveLength(12);
  // A screen reader can find clipped controls in a test tree. Their location
  // outside the scroller is the regression contract; real geometry is native-owned.
  expect(scrolling.queryByRole('button', { name: 'Choose' })).toBeNull();
  expect(scrolling.queryByRole('button', { name: 'Never mind' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Choose' })).toBeDisabled();
  await fireEvent.press(screen.getByRole('radio', { name: 'Canada' }));
  expect(screen.getByRole('radio', { name: 'Canada', checked: true })).toBeOnTheScreen();
  expect(choose).not.toHaveBeenCalled();
  await view.rerender(frame(<EventModal event={{ ...event }} busy onChoose={choose} onCancel={cancel} />, insets));
  expect(screen.getByRole('radio', { name: 'Canada', checked: true })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Choose' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Never mind' })).toBeDisabled();
  await fireEvent.press(screen.getByRole('button', { name: 'Choose' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Never mind' }));
  await fireEvent(screen.UNSAFE_getByType(Modal), 'requestClose');
  expect(choose).not.toHaveBeenCalled(); expect(cancel).not.toHaveBeenCalled();
  await view.rerender(frame(<EventModal event={{ ...event }} error="Could not save this selection. Try again." onChoose={choose} onCancel={cancel} />, insets));
  expect(screen.getByRole('alert')).toHaveTextContent('Could not save this selection. Try again.');
  expect(screen.getByRole('radio', { name: 'Canada', checked: true })).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Choose' }));
  expect(choose).toHaveBeenCalledTimes(1); expect(choose).toHaveBeenLastCalledWith('CA');
  await view.rerender(frame(<EventModal event={{ ...event, id: 'creation:city', title: 'Choose a city', choices: [{ id: 'Toronto', label: 'Toronto' }] }} onChoose={choose} onCancel={cancel} />, insets));
  expect(screen.getByRole('button', { name: 'Choose' })).toBeDisabled();
  await fireEvent.press(screen.getByRole('button', { name: 'Never mind' })); expect(cancel).toHaveBeenCalledTimes(1);
});

test.each(['cancelled', 'Android-closed', 'unmounted'] as const)('queued native button callbacks cannot emit from a %s confirmation', async state => {
  const choose = jest.fn(), cancel = jest.fn(), view = await render(frame(<EventModal event={review} onChoose={choose} onCancel={cancel} />, noInsets));
  const confirm = buttonCallback('Start a New Life'), neverMind = buttonCallback('Never mind'), androidClose = screen.UNSAFE_getByType(Modal).props.onRequestClose;
  if (state === 'cancelled') await fireEvent.press(screen.getByRole('button', { name: 'Never mind' })); else if (state === 'Android-closed') await fireEvent(screen.UNSAFE_getByType(Modal), 'requestClose'); else await view.unmount();
  await act(() => { confirm(); neverMind(); androidClose(); });
  expect(choose).not.toHaveBeenCalled(); expect(cancel).toHaveBeenCalledTimes(state === 'unmounted' ? 0 : 1);
});

test('queued native callbacks from a replaced same-id presentation cannot act on either review', async () => {
  const firstChoose = jest.fn(), firstCancel = jest.fn(), nextChoose = jest.fn(), nextCancel = jest.fn();
  const view = await render(frame(<EventModal event={review} onChoose={firstChoose} onCancel={firstCancel} />, noInsets));
  const oldConfirm = buttonCallback('Start a New Life'), oldCancel = buttonCallback('Never mind');
  await view.rerender(frame(<EventModal event={{ ...review, title: 'A different reviewed life' }} onChoose={nextChoose} onCancel={nextCancel} />, noInsets));
  await act(() => { oldConfirm(); oldCancel(); });
  expect(firstChoose).not.toHaveBeenCalled(); expect(firstCancel).not.toHaveBeenCalled(); expect(nextChoose).not.toHaveBeenCalled(); expect(nextCancel).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Start a New Life' })); expect(nextChoose).toHaveBeenCalledWith('confirm');
});

test('retained inputs respect current busy state, while a fresh failed-save confirmation remains retryable', async () => {
  const choose = jest.fn(), cancel = jest.fn(), view = await render(frame(<EventModal event={review} onChoose={choose} onCancel={cancel} />, noInsets));
  const confirm = buttonCallback('Start a New Life'), neverMind = buttonCallback('Never mind'), androidClose = screen.UNSAFE_getByType(Modal).props.onRequestClose;
  await fireEvent.press(screen.getByRole('button', { name: 'Start a New Life' })); expect(choose).toHaveBeenCalledTimes(1);
  await view.rerender(frame(<EventModal event={review} busy onChoose={choose} onCancel={cancel} />, noInsets));
  await act(() => { confirm(); neverMind(); androidClose(); }); expect(choose).toHaveBeenCalledTimes(1); expect(cancel).not.toHaveBeenCalled();
  await view.rerender(frame(<EventModal event={{ ...review }} error="Your save failed. Try again." onChoose={choose} onCancel={cancel} />, noInsets));
  expect(screen.getByRole('alert')).toHaveTextContent('Your save failed. Try again.');
  await fireEvent.press(screen.getByRole('button', { name: 'Start a New Life' })); expect(choose).toHaveBeenCalledTimes(2);
});

test.each(['decision', 'result'] as const)('Android Back cannot dismiss or disable a protected %s without a close handler', async kind => {
  const choose = jest.fn(), event: EventPresentation = kind === 'decision'
    ? { id: 'protected-decision', kind, title: 'A required decision', body: 'Choose what happens next.', choices: [{ id: 'act', label: 'Make This Choice' }] }
    : { id: 'protected-result', kind, title: 'A saved result', body: 'This result is already recorded.', effects: [] };
  await render(frame(<EventModal event={event} onChoose={choose} />, noInsets));
  await fireEvent(screen.UNSAFE_getByType(Modal), 'requestClose'); expect(choose).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: kind === 'decision' ? 'Make This Choice' : 'Continue' }));
  expect(choose).toHaveBeenCalledWith(kind === 'decision' ? 'act' : 'continue');
});
