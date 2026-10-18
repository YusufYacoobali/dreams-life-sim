import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { EventModal, EventPresentation } from '../../src/ui/EventModal';
import { Button, StatBar } from '../../src/ui/components';
import { ThemeProvider } from '../../src/ui/theme';
import { GameShell } from '../../src/ui/GameShell';

function frame(child: React.ReactNode) {
  return render(<SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider>{child}</ThemeProvider></SafeAreaProvider>);
}

test('a busy action cannot be submitted again', () => {
  const submit = jest.fn();
  frame(<Button label="Buy property" busy onPress={submit} />);
  fireEvent.press(screen.getByRole('button', { name: 'Buy property' }));
  expect(submit).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Buy property' })).toBeDisabled();
});

test('selection requires an eligible option and submits its actual stable ID', () => {
  const choose = jest.fn();
  const event: EventPresentation = { id: 'heir:1', kind: 'selection', title: 'Choose an heir', body: 'Select an existing child.', confirmLabel: 'Continue as heir', choices: [
    { id: 'child-dead', label: 'Sam', disabledReason: 'Deceased' }, { id: 'child-living', label: 'Alex' },
  ] };
  frame(<EventModal event={event} onChoose={choose} />);
  expect(screen.getByRole('button', { name: 'Continue as heir' })).toBeDisabled();
  fireEvent.press(screen.getByRole('radio', { name: 'Sam. Deceased' }));
  expect(screen.getByRole('button', { name: 'Continue as heir' })).toBeDisabled();
  fireEvent.press(screen.getByRole('radio', { name: 'Alex' }));
  expect(screen.getByRole('radio', { name: 'Alex', checked: true })).toBeOnTheScreen();
  fireEvent.press(screen.getByRole('button', { name: 'Continue as heir' }));
  expect(choose).toHaveBeenCalledWith('child-living');
});

test('required decisions have no cancel action and preserve stable choice IDs', () => {
  const choose = jest.fn();
  frame(<EventModal event={{ id: 'offer:4', kind: 'decision', title: 'Job offer', body: 'The terms are ready.', choices: [{ id: 'accept', label: 'Accept offer' }, { id: 'decline', label: 'Decline' }] }} onChoose={choose} />);
  expect(screen.queryByRole('button', { name: 'Never mind' })).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Accept offer' }));
  expect(choose).toHaveBeenCalledWith('accept');
});

test('results show committed values without recalculating money from narrative', () => {
  const choose = jest.fn();
  frame(<EventModal event={{ id: 'receipt:5', kind: 'result', title: 'Sale completed', body: 'The sale settled after fees.', effects: [{ id: 'net', label: 'Net proceeds', value: '+£17,500', tone: 'positive' }] }} onChoose={choose} />);
  expect(screen.getByText('+£17,500')).toBeOnTheScreen();
  fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
  expect(choose).toHaveBeenCalledWith('continue');
});

test('stat accessibility values remain valid even for corrupt presentation input', () => {
  frame(<StatBar label="Health" value={150} color="green" />);
  expect(screen.getByRole('progressbar', { name: 'Health' })).toHaveAccessibilityValue({ min: 0, max: 100, now: 100 });
});

test('four tabs retain selection semantics and return stable route IDs', () => {
  const navigate = jest.fn();
  frame(<GameShell activeTab="life" onSelectTab={navigate}><Button label="Open profile" onPress={() => {}} /></GameShell>);
  expect(screen.getAllByRole('tab')).toHaveLength(4);
  expect(screen.getByRole('tab', { name: 'Life', selected: true })).toBeOnTheScreen();
  fireEvent.press(screen.getByRole('tab', { name: 'Life' }));
  expect(navigate).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole('tab', { name: 'Relationships' }));
  expect(navigate).toHaveBeenCalledWith('relationships');
});
