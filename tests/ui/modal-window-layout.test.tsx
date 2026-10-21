import React from 'react';
import { Modal, ScrollView, StyleSheet } from 'react-native';
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { EventModal, EventPresentation } from '../../src/ui/EventModal';
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

test.each([
  { label: 'legacy Android bars', insets: { top: 24, bottom: 48, left: 0, right: 0 } },
  { label: 'notched portrait', insets: { top: 47, bottom: 34, left: 0, right: 0 } },
  { label: 'no system insets', insets: { top: 0, bottom: 0, left: 0, right: 0 } },
])('$label reserves insets inside a full-window backdrop and retains scrollable review actions', ({ insets }) => {
  const choose = jest.fn();
  render(frame(<EventModal event={review} onChoose={choose} onCancel={() => {}} />, insets));
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
  fireEvent.press(screen.getByRole('button', { name: 'Start a New Life' })); expect(choose).toHaveBeenCalledWith('confirm');
});

test('full-window review retains modal accessibility, live errors and guarded Back/cancel while saving', () => {
  const cancel = jest.fn(), choose = jest.fn(), insets = { top: 24, bottom: 48, left: 0, right: 0 };
  const view = render(frame(<EventModal event={review} busy error="The new life could not be saved." onChoose={choose} onCancel={cancel} />, insets));
  const alert = screen.getByRole('alert'); expect(alert).toHaveProp('accessibilityLiveRegion', 'polite');
  let card = alert.parent;
  while (card && !card.props.accessibilityViewIsModal) card = card.parent;
  expect(card).not.toBeNull();
  expect(screen.getByRole('button', { name: 'Start a New Life' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Never mind' })).toBeDisabled();
  fireEvent.press(screen.getByRole('button', { name: 'Never mind' }));
  fireEvent(screen.UNSAFE_getByType(Modal), 'requestClose'); expect(cancel).not.toHaveBeenCalled(); expect(choose).not.toHaveBeenCalled();
  view.rerender(frame(<EventModal event={review} onChoose={choose} onCancel={cancel} />, insets));
  fireEvent(screen.UNSAFE_getByType(Modal), 'requestClose'); expect(cancel).toHaveBeenCalledTimes(1);
});

test('a twelve-country selection keeps explicit actions outside its scrolling content and retains the selection through busy/error updates', () => {
  const choose = jest.fn(), cancel = jest.fn(), insets = { top: 24, bottom: 48, left: 0, right: 0 };
  const event: EventPresentation = { id: 'creation:country', kind: 'selection', title: 'Choose a country', body: 'Where will your life begin?', confirmLabel: 'Choose', choices: countryCodes.map(id => ({ id, label: countries[id].name })) };
  const view = render(frame(<EventModal event={event} onChoose={choose} onCancel={cancel} />, insets));
  const scrolling = within(screen.UNSAFE_getByType(ScrollView));
  expect(scrolling.getAllByRole('radio')).toHaveLength(12);
  // A screen reader can find clipped controls in a test tree. Their location
  // outside the scroller is the regression contract; real geometry is native-owned.
  expect(scrolling.queryByRole('button', { name: 'Choose' })).toBeNull();
  expect(scrolling.queryByRole('button', { name: 'Never mind' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Choose' })).toBeDisabled();
  fireEvent.press(screen.getByRole('radio', { name: 'Canada' }));
  expect(screen.getByRole('radio', { name: 'Canada', checked: true })).toBeOnTheScreen();
  expect(choose).not.toHaveBeenCalled();
  view.rerender(frame(<EventModal event={event} busy onChoose={choose} onCancel={cancel} />, insets));
  expect(screen.getByRole('radio', { name: 'Canada', checked: true })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Choose' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Never mind' })).toBeDisabled();
  fireEvent.press(screen.getByRole('button', { name: 'Choose' }));
  fireEvent.press(screen.getByRole('button', { name: 'Never mind' }));
  fireEvent(screen.UNSAFE_getByType(Modal), 'requestClose');
  expect(choose).not.toHaveBeenCalled(); expect(cancel).not.toHaveBeenCalled();
  view.rerender(frame(<EventModal event={event} error="Could not save this selection. Try again." onChoose={choose} onCancel={cancel} />, insets));
  expect(screen.getByRole('alert')).toHaveTextContent('Could not save this selection. Try again.');
  expect(screen.getByRole('radio', { name: 'Canada', checked: true })).toBeOnTheScreen();
  fireEvent.press(screen.getByRole('button', { name: 'Choose' }));
  expect(choose).toHaveBeenCalledTimes(1); expect(choose).toHaveBeenLastCalledWith('CA');
  view.rerender(frame(<EventModal event={{ ...event, id: 'creation:city', title: 'Choose a city', choices: [{ id: 'Toronto', label: 'Toronto' }] }} onChoose={choose} onCancel={cancel} />, insets));
  expect(screen.getByRole('button', { name: 'Choose' })).toBeDisabled();
  fireEvent.press(screen.getByRole('button', { name: 'Never mind' })); expect(cancel).toHaveBeenCalledTimes(1);
});
